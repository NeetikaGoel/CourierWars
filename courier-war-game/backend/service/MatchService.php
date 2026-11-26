<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../cache/CacheServerClient.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../cache/CacheServerTtlConfig.php';
require_once __DIR__ . '/../config/DifficultyConfig.php';
require_once __DIR__ . '/../config/HurdleConfig.php';
require_once __DIR__ . '/../config/MapGenerationConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../config/PollingConfig.php';
require_once __DIR__ . '/../constants/ApiErrorCode.php';
require_once __DIR__ . '/../constants/DifficultyValue.php';
require_once __DIR__ . '/../constants/HttpStatusCode.php';
require_once __DIR__ . '/../constants/HurdleTypeValue.php';
require_once __DIR__ . '/../constants/MatchEndReasonValue.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/../utility/HashFactory.php';
require_once __DIR__ . '/MapGenerationService.php';
require_once __DIR__ . '/MatchServiceException.php';

// this service owns the authoritative match state that both players sync from
//
// state lives in the cache server under matchStateKey, every write happens under a per match file lock
// so two players acting at the same time cannot overwrite each other
// stateVersion only moves when something a client must redraw changes, so polls with an unchanged
// version get a tiny reply instead of the whole state
class MatchService
{
    private const DRAW_WINNER = 'draw';
    private const WAITING_PLAYER_STALE_MS = 6000; // waiting matches whose creator stopped polling are skipped
    private const BLOCKING_HURDLE_TYPES = [
        HurdleTypeValue::ROAD_BLOCK,
        HurdleTypeValue::CLOSED_GATE,
        HurdleTypeValue::BROKEN_ROAD,
    ];

    private CacheServerClient $_cache;
    private MapGenerationService $_mapGenerationService;

    public function __construct(?CacheServerClient $cacheServerClient = null, ?MapGenerationService $mapGenerationService = null)
    {
        $this->_cache = $cacheServerClient ?? new CacheServerClient();
        $this->_mapGenerationService = $mapGenerationService ?? new MapGenerationService();
    }

    // ---------------------------------------------------------------- public api

    // joins a waiting match that needs this role, or opens a new one
    public function matchCreate(AuthContext $authContext, string $difficulty, string $rolePreference): array
    {
        if (!in_array($difficulty, [DifficultyValue::EASY, DifficultyValue::MEDIUM, DifficultyValue::HARD], true)) {
            throw $this->badRequest('difficulty is invalid');
        }

        if (!in_array($rolePreference, RoleValue::all(), true)) {
            throw $this->badRequest('rolePreference is invalid');
        }

        // the grid is built before taking any lock because a cold map generation takes about half a second
        $this->gridGet(MatchConfig::MAP_SEED);

        $playerToken = HashFactory::randomHex(MatchConfig::PLAYER_TOKEN_BYTES);
        $player = [
            'userId' => $authContext->getUserId(),
            'name' => $authContext->getName() ?: $authContext->getUsername(),
            'tokenHash' => HashFactory::sha256($playerToken),
            'ready' => false,
            'lastSeenMs' => Clock::unixMilliseconds(),
        ];

        $state = $this->lockRun(MatchConfig::MATCHMAKING_LOCK_NAME, function () use ($difficulty, $rolePreference, $player): array {
            $joinRoleList = $rolePreference === RoleValue::ANY ? RoleValue::playable() : [$rolePreference];

            foreach ($joinRoleList as $joinRole) {
                $joined = $this->waitingMatchJoin($joinRole, $difficulty, $player);

                if ($joined !== null) {
                    return $joined;
                }
            }

            return $this->waitingMatchOpen($rolePreference, $difficulty, $player);
        });

        $role = $this->roleForTokenGet($state, $authContext, $playerToken);
        $view = $this->viewBuild($state, $role, Clock::unixMilliseconds(), PollingConfig::defaultKnownVersion());
        $view[MatchConfig::PLAYER_TOKEN_FIELD] = $playerToken;

        return $view;
    }

    public function matchStateGet(AuthContext $authContext, int $matchId, string $playerToken, int $knownVersion): array
    {
        $state = $this->stateRequire($matchId);
        $role = $this->roleForTokenGet($state, $authContext, $playerToken);
        $nowMs = Clock::unixMilliseconds();

        // writes are only needed for a lazy status change or for the waiting creator heartbeat
        if ($this->stateAdvanceNeeded($state, $nowMs) || $state['status'] === MatchStatusValue::WAITING) {
            $state = $this->stateMutate($matchId, function (array &$lockedState, int $lockedNowMs) use ($role): void {
                if ($lockedState['status'] === MatchStatusValue::WAITING) {
                    $lockedState['players'][$role]['lastSeenMs'] = $lockedNowMs;
                }
            });
        }

        return $this->viewBuild($state, $role, $nowMs, $knownVersion);
    }

    public function matchReady(AuthContext $authContext, int $matchId, string $playerToken): array
    {
        return $this->actionRun($authContext, $matchId, $playerToken, function (array &$state, string $role, int $nowMs): void {
            if ($state['status'] !== MatchStatusValue::READY) {
                return;
            }

            if ($state['players'][$role]['ready'] !== true) {
                $state['players'][$role]['ready'] = true;
                $this->versionBump($state);
            }

            $bothReady = $state['players'][RoleValue::COURIER]['ready'] === true
                && $state['players'][RoleValue::SABOTEUR]['ready'] === true;

            if ($bothReady && $state['startedAtMs'] === null) {
                $this->matchStartSchedule($state, $nowMs);
            }
        });
    }

