<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/JwtConfig.php';
require_once __DIR__ . '/../config/CsrfConfig.php';

//this file creates Set-Cookie header values for auth and CSRF cookies
class HttpCookieFactory
{
    private const LOGIN_EMAIL_MAX_AGE_SECONDS = 2592000; // 30 days for email autocomplete cookie

    //this creates access token cookie
    public static function createAccessTokenCookie(string $token): string
    {
        return self::buildCookieHeader(
            JwtConfig::ACCESS_TOKEN_COOKIE_NAME, 
            $token, // cookie value
            JwtConfig::ACCESS_TOKEN_EXPIRY_SECONDS, // cookie max age
            JwtConfig::COOKIE_PATH, 
            JwtConfig::COOKIE_SAMESITE, 
            JwtConfig::secureCookieEnabled(), // Secure flag
            JwtConfig::httpOnlyCookieEnabled() // HttpOnly true for auth token
        );
    }

    //this creates refresh token cookie
    public static function createRefreshTokenCookie(string $token): string
    {
        return self::buildCookieHeader(
            JwtConfig::REFRESH_TOKEN_COOKIE_NAME, 
            $token, // cookie value
            JwtConfig::REFRESH_TOKEN_EXPIRY_SECONDS, // cookie max age
            JwtConfig::COOKIE_PATH, 
            JwtConfig::COOKIE_SAMESITE, 
            JwtConfig::secureCookieEnabled(), // Secure flag
            JwtConfig::httpOnlyCookieEnabled() // HttpOnly true for refresh token
        );
    }

    //this will create a csrf token cookie
    public static function createCsrfTokenCookie(string $csrfToken): string
    {
        return self::buildCookieHeader(
            CsrfConfig::CSRF_COOKIE_NAME, 
            $csrfToken, // cookie value
            JwtConfig::REFRESH_TOKEN_EXPIRY_SECONDS, // align csrf with auth session lifetime
            CsrfConfig::COOKIE_PATH, 
            CsrfConfig::COOKIE_SAMESITE, 
            CsrfConfig::secureCookieEnabled(), // Secure flag
            CsrfConfig::httpOnlyCookieEnabled() // now this will be false becoz frontend must read csrf token
        );
    }

    //creating frontend user id cookie which is not trusted for auth
    public static function createFrontendUserIdCookie(int $userId): string
    {
        return self::buildCookieHeader(
            JwtConfig::FRONTEND_USER_ID_COOKIE_NAME, 
            (string)$userId, // user id value for frontend convenience
            JwtConfig::REFRESH_TOKEN_EXPIRY_SECONDS, // same lifetime as current session
            JwtConfig::COOKIE_PATH, 
            JwtConfig::COOKIE_SAMESITE, 
            JwtConfig::secureCookieEnabled(), // Secure flag
            false // not HttpOnly because frontend can read it
        );
    }

    //creating login email autocomplete cookie
    public static function createLoginEmailCookie(string $email): string
    {
        return self::buildCookieHeader(
            JwtConfig::LOGIN_EMAIL_COOKIE_NAME, 
            $email, //email here
            self::LOGIN_EMAIL_MAX_AGE_SECONDS, // keeping remembered email for 30 days
            JwtConfig::COOKIE_PATH, 
            JwtConfig::COOKIE_SAMESITE, 
            JwtConfig::secureCookieEnabled(), // Secure flag
            false // not HttpOnly because frontend may read it
        );
    }

    //now ofc clearing access token cookie
    public static function clearAccessTokenCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::ACCESS_TOKEN_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), JwtConfig::httpOnlyCookieEnabled()); // for returning expired access cookie
    }

    //same for refresh token cookie
    public static function clearRefreshTokenCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::REFRESH_TOKEN_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), JwtConfig::httpOnlyCookieEnabled()); // for returning the expired refresh cookie
    }

    //same for csrf token cookie
    public static function clearCsrfTokenCookie(): string
    {
        return self::clearCookieHeader(CsrfConfig::CSRF_COOKIE_NAME, CsrfConfig::COOKIE_PATH, CsrfConfig::COOKIE_SAMESITE, CsrfConfig::secureCookieEnabled(), CsrfConfig::httpOnlyCookieEnabled()); // return expired csrf cookie
    }

    //now the function that will clear frontend user id cookie
    public static function clearFrontendUserIdCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::FRONTEND_USER_ID_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), false); // return expired user id cookie
    }

    //clearing the login email cookie if needed
    public static function clearLoginEmailCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::LOGIN_EMAIL_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), false); // return expired login email cookie
    }

    //creating all auth cookies together
    public static function createAuthCookieHeaders(string $accessToken, string $refreshToken, string $csrfToken, int $userId): array
    {
        return [
            self::createAccessTokenCookie($accessToken),
            self::createRefreshTokenCookie($refreshToken), 
            self::createCsrfTokenCookie($csrfToken), 
            self::createFrontendUserIdCookie($userId), 
        ];
    }

    //now clearing all auth cookies together
    public static function clearAuthCookieHeaders(): array
    {
        return [
            self::clearAccessTokenCookie(), 
            self::clearRefreshTokenCookie(),
            self::clearCsrfTokenCookie(), 
            self::clearFrontendUserIdCookie(), 
        ];
    }

    //now we need a function that builds 1 Set-Cookie header value
    private static function buildCookieHeader(string $name, string $value, int $maxAgeSeconds, string $path, string $sameSite, bool $secure, bool $httpOnly): string
    {
        $parts = []; // for storing cookie header parts
        $parts[] = $name . '=' . rawurlencode($value); // cookie name and encoded value
        $parts[] = 'Max-Age=' . $maxAgeSeconds; // browser lifetime in sec
        $parts[] = 'Path=' . $path; // cookie available path
        $parts[] = 'SameSite=' . $sameSite; // csrf protection behavior
        if ($secure) // if secure cookies are enabled
        {
            $parts[] = 'Secure'; // cookie only sent over HTTPS
        }
        if ($httpOnly) // if js should not read cookie
        {
            $parts[] = 'HttpOnly'; // protect auth tokens from JS access
        }
        return implode('; ', $parts); // create final Set-Cookie header value
    }

    //now a function to build expired cookie header
    private static function clearCookieHeader(string $name, string $path, string $sameSite, bool $secure, bool $httpOnly): string
    {
        $parts = []; // this will store expired cookie parts
        $parts[] = $name . '='; // empty cookie value
        $parts[] = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT'; // old expiry date clears cookie
        $parts[] = 'Max-Age=0'; // zero lifetime clears cookie
        $parts[] = 'Path=' . $path; // must match original path
        $parts[] = 'SameSite=' . $sameSite; // must match SameSite behavior
        if ($secure) // if secure cookies are enabled
        {
            $parts[] = 'Secure'; // include Secure flag
        }
        if ($httpOnly) // if original cookie was HttpOnly
        {
            $parts[] = 'HttpOnly'; // include HttpOnly flag
        }
        return implode('; ', $parts); // create final expired cookie header
    }
}
