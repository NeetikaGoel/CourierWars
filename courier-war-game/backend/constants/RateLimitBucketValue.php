<?php
declare(strict_types=1);

class RateLimitBucketValue
{
    public const MATCHMAKING = 'matchmaking';
    public const POLL = 'poll';
    public const MATCH_FORFEIT = 'match_forfeit';
    public const COURIER_MOVE = 'courier_move';
    public const COURIER_ABILITY = 'courier_ability';
    public const SABOTEUR_HURDLE = 'saboteur_hurdle';
    public const DRAW = 'draw';
    public const RESULT = 'result';

    public static function all(): array
    {
        return [
            self::MATCHMAKING,
            self::POLL,
            self::MATCH_FORFEIT,
            self::COURIER_MOVE,
            self::COURIER_ABILITY,
            self::SABOTEUR_HURDLE,
            self::DRAW,
            self::RESULT,
        ];
    }
}
