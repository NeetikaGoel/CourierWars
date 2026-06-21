<?php
declare(strict_types=1);

//imports first, just import all lets say
require_once __DIR__ . '/../auth/CsrfTokenService.php';
require_once __DIR__ . '/../auth/JwtTokenService.php';
require_once __DIR__ . '/../auth/PasswordHasher.php';
require_once __DIR__ . '/../config/AuthConfig.php';
require_once __DIR__ . '/../config/JwtConfig.php';
require_once __DIR__ . '/../constants/AuthRequestFieldName.php';
require_once __DIR__ . '/../constants/JwtClaimName.php';
require_once __DIR__ . '/../constants/TimeValue.php';
require_once __DIR__ . '/../constants/UserTypeValue.php';
require_once __DIR__ . '/../database/repository/CwUserRepository.php';
require_once __DIR__ . '/../database/repository/CwUserStatsRepository.php';
require_once __DIR__ . '/../entity/CwUser.php';
require_once __DIR__ . '/../http/HttpCookieFactory.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/../utility/HashFactory.php';
require_once __DIR__ . '/AuthSessionCacheService.php';

//this service owns register login guest refresh logout logic
class AuthService
{
    //all the variables first
    private CwUserRepository $_cwUserRepository;
    private CwUserStatsRepository $_cwUserStatsRepository;
    private PasswordHasher $_passwordHasher;
    private JwtTokenService $_jwtTokenService;
    private CsrfTokenService $_csrfTokenService;
    private AuthSessionCacheService $_authSessionCacheService;

    //then constructor to create auth dependencies
    public function __construct(?CwUserRepository $cwUserRepository = null, ?CwUserStatsRepository $cwUserStatsRepository = null)
    {
        $this->_cwUserRepository = $cwUserRepository ?? new CwUserRepository();
        $this->_cwUserStatsRepository = $cwUserStatsRepository ?? new CwUserStatsRepository();
        $this->_passwordHasher = new PasswordHasher();
        $this->_jwtTokenService = new JwtTokenService();
        $this->_csrfTokenService = new CsrfTokenService();
        $this->_authSessionCacheService = new AuthSessionCacheService();
    }

    //now a function to register a user and creates an auth session
    public function register(array $input): array
    {
        $username = $input[AuthRequestFieldName::USERNAME];
        $email = $input[AuthRequestFieldName::EMAIL];

        if ($this->_cwUserRepository->findByUsername($username) !== null) {
            throw new InvalidArgumentException('Username is already taken!!');
        }

        if ($this->_cwUserRepository->findByEmail($email) !== null) {
            throw new InvalidArgumentException('Email is already registered!!');
        }

        $passwordHash = $this->_passwordHasher->passwordHashCreate($input[AuthRequestFieldName::PASSWORD]);
        $userId = $this->_cwUserRepository->createRegisteredUser($username, $input[AuthRequestFieldName::NAME], $email, $passwordHash);
        $this->_cwUserStatsRepository->createDefaultStats($userId, $input[AuthRequestFieldName::PREFERRED_ROLE]);
        $user = $this->_cwUserRepository->findByUserId($userId);
        if ($user === null) {
            throw new RuntimeException('created user could not be loaded');
        }
        return $this->sessionCreate($user, UserTypeValue::REGISTERED);
    }

    //now login of registered user and creation of an auth session
    public function login(array $input): array
    {
        $user = $this->_cwUserRepository->findRegisteredByIdentifier($input[AuthRequestFieldName::IDENTIFIER]);
        if ($user === null || $user->getPasswordHash() === null) {
            throw new RuntimeException('invalid login credentials');
        }
        if (!$this->_passwordHasher->passwordVerify($input[AuthRequestFieldName::PASSWORD], $user->getPasswordHash())) {
            throw new RuntimeException('invalid login credentials');
        }
        return $this->sessionCreate($user, UserTypeValue::REGISTERED);
    }

    //now creating a guest user and auth session
    public function guest(array $input): array
    {
        $username = $this->guestUsernameCreate();
        $userId = $this->_cwUserRepository->createGuestUser($username, $input[AuthRequestFieldName::NAME]);
        $this->_cwUserStatsRepository->createDefaultStats($userId);

        $user = $this->_cwUserRepository->findByUserId($userId);

        if ($user === null) {
            throw new RuntimeException('created guest could not be loaded');
        }

        return $this->sessionCreate($user, UserTypeValue::GUEST);
    }

