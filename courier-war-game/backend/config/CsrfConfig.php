<?php
declare(strict_types=1); 

//this is for CSRF token configuration
class CsrfConfig
{
    public const CSRF_COOKIE_NAME = 'cw_csrf_token'; // this cookie stores the CSRF token readable by frontend
    public const CSRF_HEADER_NAME = 'X-CSRF-Token'; // this header must be sent on mutating APIs

    //now some constant length values
    public const CSRF_TOKEN_LENGTH_BYTES = 32; // for creating a strong random token before encoding
    public const CSRF_TOKEN_MIN_LENGTH = 16; // min accepted CSRF token length
    public const CSRF_TOKEN_MAX_LENGTH = 128; // max accepted CSRF token length

    public const COOKIE_PATH = '/'; // this makes CSRF cookie available across app routes
    //this tells where cookie is available?

    public const COOKIE_SAMESITE = 'Lax'; // this matches JWT cookie SameSite behavior
    //SameSite=Lax means the browser sends cookies for normal same-site app usage
    // but blocks many dangerous cross-site POST-style attacks - helps against csrf

    //for returning cookie name of csrf
    public static function cookieName(): string
    {
        return self::CSRF_COOKIE_NAME;
    }

    //for returning csrf req header name
    public static function headerName(): string
    {
        return self::CSRF_HEADER_NAME;
    }

    public static function secureCookieEnabled(): bool // this tells if CSRF cookie should be Secure
    {
        return getenv('CSRF_COOKIE_SECURE') !== 'false'; // this defaults to secure cookies unless disabled locally -- only sent over https
    }

    //to tell if csrf cookie is httponly or not, which should return false so frontend can read and send the token name in header
    public static function httpOnlyCookieEnabled(): bool
    {
        return false; //so js cannot read the cookie
    }
}
