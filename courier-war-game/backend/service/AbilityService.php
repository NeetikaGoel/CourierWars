<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/AbilityConfig.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/AbilityTypeValue.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/IdempotencyService.php';
require_once __DIR__ . '/MatchStateService.php';
require_once __DIR__ . '/PollingStateService.php';

// handles courier abilities, cooldowns, active effects, counters, stale state checks, and idempotency

class AbilityService
{
    private IdempotencyService $_idempotencyService; // prevents duplicate ability effects

    private MatchStateService $_matchStateService; // owns cached match state

    private PollingStateService $_pollingStateService; // returns frontend-friendly state

    public function __construct(
        ?IdempotencyService $idempotencyService = null,
        ?MatchStateService $matchStateService = null,
        ?PollingStateService $pollingStateService = null
    ) {
        $this->_idempotencyService = $idempotencyService ?? new IdempotencyService(); // creates idempotency helper
        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state helper
        $this->_pollingStateService = $pollingStateService ?? new PollingStateService(); // creates state projector
    }

    public function courierAbilityUse(AuthContext $authContext, int $matchId, array $validatedBody, string $idempotencyKey): array
    {
        $idempotencyPayload = [
            'operation' => 'courierAbility', // separates ability from other writes
            'matchId' => $matchId, // locks action to match
            'body' => $validatedBody, // locks key to exact body
        ];

        $cachedResponse = $this->_idempotencyService->cachedResponseGet($authContext, $idempotencyKey, $idempotencyPayload); // checks retry cache

        if ($cachedResponse !== null) {
            return $cachedResponse; // returns original response for duplicate retry
        }

        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads authoritative state
        $assignedRole = $this->_matchStateService->participantRoleRequire($authContext, $matchState); // authorizes participant

        if ($assignedRole !== RoleValue::COURIER) {
            throw new DomainException('only courier can use abilities'); // blocks saboteur from ability endpoint
        }

        if ((int)($matchState[MatchStateFieldName::STATUS] ?? -1) !== MatchStatusValue::ACTIVE) {
            throw new LogicException('match is not active'); // abilities only work during active match
        }

        $this->_matchStateService->stateVersionFreshRequire($matchState, (int)$validatedBody[MatchRequestFieldName::KNOWN_STATE_VERSION]); // rejects stale actions

        $abilityType = (string)$validatedBody[MatchRequestFieldName::ABILITY_TYPE]; // reads ability type
        $nowMs = $this->nowMs(); // captures server time
        $cooldowns = $matchState[MatchStateFieldName::COURIER]['cooldowns'] ?? []; // reads current cooldowns
        $cooldownUntilMs = (int)($cooldowns[$abilityType] ?? 0); // reads selected ability cooldown

        if ($cooldownUntilMs > $nowMs) {
            throw new LogicException('ability is on cooldown'); // rejects ability spam
        }

        $matchState[MatchStateFieldName::COURIER]['abilitiesActive'][$abilityType] = $this->activeAbilityCreate($abilityType, $nowMs); // stores active effect
        $matchState[MatchStateFieldName::COURIER]['cooldowns'][$abilityType] = $nowMs + AbilityConfig::cooldownMsFor($abilityType); // stores next allowed time
        $matchState = $this->abilityCountersIncrement($matchState, $abilityType); // updates match counters
        $matchState = $this->_matchStateService->stateVersionIncrement($matchState); // bumps version
        $this->_matchStateService->matchStateStore($matchState); // persists state

        $response = $this->_pollingStateService->matchStateGet($authContext, $matchId, 0); // returns updated state

        $this->_idempotencyService->responseStore($authContext, $idempotencyKey, $idempotencyPayload, $response); // stores retry response

        return $response; // returns accepted ability result
    }

    private function activeAbilityCreate(string $abilityType, int $nowMs): array
    {
        $activeAbility = [
            'startedAtMs' => $nowMs, // stores start time
            'expiresAtMs' => $nowMs + AbilityConfig::durationMsFor($abilityType), // stores expiry time
        ];

        if ($abilityType === AbilityTypeValue::SPEED_BOOST) {
            $activeAbility['movementMultiplier'] = AbilityConfig::SPEED_BOOST_MOVEMENT_MULTIPLIER; // exposes speed modifier
        }

        if ($abilityType === AbilityTypeValue::SHIELD) {
            $activeAbility['remainingBlockCount'] = AbilityConfig::SHIELD_BLOCKED_EFFECT_COUNT; // shield blocks one effect
        }

        return $activeAbility; // returns active ability payload
    }

    private function abilityCountersIncrement(array $matchState, string $abilityType): array
    {
        $matchState[MatchStateFieldName::COUNTERS]['abilitiesUsed'] = (int)($matchState[MatchStateFieldName::COUNTERS]['abilitiesUsed'] ?? 0) + 1; // increments total ability count
        $matchState[MatchStateFieldName::COUNTERS]['abilityCounts'][$abilityType] = (int)($matchState[MatchStateFieldName::COUNTERS]['abilityCounts'][$abilityType] ?? 0) + 1; // increments selected ability count

        return $matchState; // returns updated state
    }

    private function nowMs(): int
    {
        return (int)floor(microtime(true) * 1000); // returns current unix milliseconds
    }
}
