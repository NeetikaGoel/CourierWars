<?php

declare(Strict_types=1);

class RateLimitUtilities
{
    // Placeholder rate-limit check for admin controller
    public static function adminCacheRateLimitCheck(Request $request): bool
    {
        // for now no rate limit!
        return true;
    }


    //Placeholder rate-limit check for cache set endpoint
    public static function cacheSetRateLimitCheck(Request $request): bool
    {
        //For now no rate limit.
        return true;
    }

    //Placeholder rate-limit check for get
    public static function cacheGetRateLimitCheck(Request $request): bool
    {
        //for now no rate limit!
        return true;
    }


    //Placeholder rate-limit check for delete
    public static function cacheDeleteRateLimitCheck(Request $request): bool
    {
        //For now no rate limit!
        return true;
    }
}