<?php
declare(strict_types=1);

//this will need imports first ofc
require_once __DIR__ . '/AuthContext.php';
require_once __DIR__ . '/JwtTokenService.php';
require_once __DIR__ . '/../config/CsrfConfig.php';
require_once __DIR__ . '/../config/JwtConfig.php';
require_once __DIR__ . '/../constants/JwtClaimName.php';
require_once __DIR__ . '/../http/HttpRequest.php';
require_once __DIR__ . '/../service/AuthSessionCacheService.php';

//this will have to contain the class that converts request cookies into verified auth context
class AuthRequestAuthenticator
{
    private JwtTokenService $_jwtTokenService;
    private AuthSessionCacheService $_authSessionCacheService;

    //constructor to create the auth helpers
    public function __construct(?JwtTokenService $jwtTokenService = null, ?AuthSessionCacheService $authSessionCacheService = null)
    {
        $this->_jwtTokenService = $jwtTokenService ?? new JwtTokenService();
        $this->_authSessionCacheService = $authSessionCacheService ?? new AuthSessionCacheService();
    }

    //for creating auth context from access token cookie
    public function authContextFromRequest(HttpRequest $request): ?AuthContext
    {
        $accessToken = $request->getCookie(JwtConfig::ACCESS_TOKEN_COOKIE_NAME);
        if ($accessToken === null || trim($accessToken) === '') {
            return null;
        }
        $claims = $this->_jwtTokenService->accessTokenClaimsVerify($accessToken);
        if ($claims === null) {
            return null;
        }
        $sessionId = (string)($claims[JwtClaimName::SESSION_ID] ?? '');
        $accessTokenId = (string)($claims[JwtClaimName::TOKEN_ID] ?? '');
        if ($sessionId === '' || $accessTokenId === '') {
            return null;
        }
        $sessionMetadata = $this->_authSessionCacheService->sessionGetBySessionId($sessionId);
        if ($sessionMetadata === null) {
            return null;
        }
        return $this->_authSessionCacheService->authContextCreate($sessionId, $accessTokenId, $sessionMetadata);
    }

    //for checking csrf token for an already authenticated context here
    public function csrfTokenValidForContext(AuthContext $authContext, HttpRequest $request): bool
    {
        $csrfToken = $request->getHeader(CsrfConfig::CSRF_HEADER_NAME);
        if ($csrfToken === null || trim($csrfToken) === '') {
            return false;
        }
        $sessionMetadata = $this->_authSessionCacheService->sessionGetBySessionId($authContext->getSessionId());
        if ($sessionMetadata === null) {
            return false;
        }
        return $this->_authSessionCacheService->csrfTokenMatches($sessionMetadata, $csrfToken);
    }
}