    // applies a batch of courier steps, each step carries a seq so retries are harmless
    public function courierMove(AuthContext $authContext, int $matchId, string $playerToken, array $stepList, ?int $livesReported): array
    {
        if (count($stepList) > MatchConfig::COURIER_STEPS_PER_REQUEST_MAX) {
            throw $this->badRequest('too many steps in one request');
        }

        $grid = $this->gridGet(MatchConfig::MAP_SEED);

        return $this->actionRun($authContext, $matchId, $playerToken, function (array &$state, string $role, int $nowMs) use ($grid, $stepList, $livesReported): void {
            $this->roleRequire($role, RoleValue::COURIER);
            $this->activeRequire($state);

            $courier = &$state['courier'];
            $elapsedMs = min(MatchConfig::COURIER_STEP_BUDGET_WINDOW_MS, max(0, $nowMs - $courier['lastMoveAtMs']));
            $stepBudget = intdiv($elapsedMs, MatchConfig::COURIER_STEP_MS_MIN)
                + MatchConfig::COURIER_STEP_BURST_ALLOWANCE;
            $changed = false;
            $state['moveRejected'] = null;

            usort($stepList, fn(array $a, array $b): int => $a['seq'] <=> $b['seq']);

            foreach ($stepList as $step) {
                if ($step['seq'] <= $courier['moveSeq']) {
                    continue; // already applied by an earlier retry
                }

                $rejectReason = $this->courierStepRejectReason($state, $grid, $step, $stepBudget, $nowMs);

                if ($rejectReason !== null) {
                    $state['moveRejected'] = ['seq' => $step['seq'], 'reason' => $rejectReason];
                    break;
                }

                $stepBudget--;
                $courier['x'] = $step['x'];
                $courier['y'] = $step['y'];
                $courier['moveSeq'] = $step['seq'];
                $courier['tilesTravelled']++;
                $courier['trail'][] = [$step['x'], $step['y'], $step['seq']];
                $changed = true;

                if ($step['x'] === $grid['delivery'][0] && $step['y'] === $grid['delivery'][1]) {
                    $this->matchEnd($state, RoleValue::COURIER, MatchEndReasonValue::DELIVERED, $nowMs);
                    break;
                }
            }

            if (count($courier['trail']) > MatchConfig::COURIER_TRAIL_LENGTH_MAX) {
                $courier['trail'] = array_slice($courier['trail'], -MatchConfig::COURIER_TRAIL_LENGTH_MAX);
            }

            if ($changed) {
                $courier['lastMoveAtMs'] = $nowMs;
            }

            // lives only ever go down, the courier client detects moving barrier hits
            if ($livesReported !== null && $livesReported < $courier['lives'] && $this->matchActiveCheck($state)) {
                $courier['lives'] = max(0, $livesReported);
                $changed = true;

                if ($courier['lives'] === 0) {
                    $this->matchEnd($state, RoleValue::SABOTEUR, MatchEndReasonValue::COURIER_LIVES_ZERO, $nowMs);
                }
            }

            if ($changed || $state['moveRejected'] !== null) {
                $this->versionBump($state);
            }
        });
    }

    // places one hurdle, tileList is the anchor tile first and then the road width tiles the client expanded
    public function hurdlePlace(AuthContext $authContext, int $matchId, string $playerToken, string $hurdleType, array $tileList, ?int $durationMsRequested = null): array
    {
        if (!in_array($hurdleType, HurdleTypeValue::all(), true)) {
            throw $this->badRequest('hurdleType is invalid');
        }

        if (count($tileList) < 1 || count($tileList) > MatchConfig::HURDLE_TILES_MAX) {
            throw $this->badRequest('tiles must hold 1 to ' . MatchConfig::HURDLE_TILES_MAX . ' tiles');
        }

        $grid = $this->gridGet(MatchConfig::MAP_SEED);

        return $this->actionRun($authContext, $matchId, $playerToken, function (array &$state, string $role, int $nowMs) use ($grid, $hurdleType, $tileList, $durationMsRequested): void {
            $this->roleRequire($role, RoleValue::SABOTEUR);
            $this->activeRequire($state);

            $rule = HurdleConfig::ruleFor($hurdleType);
            $durationMs = HurdleConfig::durationMsResolve($hurdleType, $durationMsRequested);
            $energy = $this->energyAt($state, $nowMs);
            $cooldownUntilMs = (int)($state['saboteur']['cooldownUntilMsByType'][$hurdleType] ?? 0);
            $signalId = null;

            if (count($state['hurdles']) >= HurdleConfig::ACTIVE_HURDLE_COUNT_MAX) {
                throw $this->ruleRejected(ApiErrorCode::ACTIVE_HURDLE_LIMIT_REACHED, 'active hurdle limit reached');
            }

            if ($cooldownUntilMs > $nowMs) {
                throw $this->ruleRejected(ApiErrorCode::HURDLE_COOLDOWN_ACTIVE, 'hurdle is on cooldown', ['cooldownRemainingMs' => $cooldownUntilMs - $nowMs]);
            }

            if ($energy < $rule['energyCost']) {
                throw $this->ruleRejected(ApiErrorCode::ENERGY_INSUFFICIENT, 'not enough energy');
            }

            $occupiedTileSet = $this->hurdleTileSetGet($state, null);
            $anchor = $tileList[0];

            foreach ($tileList as $tile) {
                $this->hurdleTileValidate($state, $grid, $anchor, $tile, $occupiedTileSet);
            }

            if ($hurdleType === HurdleTypeValue::RED_TRAFFIC_LIGHT) {
                $signalId = $grid['signals'][$this->tileKey($anchor['x'], $anchor['y'])] ?? null;

                if ($signalId === null || count($tileList) !== 1) {
                    throw $this->ruleRejected(ApiErrorCode::INVALID_TILE, 'red traffic light needs one traffic signal tile');
                }
            }

            $state['hurdleSeq']++;
            $state['hurdles'][] = [
                'id' => 'h' . $state['hurdleSeq'],
                'type' => $hurdleType,
                'tiles' => array_map(fn(array $tile): array => [$tile['x'], $tile['y']], $tileList),
                'signalId' => $signalId,
                'startedAtMs' => $nowMs,
                'expiresAtMs' => $nowMs + $durationMs,
            ];

            $saboteur = &$state['saboteur'];
            $saboteur['energy'] = $energy - (int)$rule['energyCost'];
            $saboteur['energyAtMs'] = $nowMs;
            $saboteur['energySpent'] += (int)$rule['energyCost'];
            $saboteur['cooldownUntilMsByType'][$hurdleType] = $nowMs + (int)$rule['cooldownMs'];
            $saboteur['hurdleCounts'][$hurdleType] = (int)($saboteur['hurdleCounts'][$hurdleType] ?? 0) + 1;
            $saboteur['longestHurdleMs'] = max((int)$saboteur['longestHurdleMs'], $durationMs);

            $this->versionBump($state);
        });
    }

