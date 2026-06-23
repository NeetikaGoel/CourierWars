<?php
declare(strict_types=1);

//for stroing user type values used inside auth tokens and api responses
class UserTypeValue
{
    public const REGISTERED = 'registered'; // user has email and password hash
    public const GUEST = 'guest'; // user has no email and pw

    //for returning all allowed user types
    public static function all(): array
    {
        return [self::REGISTERED, self::GUEST];
    }
}
