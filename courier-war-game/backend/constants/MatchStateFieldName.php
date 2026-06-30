<?php
declare(strict_types=1);

class MatchStateFieldName
{
    public const MATCH_ID = 'matchId';
    public const STATUS = 'status';
    public const STATE_VERSION = 'stateVersion';
    public const DIFFICULTY = 'difficulty';

    public const MAP_VERSION = 'mapVersion';
    public const MAP_GENERATION_VERSION = 'mapGenerationVersion';
    public const MAP_SEED = 'mapSeed';
    public const MAP_CACHE_KEY = 'mapCacheKey';

    public const TIMER_TOTAL_MS = 'timerTotalMs';
    public const STARTED_AT_MS = 'startedAtMs';
    public const TIMER_REMAINING_MS = 'timerRemainingMs';

    public const COURIER = 'courier';
    public const SABOTEUR = 'saboteur';

    public const USER_ID = 'userId';
    public const USERNAME = 'username';
    public const NAME = 'name';
    public const POSITION = 'position';
    public const DIRECTION = 'direction';
    public const LIVES = 'lives';
    public const VISITED_TILE_KEYS = 'visitedTileKeys';

    public const ENERGY_CURRENT = 'energyCurrent';
    public const ENERGY_MAX = 'energyMax';
    public const ENERGY_SPENT = 'energySpent';
    public const ACTIVE_HURDLE_COUNT = 'activeHurdleCount';
    public const ACTIVE_HURDLE_COUNT_MAX = 'activeHurdleCountMax';
    public const COOLDOWNS = 'cooldowns';

    public const TRAFFIC_SIGNALS = 'trafficSignals';
    public const ACTIVE_HURDLES = 'activeHurdles';
    public const COUNTERS = 'counters';
    public const DRAW_OFFER = 'drawOffer';

    public const WINNER_ROLE = 'winnerRole';
    public const END_REASON = 'endReason';
}
