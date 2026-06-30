<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/HurdleConfig.php';
require_once __DIR__ . '/../constants/HurdleTypeValue.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/IdempotencyService.php';
require_once __DIR__ . '/MapBootstrapService.php';
require_once __DIR__ . '/MatchStateService.php';
require_once __DIR__ . '/PollingStateService.php';

// handles saboteur hurdle activation with role, state, cooldown, energy, map support, current-zone, distance, active-limit, and signal runtime checks

class HurdleService
{
    private IdempotencyService $_idempotencyService; // prevents duplicate hurdle activation

    private MatchStateService $_matchStateService; // reads and writes match state

    private MapBootstrapService $_mapBootstrapService; // loads official map snapshot

    private PollingStateService $_pollingStateService; // returns frontend-friendly state

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

    public function saboteurHurdleActivate(AuthContext $authContext, int $matchId, array $validatedBody, string $idempotencyKey): array
    {
        $idempotencyPayload = [
            'operation' => 'saboteurHurdle', // separates hurdle action from other writes
            'matchId' => $matchId, // locks action to match
            'body' => $validatedBody, // locks key to exact body
        ];

        $cachedResponse = $this->_idempotencyService->cachedResponseGet($authContext, $idempotencyKey, $idempotencyPayload); // checks retry cache

        if ($cachedResponse !== null) {
            return $cachedResponse; // returns original response for duplicate retry
        }

        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads authoritative state
        $assignedRole = $this->_matchStateService->participantRoleRequire($authContext, $matchState); // authorizes participant

        if ($assignedRole !== RoleValue::SABOTEUR) {
            throw new DomainException('only saboteur can activate hurdles'); // blocks courier from hurdle endpoint
        }

        if ((int)($matchState[MatchStateFieldName::STATUS] ?? -1) !== MatchStatusValue::ACTIVE) {
            throw new LogicException('match is not active'); // hurdles only work during active match
        }

        $this->_matchStateService->stateVersionFreshRequire($matchState, (int)$validatedBody[MatchRequestFieldName::KNOWN_STATE_VERSION]); // rejects stale state

        $mapSnapshot = $this->_mapBootstrapService->activeMatchMapGet($matchId); // loads official map

        if ($mapSnapshot === null) {
            throw new RuntimeException('match map was not found'); // map is required for hurdle validation
        }

        $nowMs = $this->nowMs(); // captures server time
        $matchState = $this->runtimeEffectsExpire($matchState, $nowMs); // removes expired runtime effects

        $hurdleType = (string)$validatedBody[MatchRequestFieldName::HURDLE_TYPE]; // reads hurdle type
        $target = $validatedBody[MatchRequestFieldName::TARGET]; // reads target tile
        $targetTile = $this->tileAtGet($mapSnapshot, (int)$target['x'], (int)$target['y']); // loads target tile
        $rule = HurdleConfig::ruleFor($hurdleType); // loads hurdle tuning rule

        if ($targetTile === null) {
            throw new LogicException('target tile was not found'); // rejects invalid map target
        }

        $this->hurdleRuleRequire($matchState, $mapSnapshot, $targetTile, $target, $hurdleType, $rule, $nowMs); // runs gameplay validation

        $durationMs = $this->durationMsGet($validatedBody, $rule); // resolves final duration
        $energyCost = (int)$rule['energyCost']; // reads energy cost
        $activeHurdleId = 'active-hurdle-' . (string)$validatedBody[MatchRequestFieldName::CLIENT_ACTION_ID]; // creates stable active id

        $matchState[MatchStateFieldName::ACTIVE_HURDLES][$activeHurdleId] = [
            'id' => $activeHurdleId, // active hurdle id
            'hurdleType' => $hurdleType, // hurdle type
            'tilePoint' => [
                'x' => (int)$target['x'], // target x
                'y' => (int)$target['y'], // target y
            ],
            'startedAtMs' => $nowMs, // start time
            'expiresAtMs' => $nowMs + $durationMs, // expiry time
            'energyCost' => $energyCost, // energy spent
        ];

        if ($hurdleType === HurdleTypeValue::RED_TRAFFIC_LIGHT) {
            $matchState = $this->trafficSignalTurnRed($matchState, $targetTile, $nowMs + $durationMs); // changes selected signal to red
        }

        $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::ENERGY_CURRENT] -= $energyCost; // spends energy
        $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::ENERGY_SPENT] += $energyCost; // tracks energy spent
        $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::COOLDOWNS][$hurdleType] = $nowMs + (int)$rule['cooldownMs']; // stores cooldown
        $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::ACTIVE_HURDLE_COUNT] = count($matchState[MatchStateFieldName::ACTIVE_HURDLES]); // syncs active count
        $matchState = $this->hurdleCountersIncrement($matchState, $hurdleType); // updates counters
        $matchState = $this->_matchStateService->stateVersionIncrement($matchState); // bumps version
        $this->_matchStateService->matchStateStore($matchState); // persists state

        $response = $this->_pollingStateService->matchStateGet($authContext, $matchId, 0); // returns updated state

        $this->_idempotencyService->responseStore($authContext, $idempotencyKey, $idempotencyPayload, $response); // stores retry response

        return $response; // returns accepted hurdle result
    }

    private function hurdleRuleRequire(array $matchState, array $mapSnapshot, array $targetTile, array $target, string $hurdleType, array $rule, int $nowMs): void
    {
        if (empty($rule)) {
            throw new LogicException('hurdle rule is missing'); // rejects unsupported hurdle config
        }

        if ((bool)($targetTile['start'] ?? false) || (bool)($targetTile['delivery'] ?? false)) {
            throw new LogicException('hurdle cannot be placed on start or delivery'); // protects key tiles
        }

        if ($this->sameTile($target, $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::POSITION])) {
            throw new LogicException('hurdle cannot be placed on courier'); // prevents instant punishment
        }

        if ($this->distanceToCourier($matchState, $target) <= HurdleConfig::COURIER_DISTANCE_MIN_TILES) {
            throw new LogicException('hurdle is too close to courier'); // enforces prediction distance
        }

        if ($this->targetInCourierCurrentZone($mapSnapshot, $matchState, $targetTile)) {
            throw new LogicException('hurdle cannot be placed in courier current zone'); // protects current zone
        }

        if (!$this->tileSupportsHurdle($targetTile, $hurdleType)) {
            throw new LogicException('target tile does not support this hurdle'); // validates map feature support
        }

        if ($this->activeHurdleOnTileExists($matchState, $target)) {
            throw new LogicException('target tile already has an active hurdle'); // avoids overlapping active hurdles
        }

        if ($hurdleType === HurdleTypeValue::RED_TRAFFIC_LIGHT && $this->trafficSignalAlreadyRed($matchState, $targetTile, $nowMs)) {
            throw new LogicException('traffic signal is already red'); // avoids extending red signal by spam
        }

        $activeCount = count($matchState[MatchStateFieldName::ACTIVE_HURDLES] ?? []); // reads live active count
        $activeMax = (int)($matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::ACTIVE_HURDLE_COUNT_MAX] ?? HurdleConfig::ACTIVE_HURDLE_COUNT_MAX); // reads max active count

        if ($activeCount >= $activeMax) {
            throw new LogicException('active hurdle limit reached'); // enforces active hurdle cap
        }

        $energyCurrent = (int)($matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::ENERGY_CURRENT] ?? 0); // reads current energy

        if ($energyCurrent < (int)$rule['energyCost']) {
            throw new LogicException('not enough saboteur energy'); // enforces energy cost
        }

        $cooldownUntilMs = (int)($matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::COOLDOWNS][$hurdleType] ?? 0); // reads cooldown

        if ($cooldownUntilMs > $nowMs) {
            throw new LogicException('hurdle is on cooldown'); // enforces cooldown
        }
    }

    private function tileSupportsHurdle(array $targetTile, string $hurdleType): bool
    {
        if ($hurdleType === HurdleTypeValue::RED_TRAFFIC_LIGHT) {
            return ($targetTile['trafficSignalId'] ?? null) !== null; // red light requires signal tile
        }

        if ($hurdleType === HurdleTypeValue::CLOSED_GATE) {
            return (bool)($targetTile['tunnelEntrance'] ?? false)
                || (bool)($targetTile['shortcutEntrance'] ?? false)
                || (bool)($targetTile['bridgeEntrance'] ?? false)
                || ($targetTile['tunnelId'] ?? null) !== null
                || ($targetTile['shortcutId'] ?? null) !== null
                || ($targetTile['bridgeId'] ?? null) !== null; // closed gate needs route feature
        }

        if ($hurdleType === HurdleTypeValue::WRONG_DIRECTION_SIGN) {
            return ($targetTile['intersectionId'] ?? null) !== null || ($targetTile['shortcutId'] ?? null) !== null; // sign belongs near choices
        }

        return (bool)($targetTile['walkable'] ?? false); // other hurdles need walkable path
    }

    private function trafficSignalTurnRed(array $matchState, array $targetTile, int $redUntilMs): array
    {
        $signalId = (string)($targetTile['trafficSignalId'] ?? ''); // reads signal id

        if ($signalId === '') {
            throw new LogicException('traffic signal id is missing'); // red light needs signal id
        }

        $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId] = [
            'stateName' => 'red', // signal is now red
            'redUntilMs' => $redUntilMs, // signal expiry
            'activatedBySaboteur' => true, // marks saboteur activation
        ];

        return $matchState; // returns updated state
    }

    private function trafficSignalAlreadyRed(array $matchState, array $targetTile, int $nowMs): bool
    {
        $signalId = (string)($targetTile['trafficSignalId'] ?? ''); // reads signal id

        if ($signalId === '') {
            return false; // no signal cannot already be red
        }

        $signalState = $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId] ?? null; // reads signal state

        if (!is_array($signalState)) {
            return false; // missing runtime signal is not red
        }

        return (string)($signalState['stateName'] ?? 'green') === 'red' && (int)($signalState['redUntilMs'] ?? 0) > $nowMs; // active red check
    }

    private function targetInCourierCurrentZone(array $mapSnapshot, array $matchState, array $targetTile): bool
    {
        $courierPosition = $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::POSITION]; // reads courier tile
        $courierTile = $this->tileAtGet($mapSnapshot, (int)$courierPosition['x'], (int)$courierPosition['y']); // reads courier map tile

        if ($courierTile === null) {
            return false; // missing courier tile should not crash placement
        }

        return (string)($courierTile['zoneId'] ?? '') === (string)($targetTile['zoneId'] ?? ''); // same zone is forbidden
    }

    private function activeHurdleOnTileExists(array $matchState, array $target): bool
    {
        foreach (($matchState[MatchStateFieldName::ACTIVE_HURDLES] ?? []) as $activeHurdle) {
            if (!is_array($activeHurdle)) {
                continue; // skips malformed hurdle
            }

            if ($this->sameTile($activeHurdle['tilePoint'] ?? [], $target)) {
                return true; // target already has active hurdle
            }
        }

        return false; // target has no active hurdle
    }

    private function runtimeEffectsExpire(array $matchState, int $nowMs): array
    {
        $activeHurdles = []; // stores live hurdles

        foreach (($matchState[MatchStateFieldName::ACTIVE_HURDLES] ?? []) as $hurdleId => $activeHurdle) {
            if (!is_array($activeHurdle)) {
                continue; // skips malformed hurdle
            }

            if ((int)($activeHurdle['expiresAtMs'] ?? 0) > $nowMs) {
                $activeHurdles[$hurdleId] = $activeHurdle; // keeps unexpired hurdle
            }
        }

        foreach (($matchState[MatchStateFieldName::TRAFFIC_SIGNALS] ?? []) as $signalId => $signalState) {
            if (!is_array($signalState)) {
                continue; // skips malformed signal
            }

            if ((string)($signalState['stateName'] ?? 'green') === 'red' && (int)($signalState['redUntilMs'] ?? 0) <= $nowMs) {
                $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId]['stateName'] = 'green'; // restores green signal
                $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId]['redUntilMs'] = null; // clears expiry
                $matchState[MatchStateFieldName::TRAFFIC_SIGNALS][$signalId]['activatedBySaboteur'] = false; // clears flag
            }
        }

        $matchState[MatchStateFieldName::ACTIVE_HURDLES] = $activeHurdles; // stores cleaned hurdles
        $matchState[MatchStateFieldName::SABOTEUR][MatchStateFieldName::ACTIVE_HURDLE_COUNT] = count($activeHurdles); // syncs count

        return $matchState; // returns cleaned state
    }

    private function hurdleCountersIncrement(array $matchState, string $hurdleType): array
    {
        $matchState[MatchStateFieldName::COUNTERS]['hurdlesActivated'] = (int)($matchState[MatchStateFieldName::COUNTERS]['hurdlesActivated'] ?? 0) + 1; // increments total hurdles
        $matchState[MatchStateFieldName::COUNTERS]['hurdleCounts'][$hurdleType] = (int)($matchState[MatchStateFieldName::COUNTERS]['hurdleCounts'][$hurdleType] ?? 0) + 1; // increments selected hurdle

        return $matchState; // returns updated state
    }

    private function durationMsGet(array $validatedBody, array $rule): int
    {
        if (($validatedBody[MatchRequestFieldName::REQUESTED_DURATION_MS] ?? null) !== null) {
            return (int)$validatedBody[MatchRequestFieldName::REQUESTED_DURATION_MS]; // uses optional client duration after validator bounds
        }

        return (int)$rule['durationMs']; // uses configured default duration
    }

    private function tileAtGet(array $mapSnapshot, int $x, int $y): ?array
    {
        $row = $mapSnapshot['tileRows'][$y] ?? null; // reads row by y

        if (is_array($row) && isset($row[$x]) && is_array($row[$x])) {
            return $row[$x]; // fast path for normalized map
        }

        foreach (($mapSnapshot['tileRows'] ?? []) as $tileRow) {
            if (!is_array($tileRow)) {
                continue; // skips malformed row
            }

            foreach ($tileRow as $tile) {
                if (is_array($tile) && (int)($tile['x'] ?? -1) === $x && (int)($tile['y'] ?? -1) === $y) {
                    return $tile; // fallback coordinate search
                }
            }
        }

        return null; // tile missing
    }

    private function sameTile(array $left, array $right): bool
    {
        return (int)($left['x'] ?? -1) === (int)($right['x'] ?? -2) && (int)($left['y'] ?? -1) === (int)($right['y'] ?? -2); // compares tile coordinates
    }

    private function distanceToCourier(array $matchState, array $target): int
    {
        $courierPosition = $matchState[MatchStateFieldName::COURIER][MatchStateFieldName::POSITION]; // reads courier position

        return abs((int)$courierPosition['x'] - (int)$target['x']) + abs((int)$courierPosition['y'] - (int)$target['y']); // manhattan distance
    }

    private function nowMs(): int
    {
        return (int)floor(microtime(true) * 1000); // returns current unix milliseconds
    }
}
