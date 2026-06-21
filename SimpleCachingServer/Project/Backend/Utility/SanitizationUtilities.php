<?php

declare(Strict_types=1);

require_once __DIR__ . '/../config/constants.php'; //for cache related constants

class SanitizationUtilities
{
    public static function sanitizeKey(string $key):string
    {
        //sanitize key now
        $key = trim($key);

        if ($key === '' || strlen($key) > CACHE_KEY_LENGTH_MAX || preg_match(CACHE_ITEM_KEY_REGEX, $key) !== 1) {
            throw new InvalidArgumentException('key must be 1 to 255 chars and contain only A-Z a-z 0-9 dot underscore colon hyphen');
        }

        return $key;
    }
}