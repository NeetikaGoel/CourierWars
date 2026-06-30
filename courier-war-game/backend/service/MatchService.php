<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../config/DifficultyConfig.php';
require_once __DIR__ . '/../config/HurdleConfig.php';
require_once __DIR__ . '/../config/MapGenerationConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../config/MatchmakingConfig.php';
require_once __DIR__ . '/../constants/DirectionValue.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/IdempotencyService.php';
require_once __DIR__ . '/MapBootstrapService.php';
require_once __DIR__ . '/MapGenerationService.php';
require_once __DIR__ . '/MatchmakingService.php';
require_once __DIR__ . '/MatchStateService.php';

class MatchService
{
    private IdempotencyService $_idempotencyService; // prevents duplicate match create effects

    private MatchStateService $_matchStateService; // stores active match state

    private MatchmakingService $_matchmakingService; // owns waiting queues

    private MapBootstrapService $_mapBootstrapService; // stores and loads generated maps

    private MapGenerationService $_mapGenerationService; // generates map on demand

    

    public function __construct(
        ?IdempotencyService $idempotencyService = null,
        ?MatchStateService $matchStateService = null,
        ?MatchmakingService $matchmakingService = null,
        ?MapBootstrapService $mapBootstrapService = null,
        ?MapGenerationService $mapGenerationService = null
    ) {
        $this->_idempotencyService = $idempotencyService ?? new IdempotencyService(); // creates idempotency service
        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates match state service
        $this->_matchmakingService = $matchmakingService ?? new MatchmakingService(); // creates matchmaking service
        $this->_mapBootstrapService = $mapBootstrapService ?? new MapBootstrapService(); // creates map bootstrap service
        $this->_mapGenerationService = $mapGenerationService ?? new MapGenerationService(); // creates map generation service
    }

    public function matchCreate(AuthContext $authContext, array $validatedBody, string $idempotencyKey): array
    {
        $idempotencyPayload = [
            'operation' => 'matchCreate', // separates this action from other idempotent actions
            'body' => $validatedBody, // locks idempotency key to this exact request body
        ];

        $cachedResponse = $this->_idempotencyService->cachedResponseGet($authContext, $idempotencyKey, $idempotencyPayload); // checks retry cache

        if ($cachedResponse !== null) {
            return $cachedResponse; // returns first response for duplicate retry
        }

        $difficulty = (string)$validatedBody['difficulty']; // reads validated difficulty
        $rolePreference = (string)$validatedBody['rolePreference']; // reads validated role preference

        $opponentMatch = $this->_matchmakingService->opponentFind($authContext, $rolePreference, $difficulty); // tries to match waiting player

        if ($opponentMatch !== null) {
            $response = $this->waitingMatchJoin($authContext, $opponentMatch, $difficulty); // activates existing waiting match
            $this->_idempotencyService->responseStore($authContext, $idempotencyKey, $idempotencyPayload, $response); // stores response for retry

            return $response; // returns active match
        }

        $assignedRole = $this->assignedRoleForWaitingPlayerGet($rolePreference); // chooses role for new waiting player
        $matchId = $this->matchIdCreate(); // creates cache-safe match id
        $timerTotalMs = DifficultyConfig::timerMs($difficulty); // gets difficulty timer
        $mapSnapshot = $this->mapSnapshotAllocate($matchId); // gets bootstrap or generated map

        $this->_mapBootstrapService->activeMatchMapStore($matchId, $mapSnapshot, $timerTotalMs); // stores map for both players

        $matchState = $this->initialMatchStateCreate($authContext, $matchId, $assignedRole, $difficulty, $timerTotalMs, $mapSnapshot); // builds state
        $this->_matchStateService->matchStateStore($matchState); // stores waiting state

        $this->_matchmakingService->waitingPlayerStore($authContext, $matchId, $assignedRole, $rolePreference, $difficulty); // queues player

        $response = $this->matchCreateResponse($matchState, $assignedRole, null); // creates response payload

        $this->_idempotencyService->responseStore($authContext, $idempotencyKey, $idempotencyPayload, $response); // stores response for retry

        return $response; // returns waiting match
    }

    private function waitingMatchJoin(AuthContext $authContext, array $opponentMatch, string $difficulty): array
    {
        $currentRole = (string)$opponentMatch['currentRole']; // role assigned to caller
        $opponentRole = (string)$opponentMatch['opponentRole']; // role assigned to waiting player
        $opponent = $opponentMatch['opponent']; // waiting player queue item
        $matchId = (int)$opponent['matchId']; // existing waiting match id

        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads waiting match

        $matchState = $this->participantAssign($matchState, $authContext, $currentRole); // assigns caller into missing role
        $matchState[MatchStateFieldName::STATUS] = MatchStatusValue::ACTIVE; // match becomes playable
        $matchState[MatchStateFieldName::STARTED_AT_MS] = Clock::unixMilliseconds(); // starts timer now
        $matchState[MatchStateFieldName::STATE_VERSION] = MatchConfig::nextStateVersion((int)$matchState[MatchStateFieldName::STATE_VERSION]); // increments state
        $matchState['opponentRole'] = $opponentRole; // keeps role metadata visible

        $this->_matchStateService->matchStateStore($matchState); // stores active state

        return $this->matchCreateResponse($matchState, $currentRole, $opponentRole); // returns response for second player
    }

