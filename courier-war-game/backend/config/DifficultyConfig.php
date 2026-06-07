<?php 
declare(strict_types=1); 

//importing difficult value name constants
require_once __DIR__ . '/../constants/DifficultyValue.php'; // this imports fixed difficulty names

//now this class is for storing timer and route-help values
class DifficultyConfig 
{
    //TIMERS
    public const EASY_TIMER_MS = 420000; // 7 min for easy
    public const MEDIUM_TIMER_MS = 300000; // 5 min for medium
    public const HARD_TIMER_MS = 180000; // 3 min for hard

    //ROUTE HELPS
    public const EASY_ROUTE_HELP = 'safestRoute'; // safest route help
    public const MEDIUM_ROUTE_HELP = 'shortestRoute'; // shortest route help
    public const HARD_ROUTE_HELP = 'none'; // disables route help

    //if to get all timers
    public static function timerMsByDifficulty(): array 
    {
        return [ 
            DifficultyValue::EASY => self::EASY_TIMER_MS, 
            DifficultyValue::MEDIUM => self::MEDIUM_TIMER_MS, 
            DifficultyValue::HARD => self::HARD_TIMER_MS, 
        ]; 
    }

    //if to get all route helps
    public static function routeHelpByDifficulty(): array 
    {
        return [ 
            DifficultyValue::EASY => self::EASY_ROUTE_HELP, 
            DifficultyValue::MEDIUM => self::MEDIUM_ROUTE_HELP,
            DifficultyValue::HARD => self::HARD_ROUTE_HELP,
        ]; 
    }

    //if to get timer for a certain difficulty or default will be medium one 5 min
    public static function timerMs(string $difficulty): int 
    {
        return self::timerMsByDifficulty()[$difficulty] ?? self::MEDIUM_TIMER_MS;
    }
}
