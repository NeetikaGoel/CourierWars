<?php
declare(strict_types=1);

require_once __DIR__ . '/MapGenerationConfig.php';

// this class stores match lifecycle and sync values that can be tuned after testing
class MatchConfig
{
    public const MATCH_ID_MIN = 100000000; // match ids are random 9 digit numbers
    public const MATCH_ID_MAX = 999999999;
    public const MATCH_ID_CREATE_ATTEMPTS_MAX = 5; // retries when a random id collides

    public const PLAYER_TOKEN_BYTES = 16; // per tab token so two tabs of one account can still play each other
    public const PLAYER_TOKEN_FIELD = 'playerToken'; // body field and query param name for player token

    public const MAP_SEED = MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT; // every match uses this seed until map rotation exists

    public const START_COUNTDOWN_MS = 1500; // gap between both players ready and timer start
    public const READY_WAIT_MAX_MS = 30000; // starts the match anyway when one player never reports ready

    public const COURIER_TRAIL_LENGTH_MAX = 24; // recent tiles sent so the Saboteur can animate the Courier path
    public const COURIER_STEPS_PER_REQUEST_MAX = 32; // caps one move batch
    public const COURIER_STEP_MS_MIN = 60; // fastest legal tile step, below the fastest client tween (tunnel 0.62 * 145ms)
    public const COURIER_STEP_BURST_ALLOWANCE = 6; // extra steps allowed on top of elapsed time budget for network jitter
    public const COURIER_STEP_BUDGET_WINDOW_MS = 2000; // idle time older than this does not add step budget, stops bursts after standing still
    public const COURIER_LIVES_START = 3;

    public const HURDLE_TILES_MAX = 8; // a hurdle covers at most a road width of tiles
    public const HURDLE_TILE_SPREAD_MAX = 4; // every hurdle tile must be this close to the anchor tile

    public const LOCK_DIRECTORY_NAME = 'courier-war-match-locks'; // created inside the system temp directory
    public const MATCHMAKING_LOCK_NAME = 'matchmaking';

    public const TILE_DISTANCE_KM = 0.05; // used for the result screen distance stat

    public static function lockDirectory(): string
    {
        return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . self::LOCK_DIRECTORY_NAME;
    }
}
