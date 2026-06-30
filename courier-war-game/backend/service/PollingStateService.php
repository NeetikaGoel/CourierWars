<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/MatchStateService.php';

class PollingStateService
{
    private MatchStateService $_matchStateService; // loads state and checks participant access

    public function __construct(?MatchStateService $matchStateService = null)
    {
        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state dependency
    }

    public function matchStateGet(AuthContext $authContext, int $matchId, int $knownVersion): array
    {
        $matchState = $this->_matchStateService->matchStateRequire($matchId); // reads match state from cache
        $assignedRole = $this->_matchStateService->participantRoleRequire($authContext, $matchState); // gets caller role

        $serverVersion = (int)($matchState[MatchStateFieldName::STATE_VERSION] ?? 0); // reads authoritative version
        $hasChanges = $knownVersion !== $serverVersion; // tells frontend if version changed

        $matchState[MatchStateFieldName::TIMER_REMAINING_MS] = $this->timerRemainingMsGet($matchState); // updates timer every poll

        return $this->frontendStateCreate($matchState, $assignedRole, $hasChanges); // returns projected state
    }

    private function frontendStateCreate(array $matchState, string $assignedRole, bool $hasChanges): array
    {
        $courier = $matchState[MatchStateFieldName::COURIER] ?? []; // reads courier block
        $saboteur = $matchState[MatchStateFieldName::SABOTEUR] ?? []; // reads saboteur block

        $matchState['assignedRole'] = $assignedRole; // tells frontend current player role
        $matchState['opponentRole'] = $this->opponentRoleGet($assignedRole); // tells frontend the matched opponent role
        $matchState['hasChanges'] = $hasChanges; // exposes version comparison result

        $matchState['courierLivesRemaining'] = (int)($courier[MatchStateFieldName::LIVES] ?? 0); // hud-friendly lives
        $matchState['obstacleEnergyRemaining'] = (int)($saboteur[MatchStateFieldName::ENERGY_CURRENT] ?? 0); // hud-friendly energy
        $matchState['obstacleEnergySpent'] = (int)($saboteur[MatchStateFieldName::ENERGY_SPENT] ?? 0); // result/hud stat
        $matchState['energyMax'] = (int)($saboteur[MatchStateFieldName::ENERGY_MAX] ?? 0); // energy bar max
        $matchState['activeHurdleCount'] = (int)($saboteur[MatchStateFieldName::ACTIVE_HURDLE_COUNT] ?? 0); // hurdle count
        $matchState['deliveryProgressPct'] = MatchConfig::deliveryProgressClamp((int)($matchState['deliveryProgressPct'] ?? 0)); // safe progress

        $matchState['courierName'] = $courier[MatchStateFieldName::NAME] ?? $courier[MatchStateFieldName::USERNAME] ?? 'Courier'; // easy display name
        $matchState['saboteurName'] = $saboteur[MatchStateFieldName::NAME] ?? $saboteur[MatchStateFieldName::USERNAME] ?? 'Saboteur'; // easy display name
        $matchState[MatchStateFieldName::DRAW_OFFER] = $this->activeDrawOfferGet($matchState[MatchStateFieldName::DRAW_OFFER] ?? null); // exposes only active draw offer

        return $matchState; // returns compatible state shape
    }

    private function opponentRoleGet(string $assignedRole): string
    {
        if ($assignedRole === RoleValue::COURIER) {
            return RoleValue::SABOTEUR; // courier is playing against saboteur
        }

        return RoleValue::COURIER; // saboteur is playing against courier
    }

    private function activeDrawOfferGet($drawOffer): ?array
    {
        if (!is_array($drawOffer)) {
            return null; // no active draw offer exists
        }

        $expiresAtMs = (int)($drawOffer['expiresAtMs'] ?? 0); // reads offer expiry

        if ($expiresAtMs <= (int)floor(microtime(true) * 1000)) {
            return null; // hides expired offer from frontend
        }

        return $drawOffer; // returns active draw offer for popup
    }

    private function timerRemainingMsGet(array $matchState): int
    {
        $matchStatus = (int)($matchState[MatchStateFieldName::STATUS] ?? -1); // reads match lifecycle status

        if (MatchConfig::matchStatusIsEnded($matchStatus)) {
            return MatchConfig::timerRemainingClamp((int)($matchState[MatchStateFieldName::TIMER_REMAINING_MS] ?? 0)); // ended matches keep stored timer
        }

        $timerTotalMs = (int)($matchState[MatchStateFieldName::TIMER_TOTAL_MS] ?? 0); // full match timer
        $startedAtMs = $matchState[MatchStateFieldName::STARTED_AT_MS] ?? null; // null while waiting

        if (!is_int($startedAtMs) || $startedAtMs <= 0) {
            return MatchConfig::timerRemainingClamp($timerTotalMs); // waiting match still has full timer
        }

        $elapsedMs = (int)floor(microtime(true) * 1000) - $startedAtMs; // computes elapsed time
        $remainingMs = $timerTotalMs - $elapsedMs; // computes remaining time

        return MatchConfig::timerRemainingClamp($remainingMs); // never returns negative time
    }
}
