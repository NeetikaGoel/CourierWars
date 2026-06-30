<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchEndReasonValue.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/IdempotencyService.php';
require_once __DIR__ . '/MatchStateService.php';
require_once __DIR__ . '/PollingStateService.php';

class MatchLifecycleService
{
    private IdempotencyService $_idempotencyService;
    private MatchStateService $_matchStateService;
    private PollingStateService $_pollingStateService;

    public function __construct(?IdempotencyService $idempotencyService = null, ?MatchStateService $matchStateService = null, ?PollingStateService $pollingStateService = null)
    {
        $this->_idempotencyService = $idempotencyService ?? new IdempotencyService();
        $this->_matchStateService = $matchStateService ?? new MatchStateService();
        $this->_pollingStateService = $pollingStateService ?? new PollingStateService();
    }

    public function matchForfeit(AuthContext $authContext, int $matchId, array $validatedBody, string $idempotencyKey): array
    {
        $idempotencyPayload = [
            'operation' => 'matchForfeit',
            'matchId' => $matchId,
            'body' => $validatedBody,
        ];

        $cachedResponse = $this->_idempotencyService->cachedResponseGet($authContext, $idempotencyKey, $idempotencyPayload);

        if ($cachedResponse !== null) {
            return $cachedResponse;
        }

        $matchState = $this->_matchStateService->matchStateRequire($matchId);
        $forfeitRole = $this->_matchStateService->participantRoleRequire($authContext, $matchState);

        if (!MatchConfig::matchStatusIsEnded((int)($matchState[MatchStateFieldName::STATUS] ?? -1))) {
            if ((int)($matchState[MatchStateFieldName::STATUS] ?? -1) !== MatchStatusValue::ACTIVE) {
                throw new LogicException('match is not active');
            }

            $matchState[MatchStateFieldName::STATUS] = MatchStatusValue::COMPLETED;
            $matchState[MatchStateFieldName::WINNER_ROLE] = $this->opponentRoleGet($forfeitRole);
            $matchState[MatchStateFieldName::END_REASON] = MatchEndReasonValue::FORFEIT;
            $matchState[MatchStateFieldName::TIMER_REMAINING_MS] = $this->timerRemainingMsGet($matchState);
            $matchState[MatchStateFieldName::DRAW_OFFER] = null;

            $matchState = $this->_matchStateService->stateVersionIncrement($matchState);
            $this->_matchStateService->matchStateStore($matchState);
        }

        $response = $this->_pollingStateService->matchStateGet($authContext, $matchId, 0);
        $this->_idempotencyService->responseStore($authContext, $idempotencyKey, $idempotencyPayload, $response);

        return $response;
    }

    private function opponentRoleGet(string $role): string
    {
        return $role === RoleValue::COURIER ? RoleValue::SABOTEUR : RoleValue::COURIER;
    }

    private function timerRemainingMsGet(array $matchState): int
    {
        $timerTotalMs = (int)($matchState[MatchStateFieldName::TIMER_TOTAL_MS] ?? 0);
        $startedAtMs = $matchState[MatchStateFieldName::STARTED_AT_MS] ?? null;

        if (!is_int($startedAtMs) || $startedAtMs <= 0) {
            return MatchConfig::timerRemainingClamp($timerTotalMs);
        }

        return MatchConfig::timerRemainingClamp($timerTotalMs - (Clock::unixMilliseconds() - $startedAtMs));
    }
}
