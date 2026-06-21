<?php
declare(strict_types=1);

//this file stores fixed tile layer values used by backend map generation!!
class CityTileValue
{
    public const TERRAIN_BUILDING = 'building';
    public const TERRAIN_LAND = 'land';
    public const TERRAIN_PARK = 'park';
    public const TERRAIN_WATER = 'water';

    public const ROAD_CLASS_NONE = 'none';
    public const ROAD_CLASS_LOCAL_ROAD = 'localRoad';
    public const ROAD_CLASS_DISTRICT_ROAD = 'districtRoad';
    public const ROAD_CLASS_AVENUE_ROAD = 'avenueRoad';

    public const PATH_KIND_NONE = 'none';
    public const PATH_KIND_ROAD = 'road';
    public const PATH_KIND_BRIDGE = 'bridge';
    public const PATH_KIND_TUNNEL = 'tunnel';
    public const PATH_KIND_SHORTCUT = 'shortcut';

    public const FEATURE_NONE = 'none';
    public const FEATURE_TRAFFIC_SIGNAL = 'trafficSignal';
    public const FEATURE_TUNNEL_ENTRANCE = 'tunnelEntrance';
    public const FEATURE_SHORTCUT_ENTRANCE = 'shortcutEntrance';
    public const FEATURE_BRIDGE_ENTRANCE = 'bridgeEntrance';

    public const ROAD_ORIENTATION_HORIZONTAL = 'horizontal';
    public const ROAD_ORIENTATION_VERTICAL = 'vertical';

    //this returns all terrain values
    public static function terrainTypeList(): array
    {
        return [
            self::TERRAIN_BUILDING,
            self::TERRAIN_LAND,
            self::TERRAIN_PARK,
            self::TERRAIN_WATER,
        ];
    }

    //this returns all road class values
    public static function roadClassList(): array
    {
        return [
            self::ROAD_CLASS_NONE,
            self::ROAD_CLASS_LOCAL_ROAD,
            self::ROAD_CLASS_DISTRICT_ROAD,
            self::ROAD_CLASS_AVENUE_ROAD,
        ];
    }

    //this returns all path kind values
    public static function pathKindList(): array
    {
        return [
            self::PATH_KIND_NONE,
            self::PATH_KIND_ROAD,
            self::PATH_KIND_BRIDGE,
            self::PATH_KIND_TUNNEL,
            self::PATH_KIND_SHORTCUT,
        ];
    }

    //this returns all feature values
    public static function featureKindList(): array
    {
        return [
            self::FEATURE_TRAFFIC_SIGNAL,
            self::FEATURE_TUNNEL_ENTRANCE,
            self::FEATURE_SHORTCUT_ENTRANCE,
            self::FEATURE_BRIDGE_ENTRANCE,
        ];
    }
}
