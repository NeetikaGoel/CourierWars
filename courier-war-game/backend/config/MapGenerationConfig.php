<?php 
declare(strict_types=1);

require_once __DIR__ . '/../constants/MapVersionValue.php';

class MapGenerationConfig
{
    public const MAP_VERSION = MapVersionValue::MAP_V1;
    public const MAP_GENERATION_VERSION = MapVersionValue::CITY_MAP_GENERATION_V7; 

    public const MAP_WIDTH_TILES = 96; 
    public const MAP_HEIGHT_TILES = 96; 

    public const ZONE_COLUMN_COUNT = 3; 
    public const ZONE_ROW_COUNT = 3;

    //isometric tile dimension details for frontend rendering
    public const TILE_WIDTH_PIXELS = 32; 
    public const TILE_HEIGHT_PIXELS = 16;

    //road widths
    public const LOCAL_ROAD_WIDTH_TILES = 1; 
    public const DISTRICT_ROAD_WIDTH_TILES = 2;
    public const AVENUE_ROAD_WIDTH_TILES = 3;

    //target min and max counts for diff map features
    public const PARK_COUNT_MIN = 5;
    public const PARK_COUNT_MAX = 9;
    public const LAKE_COUNT_MIN = 3;
    public const LAKE_COUNT_MAX = 6;
    public const BRIDGE_COUNT_MIN = 5;
    public const BRIDGE_COUNT_MAX = 10;
    public const TUNNEL_COUNT_MIN = 6;
    public const TUNNEL_COUNT_MAX = 12;
    public const SHORTCUT_COUNT_MIN = 5;
    public const SHORTCUT_COUNT_MAX = 10;
    public const TRAFFIC_SIGNAL_COUNT_MIN = 35;
    public const TRAFFIC_SIGNAL_COUNT_MAX = 55;

    public const GENERATED_MAP_COUNT_INITIAL = 10;
    public const TRAFFIC_SIGNAL_DISTANCE_MIN_TILES = 7; // to prevent clustered traffic signals

    public const GENERATION_RETRY_COUNT_MAX = 8; // this lets backend retry invalid generated maps

    public const MAP_SEED_MIN = 1; // min generated map seed
    public const MAP_SEED_MAX = 2147483647; // safe signed 32-bit max seed

    //to return all map metadata together for clients and cache
    public static function mapMetadata(): array
    {
        return [
            'mapVersion' => self::MAP_VERSION, 
            'mapGenerationVersion' => self::MAP_GENERATION_VERSION, 
            'widthTiles' => self::MAP_WIDTH_TILES,
            'heightTiles' => self::MAP_HEIGHT_TILES, 
            'zoneColumns' => self::ZONE_COLUMN_COUNT, 
            'zoneRows' => self::ZONE_ROW_COUNT, 
            'tileSize' => [ 
                'widthPixels' => self::TILE_WIDTH_PIXELS, 
                'heightPixels' => self::TILE_HEIGHT_PIXELS, 
            ], 
        ]; 
    }

    //for returning all feature count ranges together
    public static function featureCountRanges(): array
    {
        return [
            'park' => [
                'min' => self::PARK_COUNT_MIN,
                'max' => self::PARK_COUNT_MAX,
            ],
            'lake' => [
                'min' => self::LAKE_COUNT_MIN,
                'max' => self::LAKE_COUNT_MAX,
            ],
            'bridge' => [
                'min' => self::BRIDGE_COUNT_MIN,
                'max' => self::BRIDGE_COUNT_MAX,
            ],
            'tunnel' => [
                'min' => self::TUNNEL_COUNT_MIN,
                'max' => self::TUNNEL_COUNT_MAX,
            ],
            'shortcut' => [
                'min' => self::SHORTCUT_COUNT_MIN,
                'max' => self::SHORTCUT_COUNT_MAX,
            ],
            'trafficSignal' => [
                'min' => self::TRAFFIC_SIGNAL_COUNT_MIN,
                'max' => self::TRAFFIC_SIGNAL_COUNT_MAX,
            ],
        ];
    }
}
