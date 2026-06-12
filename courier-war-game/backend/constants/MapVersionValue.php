<?php
declare(strict_types=1);

//for storing version strings
class MapVersionValue
{
    public const MAP_V1 = 'v1';
    public const CITY_MAP_GENERATION_V7 = 'city_map_generation_v7';

    //getting curr version
    public static function currentMapVersion(): string
    {
        return self::MAP_V1;
    }

    //getting curr gen version
    public static function currentGenerationVersion(): string 
    {
        return self::CITY_MAP_GENERATION_V7;
    }
}
