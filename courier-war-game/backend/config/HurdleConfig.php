<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/HurdleTypeValue.php';

//this class is for storing duration of  cooldown energy and active-count tuning values
class HurdleConfig 
{
    public const SABOTEUR_ENERGY_MAX = 100; 
    public const SABOTEUR_ENERGY_START = 100;
    public const SABOTEUR_ENERGY_RECOVERY_PER_SECOND = 4; 
    public const ACTIVE_HURDLE_COUNT_MAX = 5; //so to not spam map
    public const COURIER_DISTANCE_MIN_TILES = 3; // to prevent placing hurdles too close to Courier
    public const ENERGY_COST_MEDIUM = 15; // med hurdle cost
    public const ENERGY_COST_HIGH = 25; // high hurdle cost

    //for saving all hurdle rules together
    public static function hurdleRules(): array
    {
        return [
            HurdleTypeValue::RED_TRAFFIC_LIGHT => [
                'durationMs' => 4000, // this stops Courier at signal for 4 sec
                'cooldownMs' => 8000, // 8 sec
                'energyCost' => self::ENERGY_COST_MEDIUM, 
            ],
            HurdleTypeValue::ROAD_BLOCK => [ 
                'durationMs' => 5000, // this blocks road for 5 sec
                'cooldownMs' => 12000, // 12 sec 
                'energyCost' => self::ENERGY_COST_HIGH, 
            ], 
            HurdleTypeValue::CONSTRUCTION_WORK => [ 
                'durationMs' => 8000, // this slows movt for 8 sec
                'cooldownMs' => 15000, // 15 sec
                'energyCost' => self::ENERGY_COST_MEDIUM,
            ], 
            HurdleTypeValue::TRAFFIC_JAM => [ 
                'durationMs' => 6000, // this slows movt for 6 sec
                'cooldownMs' => 10000, // 10 sec
                'energyCost' => self::ENERGY_COST_MEDIUM,
            ], 
            HurdleTypeValue::CLOSED_GATE => [ 
                'durationMs' => 5000, // this closes tunnel bridge/shortcut entrance for 5 sec
                'cooldownMs' => 12000, // 12 sec
                'energyCost' => self::ENERGY_COST_HIGH, 
            ], 
            HurdleTypeValue::WRONG_DIRECTION_SIGN => [ 
                'durationMs' => 5000, // this misleads route decision for 5 sec
                'cooldownMs' => 15000, // 15 sec
                'energyCost' => self::ENERGY_COST_MEDIUM,
            ], 
            HurdleTypeValue::BROKEN_ROAD => [ 
                'durationMs' => 6000, // this makes road unavailable for 6 sec
                'cooldownMs' => 15000, // 15 sec
                'energyCost' => self::ENERGY_COST_HIGH, 
            ], 
            HurdleTypeValue::MOVING_BARRIER => [ 
                'durationMs' => 8000, // this creates timing hazard for 8 sec
                'cooldownMs' => 15000, // 15 sec
                'energyCost' => self::ENERGY_COST_HIGH, 
            ], 
            HurdleTypeValue::SECURITY_CHECKPOINT => [
                'durationMs' => 4000, // this stops Courier briefly for 4 sec
                'cooldownMs' => 12000, // 12 sec
                'energyCost' => self::ENERGY_COST_MEDIUM,
            ], 
        ]; 
    }

    //if to get specific rule for 1 hurdle
    public static function ruleFor(string $hurdleType): array
    {
        return self::hurdleRules()[$hurdleType] ?? [];
    }
}
