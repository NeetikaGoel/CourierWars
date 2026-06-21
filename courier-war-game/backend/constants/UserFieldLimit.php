<?php
declare(strict_types=1);

// this will be for storing validation limits for user-related fields
class UserFieldLimit
{
    //username length
    public const USERNAME_LENGTH_MIN = 3;
    public const USERNAME_LENGTH_MAX = 32;
    public const USERNAME_REGEX = '/^[A-Za-z0-9_]+$/';

    //name length
    public const NAME_LENGTH_MIN = 3;
    public const NAME_LENGTH_MAX = 40;

    //email length
    public const EMAIL_LENGTH_MIN = 6;
    public const EMAIL_LENGTH_MAX = 254;

    //password length
    public const PASSWORD_LENGTH_MIN = 8;
    public const PASSWORD_LENGTH_MAX = 72; //before hashing

    //idempotency client action id length
    public const CLIENT_ACTION_ID_LENGTH = 36; // uuid v4 length
}
