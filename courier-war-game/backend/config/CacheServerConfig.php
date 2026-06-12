<?php
declare(strict_types=1);

class CacheServerConfig 
{
    //default local cache server URL
    public const CACHE_SERVER_URL_DEFAULT = 'http://127.0.0.1:8081'; 

    //next is auth header for the cache server
    public const CACHE_SERVER_AUTH_HEADER = 'X-Cache-Api-Key';

    public const CACHE_KEY_LENGTH_MAX = 255;
    public const CACHE_VALUE_LENGTH_MAX = 8388608; // 8 MB, needed for full readable map JSON
    public const CACHE_KEY_REGEX = '/^[A-Za-z0-9._:-]+$/';

    //now ttl constants
    public const CACHE_REQUEST_TIMEOUT_MS_DEFAULT = 1000; // default cache request timeout
    public const JWT_SESSION_TTL_SECONDS = 86400; // 24 hrs for refresh/session metadata
    public const WAITING_MATCH_TTL_SECONDS = 900; // 15 min for waiting matchmaking entries
    public const IDEMPOTENCY_TTL_SECONDS = 600; // 10 min for idempotency responses
    public const RATE_LIMIT_TTL_SECONDS = 60; // 60 sec for rate-limit windows
    public const POLLING_METADATA_TTL_SECONDS = 300; // 5 min for polling metadata
    public const TEMP_RESULT_TTL_SECONDS = 1800; // 30 min for temporary result cache
    public const ACTIVE_MATCH_EXTRA_TTL_SECONDS = 1800; // for keeping match state for 30 min after match timer

    //now a func for returning cache server base URL
    public static function baseUrl(): string 
    {
        return getenv('CACHE_SERVER_URL') ?: self::CACHE_SERVER_URL_DEFAULT; //uses env or local cache server URL
    }

    public static function apiKey(): string // this returns cache server API key
    {
        return getenv('CACHE_SERVER_API_KEY') ?: ''; // this must be configured outside source code
    }

    //to get the cache server auth header name
    public static function authHeaderName(): string
    {
        return self::CACHE_SERVER_AUTH_HEADER;
    }

    public static function requestTimeoutMs(): int // this returns cache request timeout
    {
        return (int) (getenv('CACHE_REQUEST_TIMEOUT_MS') ?: self::CACHE_REQUEST_TIMEOUT_MS_DEFAULT); // this uses env or default timeout
    }
}