    public function matchCancel(AuthContext $authContext, int $matchId, string $playerToken): array
    {
        return $this->actionRun($authContext, $matchId, $playerToken, function (array &$state, string $role, int $nowMs): void {
            if ($state['status'] === MatchStatusValue::WAITING) {
                $this->matchEnd($state, self::DRAW_WINNER, MatchEndReasonValue::CANCELLED, $nowMs);
                return;
            }

            // leaving after an opponent joined counts as a forfeit so the other screen ends too
            if ($this->matchOpenCheck($state)) {
                $this->matchEnd($state, $this->roleOppositeGet($role), MatchEndReasonValue::FORFEIT, $nowMs);
            }
        });
    }

    // a draw needs both players, the first offer is shown to the opponent and the second one ends the match
    public function drawOffer(AuthContext $authContext, int $matchId, string $playerToken): array
    {
        return $this->actionRun($authContext, $matchId, $playerToken, function (array &$state, string $role, int $nowMs): void {
            $this->activeRequire($state);

            if ($state['drawOfferedBy'] === $this->roleOppositeGet($role)) {
                $this->matchEnd($state, self::DRAW_WINNER, MatchEndReasonValue::DRAW_AGREEMENT, $nowMs);
                return;
            }

            if ($state['drawOfferedBy'] !== $role) {
                $state['drawOfferedBy'] = $role;
                $this->versionBump($state);
            }
        });
    }

    public function resultGet(AuthContext $authContext, int $matchId, string $playerToken): array
    {
        $state = $this->stateRequire($matchId);
        $this->roleForTokenGet($state, $authContext, $playerToken);
        $nowMs = Clock::unixMilliseconds();

        if ($this->stateAdvanceNeeded($state, $nowMs)) {
            $state = $this->stateMutate($matchId, function (): void {
            });
        }

        if ($state['result'] === null) {
            throw new MatchServiceException(ApiErrorCode::STATE_CONFLICT, 'match has not ended yet', HttpStatusCode::CONFLICT);
        }

        return $this->resultBuild($state);
    }

    // ---------------------------------------------------------------- matchmaking

    private function waitingMatchJoin(string $joinRole, string $difficulty, array $player): ?array
    {
        $waitingKey = CacheServerKeyFactory::matchmakingWaitingKey($joinRole, $difficulty);
        $waitingIdList = $this->_cache->cacheGet($waitingKey);
        $waitingIdList = is_array($waitingIdList) ? $waitingIdList : [];
        $remainingIdList = [];
        $joinedState = null;
        $nowMs = Clock::unixMilliseconds();

        foreach ($waitingIdList as $waitingMatchId) {
            if ($joinedState !== null) {
                $remainingIdList[] = $waitingMatchId;
                continue;
            }

            $state = $this->lockRun('match-' . (int)$waitingMatchId, function () use ($waitingMatchId, $joinRole, $player, $nowMs): ?array {
                $state = $this->stateLoad((int)$waitingMatchId);

                if (!$this->waitingMatchJoinableCheck($state, $joinRole, $nowMs)) {
                    return null;
                }

                $state['players'][$joinRole] = $player;
                $state['status'] = MatchStatusValue::READY;
                $state['joinedAtMs'] = $nowMs;
                $this->versionBump($state);
                $this->stateStore($state);

                return $state;
            });

            if ($state !== null) {
                $joinedState = $state;
                continue;
            }

            // matches that are no longer joinable drop out of the list here
            $stillWaiting = $this->stateLoad((int)$waitingMatchId);

            if ($stillWaiting !== null && $stillWaiting['status'] === MatchStatusValue::WAITING
                && $nowMs - $this->waitingCreatorLastSeenGet($stillWaiting) < self::WAITING_PLAYER_STALE_MS) {
                $remainingIdList[] = $waitingMatchId;
            }
        }

        if ($remainingIdList !== $waitingIdList) {
            $this->waitingListStore($waitingKey, $remainingIdList);
        }

        return $joinedState;
    }

