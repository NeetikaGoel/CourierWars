<?php
declare(strict_types=1);

class JwtConfig
{
    public const JWT_ALGORITHM = 'HS256'; // selected jwt signing algorithm
    public const JWT_SECRET_LENGTH_MIN = 32; // minimum length needed for hs256 secret

    public const JWT_HMAC_HASH_ALGORITHM = 'sha256'; // php hash algorithm used for hs256

    public const ACCESS_TOKEN_COOKIE_NAME = 'cw_access_token'; // this cookie stores the jwt access token
    public const REFRESH_TOKEN_COOKIE_NAME = 'cw_refresh_token'; // this cookie stores the jwt refresh token
    public const FRONTEND_USER_ID_COOKIE_NAME = 'cw_user_id'; // this cookie is frontend convenience only and not trusted
    public const LOGIN_EMAIL_COOKIE_NAME = 'cw_login_email'; // this cookie stores optional remembered email for autocomplete

    public const JWT_ISSUER_DEFAULT = 'courier-war-api'; // default token issuer
    public const JWT_AUDIENCE_DEFAULT = 'courier-war-client'; // default token audience
    public const JWT_SECRET_DEFAULT = ''; // secret must come from env and should not be stored in source

    public const ACCESS_TOKEN_EXPIRY_SECONDS = 1800; // 30 min
    public const REFRESH_TOKEN_EXPIRY_SECONDS = 86400; // 24 hrs
    public const JWT_LEEWAY_SECONDS = 10; // small clock drift allowance in seconds

    public const SESSION_ID_RANDOM_BYTE_COUNT = 16; // creates 32 char session id before hashing
    public const TOKEN_ID_RANDOM_BYTE_COUNT = 16; // creates 32 char jwt id before hashing

    public const COOKIE_PATH = '/'; // this makes cookies available to the whole app
    public const COOKIE_SAMESITE = 'Lax'; // this gives csrf protection while keeping normal navigation usable

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
        return getenv('JWT_SECRET') ?: self::JWT_SECRET_DEFAULT; // this must be set outside source code
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
        return getenv('JWT_COOKIE_SECURE') !== 'false'; // set JWT_COOKIE_SECURE=false for local http testing
    }

    //to tell if auth cookies are httponly or not
    public static function httpOnlyCookieEnabled(): bool
    {
        return true; // this prevents javascript from reading access and refresh tokens
    }
}
