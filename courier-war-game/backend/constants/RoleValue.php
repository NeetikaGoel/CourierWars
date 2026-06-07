<?php
declare(strict_types=1); 

class RoleValue
{
    public const COURIER = 'courier';
    public const SABOTEUR = 'saboteur';

    public const ANY = 'any'; // for the case when backend may assign either role

    //to get all role values at once
    public static function all(): array 
    {
        return [self::COURIER, self::SABOTEUR, self::ANY]; 
    }

    //without any
    public static function playable(): array 
    {
        return [self::COURIER, self::SABOTEUR];
    }
}