    //now a func for refreshing access and refresh token using refresh cookie and csrf token hehe okya
    public function refresh(string $refreshToken, string $csrfToken): array
    {
        $claims = $this->_jwtTokenService->refreshTokenClaimsVerify($refreshToken);

        if ($claims === null) {
            throw new RuntimeException('refresh token is invalid');
        }

        $sessionId = (string)($claims[JwtClaimName::SESSION_ID] ?? '');
        $refreshTokenId = (string)($claims[JwtClaimName::TOKEN_ID] ?? '');
        $userId = (int)($claims[JwtClaimName::SUBJECT] ?? 0);
        $sessionMetadata = $this->_authSessionCacheService->sessionGetBySessionId($sessionId);

        if ($sessionMetadata === null || !$this->_authSessionCacheService->sessionRefreshActive($sessionMetadata)) {
            throw new RuntimeException('refresh session is invalid');
        }

        if (!$this->_authSessionCacheService->refreshTokenMatches($sessionMetadata, $refreshTokenId)) {
            throw new RuntimeException('refresh token is invalid');
        }

        if (!$this->_authSessionCacheService->csrfTokenMatches($sessionMetadata, $csrfToken)) {
            throw new RuntimeException('csrf token is invalid');
        }

        $user = $this->_cwUserRepository->findByUserId($userId);

        if ($user === null) {
            throw new RuntimeException('user was not found');
        }

        return $this->sessionCreate($user, $user->isGuest() ? UserTypeValue::GUEST : UserTypeValue::REGISTERED, $sessionId);
    }

    //logging out of current session
    public function logout(AuthContext $authContext): array
    {
        $this->_authSessionCacheService->sessionRevokeBySessionId($authContext->getSessionId());

        return [
            'data' => ['loggedOut' => true],
            'cookieHeaders' => HttpCookieFactory::clearAuthCookieHeaders(),
        ];
    }

    //now forgetting guest session
    public function guestForget(AuthContext $authContext): array
    {
        $this->_authSessionCacheService->sessionRevokeBySessionId($authContext->getSessionId());

        return [
            'data' => ['guestForgotten' => true],
            'cookieHeaders' => HttpCookieFactory::clearAuthCookieHeaders(),
        ];
    }

    //now creation of auth tokens cookies and cache metadata
    private function sessionCreate(CwUser $user, string $userType, ?string $existingSessionId = null): array
    {
        $sessionId = $existingSessionId ?? HashFactory::randomHex(JwtConfig::SESSION_ID_RANDOM_BYTE_COUNT);
        $accessTokenId = HashFactory::randomHex(JwtConfig::TOKEN_ID_RANDOM_BYTE_COUNT);
        $refreshTokenId = HashFactory::randomHex(JwtConfig::TOKEN_ID_RANDOM_BYTE_COUNT);
        $csrfToken = $this->_csrfTokenService->csrfTokenCreate();
        $accessExpiresAtMs = Clock::unixMilliseconds() + (JwtConfig::ACCESS_TOKEN_EXPIRY_SECONDS * TimeValue::MILLISECONDS_PER_SECOND);
        $refreshExpiresAtMs = Clock::unixMilliseconds() + (JwtConfig::REFRESH_TOKEN_EXPIRY_SECONDS * TimeValue::MILLISECONDS_PER_SECOND);

        $accessToken = $this->_jwtTokenService->accessTokenCreate($user->getUserId(), $sessionId, $accessTokenId, $userType, $user->getName());
        $refreshToken = $this->_jwtTokenService->refreshTokenCreate($user->getUserId(), $sessionId, $refreshTokenId, $userType, $user->getName());

        $this->_authSessionCacheService->sessionStore(
            $this->_authSessionCacheService->sessionMetadataCreate(
                $user->getUserId(),
                $user->getUsername(),
                $user->getName(),
                $userType === UserTypeValue::GUEST,
                $sessionId,
                $accessTokenId,
                $refreshTokenId,
                $csrfToken,
                $accessExpiresAtMs,
                $refreshExpiresAtMs
            )
        );

        return [
            'data' => [
                'user' => $this->userPayloadCreate($user, $userType),
                'session' => [
                    'accessExpiresAtMs' => $accessExpiresAtMs,
                    'refreshExpiresAtMs' => $refreshExpiresAtMs,
                ],
            ],
            'cookieHeaders' => HttpCookieFactory::createAuthCookieHeaders($accessToken, $refreshToken, $csrfToken, $user->getUserId()),
        ];
    }

    //a func we need above to create a response user payload
    private function userPayloadCreate(CwUser $user, string $userType): array
    {
        return [
            'userId' => $user->getUserId(),
            'username' => $user->getUsername(),
            'name' => $user->getName(),
            'userType' => $userType,
            'isGuest' => $userType === UserTypeValue::GUEST,
        ];
    }

    //a func we need above to create unique guest username
    private function guestUsernameCreate(): string
    {
        for ($attempt = 0; $attempt < AuthConfig::UNIQUE_USERNAME_ATTEMPT_MAX; $attempt++) {
            $username = AuthConfig::GUEST_USERNAME_PREFIX . HashFactory::randomHex(AuthConfig::GUEST_USERNAME_RANDOM_BYTE_COUNT);

            if ($this->_cwUserRepository->findByUsername($username) === null) {
                return $username;
            }
        }
        throw new RuntimeException('guest username could not be created');
    }
}
