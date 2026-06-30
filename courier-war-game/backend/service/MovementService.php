<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/CourierMovementConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/AbilityTypeValue.php';
require_once __DIR__ . '/../constants/DirectionValue.php';
require_once __DIR__ . '/../constants/HurdleTypeValue.php';
require_once __DIR__ . '/../constants/MatchEndReasonValue.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/IdempotencyService.php';
require_once __DIR__ . '/MapBootstrapService.php';
require_once __DIR__ . '/MatchStateService.php';
require_once __DIR__ . '/PollingStateService.php';


// handles courier movement after controller validation, with server-side role, state, map, movement, hurdle, delivery, and idempotency checks


class MovementService
{
    private IdempotencyService $_idempotencyService; // prevents duplicate movement effects

    private MatchStateService $_matchStateService; // reads and writes authoritative match state

    private MapBootstrapService $_mapBootstrapService; // loads authoritative match map

    private PollingStateService $_pollingStateService; // returns frontend-friendly state payload

    public function __construct(
        ?IdempotencyService $idempotencyService = null,
        ?MatchStateService $matchStateService = null,
        ?MapBootstrapService $mapBootstrapService = null,
        ?PollingStateService $pollingStateService = null
    ) {
        $this->_idempotencyService = $idempotencyService ?? new IdempotencyService(); // creates idempotency helper
        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state helper
        $this->_mapBootstrapService = $mapBootstrapService ?? new MapBootstrapService(); // creates map helper
        $this->_pollingStateService = $pollingStateService ?? new PollingStateService(); // creates state projector
    }

    public function courierMove(AuthContext $authContext, int $matchId, array $validatedBody, string $idempotencyKey): array
    {
        $idempotencyPayload = [
            'operation' => 'courierMove', // separates movement from other mutating actions
            'matchId' => $matchId, // locks idempotency to this match
            'body' => $validatedBody, // locks idempotency to this exact move
        ];

        $cachedResponse = $this->_idempotencyService->cachedResponseGet($authContext, $idempotencyKey, $idempotencyPayload); // checks retry cache

        if ($cachedResponse !== null) {
            return $cachedResponse; // returns original response for duplicate retry
        }

        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads authoritative state
        $assignedRole = $this->_matchStateService->participantRoleRequire($authContext, $matchState); // verifies participant

        if ($assignedRole !== RoleValue::COURIER) {
            throw new DomainException('only courier can move'); // blocks saboteur from courier endpoint
        }

        $this->activeMatchRequire($matchState); // movement is allowed only while active
        $this->_matchStateService->stateVersionFreshRequire($matchState, (int)$validatedBody[MatchRequestFieldName::KNOWN_STATE_VERSION]); // rejects stale client state

        $mapSnapshot = $this->_mapBootstrapService->activeMatchMapGet($matchId); // loads backend-generated map

        if ($mapSnapshot === null) {
            throw new RuntimeException('match map was not found'); // cache loss prevents movement validation
        }

        $nowMs = $this->nowMs(); // captures one server time for this action
        $matchState = $this->runtimeEffectsExpire($matchState, $nowMs); // removes expired hurdles and signals

        $from = $validatedBody[MatchRequestFieldName::FROM]; // reads validated source tile
        $to = $validatedBody[MatchRequestFieldName::TO]; // reads validated target tile
        $direction = (string)$validatedBody[MatchRequestFieldName::DIRECTION]; // reads validated direction

        $courier = $matchState[MatchStateFieldName::COURIER]; // reads courier state block
        $serverPosition = $courier[MatchStateFieldName::POSITION]; // reads server position

        if (!$this->sameTile($from, $serverPosition)) {
            throw new RuntimeException('courier position does not match server state'); // rejects client-authoritative movement
        }

        if (!$this->isAdjacent($from, $to)) {
            throw new LogicException('target tile is not adjacent'); // courier moves one tile at a time
        }

        if (!$this->directionMatchesMove($from, $to, $direction)) {
            throw new LogicException('direction does not match target tile'); // prevents mismatched direction payloads
        }

        $targetTile = $this->tileAtGet($mapSnapshot, (int)$to['x'], (int)$to['y']); // reads target tile from official map

        if ($targetTile === null || !((bool)($targetTile['walkable'] ?? false))) {
            throw new LogicException('target tile is not walkable'); // rejects buildings water and invalid terrain
        }

        $activeHurdle = $this->activeHurdleOnTileGet($matchState, $to); // checks hurdle on target tile
        $movementDelayMs = $this->movementDelayMsGet($targetTile, $activeHurdle); // computes delay for hud/debug

        if ($this->redSignalBlocks($matchState, $targetTile, $nowMs)) {
            $matchState = $this->shieldConsumeOrReject($matchState, 'red traffic light blocks movement'); // shield may bypass one red light
        }

        if ($activeHurdle !== null && $this->hurdleBlocksMovement((string)$activeHurdle['hurdleType'])) {
            $matchState = $this->shieldConsumeOrReject($matchState, 'active hurdle blocks movement'); // shield may bypass one blocking hurdle
        }

        if ($activeHurdle !== null && (string)$activeHurdle['hurdleType'] === HurdleTypeValue::MOVING_BARRIER) {
            $matchState = $this->movingBarrierApply($matchState); // moving barrier removes life unless shield exists
        }

        $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::POSITION] = [
            'x' => (int)$to['x'], // stores server-authoritative x
            'y' => (int)$to['y'], // stores server-authoritative y
        ];