    private function waitingMatchJoinableCheck(?array $state, string $joinRole, int $nowMs): bool
    {
        if ($state === null || $state['status'] !== MatchStatusValue::WAITING) {
            return false;
        }

        if ($state['players'][$joinRole] !== null) {
            return false;
        }

        return $nowMs - $this->waitingCreatorLastSeenGet($state) < self::WAITING_PLAYER_STALE_MS;
    }

    private function waitingCreatorLastSeenGet(array $state): int
    {
        foreach (RoleValue::playable() as $role) {
            if ($state['players'][$role] !== null) {
                return (int)$state['players'][$role]['lastSeenMs'];
            }
        }

        return 0;
    }

    private function waitingMatchOpen(string $rolePreference, string $difficulty, array $player): array
    {
        $ownRole = $rolePreference === RoleValue::SABOTEUR ? RoleValue::SABOTEUR : RoleValue::COURIER;
        $openRole = $this->roleOppositeGet($ownRole);
        $matchId = $this->matchIdCreate();
        $state = $this->stateInitialCreate($matchId, $difficulty, $ownRole, $player);

        $this->lockRun('match-' . $matchId, function () use ($state): void {
            $this->stateStore($state);
        });

        $waitingKey = CacheServerKeyFactory::matchmakingWaitingKey($openRole, $difficulty);
        $waitingIdList = $this->_cache->cacheGet($waitingKey);
        $waitingIdList = is_array($waitingIdList) ? $waitingIdList : [];
        $waitingIdList[] = $matchId;
        $this->waitingListStore($waitingKey, $waitingIdList);

        return $state;
    }

    private function waitingListStore(string $waitingKey, array $waitingIdList): void
    {
        if ($waitingIdList === []) {
            $this->_cache->cacheDelete($waitingKey);
            return;
        }

        $this->_cache->cacheSet($waitingKey, array_values($waitingIdList), CacheServerTtlConfig::waitingMatchTtlSeconds());
    }

    private function matchIdCreate(): int
    {
        for ($attempt = 0; $attempt < MatchConfig::MATCH_ID_CREATE_ATTEMPTS_MAX; $attempt++) {
            $matchId = random_int(MatchConfig::MATCH_ID_MIN, MatchConfig::MATCH_ID_MAX);

            if ($this->stateLoad($matchId) === null) {
                return $matchId;
            }
        }

        throw new RuntimeException('match id could not be created');
    }

    private function stateInitialCreate(int $matchId, string $difficulty, string $ownRole, array $player): array
    {
        $grid = $this->gridGet(MatchConfig::MAP_SEED);
        $nowMs = Clock::unixMilliseconds();

        return [
            'matchId' => $matchId,
            'status' => MatchStatusValue::WAITING,
            'stateVersion' => 1,
            'difficulty' => $difficulty,
            'mapSeed' => MatchConfig::MAP_SEED,
            'mapVersion' => MapGenerationConfig::MAP_VERSION,
            'mapGenerationVersion' => MapGenerationConfig::MAP_GENERATION_VERSION,
            'timerTotalMs' => DifficultyConfig::timerMs($difficulty),
            'createdAtMs' => $nowMs,
            'joinedAtMs' => null,
            'startedAtMs' => null,
            'endsAtMs' => null,
            'endedAtMs' => null,
            'players' => [
                RoleValue::COURIER => $ownRole === RoleValue::COURIER ? $player : null,
                RoleValue::SABOTEUR => $ownRole === RoleValue::SABOTEUR ? $player : null,
            ],
            'courier' => [
                'x' => $grid['start'][0],
                'y' => $grid['start'][1],
                'lives' => MatchConfig::COURIER_LIVES_START,
                'moveSeq' => 0,
                'lastMoveAtMs' => $nowMs,
                'tilesTravelled' => 0,
                'trail' => [],
            ],
            'saboteur' => [
                'energy' => HurdleConfig::SABOTEUR_ENERGY_START,
                'energyAtMs' => $nowMs,
                'energySpent' => 0,
                'cooldownUntilMsByType' => (object)[],
                'hurdleCounts' => (object)[],
                'longestHurdleMs' => 0,
            ],
            'hurdles' => [],
            'hurdleSeq' => 0,
            'moveRejected' => null,
            'drawOfferedBy' => null,
            'result' => null,
        ];
    }

    // ---------------------------------------------------------------- state lifecycle

    private function actionRun(AuthContext $authContext, int $matchId, string $playerToken, callable $action): array
    {
        $role = null;
        $state = $this->stateMutate($matchId, function (array &$state, int $nowMs) use ($authContext, $playerToken, $action, &$role): void {
            $role = $this->roleForTokenGet($state, $authContext, $playerToken);
            $action($state, $role, $nowMs);
        });

        return $this->viewBuild($state, (string)$role, Clock::unixMilliseconds(), -1);
    }

