<?php

declare(strict_types=1);

require_once __DIR__ . '/../constants/MapVersionValue.php';

//this file stores backend map generation values
class MapGenerationConfig
{
    public const MAP_VERSION = MapVersionValue::MAP_V1;
    public const MAP_GENERATION_VERSION = MapVersionValue::CITY_MAP_GENERATION_V7;

    public const MAP_WIDTH_TILES = 96;
    public const MAP_HEIGHT_TILES = 96;
    public const SAFE_BORDER_TILES = 4;

    public const ZONE_COLUMN_COUNT = 3;
    public const ZONE_ROW_COUNT = 3;

    public const TILE_WIDTH_PIXELS = 32;
    public const TILE_HEIGHT_PIXELS = 16;

    public const LOCAL_ROAD_WIDTH_TILES = 1;
    public const LOCAL_ROAD_SPACING_TILES_MIN = 8;
    public const LOCAL_ROAD_SPACING_TILES_MAX = 13;
    public const LOCAL_ROAD_BRANCH_COUNT_PER_ZONE_TARGET = 3;

    public const DISTRICT_ROAD_WIDTH_TILES = 2;
    public const DISTRICT_ROAD_SPACING_TILES_MIN = 13;
    public const DISTRICT_ROAD_SPACING_TILES_MAX = 20;
    public const DISTRICT_ROAD_COUNT_PER_ZONE_TARGET = 2;

    public const AVENUE_ROAD_WIDTH_TILES = 3;
    public const AVENUE_ROAD_SPACING_TILES_MIN = 24;
    public const AVENUE_ROAD_SPACING_TILES_MAX = 32;
    public const AVENUE_VERTICAL_COUNT_TARGET = 3;
    public const AVENUE_HORIZONTAL_COUNT_TARGET = 3;

    public const ROAD_PARALLEL_OVERLAP_RATIO_MAX = 0.22;
    public const LOCAL_BRANCH_OVERLAP_RATIO_MAX = 0.42;

    public const PARK_COUNT_MIN = 5;
    public const PARK_COUNT_MAX = 8;
    public const PARK_WIDTH_TILES_MIN = 6;
    public const PARK_WIDTH_TILES_MAX = 13;
    public const PARK_HEIGHT_TILES_MIN = 5;
    public const PARK_HEIGHT_TILES_MAX = 12;
    public const PARK_RING_ROAD_ALLOWED = true;
    public const PARK_ROAD_OVERLAP_RATIO_MAX = 0.24;

    public const LAKE_COUNT_MIN = 4;
    public const LAKE_COUNT_MAX = 7;
    public const LAKE_WIDTH_TILES_MIN = 8;
    public const LAKE_WIDTH_TILES_MAX = 18;
    public const LAKE_HEIGHT_TILES_MIN = 6;
    public const LAKE_HEIGHT_TILES_MAX = 14;
    public const LAKE_RING_ROAD_ALLOWED = true;
    public const LAKE_ROAD_OVERLAP_RATIO_MAX = 0.14;

    public const BRIDGE_COUNT_MIN = 5;
    public const BRIDGE_COUNT_MAX = 9;
    public const BRIDGE_LENGTH_TILES_MIN = 5;
    public const BRIDGE_LENGTH_TILES_MAX = 18;

    public const TUNNEL_COUNT_MIN = 5;
    public const TUNNEL_COUNT_MAX = 9;
    public const TUNNEL_LENGTH_TILES_MIN = 5;
    public const TUNNEL_LENGTH_TILES_MAX = 15;
    public const TUNNEL_ENDPOINT_DISTANCE_TILES_MIN = 8;

    public const SHORTCUT_COUNT_MIN = 6;
    public const SHORTCUT_COUNT_MAX = 10;
    public const SHORTCUT_LENGTH_TILES_MIN = 5;
    public const SHORTCUT_LENGTH_TILES_MAX = 13;
    public const SHORTCUT_DISTANCE_SAVING_TILES_MIN = 4;

    public const TRAFFIC_SIGNAL_COUNT_TARGET = 32;
    public const TRAFFIC_SIGNAL_DISTANCE_MIN_TILES = 9;
    public const TRAFFIC_SIGNAL_AVENUE_AVENUE_REQUIRED = true;
    public const TRAFFIC_SIGNAL_AVENUE_DISTRICT_CHANCE = 0.7;
    public const TRAFFIC_SIGNAL_DISTRICT_DISTRICT_CHANCE = 0.38;
    public const TRAFFIC_SIGNAL_LOCAL_ONLY_CHANCE = 0.0;

    public const START_ZONE_ID_PREFERRED = 'zone-0';
    public const DELIVERY_ZONE_ID_PREFERRED = 'zone-8';
    public const START_DELIVERY_VALID_ROAD_SEARCH_RADIUS_TILES_MAX = 20;

    public const GENERATED_MAP_COUNT_INITIAL = 10;
    public const GENERATION_RETRY_COUNT_MAX = 10;
    public const GENERATION_RETRY_SEED_OFFSET = 9973;

    public const MAP_SEED_MIN = 1;
    public const MAP_SEED_MAX = 2147483647;
    public const PREVIEW_MAP_SEED_DEFAULT = 20260531;

    //this returns metadata needed by frontend and cache
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

    //this returns feature ranges for debug and frontend metadata
    public static function featureCountRanges(): array
    {
        return [
            'park' => ['min' => self::PARK_COUNT_MIN, 'max' => self::PARK_COUNT_MAX],
            'lake' => ['min' => self::LAKE_COUNT_MIN, 'max' => self::LAKE_COUNT_MAX],
            'bridge' => ['min' => self::BRIDGE_COUNT_MIN, 'max' => self::BRIDGE_COUNT_MAX],
            'tunnel' => ['min' => self::TUNNEL_COUNT_MIN, 'max' => self::TUNNEL_COUNT_MAX],
            'shortcut' => ['min' => self::SHORTCUT_COUNT_MIN, 'max' => self::SHORTCUT_COUNT_MAX],
            'trafficSignal' => ['target' => self::TRAFFIC_SIGNAL_COUNT_TARGET],
        ];
    }
}
