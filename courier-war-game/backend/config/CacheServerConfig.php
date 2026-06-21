<?php
declare(strict_types=1);

class CacheServerConfig
{
    //default local cache server URL matching simple cache server
    public const CACHE_SERVER_URL_DEFAULT = 'http://127.0.0.1:8080';

    public const ROOT_PREFIX = 'cw'; // root prefix for courier war cache keys
    public const SEPARATOR = ':'; // separator used in cache keys

    //simple cache server reads this exact header name
    public const CACHE_SERVER_AUTH_HEADER = 'X-API-Key';

    public const CACHE_KEY_LENGTH_MAX = 255;
    public const CACHE_VALUE_LENGTH_MAX = 8388608; // 8 mb needed for full readable map json
    public const CACHE_KEY_REGEX = '/^[A-Za-z0-9._:-]+$/';
    public const CACHE_KEY_PART_REGEX = '/^[A-Za-z0-9._:-]+$/';

    public const CACHE_HTTP_STATUS_LINE_REGEX = '/\s([0-9]{3})\s/';
    public const CACHE_HTTP_STATUS_CODE_DEFAULT = 0;
    public const CACHE_REQUEST_TIMEOUT_SECONDS_MIN = 1;

    public const CACHE_REQUEST_KEY_FIELD = 'key';
    public const CACHE_REQUEST_VALUE_FIELD = 'value';
    public const CACHE_REQUEST_TTL_FIELD = 'ttl';

    public const CACHE_RESPONSE_STATUS_CODE_KEY = 'statusCode';
    public const CACHE_RESPONSE_BODY_KEY = 'body';
    public const CACHE_RESPONSE_SUCCESS_KEY = 'success';
    public const CACHE_RESPONSE_DATA_KEY = 'data';
    public const CACHE_RESPONSE_VALUE_KEY = 'value';

    public const CACHE_REQUEST_ACCEPT_HEADER = 'Accept: application/json';
    public const CACHE_REQUEST_CONTENT_TYPE_HEADER = 'Content-Type: application/json';
    public const CACHE_HTTP_HEADER_SEPARATOR = "\r\n";
    public const CACHE_URL_PATH_SEPARATOR = '/';
    public const CACHE_URL_QUERY_SEPARATOR = '?';

    //now ttl constants
    public const JWT_SESSION_TTL_SECONDS = 86400; // 24 hrs for refresh/session metadata
    public const WAITING_MATCH_TTL_SECONDS = 900; // 15 min for waiting matchmaking entries
    public const BOOTSTRAP_MAP_TTL_SECONDS = 86400; // 24 hrs for generated bootstrap maps
    public const IDEMPOTENCY_TTL_SECONDS = 600; // 10 min for idempotency responses
    public const RATE_LIMIT_TTL_SECONDS = 60; // 60 sec for rate-limit windows
    public const POLLING_METADATA_TTL_SECONDS = 300; // 5 min for polling metadata
    public const TEMP_RESULT_TTL_SECONDS = 1800; // 30 min for temporary result cache
    public const ACTIVE_MATCH_EXTRA_TTL_SECONDS = 1800; // keeps match state after timer

    public const CACHE_REQUEST_TIMEOUT_MS_DEFAULT = 1000; // default cache request timeout
    public const CACHE_HEALTH_KEY = 'cw:health:backend-ping'; // safe key used to test cache reachability

    //now a func for returning cache server base URL
    public static function baseUrl(): string
    {
        return getenv('CACHE_SERVER_URL') ?: self::CACHE_SERVER_URL_DEFAULT;
    }

    //this returns cache server api key
    public static function apiKey(): string
    {
        return getenv('CACHE_SERVER_API_KEY') ?: '';
    }

    //to get the cache server auth header name
    public static function authHeaderName(): string
    {
        return self::CACHE_SERVER_AUTH_HEADER;
    }

    //this returns cache request timeout
    public static function requestTimeoutMs(): int
    {
        return (int)(getenv('CACHE_REQUEST_TIMEOUT_MS') ?: self::CACHE_REQUEST_TIMEOUT_MS_DEFAULT);
    }
}