    // loads, advances, mutates and stores one match under its lock
    private function stateMutate(int $matchId, callable $mutation): array
    {
        return $this->lockRun('match-' . $matchId, function () use ($matchId, $mutation): array {
            $state = $this->stateRequire($matchId);
            $nowMs = Clock::unixMilliseconds();

            $this->stateAdvance($state, $nowMs);
            $mutation($state, $nowMs);
            $this->hurdleExpiredPrune($state, $nowMs);
            $this->stateStore($state);

            return $state;
        });
    }

    private function stateAdvanceNeeded(array $state, int $nowMs): bool
    {
        $copy = $state;

        return $this->stateAdvance($copy, $nowMs);
    }

    // applies time based transitions, returns true when the visible state changed
    private function stateAdvance(array &$state, int $nowMs): bool
    {
        $changed = false;

        if ($state['status'] === MatchStatusValue::READY && $state['startedAtMs'] === null
            && $state['joinedAtMs'] !== null && $nowMs - (int)$state['joinedAtMs'] >= MatchConfig::READY_WAIT_MAX_MS) {
            $this->matchStartSchedule($state, $nowMs);
            $changed = true;
        }

        if ($state['status'] === MatchStatusValue::READY && $state['startedAtMs'] !== null && $nowMs >= (int)$state['startedAtMs']) {
            $state['status'] = MatchStatusValue::ACTIVE;
            $state['courier']['lastMoveAtMs'] = (int)$state['startedAtMs'];
            $this->versionBump($state);
            $changed = true;
        }

        if ($state['status'] === MatchStatusValue::ACTIVE && $nowMs >= (int)$state['endsAtMs']) {
            $this->matchEnd($state, RoleValue::SABOTEUR, MatchEndReasonValue::TIMER_EXPIRED, (int)$state['endsAtMs']);
            $changed = true;
        }

        return $changed;
    }

    private function matchStartSchedule(array &$state, int $nowMs): void
    {
        $state['startedAtMs'] = $nowMs + MatchConfig::START_COUNTDOWN_MS;
        $state['endsAtMs'] = $state['startedAtMs'] + (int)$state['timerTotalMs'];
        $state['saboteur']['energyAtMs'] = $state['startedAtMs'];
        $this->versionBump($state);
    }

    private function matchEnd(array &$state, string $winnerRole, string $endReason, int $endedAtMs): void
    {
        if ($state['result'] !== null) {
            return;
        }

        $state['status'] = $winnerRole === self::DRAW_WINNER ? MatchStatusValue::DRAW : MatchStatusValue::COMPLETED;
        $state['endedAtMs'] = $endedAtMs;
        $state['result'] = ['winnerRole' => $winnerRole, 'endReason' => $endReason];
        $state['hurdles'] = [];
        $this->versionBump($state);
    }

    private function versionBump(array &$state): void
    {
        $state['stateVersion'] = (int)$state['stateVersion'] + 1;
    }

    private function hurdleExpiredPrune(array &$state, int $nowMs): void
    {
        // expiry is not a version change because both clients expire hurdles on their own clocks
        $state['hurdles'] = array_values(array_filter(
            $state['hurdles'],
            fn(array $hurdle): bool => (int)$hurdle['expiresAtMs'] > $nowMs
        ));
    }

    private function matchActiveCheck(array $state): bool
    {
        return $state['status'] === MatchStatusValue::ACTIVE;
    }

    private function matchOpenCheck(array $state): bool
    {
        return in_array($state['status'], [MatchStatusValue::WAITING, MatchStatusValue::READY, MatchStatusValue::ACTIVE], true);
    }

    // ---------------------------------------------------------------- rules

    private function courierStepRejectReason(array $state, array $grid, array $step, int $stepBudget, int $nowMs): ?string
    {
        if (!$this->matchActiveCheck($state)) {
            return 'matchNotActive';
        }

        if ($step['seq'] !== $state['courier']['moveSeq'] + 1) {
            return 'stepSeqGap';
        }

        if ($stepBudget <= 0) {
            return 'tooFast';
        }

        if (abs($step['x'] - $state['courier']['x']) + abs($step['y'] - $state['courier']['y']) !== 1) {
            return 'notAdjacent';
        }

        if (!$this->gridWalkableCheck($grid, $step['x'], $step['y'])) {
            return 'notWalkable';
        }

        $blockedTileSet = $this->hurdleTileSetGet($state, self::BLOCKING_HURDLE_TYPES, $nowMs);

        if (isset($blockedTileSet[$this->tileKey($step['x'], $step['y'])])) {
            return 'blockedByHurdle';
        }

        return null;
    }

