<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../auth/CsrfTokenService.php';
require_once __DIR__ . '/../cache/CacheServerClient.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../cache/CacheServerTtlConfig.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/../utility/HashFactory.php';

//this service stores and verifies auth session metadata in cache
class AuthSessionCacheService
{
    private const FIELD_SID_HASH = 'sidHash';
    private const FIELD_USER_ID = 'userId';
    private const FIELD_USERNAME = 'username';
    private const FIELD_NAME = 'name';
    private const FIELD_IS_GUEST = 'isGuest';
    private const FIELD_ACCESS_JTI_HASH = 'accessJtiHash';
    private const FIELD_REFRESH_JTI_HASH = 'refreshJtiHash';
    private const FIELD_CSRF_TOKEN_HASH = 'csrfTokenHash';
    private const FIELD_ACCESS_EXPIRES_AT_MS = 'accessExpiresAtMs';
    private const FIELD_REFRESH_EXPIRES_AT_MS = 'refreshExpiresAtMs';
    private const FIELD_REVOKED_AT_MS = 'revokedAtMs';
    private const FIELD_LAST_SEEN_AT_MS = 'lastSeenAtMs';

    private CacheServerClient $_cacheServerClient;
    private CsrfTokenService $_csrfTokenService;

    //constructor creates cache and csrf helpers
    public function __construct(?CacheServerClient $cacheServerClient = null, ?CsrfTokenService $csrfTokenService = null)
    {
        $this->_cacheServerClient = $cacheServerClient ?? new CacheServerClient();
        $this->_csrfTokenService = $csrfTokenService ?? new CsrfTokenService();
    }

    //this creates safe session metadata payload for cache
    public function sessionMetadataCreate(int $userId, string $username, ?string $name, bool $isGuest, string $sessionId, string $accessTokenId, string $refreshTokenId, string $csrfToken, int $accessExpiresAtMs, int $refreshExpiresAtMs): array
    {
        return [
            self::FIELD_SID_HASH => HashFactory::sha256($sessionId),
            self::FIELD_USER_ID => $userId,
            self::FIELD_USERNAME => $username,
            self::FIELD_NAME => $name,
            self::FIELD_IS_GUEST => $isGuest,
            self::FIELD_ACCESS_JTI_HASH => HashFactory::sha256($accessTokenId),
            self::FIELD_REFRESH_JTI_HASH => HashFactory::sha256($refreshTokenId),
            self::FIELD_CSRF_TOKEN_HASH => $this->_csrfTokenService->csrfTokenHashCreate($csrfToken),
            self::FIELD_ACCESS_EXPIRES_AT_MS => $accessExpiresAtMs,
            self::FIELD_REFRESH_EXPIRES_AT_MS => $refreshExpiresAtMs,
            self::FIELD_REVOKED_AT_MS => null,
            self::FIELD_LAST_SEEN_AT_MS => Clock::unixMilliseconds(),
        ];
    }

    //this stores session metadata in cache
    public function sessionStore(array $sessionMetadata): void
    {
        $this->metadataValidate($sessionMetadata);

        $sessionMetadata[self::FIELD_LAST_SEEN_AT_MS] = Clock::unixMilliseconds();

        $stored = $this->_cacheServerClient->cacheSet(
            CacheServerKeyFactory::authSessionKey((string)$sessionMetadata[self::FIELD_SID_HASH]),
            $sessionMetadata,
            CacheServerTtlConfig::authSessionTtlSeconds()
        );

        //adding verification here as per pr review
        if (!$stored) {
            throw new RuntimeException('auth session cache store failed!!');
        }
    }

    //this gets session metadata by raw session id
    public function sessionGetBySessionId(string $sessionId): ?array
    {
        return $this->sessionGetBySidHash(HashFactory::sha256($sessionId));
    }

    //this gets session metadata by hashed session id
    public function sessionGetBySidHash(string $sidHash): ?array
    {
        $value = $this->_cacheServerClient->cacheGet(CacheServerKeyFactory::authSessionKey($sidHash));

        return is_array($value) ? $value : null;
    }

