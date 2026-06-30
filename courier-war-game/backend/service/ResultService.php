<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchEndReasonValue.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/MatchStateService.php';


//returns result payload for completed matches and finalizes timer-expired active matches at read time for now

class ResultService
{
    private MatchStateService $_matchStateService; // reads and stores match state

    public function __construct(?MatchStateService $matchStateService = null)
    {
        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state helper
    }

    public function resultGet(AuthContext $authContext, int $matchId): array
    {
        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads match state
        $assignedRole = $this->_matchStateService->participantRoleRequire($authContext, $matchState); // verifies participant

        $matchState = $this->timerExpiredFinalizeIfNeeded($matchState); // finalizes active timeout when needed

        if (!$this->matchIsEnded($matchState)) {
            throw new RuntimeException('match result is not ready'); // result is available only after end
        }

        $this->_matchStateService->matchStateStore($matchState); // stores timeout finalization if it happened

        return $this->resultPayloadCreate($matchState, $assignedRole); // returns result data
    }

    private function timerExpiredFinalizeIfNeeded(array $matchState): array
    {
        if ((int)($matchState[MatchStateFieldName::STATUS] ?? -1) !== MatchStatusValue::ACTIVE) {
            return $matchState; // only active matches can expire here
        }

        $timerRemainingMs = $this->timerRemainingMsGet($matchState); // computes current remaining time

        if ($timerRemainingMs > 0) {
            $matchState[MatchStateFieldName::TIMER_REMAINING_MS] = $timerRemainingMs; // keeps current timer
            return $matchState; // match still active
        }

        $matchState[MatchStateFieldName::STATUS] = MatchStatusValue::COMPLETED; // ends match
        $matchState[MatchStateFieldName::WINNER_ROLE] = RoleValue::SABOTEUR; // saboteur wins by timeout
        $matchState[MatchStateFieldName::END_REASON] = MatchEndReasonValue::TIMER_EXPIRED; // stores end reason
        $matchState[MatchStateFieldName::TIMER_REMAINING_MS] = 0; // timer cannot go below zero
        $matchState = $this->_matchStateService->stateVersionIncrement($matchState); // bumps version for polling

        return $matchState; // returns finalized state
    }

    private function resultPayloadCreate(array $matchState, string $assignedRole): array
    {
        $courier = $matchState[MatchStateFieldName::COURIER] ?? []; // reads courier block
        $saboteur = $matchState[MatchStateFieldName::SABOTEUR] ?? []; // reads saboteur block
        $counters = $matchState[MatchStateFieldName::COUNTERS] ?? []; // reads match counters
        $timerRemainingMs = $this->timerRemainingMsGet($matchState); // computes latest timer
        $winnerRole = $matchState[MatchStateFieldName::WINNER_ROLE] ?? null; // reads winner

        return [
            'matchId' => (int)$matchState[MatchStateFieldName::MATCH_ID], // match id
            'assignedRole' => $assignedRole, // role of requesting user
            'winnerRole' => $winnerRole ?? 'draw', // frontend-friendly winner
            'endReason' => $matchState[MatchStateFieldName::END_REASON] ?? MatchEndReasonValue::DRAW, // end reason
            'difficulty' => (string)($matchState[MatchStateFieldName::DIFFICULTY] ?? 'medium'), // difficulty
            'mapVersion' => (string)($matchState[MatchStateFieldName::MAP_VERSION] ?? 'v1'), // map version
            'mapGenerationVersion' => (string)($matchState[MatchStateFieldName::MAP_GENERATION_VERSION] ?? 'city_map_generation_v7'), // generator version
            'mapSeed' => (int)($matchState[MatchStateFieldName::MAP_SEED] ?? 0), // map seed for debug
            'matchTimeMs' => max(0, (int)$matchState[MatchStateFieldName::TIMER_TOTAL_MS] - $timerRemainingMs), // elapsed match time
            'timerTotalMs' => (int)$matchState[MatchStateFieldName::TIMER_TOTAL_MS], // total timer
            'timeRemainingMs' => $timerRemainingMs, // remaining time
            'courierLivesRemaining' => (int)($courier[MatchStateFieldName::LIVES] ?? 0), // courier lives
            'deliveryProgressPct' => MatchConfig::deliveryProgressClamp((int)($matchState['deliveryProgressPct'] ?? 0)), // delivery progress
            'obstacleEnergySpent' => (int)($saboteur[MatchStateFieldName::ENERGY_SPENT] ?? 0), // energy spent
            'obstacleEnergyRemaining' => (int)($saboteur[MatchStateFieldName::ENERGY_CURRENT] ?? 0), // energy remaining
            'obstacleEnergyMax' => (int)($saboteur[MatchStateFieldName::ENERGY_MAX] ?? 0), // energy max
            'hurdlesActivated' => (int)($counters['hurdlesActivated'] ?? 0), // total hurdles
            'abilitiesUsed' => (int)($counters['abilitiesUsed'] ?? 0), // total abilities
            'hurdleCounts' => $counters['hurdleCounts'] ?? [], // per-hurdle counts
            'abilityCounts' => $counters['abilityCounts'] ?? [], // per-ability counts
            'courierName' => $courier[MatchStateFieldName::NAME] ?? $courier[MatchStateFieldName::USERNAME] ?? 'Courier', // courier display
            'saboteurName' => $saboteur[MatchStateFieldName::NAME] ?? $saboteur[MatchStateFieldName::USERNAME] ?? 'Saboteur', // saboteur display
        ];
    }

    private function matchIsEnded(array $matchState): bool
    {
        return MatchConfig::matchStatusIsEnded((int)($matchState[MatchStateFieldName::STATUS] ?? -1)); // checks completed or draw
    }

    private function timerRemainingMsGet(array $matchState): int
    {
        if (MatchConfig::matchStatusIsEnded((int)($matchState[MatchStateFieldName::STATUS] ?? -1))) {
            return MatchConfig::timerRemainingClamp((int)($matchState[MatchStateFieldName::TIMER_REMAINING_MS] ?? 0)); // ended matches use stored value
        }

        $timerTotalMs = (int)($matchState[MatchStateFieldName::TIMER_TOTAL_MS] ?? 0); // reads total timer
        $startedAtMs = $matchState[MatchStateFieldName::STARTED_AT_MS] ?? null; // reads start time

        if (!is_int($startedAtMs) || $startedAtMs <= 0) {
            return MatchConfig::timerRemainingClamp($timerTotalMs); // waiting match has full timer
        }

        $elapsedMs = (int)floor(microtime(true) * 1000) - $startedAtMs; // computes elapsed time

        return MatchConfig::timerRemainingClamp($timerTotalMs - $elapsedMs); // clamps remaining time
    }
}