    private function hurdleTileValidate(array $state, array $grid, array $anchor, array $tile, array $occupiedTileSet): void
    {
        if (!$this->gridWalkableCheck($grid, $tile['x'], $tile['y'])) {
            throw $this->ruleRejected(ApiErrorCode::INVALID_TILE, 'hurdle tile is not a road');
        }

        $isStart = $tile['x'] === $grid['start'][0] && $tile['y'] === $grid['start'][1];
        $isDelivery = $tile['x'] === $grid['delivery'][0] && $tile['y'] === $grid['delivery'][1];

        if ($isStart || $isDelivery) {
            throw $this->ruleRejected(ApiErrorCode::INVALID_TILE, 'cannot place hurdle on start or delivery tile');
        }

        if (max(abs($tile['x'] - $anchor['x']), abs($tile['y'] - $anchor['y'])) > MatchConfig::HURDLE_TILE_SPREAD_MAX) {
            throw $this->ruleRejected(ApiErrorCode::INVALID_TILE, 'hurdle tiles are too far apart');
        }

        $courierDistance = abs($tile['x'] - $state['courier']['x']) + abs($tile['y'] - $state['courier']['y']);

        if ($courierDistance < HurdleConfig::COURIER_DISTANCE_MIN_TILES) {
            throw $this->ruleRejected(ApiErrorCode::INVALID_TILE, 'hurdle is too close to the courier');
        }

        if (isset($occupiedTileSet[$this->tileKey($tile['x'], $tile['y'])])) {
            throw $this->ruleRejected(ApiErrorCode::INVALID_TILE, 'tile already has an active hurdle');
        }
    }

    // returns tile keys covered by active hurdles, optionally only of some types
    private function hurdleTileSetGet(array $state, ?array $typeList, ?int $nowMs = null): array
    {
        $tileSet = [];

        foreach ($state['hurdles'] as $hurdle) {
            if ($typeList !== null && !in_array($hurdle['type'], $typeList, true)) {
                continue;
            }

            if ($nowMs !== null && (int)$hurdle['expiresAtMs'] <= $nowMs) {
                continue;
            }

            foreach ($hurdle['tiles'] as $tile) {
                $tileSet[$this->tileKey((int)$tile[0], (int)$tile[1])] = true;
            }
        }

        return $tileSet;
    }

    private function energyAt(array $state, int $nowMs): int
    {
        $saboteur = $state['saboteur'];
        $elapsedMs = max(0, $nowMs - (int)$saboteur['energyAtMs']);
        $recovered = intdiv($elapsedMs * HurdleConfig::SABOTEUR_ENERGY_RECOVERY_PER_SECOND, 1000);

        return min(HurdleConfig::SABOTEUR_ENERGY_MAX, (int)$saboteur['energy'] + $recovered);
    }

    private function deliveryProgressPctGet(array $state, array $grid): int
    {
        if ($state['result'] !== null && $state['result']['endReason'] === MatchEndReasonValue::DELIVERED) {
            return 100;
        }

        $totalDistance = abs($grid['delivery'][0] - $grid['start'][0]) + abs($grid['delivery'][1] - $grid['start'][1]);
        $remainingDistance = abs($grid['delivery'][0] - $state['courier']['x']) + abs($grid['delivery'][1] - $state['courier']['y']);

        if ($totalDistance <= 0) {
            return 100;
        }

        return max(0, min(99, (int)round(100 * (1 - $remainingDistance / $totalDistance))));
    }

    // ---------------------------------------------------------------- players

    private function roleForTokenGet(array $state, AuthContext $authContext, string $playerToken): string
    {
        $tokenHash = HashFactory::sha256($playerToken);

        foreach (RoleValue::playable() as $role) {
            $player = $state['players'][$role] ?? null;

            if ($player === null) {
                continue;
            }

            if ((int)$player['userId'] === $authContext->getUserId() && HashFactory::hashEquals((string)$player['tokenHash'], $tokenHash)) {
                return $role;
            }
        }

        throw new MatchServiceException(ApiErrorCode::FORBIDDEN, 'you are not a player in this match', HttpStatusCode::FORBIDDEN);
    }

    private function roleRequire(string $role, string $expectedRole): void
    {
        if ($role !== $expectedRole) {
            throw $this->ruleRejected(ApiErrorCode::INVALID_ROLE, 'only the ' . $expectedRole . ' can do this');
        }
    }

    private function activeRequire(array $state): void
    {
        if (!$this->matchActiveCheck($state)) {
            throw new MatchServiceException(ApiErrorCode::STATE_CONFLICT, 'match is not active', HttpStatusCode::CONFLICT, [
                'status' => $state['status'],
                'stateVersion' => $state['stateVersion'],
            ]);
        }
    }

    private function roleOppositeGet(string $role): string
    {
        return $role === RoleValue::COURIER ? RoleValue::SABOTEUR : RoleValue::COURIER;
    }

    // ---------------------------------------------------------------- views

