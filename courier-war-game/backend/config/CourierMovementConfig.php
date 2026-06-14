<?php

declare(strict_types=1);

require_once __DIR__ . '/../map/type/CityTileValue.php';

//this file stores movt costs shared by backend map generation and later movt validation
class CourierMovementConfig
{
    public const BASE_MOVE_DURATION_MS = 145;
    public const RED_TRAFFIC_SIGNAL_STOP_MS = 4000;

    public const LOCAL_ROAD_MOVEMENT_COST = 1.25;
    public const DISTRICT_ROAD_MOVEMENT_COST = 1.0;
    public const AVENUE_ROAD_MOVEMENT_COST = 0.7;

    public const BRIDGE_MOVEMENT_COST = 0.78;
    public const TUNNEL_MOVEMENT_COST = 0.62;
    public const SHORTCUT_MOVEMENT_COST = 1.65;

    public const CONSTRUCTION_WORK_MULTIPLIER = 2.5;
    public const TRAFFIC_JAM_MULTIPLIER = 2.0;
    public const SECURITY_CHECKPOINT_MULTIPLIER = 1.5;

    //this returns the default movement cost for a tile path and road class
    public static function baseMovementCostFor(string $roadClass, string $pathKind): float
    {
        if ($pathKind === CityTileValue::PATH_KIND_BRIDGE) {
            return self::BRIDGE_MOVEMENT_COST;
        }

        if ($pathKind === CityTileValue::PATH_KIND_TUNNEL) {
            return self::TUNNEL_MOVEMENT_COST;
        }

        if ($pathKind === CityTileValue::PATH_KIND_SHORTCUT) {
            return self::SHORTCUT_MOVEMENT_COST;
        }

        if ($roadClass === CityTileValue::ROAD_CLASS_LOCAL_ROAD) {
            return self::LOCAL_ROAD_MOVEMENT_COST;
        }

        if ($roadClass === CityTileValue::ROAD_CLASS_AVENUE_ROAD) {
            return self::AVENUE_ROAD_MOVEMENT_COST;
        }

        return self::DISTRICT_ROAD_MOVEMENT_COST;
    }
}