    private function matchIdCreate(): int
    {
        for ($attempt = 0; $attempt < MatchConfig::MATCH_ID_RANDOM_RETRY_MAX; $attempt++) {
            $matchId = random_int(MatchConfig::MATCH_ID_MIN, MatchConfig::MATCH_ID_MAX); // creates unpredictable match id

            if ($this->_matchStateService->matchStateGet($matchId) === null) {
                return $matchId; // id is free in active match cache
            }
        }

        throw new RuntimeException('match id could not be allocated'); // avoids accidental overwrite
    }

    private function assignedRoleForWaitingPlayerGet(string $rolePreference): string
    {
        if ($rolePreference === RoleValue::SABOTEUR) {
            return RoleValue::SABOTEUR; // respects explicit saboteur choice
        }

        return RoleValue::COURIER; // courier is default for courier or any
    }

    private function mapSnapshotAllocate(int $matchId): array
    {
        $bootstrapList = $this->_mapBootstrapService->bootstrapMapListGet(); // tries pre-generated map list
        $mapCount = (int)($bootstrapList['mapCount'] ?? 0); // reads generated map count

        if ($mapCount > 0) {
            $mapIndex = $matchId % $mapCount; // spreads matches across bootstrap maps
            $mapSnapshot = $this->_mapBootstrapService->bootstrapMapGet($mapIndex); // loads bootstrap map

            if (is_array($mapSnapshot)) {
                return $mapSnapshot; // returns cached readable map
            }
        }

        $seed = random_int(MapGenerationConfig::MAP_SEED_MIN, MapGenerationConfig::MAP_SEED_MAX); // creates fallback map seed

        return $this->_mapGenerationService->previewMapGenerate((string)$seed); // generates readable map on demand
    }

    private function initialMatchStateCreate(AuthContext $authContext, int $matchId, string $assignedRole, string $difficulty, int $timerTotalMs, array $mapSnapshot): array
    {
        $startTilePoint = $mapSnapshot['startTilePoint'] ?? ['x' => 0, 'y' => 0]; // reads start tile from backend map
        $mapSeed = (int)($mapSnapshot['mapSeed'] ?? MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT); // reads map seed

        $state = [
            MatchStateFieldName::MATCH_ID => $matchId, // unique match id
            MatchStateFieldName::STATUS => MatchStatusValue::WAITING, // first player waits for opponent
            MatchStateFieldName::STATE_VERSION => MatchConfig::initialStateVersion(), // first state version
            MatchStateFieldName::DIFFICULTY => $difficulty, // selected difficulty
            MatchStateFieldName::MAP_VERSION => MapGenerationConfig::MAP_VERSION, // map version
            MatchStateFieldName::MAP_GENERATION_VERSION => MapGenerationConfig::MAP_GENERATION_VERSION, // generation version
            MatchStateFieldName::MAP_SEED => $mapSeed, // map seed for debugging
            MatchStateFieldName::MAP_CACHE_KEY => CacheServerKeyFactory::matchMapKey($matchId), // map cache pointer
            MatchStateFieldName::TIMER_TOTAL_MS => $timerTotalMs, // timer total from difficulty
            MatchStateFieldName::STARTED_AT_MS => null, // null until second player joins
            MatchStateFieldName::TIMER_REMAINING_MS => $timerTotalMs, // full timer while waiting
            MatchStateFieldName::COURIER => $this->courierStateCreate($assignedRole === RoleValue::COURIER ? $authContext : null, $startTilePoint), // courier block
            MatchStateFieldName::SABOTEUR => $this->saboteurStateCreate($assignedRole === RoleValue::SABOTEUR ? $authContext : null), // saboteur block
            MatchStateFieldName::TRAFFIC_SIGNALS => $this->trafficSignalStateCreate($mapSnapshot), // runtime signal states
            MatchStateFieldName::ACTIVE_HURDLES => [], // no active hurdles at start
            MatchStateFieldName::DRAW_OFFER => null,
            MatchStateFieldName::COUNTERS => [
                'hurdlesActivated' => 0, // total hurdle count
                'abilitiesUsed' => 0, // total ability count
            ],
            'deliveryProgressPct' => 0, // courier has not moved yet
            MatchStateFieldName::WINNER_ROLE => null, // no winner yet
            MatchStateFieldName::END_REASON => null, // no end reason yet
        ];

        $state['assignedRole'] = $assignedRole; // helps first response and polling

        return $state; // returns initial state
    }

