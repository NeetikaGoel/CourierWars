<?php
declare(strict_types=1);

class MatchEndReasonValue 
{
    public const DELIVERED = 'delivered'; // courier delivered package
    public const TIMER_EXPIRED = 'timerExpired'; // saboteur won by time expiry
    public const COURIER_LIVES_ZERO = 'courierLivesZero'; // courier lost all lives
    public const FORFEIT = 'forfeit'; // a player gave up/disconnected
    public const DRAW = 'draw'; // match was cancelled by system or cache loss or anything by agreement maybe or whatever

    //to get all values at once
    public static function all(): array 
    {
        return [self::DELIVERED, self::TIMER_EXPIRED, self::COURIER_LIVES_ZERO, self::FORFEIT, self::DRAW]; 
    }
}
