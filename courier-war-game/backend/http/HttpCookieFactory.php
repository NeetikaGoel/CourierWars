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
            JwtConfig::ACCESS_TOKEN_COOKIE_NAME, // cookie name
            $token, // cookie value
            JwtConfig::ACCESS_TOKEN_EXPIRY_SECONDS, // cookie max age
            JwtConfig::COOKIE_PATH, // cookie path
            JwtConfig::COOKIE_SAMESITE, // SameSite value
            JwtConfig::secureCookieEnabled(), // Secure flag
            JwtConfig::httpOnlyCookieEnabled() // HttpOnly true for auth token
        );
    }

    //this creates refresh token cookie
    public static function createRefreshTokenCookie(string $token): string
    {
        return self::buildCookieHeader(
            JwtConfig::REFRESH_TOKEN_COOKIE_NAME, // cookie name
            $token, // cookie value
            JwtConfig::REFRESH_TOKEN_EXPIRY_SECONDS, // cookie max age
            JwtConfig::COOKIE_PATH, // cookie path
            JwtConfig::COOKIE_SAMESITE, // SameSite value
            JwtConfig::secureCookieEnabled(), // Secure flag
            JwtConfig::httpOnlyCookieEnabled() // HttpOnly true for refresh token
        );
    }

    //this creates CSRF token cookie
    public static function createCsrfTokenCookie(string $csrfToken): string
    {
        return self::buildCookieHeader(
            CsrfConfig::CSRF_COOKIE_NAME, // cookie name
            $csrfToken, // cookie value
            JwtConfig::REFRESH_TOKEN_EXPIRY_SECONDS, // align csrf with auth session lifetime
            CsrfConfig::COOKIE_PATH, // csrf cookie path
            CsrfConfig::COOKIE_SAMESITE, // csrf SameSite value
            CsrfConfig::secureCookieEnabled(), // Secure flag
            CsrfConfig::httpOnlyCookieEnabled() // false because frontend must read csrf token
        );
    }

    //this creates frontend user id cookie which is not trusted for auth
    public static function createFrontendUserIdCookie(int $userId): string
    {
        return self::buildCookieHeader(
            JwtConfig::FRONTEND_USER_ID_COOKIE_NAME, // cookie name
            (string)$userId, // user id value for frontend convenience
            JwtConfig::REFRESH_TOKEN_EXPIRY_SECONDS, // same lifetime as current session
            JwtConfig::COOKIE_PATH, // cookie path
            JwtConfig::COOKIE_SAMESITE, // SameSite value
            JwtConfig::secureCookieEnabled(), // Secure flag
            false // not HttpOnly because frontend can read it
        );
    }

    //this creates login email autocomplete cookie
    public static function createLoginEmailCookie(string $email): string
    {
        return self::buildCookieHeader(
            JwtConfig::LOGIN_EMAIL_COOKIE_NAME, // cookie name
            $email, // email value
            self::LOGIN_EMAIL_MAX_AGE_SECONDS, // keep remembered email for 30 days
            JwtConfig::COOKIE_PATH, // cookie path
            JwtConfig::COOKIE_SAMESITE, // SameSite value
            JwtConfig::secureCookieEnabled(), // Secure flag
            false // not HttpOnly because frontend may read it
        );
    }

    //this clears access token cookie
    public static function clearAccessTokenCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::ACCESS_TOKEN_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), JwtConfig::httpOnlyCookieEnabled()); // return expired access cookie
    }

    //this clears refresh token cookie
    public static function clearRefreshTokenCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::REFRESH_TOKEN_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), JwtConfig::httpOnlyCookieEnabled()); // return expired refresh cookie
    }

    //this clears csrf token cookie
    public static function clearCsrfTokenCookie(): string
    {
        return self::clearCookieHeader(CsrfConfig::CSRF_COOKIE_NAME, CsrfConfig::COOKIE_PATH, CsrfConfig::COOKIE_SAMESITE, CsrfConfig::secureCookieEnabled(), CsrfConfig::httpOnlyCookieEnabled()); // return expired csrf cookie
    }

    //this clears frontend user id cookie
    public static function clearFrontendUserIdCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::FRONTEND_USER_ID_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), false); // return expired user id cookie
    }

    //this clears login email cookie if needed
    public static function clearLoginEmailCookie(): string
    {
        return self::clearCookieHeader(JwtConfig::LOGIN_EMAIL_COOKIE_NAME, JwtConfig::COOKIE_PATH, JwtConfig::COOKIE_SAMESITE, JwtConfig::secureCookieEnabled(), false); // return expired login email cookie
    }

    //this creates all auth cookies together
    public static function createAuthCookieHeaders(string $accessToken, string $refreshToken, string $csrfToken, int $userId): array
    {
        return [
            self::createAccessTokenCookie($accessToken), // access token cookie
            self::createRefreshTokenCookie($refreshToken), // refresh token cookie
            self::createCsrfTokenCookie($csrfToken), // csrf token cookie
            self::createFrontendUserIdCookie($userId), // frontend user id cookie
        ];
    }

    //this creates clear auth cookie headers together
    public static function clearAuthCookieHeaders(): array
    {
        return [
            self::clearAccessTokenCookie(), // clear access token
            self::clearRefreshTokenCookie(), // clear refresh token
            self::clearCsrfTokenCookie(), // clear csrf token
            self::clearFrontendUserIdCookie(), // clear frontend user id
        ];
    }

    //this builds one Set-Cookie header value
    private static function buildCookieHeader(string $name, string $value, int $maxAgeSeconds, string $path, string $sameSite, bool $secure, bool $httpOnly): string
    {
        $parts = []; // this will store cookie header parts

        $parts[] = $name . '=' . rawurlencode($value); // cookie name and encoded value

        $parts[] = 'Max-Age=' . $maxAgeSeconds; // browser lifetime in seconds

        $parts[] = 'Path=' . $path; // cookie available path

        $parts[] = 'SameSite=' . $sameSite; // csrf protection behavior

        if ($secure) // if secure cookies are enabled
        {
            $parts[] = 'Secure'; // cookie only sent over HTTPS
        }

        if ($httpOnly) // if JavaScript should not read cookie
        {
            $parts[] = 'HttpOnly'; // protect auth tokens from JS access
        }

        return implode('; ', $parts); // create final Set-Cookie header value
    }

    //this builds expired cookie header
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
