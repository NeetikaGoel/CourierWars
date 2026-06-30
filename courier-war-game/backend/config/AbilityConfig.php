<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/AbilityTypeValue.php';

class AbilityConfig
{
    public const SPEED_BOOST_DURATION_MS = 5000; // speed boost lasts five seconds

    public const SPEED_BOOST_COOLDOWN_MS = 20000; // speed boost cooldown is twenty seconds

    public const SPEED_BOOST_MOVEMENT_MULTIPLIER = 0.65; // lower multiplier means faster movement

    public const SHIELD_DURATION_MS = 3000; // shield lasts three seconds

    public const SHIELD_COOLDOWN_MS = 30000; // shield cooldown is thirty seconds

    public const SHIELD_BLOCKED_EFFECT_COUNT = 1; // shield blocks one obstacle effect

    public const REVEAL_ROUTE_DURATION_MS = 5000; // reveal route lasts five seconds

    public const REVEAL_ROUTE_COOLDOWN_MS = 25000; // reveal route cooldown is twenty five seconds

    public static function abilityRules(): array
    {
        return [
            AbilityTypeValue::SPEED_BOOST => [
                'durationMs' => self::SPEED_BOOST_DURATION_MS, // active time for speed boost
                'cooldownMs' => self::SPEED_BOOST_COOLDOWN_MS, // cooldown time for speed boost
                'movementMultiplier' => self::SPEED_BOOST_MOVEMENT_MULTIPLIER, // movement speed effect
            ],
            AbilityTypeValue::SHIELD => [
                'durationMs' => self::SHIELD_DURATION_MS, // active time for shield
                'cooldownMs' => self::SHIELD_COOLDOWN_MS, // cooldown time for shield
                'blockedEffectCount' => self::SHIELD_BLOCKED_EFFECT_COUNT, // number of blocked effects
            ],
            AbilityTypeValue::REVEAL_ROUTE => [
                'durationMs' => self::REVEAL_ROUTE_DURATION_MS, // active time for route reveal
                'cooldownMs' => self::REVEAL_ROUTE_COOLDOWN_MS, // cooldown time for route reveal
            ],
        ];
    }

    public static function abilityExists(string $abilityType): bool
    {
        return array_key_exists($abilityType, self::abilityRules()); // checks backend support for ability
    }

    public static function ruleFor(string $abilityType): array
    {
        return self::abilityRules()[$abilityType] ?? []; // returns ability rule or empty array
    }

    public static function durationMsFor(string $abilityType): int
    {
        $rule = self::ruleFor($abilityType); // loads selected ability rule

        return (int)($rule['durationMs'] ?? 0); // returns zero for unsupported ability
    }

    public static function cooldownMsFor(string $abilityType): int
    {
        $rule = self::ruleFor($abilityType); // loads selected ability rule

        return (int)($rule['cooldownMs'] ?? 0); // returns zero for unsupported ability
    }
}
