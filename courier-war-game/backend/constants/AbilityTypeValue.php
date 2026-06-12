<?php 
declare(strict_types=1);

//for the courier abilities
class AbilityTypeValue 
{
    public const SPEED_BOOST = 'speedBoost'; // temporarily increases courier speed
    public const SHIELD = 'shield'; // blocks 1 obstacle effect
    public const REVEAL_ROUTE = 'revealRoute'; // reveals route guidance

    //to get all together
    public static function all(): array
    {
        return [self::SPEED_BOOST, self::SHIELD, self::REVEAL_ROUTE];
    }
}