    // builds what one player sees, unchanged versions get only the fields that tick with time
    private function viewBuild(array $state, string $role, int $nowMs, int $knownVersion): array
    {
        $view = [
            'changed' => $knownVersion !== (int)$state['stateVersion'],
            'matchId' => $state['matchId'],
            'status' => $state['status'],
            'stateVersion' => $state['stateVersion'],
            'serverNowMs' => $nowMs,
            'pollIntervalMs' => PollingConfig::matchStatusPollIntervalMs((int)$state['status']),
            'timerRemainingMs' => $this->timerRemainingMsGet($state, $nowMs),
            'obstacleEnergyRemaining' => $this->energyAt($state, $nowMs),
        ];

        if (!$view['changed']) {
            return $view;
        }

        // the rules only travel on the first full state a client asks for, they never change during a match
        if ($knownVersion === PollingConfig::defaultKnownVersion()) {
            $view['hurdleRules'] = $this->hurdleRulesPublicGet();
        }

        $grid = $this->gridGet((int)$state['mapSeed']);
        $courierPlayer = $state['players'][RoleValue::COURIER];
        $saboteurPlayer = $state['players'][RoleValue::SABOTEUR];

        return $view + [
            'assignedRole' => $role,
            'opponentRole' => $this->roleOppositeGet($role),
            'opponentJoined' => $state['players'][$this->roleOppositeGet($role)] !== null,
            'difficulty' => $state['difficulty'],
            'mapSeed' => $state['mapSeed'],
            'mapVersion' => $state['mapVersion'],
            'mapGenerationVersion' => $state['mapGenerationVersion'],
            'timerTotalMs' => $state['timerTotalMs'],
            'startsAtMs' => $state['startedAtMs'],
            'courierName' => $courierPlayer['name'] ?? null,
            'saboteurName' => $saboteurPlayer['name'] ?? null,
            'courier' => [
                'x' => $state['courier']['x'],
                'y' => $state['courier']['y'],
                'lives' => $state['courier']['lives'],
                'moveSeq' => $state['courier']['moveSeq'],
                'trail' => $state['courier']['trail'],
            ],
            'courierLivesRemaining' => $state['courier']['lives'],
            'deliveryProgressPct' => $this->deliveryProgressPctGet($state, $grid),
            'energyMax' => HurdleConfig::SABOTEUR_ENERGY_MAX,
            'energyRecoveryPerSecond' => HurdleConfig::SABOTEUR_ENERGY_RECOVERY_PER_SECOND,
            'obstacleEnergySpent' => $state['saboteur']['energySpent'],
            'cooldownUntilMsByType' => $state['saboteur']['cooldownUntilMsByType'],
            'activeHurdleCount' => count($state['hurdles']),
            'activeHurdleCountMax' => HurdleConfig::ACTIVE_HURDLE_COUNT_MAX,
            'hurdlesActivated' => array_sum((array)$state['saboteur']['hurdleCounts']),
            'hurdles' => $state['hurdles'],
            'moveRejected' => $state['moveRejected'] ?? null,
            'drawOfferedBy' => $state['drawOfferedBy'],
            'result' => $state['result'],
        ];
    }

    // energy cost, cooldown and duration range per hurdle type, the deck and the local preview use these
    private function hurdleRulesPublicGet(): array
    {
        $ruleByType = [];

        foreach (HurdleTypeValue::all() as $hurdleType) {
            $rule = HurdleConfig::ruleFor($hurdleType);
            $ruleByType[$hurdleType] = [
                'energyCost' => (int)$rule['energyCost'],
                'cooldownMs' => (int)$rule['cooldownMs'],
                'durationMs' => (int)$rule['durationMs'],
                'durationMsMin' => (int)$rule['durationMsMin'],
                'durationMsMax' => (int)$rule['durationMsMax'],
            ];
        }

        return $ruleByType;
    }

    private function timerRemainingMsGet(array $state, int $nowMs): int
    {
        if ($state['startedAtMs'] === null) {
            return (int)$state['timerTotalMs'];
        }

        $referenceMs = $state['endedAtMs'] ?? max($nowMs, (int)$state['startedAtMs']);

        return max(0, (int)$state['endsAtMs'] - (int)$referenceMs);
    }

    private function resultBuild(array $state): array
    {
        $grid = $this->gridGet((int)$state['mapSeed']);
        $hurdleCounts = (array)$state['saboteur']['hurdleCounts'];
        $hurdlesActivated = array_sum($hurdleCounts);
        $mostUsedHurdle = null;

        if ($hurdleCounts !== []) {
            arsort($hurdleCounts);
            $mostUsedHurdle = (string)array_key_first($hurdleCounts);
        }

        $startedAtMs = (int)($state['startedAtMs'] ?? $state['endedAtMs']);
        $endedAtMs = (int)$state['endedAtMs'];

        return [
            'matchId' => $state['matchId'],
            'winnerRole' => $state['result']['winnerRole'],
            'endReason' => $state['result']['endReason'],
            'difficulty' => $state['difficulty'],
            'matchTimeMs' => max(0, $endedAtMs - $startedAtMs),
            'timeRemainingMs' => $this->timerRemainingMsGet($state, $endedAtMs),
            'courierLivesRemaining' => $state['courier']['lives'],
            'deliveryProgressPct' => $this->deliveryProgressPctGet($state, $grid),
            'obstacleEnergySpent' => $state['saboteur']['energySpent'],
            'obstacleEnergyRemaining' => $this->energyAt($state, $endedAtMs),
            'obstacleEnergyMax' => HurdleConfig::SABOTEUR_ENERGY_MAX,
            'hurdlesActivated' => $hurdlesActivated,
            'mostUsedHurdle' => $mostUsedHurdle,
            'longestActiveHurdleMs' => $state['saboteur']['longestHurdleMs'],
            'distanceTravelledKm' => round($state['courier']['tilesTravelled'] * MatchConfig::TILE_DISTANCE_KM, 2),
            'courierName' => $state['players'][RoleValue::COURIER]['name'] ?? 'Courier',
            'saboteurName' => $state['players'][RoleValue::SABOTEUR]['name'] ?? 'Saboteur',
            'hurdleCounts' => [
                'redTrafficLight' => (int)($hurdleCounts[HurdleTypeValue::RED_TRAFFIC_LIGHT] ?? 0),
                'roadBlock' => (int)($hurdleCounts[HurdleTypeValue::ROAD_BLOCK] ?? 0),
                'construction' => (int)($hurdleCounts[HurdleTypeValue::CONSTRUCTION_WORK] ?? 0),
                'trafficJam' => (int)($hurdleCounts[HurdleTypeValue::TRAFFIC_JAM] ?? 0),
                'closedGate' => (int)($hurdleCounts[HurdleTypeValue::CLOSED_GATE] ?? 0),
                'wrongDirectionSign' => (int)($hurdleCounts[HurdleTypeValue::WRONG_DIRECTION_SIGN] ?? 0),
            ],
        ];
    }