        $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::DIRECTION] = $direction; // stores last movement direction
        $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::VISITED_TILE_KEYS][] = $this->tileKey($to); // records visited tile
        $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::VISITED_TILE_KEYS] = array_values(array_unique($matchState[MatchStateFieldName::COURIER][MatchStateFieldName::VISITED_TILE_KEYS])); // removes duplicate visited keys
        $matchState['lastMovement'] = [
            'from' => $from, // exposes source tile for client animation
            'to' => $to, // exposes target tile for client animation
            'direction' => $direction, // exposes movement direction
            'movementDelayMs' => $movementDelayMs, // exposes server movement delay
        ];

        $matchState['deliveryProgressPct'] = $this->deliveryProgressPctGet($mapSnapshot, $to); // updates delivery progress

        if ((bool)($targetTile['delivery'] ?? false)) {
            $matchState[MatchStateFieldName::STATUS] = MatchStatusValue::COMPLETED; // marks match complete
            $matchState[MatchStateFieldName::WINNER_ROLE] = RoleValue::COURIER; // courier wins by delivery
            $matchState[MatchStateFieldName::END_REASON] = MatchEndReasonValue::DELIVERED; // stores win reason
            $matchState['deliveryProgressPct'] = MatchConfig::DELIVERY_PROGRESS_MAX; // delivery means full progress
        }

        $matchState = $this->_matchStateService->stateVersionIncrement($matchState); // increments state after accepted move
        $this->_matchStateService->matchStateStore($matchState); // stores updated state

        $response = $this->_pollingStateService->matchStateGet($authContext, $matchId, 0); // returns current frontend state

        $this->_idempotencyService->responseStore($authContext, $idempotencyKey, $idempotencyPayload, $response); // stores response for retries

        return $response; // returns accepted movement state
    }

    private function activeMatchRequire(array $matchState): void
    {
        if ((int)($matchState[MatchStateFieldName::STATUS] ?? -1) !== MatchStatusValue::ACTIVE) {
            throw new LogicException('match is not active'); // prevents actions before active or after end
        }
    }

    private function tileAtGet(array $mapSnapshot, int $x, int $y): ?array
    {
        $row = $mapSnapshot['tileRows'][$y] ?? null; // reads row by y

        if (is_array($row) && isset($row[$x]) && is_array($row[$x])) {
            return $row[$x]; // fast path for normalized tile rows
        }

        foreach (($mapSnapshot['tileRows'] ?? []) as $tileRow) {
            if (!is_array($tileRow)) {
                continue; // skips malformed rows
            }

            foreach ($tileRow as $tile) {
                if (is_array($tile) && (int)($tile['x'] ?? -1) === $x && (int)($tile['y'] ?? -1) === $y) {
                    return $tile; // fallback lookup by coordinates
                }
            }
        }

        return null; // tile not found
    }

    private function sameTile(array $left, array $right): bool
    {
        return (int)$left['x'] === (int)$right['x'] && (int)$left['y'] === (int)$right['y']; // compares tile coordinates
    }

    private function isAdjacent(array $from, array $to): bool
    {
        $distance = abs((int)$from['x'] - (int)$to['x']) + abs((int)$from['y'] - (int)$to['y']); // manhattan tile distance

        return $distance === 1; // only one step is valid
    }

    private function directionMatchesMove(array $from, array $to, string $direction): bool
    {
        $dx = (int)$to['x'] - (int)$from['x']; // x delta
        $dy = (int)$to['y'] - (int)$from['y']; // y delta

        if ($direction === DirectionValue::LEFT) {
            return $dx === -1 && $dy === 0; // left means x decreases
        }

        if ($direction === DirectionValue::RIGHT) {
            return $dx === 1 && $dy === 0; // right means x increases
        }

        if ($direction === DirectionValue::UP) {
            return $dx === 0 && $dy === -1; // up means y decreases
        }

        if ($direction === DirectionValue::DOWN) {
            return $dx === 0 && $dy === 1; // down means y increases
        }

        return false; // invalid movement direction
    }

    private function activeHurdleOnTileGet(array $matchState, array $tilePoint): ?array
    {
        foreach (($matchState[MatchStateFieldName::ACTIVE_HURDLES] ?? []) as $activeHurdle) {
            if (!is_array($activeHurdle)) {
                continue; // skips malformed hurdle
            }

            if ($this->sameTile($activeHurdle['tilePoint'] ?? [], $tilePoint)) {
                return $activeHurdle; // returns hurdle on this tile
            }
        }

        return null; // no hurdle on tile
    }

    private function hurdleBlocksMovement(string $hurdleType): bool
    {
        return in_array(
            $hurdleType,
            [
                HurdleTypeValue::ROAD_BLOCK,
                HurdleTypeValue::CLOSED_GATE,
                HurdleTypeValue::BROKEN_ROAD,
            ],
            true
        ); // only hard-blocking hurdles reject movement
    }

    private function redSignalBlocks(array $matchState, array $targetTile, int $nowMs): bool
    {
        $signalId = $targetTile['trafficSignalId'] ?? null; // reads signal id from tile

        if ($signalId === null || $signalId === '') {
            return false; // non-signal tiles cannot red-block
        }

        $signalState = $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][(string)$signalId] ?? null; // reads runtime signal

        if (!is_array($signalState)) {
            return false; // missing runtime signal is treated as passable
        }

        return (string)($signalState['stateName'] ?? 'green') === 'red' && (int)($signalState['redUntilMs'] ?? 0) > $nowMs; // red signal blocks until expiry
    }

    private function shieldConsumeOrReject(array $matchState, string $message): array
    {
        if (!$this->shieldIsActive($matchState)) {
            throw new LogicException($message); // no shield means movement is rejected
        }

        return $this->shieldConsume($matchState); // shield absorbs one blocking effect
    }

    private function movingBarrierApply(array $matchState): array
    {
        if ($this->shieldIsActive($matchState)) {
            return $this->shieldConsume($matchState); // shield absorbs moving barrier
        }

        $lives = (int)$matchState[MatchStateFieldName::COURIER][MatchStateFieldName::LIVES]; // reads current lives
        $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::LIVES] = max(0, $lives - 1); // removes one life

        if ((int)$matchState[MatchStateFieldName::COURIER][MatchStateFieldName::LIVES] <= 0) {
            $matchState[MatchStateFieldName::STATUS] = MatchStatusValue::COMPLETED; // ends match at zero lives
            $matchState[MatchStateFieldName::WINNER_ROLE] = RoleValue::SABOTEUR; // saboteur wins by lives
            $matchState[MatchStateFieldName::END_REASON] = MatchEndReasonValue::COURIER_LIVES_ZERO; // stores end reason
        }

        return $matchState; // returns updated state
    }

    private function shieldIsActive(array $matchState): bool
    {
        $shield = $matchState[MatchStateFieldName::COURIER]['abilitiesActive'][AbilityTypeValue::SHIELD] ?? null; // reads shield effect

        if (!is_array($shield)) {
            return false; // no shield effect exists
        }

        return (int)($shield['expiresAtMs'] ?? 0) > $this->nowMs() && (int)($shield['remainingBlockCount'] ?? 0) > 0; // shield must be live and unused
    }

    private function shieldConsume(array $matchState): array
    {
        $shield = $matchState[MatchStateFieldName::COURIER]['abilitiesActive'][AbilityTypeValue::SHIELD] ?? []; // reads shield effect
        $remaining = max(0, (int)($shield['remainingBlockCount'] ?? 0) - 1); // consumes one block

        if ($remaining <= 0) {
            unset($matchState[MatchStateFieldName::COURIER]['abilitiesActive'][AbilityTypeValue::SHIELD]); // removes spent shield
            return $matchState; // returns updated state
        }

        $matchState[MatchStateFieldName::COURIER]['abilitiesActive'][AbilityTypeValue::SHIELD]['remainingBlockCount'] = $remaining; // stores remaining blocks

        return $matchState; // returns updated state
    }

    private function movementDelayMsGet(array $targetTile, ?array $activeHurdle): int
    {
        $baseCost = (float)($targetTile['baseMovementCost'] ?? 1); // reads tile movement cost
        $durationMs = (int)round(CourierMovementConfig::BASE_MOVE_DURATION_MS * $baseCost); // computes base duration

        if ($activeHurdle === null) {
            return $durationMs; // no slow hurdle applies
        }

        $hurdleType = (string)($activeHurdle['hurdleType'] ?? ''); // reads hurdle type

        if ($hurdleType === HurdleTypeValue::CONSTRUCTION_WORK) {
            return (int)round($durationMs * CourierMovementConfig::CONSTRUCTION_WORK_MULTIPLIER); // construction slows movement
        }

        if ($hurdleType === HurdleTypeValue::TRAFFIC_JAM) {
            return (int)round($durationMs * CourierMovementConfig::TRAFFIC_JAM_MULTIPLIER); // traffic jam slows movement
        }

        if ($hurdleType === HurdleTypeValue::SECURITY_CHECKPOINT) {
            return (int)round($durationMs * CourierMovementConfig::SECURITY_CHECKPOINT_MULTIPLIER); // checkpoint slows movement
        }

        return $durationMs; // other hurdles do not change delay here
    }

    private function deliveryProgressPctGet(array $mapSnapshot, array $currentTile): int
    {
        $start = $mapSnapshot['startTilePoint'] ?? ['x' => 0, 'y' => 0]; // reads start tile
        $delivery = $mapSnapshot['deliveryTilePoint'] ?? ['x' => 0, 'y' => 0]; // reads delivery tile
        $totalDistance = max(1, abs((int)$delivery['x'] - (int)$start['x']) + abs((int)$delivery['y'] - (int)$start['y'])); // start to delivery distance
        $remainingDistance = abs((int)$delivery['x'] - (int)$currentTile['x']) + abs((int)$delivery['y'] - (int)$currentTile['y']); // current to delivery distance
        $progress = (int)round((1 - ($remainingDistance / $totalDistance)) * 100); // approximates progress

        return MatchConfig::deliveryProgressClamp($progress); // clamps for frontend safety
    }

    private function runtimeEffectsExpire(array $matchState, int $nowMs): array
    {
        $activeHurdles = []; // stores unexpired hurdles

        foreach (($matchState[MatchStateFieldName::ACTIVE_HURDLES] ?? []) as $hurdleId => $activeHurdle) {
            if (!is_array($activeHurdle)) {
                continue; // skips malformed hurdle
            }

            if ((int)($activeHurdle['expiresAtMs'] ?? 0) > $nowMs) {
                $activeHurdles[$hurdleId] = $activeHurdle; // keeps live hurdle
            }
        }

        foreach (($matchState[MatchStateFieldName::TRAFFIC_SIGNALS] ?? []) as $signalId => $signalState) {
            if (!is_array($signalState)) {
                continue; // skips malformed signal
            }

            if ((string)($signalState['stateName'] ?? 'green') === 'red' && (int)($signalState['redUntilMs'] ?? 0) <= $nowMs) {
                $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId]['stateName'] = 'green'; // restores expired signal
                $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId]['redUntilMs'] = null; // clears expiry
                $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId]['activatedBySaboteur'] = false; // clears activation flag
            }
        }

        $matchState[MatchStateFieldName::ACTIVE_HURDLES] = $activeHurdles; // stores only live hurdles
        $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::ACTIVE_HURDLE_COUNT] = count($activeHurdles); // syncs hurdle count

        return $matchState; // returns cleaned state
    }

    private function tileKey(array $tilePoint): string
    {
        return (int)$tilePoint['x'] . ',' . (int)$tilePoint['y']; // creates stable tile key
    }

    private function nowMs(): int
    {
        return (int)floor(microtime(true) * 1000); // returns current unix milliseconds
    }
}