    //this revokes session but keeps metadata readable until ttl ends
    public function sessionRevokeBySessionId(string $sessionId): void
    {
        $sessionMetadata = $this->sessionGetBySessionId($sessionId);

        if ($sessionMetadata === null) {
            return;
        }

        $sessionMetadata[self::FIELD_REVOKED_AT_MS] = Clock::unixMilliseconds();
        $this->sessionStore($sessionMetadata);
    }

    //this verifies access token id against cache
    public function accessTokenMatches(array $sessionMetadata, string $accessTokenId): bool
    {
        return HashFactory::hashEquals((string)($sessionMetadata[self::FIELD_ACCESS_JTI_HASH] ?? ''), HashFactory::sha256($accessTokenId));
    }

    //this verifies refresh token id against cache
    public function refreshTokenMatches(array $sessionMetadata, string $refreshTokenId): bool
    {
        return HashFactory::hashEquals((string)($sessionMetadata[self::FIELD_REFRESH_JTI_HASH] ?? ''), HashFactory::sha256($refreshTokenId));
    }

    //this verifies csrf token against cache
    public function csrfTokenMatches(array $sessionMetadata, string $csrfToken): bool
    {
        return $this->_csrfTokenService->csrfTokenVerify($csrfToken, (string)($sessionMetadata[self::FIELD_CSRF_TOKEN_HASH] ?? ''));
    }

    //this creates auth context from verified session metadata
    public function authContextCreate(string $sessionId, string $accessTokenId, array $sessionMetadata): ?AuthContext
    {
        if (!$this->sessionAccessActive($sessionMetadata)) {
            return null;
        }

        if ((string)$sessionMetadata[self::FIELD_SID_HASH] !== HashFactory::sha256($sessionId)) {
            return null;
        }

        if (!$this->accessTokenMatches($sessionMetadata, $accessTokenId)) {
            return null;
        }

        return new AuthContext(
            (int)$sessionMetadata[self::FIELD_USER_ID],
            (string)$sessionMetadata[self::FIELD_USERNAME],
            $sessionMetadata[self::FIELD_NAME] === null ? null : (string)$sessionMetadata[self::FIELD_NAME],
            (bool)$sessionMetadata[self::FIELD_IS_GUEST],
            $sessionId,
            $accessTokenId,
            (string)$sessionMetadata[self::FIELD_CSRF_TOKEN_HASH]
        );
    }

    //this checks if access session is active
    public function sessionAccessActive(array $sessionMetadata): bool
    {
        if (($sessionMetadata[self::FIELD_REVOKED_AT_MS] ?? null) !== null) {
            return false;
        }

        return (int)($sessionMetadata[self::FIELD_ACCESS_EXPIRES_AT_MS] ?? 0) >= Clock::unixMilliseconds();
    }

    //this checks if refresh session is active
    public function sessionRefreshActive(array $sessionMetadata): bool
    {
        if (($sessionMetadata[self::FIELD_REVOKED_AT_MS] ?? null) !== null) {
            return false;
        }

        return (int)($sessionMetadata[self::FIELD_REFRESH_EXPIRES_AT_MS] ?? 0) >= Clock::unixMilliseconds();
    }

    //this validates required metadata fields before storing
    private function metadataValidate(array $sessionMetadata): void
    {
        foreach ([self::FIELD_SID_HASH, self::FIELD_USERNAME, self::FIELD_ACCESS_JTI_HASH, self::FIELD_REFRESH_JTI_HASH, self::FIELD_CSRF_TOKEN_HASH] as $fieldName) {
            if (!isset($sessionMetadata[$fieldName]) || !is_string($sessionMetadata[$fieldName]) || trim($sessionMetadata[$fieldName]) === '') {
                throw new InvalidArgumentException($fieldName . ' is required');
            }
        }

        foreach ([self::FIELD_USER_ID, self::FIELD_ACCESS_EXPIRES_AT_MS, self::FIELD_REFRESH_EXPIRES_AT_MS] as $fieldName) {
            if (!isset($sessionMetadata[$fieldName]) || !is_int($sessionMetadata[$fieldName])) {
                throw new InvalidArgumentException($fieldName . ' is required');
            }
        }
    }
}
