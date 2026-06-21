<?php
declare(strict_types=1);

//so imports first
require_once __DIR__ . '/../config/CacheServerConfig.php';
require_once __DIR__ . '/../utility/HashFactory.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';

//then what this file will do
//which is a utility 
//and it will now keep defensive cache contract checks in 1 place hehehe
class CacheServerValidationUtility
{
    //first of all validating cache key before request
    public static function cacheKeyValidate(string $key): void
    {
        if ($key === '') 
        {
            throw new InvalidArgumentException('Cache key is required!!');
        }

        if (strlen($key) > CacheServerConfig::CACHE_KEY_LENGTH_MAX) {
            throw new InvalidArgumentException('Cache key is too long!!');
        }

        if (preg_match(CacheServerConfig::CACHE_KEY_REGEX, $key) !== 1) {
            throw new InvalidArgumentException('Cache key format is invalid!!');
        }
    }

    //now validating encoded cache value size before request
    public static function cacheValueValidate(mixed $value): void
    {
        $encodedValue = JsonSafeEncoder::encode([CacheServerConfig::CACHE_REQUEST_VALUE_FIELD => $value]);

        if (strlen($encodedValue) > CacheServerConfig::CACHE_VALUE_LENGTH_MAX) {
            throw new InvalidArgumentException('Cache value is too large!!');
        }
    }

    //also we need to validate ttl before request
    public static function ttlValidate(int $ttlSeconds): void
    {
        if ($ttlSeconds <= 0) {
            throw new InvalidArgumentException('Cache ttl is invalid!!');
        }
    }

    //now also making 1 part of key as safe
    public static function safeKeyPartGet(string $part): string
    {
        $part = trim($part);
        if ($part === '') {
            throw new InvalidArgumentException('Cache key part is empty!!');
        }
        if (preg_match(CacheServerConfig::CACHE_KEY_PART_REGEX, $part) === 1) {
            return $part;
        }
        return HashFactory::sha256($part);
    }
}
