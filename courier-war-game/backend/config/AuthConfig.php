<?php
declare(strict_types=1);

//this file stores auth tuning values
class AuthConfig
{
    public const GUEST_USERNAME_PREFIX = 'guest_'; // prefix used for generated guest usernames
    public const GUEST_USERNAME_RANDOM_BYTE_COUNT = 6; // creates 12 hex chars
    public const UNIQUE_USERNAME_ATTEMPT_MAX = 5; // retry count for guest username creation
}
