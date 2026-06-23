<?php
declare(strict_types=1);

//need config first
require_once __DIR__ . '/../config/CacheServerConfig.php';

//keeping all cache ttl here hehe
//easy peasy cutey files
class CacheServerTtlConfig
{
    //first ttl for jwt session metadata
    public static function authSessionTtlSeconds(): int
    {
        return CacheServerConfig::JWT_SESSION_TTL_SECONDS;
    }

    //then ttl for waiting matchmaking entries
    public static function waitingMatchTtlSeconds(): int
    {
        return CacheServerConfig::WAITING_MATCH_TTL_SECONDS;
    }

    //ttl for generated bootstrap maps
    public static function bootstrapMapTtlSeconds(): int
    {
        return CacheServerConfig::BOOTSTRAP_MAP_TTL_SECONDS;
    }

    //ttl for active match state based on timer
    public static function activeMatchTtlSeconds(int $timerTotalMs): int
    {
        return (int)ceil($timerTotalMs / 1000) + CacheServerConfig::ACTIVE_MATCH_EXTRA_TTL_SECONDS;
    }

    //ttl for active match map based on timer
    public static function activeMatchMapTtlSeconds(int $timerTotalMs): int
    {
        return self::activeMatchTtlSeconds($timerTotalMs);
    }

    //ttl for idempotency response cache
    public static function idempotencyTtlSeconds(): int
    {
        return CacheServerConfig::IDEMPOTENCY_TTL_SECONDS;
    }

    //ttl for rate limit counters
    public static function rateLimitTtlSeconds(): int
    {
        return CacheServerConfig::RATE_LIMIT_TTL_SECONDS;
    }

    //ttl for polling metadata
    public static function pollingMetadataTtlSeconds(): int
    {
        return CacheServerConfig::POLLING_METADATA_TTL_SECONDS;
    }

    //ttl for temporary match result cache
    public static function temporaryResultTtlSeconds(): int
    {
        return CacheServerConfig::TEMP_RESULT_TTL_SECONDS;
    }
}