    private function courierStateCreate(?AuthContext $authContext, array $startTilePoint): array
    {
        return [
            MatchStateFieldName::USER_ID => $authContext?->getUserId(), // null until courier joins
            MatchStateFieldName::USERNAME => $authContext?->getUsername(), // optional username
            MatchStateFieldName::NAME => $authContext?->getName(), // optional display name
            MatchStateFieldName::POSITION => [
                'x' => (int)($startTilePoint['x'] ?? 0), // courier x starts on map start
                'y' => (int)($startTilePoint['y'] ?? 0), // courier y starts on map start
            ],
            MatchStateFieldName::DIRECTION => DirectionValue::NONE, // no movement yet
            MatchStateFieldName::LIVES => MatchConfig::COURIER_LIVES_START, // configured starting lives
            MatchStateFieldName::VISITED_TILE_KEYS => [
                ((int)($startTilePoint['x'] ?? 0)) . ',' . ((int)($startTilePoint['y'] ?? 0)), // start tile is visited
            ],
            'abilitiesActive' => [], // active ability effects
            'cooldowns' => [], // ability cooldown timestamps
        ];
    }

    private function saboteurStateCreate(?AuthContext $authContext): array
    {
        return [
            MatchStateFieldName::USER_ID => $authContext?->getUserId(), // null until saboteur joins
            MatchStateFieldName::USERNAME => $authContext?->getUsername(), // optional username
            MatchStateFieldName::NAME => $authContext?->getName(), // optional display name
            MatchStateFieldName::ENERGY_CURRENT => HurdleConfig::SABOTEUR_ENERGY_START, // starting energy
            MatchStateFieldName::ENERGY_MAX => HurdleConfig::SABOTEUR_ENERGY_MAX, // max energy
            MatchStateFieldName::ENERGY_SPENT => 0, // no energy spent yet
            MatchStateFieldName::ACTIVE_HURDLE_COUNT => 0, // no hurdles active yet
            MatchStateFieldName::ACTIVE_HURDLE_COUNT_MAX => HurdleConfig::ACTIVE_HURDLE_COUNT_MAX, // backend active limit
            MatchStateFieldName::COOLDOWNS => [], // hurdle cooldown timestamps
        ];
    }

    private function trafficSignalStateCreate(array $mapSnapshot): array
    {
        $runtimeSignals = []; // keyed by signal id

        foreach (($mapSnapshot['trafficSignalList'] ?? []) as $signal) {
            if (!is_array($signal)) {
                continue; // skips malformed signal
            }

            $signalId = (string)($signal['id'] ?? ''); // reads signal id

            if ($signalId === '') {
                continue; // skips unusable id
            }

            $runtimeSignals[$signalId] = [
                'stateName' => 'green', // all signals start green
                'redUntilMs' => null, // no red expiry yet
                'activatedBySaboteur' => false, // not activated yet
            ];
        }

        return $runtimeSignals; // returns runtime signal map
    }

    private function participantAssign(array $matchState, AuthContext $authContext, string $role): array
    {
        if ($role === RoleValue::COURIER) {
            $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::USER_ID] = $authContext->getUserId(); // assigns courier id
            $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::USERNAME] = $authContext->getUsername(); // assigns courier username
            $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::NAME] = $authContext->getName(); // assigns courier name

            return $matchState; // returns updated state
        }

        if ($role === RoleValue::SABOTEUR) {
            $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::USER_ID] = $authContext->getUserId(); // assigns saboteur id
            $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::USERNAME] = $authContext->getUsername(); // assigns saboteur username
            $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::NAME] = $authContext->getName(); // assigns saboteur name

            return $matchState; // returns updated state
        }

        throw new RuntimeException('assigned role is invalid'); // catches impossible role
    }

    private function matchCreateResponse(array $matchState, string $assignedRole, ?string $opponentRole): array
    {
        return [
            'matchId' => (int)$matchState[MatchStateFieldName::MATCH_ID], // match id for route navigation
            'status' => (int)$matchState[MatchStateFieldName::STATUS], // numeric status used by frontend
            'assignedRole' => $assignedRole, // caller role
            'opponentRole' => $opponentRole, // null while waiting
            'difficulty' => (string)$matchState[MatchStateFieldName::DIFFICULTY], // selected difficulty
            'timerTotalMs' => (int)$matchState[MatchStateFieldName::TIMER_TOTAL_MS], // timer for frontend
            'mapVersion' => (string)$matchState[MatchStateFieldName::MAP_VERSION], // map version
            'mapGenerationVersion' => (string)$matchState[MatchStateFieldName::MAP_GENERATION_VERSION], // generation version
            'stateVersion' => (int)$matchState[MatchStateFieldName::STATE_VERSION], // current version
        ];
    }
}
