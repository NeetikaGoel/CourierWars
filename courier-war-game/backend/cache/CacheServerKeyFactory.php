<?php
declare(strict_types=1);

//import first
require_once __DIR__ . '/../config/CacheServerConfig.php';
require_once __DIR__ . '/CacheServerValidationUtility.php';

//we need a key factory coz
//yes coz all cache server session key will be made here
class CacheServerKeyFactory
{
    //this creates jwt session metadata key
    public static function authSessionKey(string $sidHash): string
    {
        return self::keyBuild(['auth', 'session', $sidHash]);
    }

    //now creating matchmaking waiting queue key
    public static function matchmakingWaitingKey(string $role, string $difficulty): string
    {
        return self::keyBuild(['matchmaking', 'waiting', $role, $difficulty]);
    }

    //bootstrap map list key now
    public static function mapBootstrapListKey(string $mapVersion): string
    {
        return self::keyBuild(['map', 'bootstrap', $mapVersion, 'list']);
    }

    //creating bootstrap map item key
    public static function mapBootstrapItemKey(string $mapVersion, int $mapIndex): string
    {
        return self::keyBuild(['map', 'bootstrap', $mapVersion, (string)$mapIndex]);
    }

    //active match state key
    public static function matchStateKey(int $matchId): string
    {
        return self::keyBuild(['match', (string)$matchId, 'state']);
    }

    //active match map key
    public static function matchMapKey(int $matchId): string
    {
        return self::keyBuild(['match', (string)$matchId, 'map']);
    }

    //now also idempotency cache key
    public static function idempotencyKey(string $sidHash, string $clientActionId): string
    {
        return self::keyBuild(['idempotency', $sidHash, $clientActionId]);
    }

    //with the rate limit key
    public static function rateLimitKey(string $sidHash, string $bucket): string
    {
        return self::keyBuild(['rate', $sidHash, $bucket]);
    }

    //polling metadata key
    public static function pollingMetadataKey(string $sidHash, int $matchId): string
    {
        return self::keyBuild(['polling', $sidHash, (string)$matchId]);
    }

    //temporary result cache key
    public static function temporaryResultKey(int $matchId): string
    {
        return self::keyBuild(['result', 'temporary', (string)$matchId]);
    }

    //draw offer cache key
    public static function drawOfferKey(int $matchId): string
    {
        return self::keyBuild(['match', (string)$matchId, 'draw-offer']);
    }

    //now the final function that we need here keybuild function
    //this will be called in each function we defined until now
    //building safe cache key from parts
    private static function keyBuild(array $parts): string
    {
        $keyParts = [CacheServerConfig::ROOT_PREFIX];

        foreach ($parts as $part) {
            $keyParts[] = CacheServerValidationUtility::safeKeyPartGet((string)$part);
        }

        $key = implode(CacheServerConfig::SEPARATOR, $keyParts);

        CacheServerValidationUtility::cacheKeyValidate($key);

        return $key;
    }
}
