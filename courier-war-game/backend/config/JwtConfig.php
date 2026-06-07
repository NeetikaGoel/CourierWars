<?php 
declare(strict_types=1);

class JwtConfig 
{
    public const JWT_ALGORITHM = 'HS256'; // selected JWT signing algorithm
    
    public const ACCESS_TOKEN_COOKIE_NAME = 'cw_access_token'; // this cookie stores the JWT access token
    public const REFRESH_TOKEN_COOKIE_NAME = 'cw_refresh_token'; // this cookie stores the JWT refresh token
    public const FRONTEND_USER_ID_COOKIE_NAME = 'cw_user_id'; // this cookie is frontend convenience only and not trusted
    public const LOGIN_EMAIL_COOKIE_NAME = 'cw_login_email'; // this cookie stores optional remembered email for autocomplete

    public const JWT_ISSUER_DEFAULT = 'courier-war-api';
    public const JWT_AUDIENCE_DEFAULT = 'courier-war-client';
    public const JWT_SECRET_DEFAULT = '';

    //now expiry timings
    public const ACCESS_TOKEN_EXPIRY_SECONDS = 1800; // 30 min
    public const REFRESH_TOKEN_EXPIRY_SECONDS = 86400; // 24 hrs

    public const COOKIE_PATH = '/'; // this makes cookies available to the whole app
    public const COOKIE_SAMESITE = 'Lax'; // this gives CSRF protection while keeping normal navigation usable

    //now functions for returning jwt config values

    //for returning jwt issuer
    public static function issuer(): string 
    {
        return getenv('JWT_ISSUER') ?: self::JWT_ISSUER_DEFAULT; 
    }

    //for returning jwt audience
    public static function audience(): string 
    {
        return getenv('JWT_AUDIENCE') ?: self::JWT_AUDIENCE_DEFAULT; 
    }

    //for returning hs256 signing secret
    public static function secret(): string 
    {
        return getenv('JWT_SECRET') ?: self::JWT_SECRET_DEFAULT; //should be set outside source code???
    }

    //access token expiry
    public static function accessTokenExpirySeconds(): int
    {
        return self::ACCESS_TOKEN_EXPIRY_SECONDS; 
    }

    //refresh token expiry
    public static function refreshTokenExpirySeconds(): int 
    {
        return self::REFRESH_TOKEN_EXPIRY_SECONDS;
    }

    //to tell if secure cookies need to be used or not 
    public static function secureCookieEnabled(): bool 
    {
        return getenv('JWT_COOKIE_SECURE') !== 'false'; //defaulting to secure cookies unless explicitly disabled
    }

    //to tell if auth cookies are httponly or not
    public static function httpOnlyCookieEnabled(): bool 
    {
        return true; // this prevents JavaScript from reading access and refresh tokens
    }
}
