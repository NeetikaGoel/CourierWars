<?php

declare(Strict_types=1);

class ValidationUtilities
{
    //MAKE THEM QUALITY OF LIFE FUNCTIONS!!!
    public static function validateMethodPost($request) : void
    {
        if ($request->getMethod() !== 'POST') {
            throw new InvalidArgumentException('POST method required');
        }
    }

    public static function validateMethodGet($request): void
    {
        if ($request->getMethod() !== 'GET') {
            throw new InvalidArgumentException('GET method required');
        }
    }

    public static function validateMethodDelete($request): void
    {
        if ($request->getMethod() !== 'DELETE') {
            throw new InvalidArgumentException('DELETE method required');
        }
    }

    public static function validateJson($request): void
    {
        if ($request->getHasInvalidJson() === true) {
            throw new InvalidArgumentException('Malformed JSON body');
        }
    }

    public static function validateKey($key):void
    {
        //Validate key
        if (!is_string($key) || $key === '') {
            throw new InvalidArgumentException('key is required and must be a string');
        }
    }

    public static function validateTtl($ttl):int
    {
        //validate ttl if provided
        if ($ttl !== null && !is_int($ttl)) {
            throw new InvalidArgumentException('ttl must be an integer');
        }

        if ($ttl === null) {
            $ttl = CACHE_TTL_SECONDS_DEFAULT;
        }

        if ($ttl < 1 || $ttl > CACHE_TTL_SECONDS_MAX) {
            throw new InvalidArgumentException('ttl must be between 1 and 604800');
        }
        return $ttl;
    }

    //THIS ALSO UPDATED ITS FAILING CASSE
    public static function validateValue($value, bool $hasValue = true): void
    {
        if ($hasValue === false) 
        {
            throw new InvalidArgumentException('value is required');
        }

        if (is_string($value) && strlen($value) > CACHE_VALUE_STRING_LENGTH_MAX) 
        {
            throw new InvalidArgumentException('value string must not exceed 1024 characters');
        }
    }

    public static function validateItemsArray($items):void
    {
        // Validate items array!!!!
        if (!is_array($items)) {
            throw new InvalidArgumentException('items must be an array');
        }
    }

    public static function validateItemArray($item): void
    {
        // Validate items array EACH ITEM THIS TIME!!!!
        if (!is_array($item)) {
            throw new InvalidArgumentException('items must be an array');
        }
    }



   //need tp update this -test is failing
    public static function validateLimit($limitRaw): int
    {
        $limit = CACHE_LIST_LIMIT_DEFAULT;

        //same
        if ($limitRaw !== null) {
            if (!is_numeric($limitRaw)) {
                throw new InvalidArgumentException('limit must be numeric');
            }

            $limit = (int)$limitRaw;

            if ($limit < 1 || $limit > CACHE_LIST_LIMIT_MAX) {
                throw new InvalidArgumentException('limit must be between 1 and 1000');
            }
        }
        //added this
        return $limit;
    }

}
