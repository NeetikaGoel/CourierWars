<?php

declare(strict_types=1);

class IdempotencyUtilities
{
    // Placeholder idempotency check for admin controller
    public static function adminCacheIdempotencyCheck(Request $request): bool
    {
        // for now duplicate admin requests are okay
        return true;
    }

    //Placeholder idempotency check
    public static function cacheSetIdempotencyCheck(Request $request): bool
    {
        //for now duplicate set is allowed because set overwrites value.
        return true;
    }

    //Placeholder idempotency check for get
    public static function cacheGetIdempotencyCheck(Request $request): bool
    {
        //GET is safe for now so duplicate request is okay
        return true;
    }

    //Placeholder idempotency check for delete
    public static function cacheDeleteIdempotencyCheck(Request $request): bool
    {
        //delete missing key is also success so duplicate delete is okay
        return true;
    }
}