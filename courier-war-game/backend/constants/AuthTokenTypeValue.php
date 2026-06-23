<?php
declare(strict_types=1);

//for storing jwt token type values
class AuthTokenTypeValue
{
    public const ACCESS = 'access'; // short lived token used for normal api authentication
    public const REFRESH = 'refresh'; // longer lived token used to create a new access token

    //for returning all allowed token types
    public static function all(): array
    {
        return [self::ACCESS, self::REFRESH];
    }
}