    // ---------------------------------------------------------------- map grid

    // compact form of the map: walkable flags as one string plus start delivery and signal tiles
    private function gridGet(int $mapSeed): array
    {
        static $gridBySeed = [];

        if (isset($gridBySeed[$mapSeed])) {
            return $gridBySeed[$mapSeed];
        }

        $gridKey = CacheServerKeyFactory::mapGridKey(MapGenerationConfig::MAP_VERSION, $mapSeed);
        $grid = $this->_cache->cacheGet($gridKey);

        if (!is_array($grid) || !isset($grid['walk'])) {
            $grid = $this->gridBuild($this->_mapGenerationService->previewMapGenerate((string)$mapSeed));
            $this->_cache->cacheSet($gridKey, $grid, CacheServerTtlConfig::bootstrapMapTtlSeconds());
        }

        $gridBySeed[$mapSeed] = $grid;

        return $grid;
    }

    private function gridBuild(array $mapSnapshot): array
    {
        $walk = '';
        $signals = [];

        foreach ($mapSnapshot['tileRows'] as $tileRow) {
            foreach ($tileRow as $tile) {
                $walk .= !empty($tile['walkable']) ? '1' : '0';

                if (!empty($tile['trafficSignalId'])) {
                    $signals[$this->tileKey((int)$tile['x'], (int)$tile['y'])] = (string)$tile['trafficSignalId'];
                }
            }
        }

        return [
            'width' => (int)$mapSnapshot['widthTiles'],
            'height' => (int)$mapSnapshot['heightTiles'],
            'walk' => $walk,
            'start' => [(int)$mapSnapshot['startTilePoint']['x'], (int)$mapSnapshot['startTilePoint']['y']],
            'delivery' => [(int)$mapSnapshot['deliveryTilePoint']['x'], (int)$mapSnapshot['deliveryTilePoint']['y']],
            'signals' => $signals,
        ];
    }

    private function gridWalkableCheck(array $grid, int $x, int $y): bool
    {
        if ($x < 0 || $y < 0 || $x >= $grid['width'] || $y >= $grid['height']) {
            return false;
        }

        return $grid['walk'][$y * $grid['width'] + $x] === '1';
    }

    private function tileKey(int $x, int $y): string
    {
        return $x . ':' . $y;
    }

    // ---------------------------------------------------------------- storage and locking

    private function stateLoad(int $matchId): ?array
    {
        $state = $this->_cache->cacheGet(CacheServerKeyFactory::matchStateKey($matchId));

        return is_array($state) && isset($state['matchId']) ? $state : null;
    }

    private function stateRequire(int $matchId): array
    {
        $state = $this->stateLoad($matchId);

        if ($state === null) {
            throw new MatchServiceException(ApiErrorCode::MATCH_STATE_MISSING, 'match was not found', HttpStatusCode::NOT_FOUND);
        }

        return $state;
    }

    private function stateStore(array $state): void
    {
        $stored = $this->_cache->cacheSet(
            CacheServerKeyFactory::matchStateKey((int)$state['matchId']),
            $state,
            CacheServerTtlConfig::activeMatchTtlSeconds((int)$state['timerTotalMs'])
        );

        if (!$stored) {
            throw new RuntimeException('match state store failed');
        }
    }

    // runs work while holding an exclusive file lock, the cache server has no compare and set
    private function lockRun(string $lockName, callable $work): mixed
    {
        $lockDirectory = MatchConfig::lockDirectory();

        if (!is_dir($lockDirectory) && !@mkdir($lockDirectory, 0700, true) && !is_dir($lockDirectory)) {
            throw new RuntimeException('match lock directory could not be created');
        }

        $lockHandle = fopen($lockDirectory . DIRECTORY_SEPARATOR . preg_replace('/[^A-Za-z0-9_-]/', '', $lockName) . '.lock', 'c');

        if ($lockHandle === false || !flock($lockHandle, LOCK_EX)) {
            throw new RuntimeException('match lock could not be taken');
        }

        try {
            return $work();
        } finally {
            flock($lockHandle, LOCK_UN);
            fclose($lockHandle);
        }
    }

    // ---------------------------------------------------------------- errors

    private function badRequest(string $message): MatchServiceException
    {
        return new MatchServiceException(ApiErrorCode::BAD_REQUEST, $message, HttpStatusCode::BAD_REQUEST);
    }

    private function ruleRejected(string $errorCode, string $message, array $details = []): MatchServiceException
    {
        return new MatchServiceException($errorCode, $message, HttpStatusCode::UNPROCESSABLE_ENTITY, $details);
    }
}
