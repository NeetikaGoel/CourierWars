<?php
declare(strict_types=1);

class MatchRequestFieldName
{
    //there are from frontend
    public const DIFFICULTY = 'difficulty';
    public const ROLE_PREFERENCE = 'rolePreference'; // requested role it is
    public const MAP_VERSION = 'mapVersion'; // choice of map which will be more later (yeah hopefully....)
    public const MAP_GENERATION_VERSION = 'mapGenerationVersion'; //same as above ofc
    public const KNOWN_VERSION = 'knownVersion'; // for polling version from query string to maintain state
    public const CLIENT_ACTION_ID = 'clientActionId'; // for unique frontend action id
    public const KNOWN_STATE_VERSION = 'knownStateVersion'; // for frontend known match state version
    public const FROM = 'from'; // for courier movement start tile
    public const TO = 'to'; // for courier movement target tile
    public const TARGET = 'target'; // for saboteur target tile
    public const X = 'x'; // for tile x coordinate
    public const Y = 'y'; // for tile y coordinate
    public const DIRECTION = 'direction'; // for courier movement direction
    public const HURDLE_TYPE = 'hurdleType'; // for selected saboteur hurdle
    public const ABILITY_TYPE = 'abilityType'; // for selected courier ability
    public const REQUESTED_DURATION_MS = 'requestedDurationMs'; // for optional hurdle duration

    public static function matchCreateRequired(): array
    {
        return [
            self::DIFFICULTY, // match creation needs difficulty
            self::ROLE_PREFERENCE, // match creation needs role preference
            self::MAP_VERSION, // match creation must confirm map version
            self::MAP_GENERATION_VERSION, // match creation must confirm generator version
        ];
    }

    public static function courierMoveRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID, // move needs retry-safe action id
            self::KNOWN_STATE_VERSION, // move needs stale state protection
            self::FROM, // move needs claimed start tile
            self::TO, // move needs target tile
            self::DIRECTION, // move needs direction
        ];
    }

    public static function saboteurHurdleRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID, // hurdle action needs retry-safe action id
            self::KNOWN_STATE_VERSION, // hurdle action needs stale state protection
            self::HURDLE_TYPE, // hurdle action needs hurdle type
            self::TARGET, // hurdle action needs target tile
        ];
    }

    public static function courierAbilityRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID, // ability action needs retry-safe action id
            self::KNOWN_STATE_VERSION, // ability action needs stale state protection
            self::ABILITY_TYPE, // ability action needs ability type
        ];
    }
}
