<?php
declare(strict_types=1);

class MatchRequestFieldName
{
    public const DIFFICULTY = 'difficulty';
    public const ROLE_PREFERENCE = 'rolePreference';
    public const MAP_VERSION = 'mapVersion';
    public const MAP_GENERATION_VERSION = 'mapGenerationVersion';
    public const KNOWN_VERSION = 'knownVersion';
    public const CLIENT_ACTION_ID = 'clientActionId';
    public const KNOWN_STATE_VERSION = 'knownStateVersion';

    public const FROM = 'from';
    public const TO = 'to';
    public const TARGET = 'target';
    public const X = 'x';
    public const Y = 'y';
    public const DIRECTION = 'direction';

    public const HURDLE_TYPE = 'hurdleType';
    public const ABILITY_TYPE = 'abilityType';
    public const REQUESTED_DURATION_MS = 'requestedDurationMs';
    public const ACCEPTED = 'accepted';

    public static function matchCreateRequired(): array
    {
        return [
            self::DIFFICULTY,
            self::ROLE_PREFERENCE,
            self::MAP_VERSION,
            self::MAP_GENERATION_VERSION,
        ];
    }

    public static function courierMoveRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID,
            self::KNOWN_STATE_VERSION,
            self::FROM,
            self::TO,
            self::DIRECTION,
        ];
    }

    public static function saboteurHurdleRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID,
            self::KNOWN_STATE_VERSION,
            self::HURDLE_TYPE,
            self::TARGET,
        ];
    }

    public static function courierAbilityRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID,
            self::KNOWN_STATE_VERSION,
            self::ABILITY_TYPE,
        ];
    }

    public static function drawOfferRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID,
            self::KNOWN_STATE_VERSION,
        ];
    }

    public static function drawRespondRequired(): array
    {
        return [
            self::CLIENT_ACTION_ID,
            self::KNOWN_STATE_VERSION,
            self::ACCEPTED,
        ];
    }
}
