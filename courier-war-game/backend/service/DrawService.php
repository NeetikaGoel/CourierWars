<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchEndReasonValue.php';
require_once __DIR__ . '/../constants/MatchRequestFieldName.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/IdempotencyService.php';
require_once __DIR__ . '/MatchStateService.php';
require_once __DIR__ . '/PollingStateService.php';

class DrawService
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

    public function drawOffer(AuthContext $authContext, int $matchId, array $validatedBody, string $idempotencyKey): array
    {
        return $this->drawMutationRun($authContext, $matchId, $validatedBody, $idempotencyKey, 'drawOffer', function (array $matchState, string $role, int $nowMs, bool $accepted): array {
            $activeOffer = $this->activeDrawOfferGet($matchState);

            if ($activeOffer !== null && (string)$activeOffer['offeredByRole'] !== $role) {
                throw new LogicException('opponent already offered a draw');
            }

            $matchState[MatchStateFieldName::DRAW_OFFER] = [
                'offeredByRole' => $role,
                'offeredByUserId' => $matchState[$role][MatchStateFieldName::USER_ID] ?? null,
                'offeredByName' => $this->participantNameGet($matchState, $role),
                'offeredAtMs' => $nowMs,
                'expiresAtMs' => $nowMs + MatchConfig::DRAW_OFFER_TTL_MS,
            ];

            return $matchState;
        });
    }

    public function drawRespond(AuthContext $authContext, int $matchId, array $validatedBody, string $idempotencyKey): array
    {
        return $this->drawMutationRun($authContext, $matchId, $validatedBody, $idempotencyKey, 'drawRespond', function (array $matchState, string $role, int $nowMs, bool $accepted): array {
            $activeOffer = $this->activeDrawOfferGet($matchState);

            if ($activeOffer === null) {
                throw new LogicException('draw offer is not active');
            }

            if ((string)$activeOffer['offeredByRole'] === $role) {
                throw new LogicException('draw offer must be answered by opponent');
            }

            if ($accepted) {
                $matchState[MatchStateFieldName::STATUS] = MatchStatusValue::DRAW;
                $matchState[MatchStateFieldName::WINNER_ROLE] = null;
                $matchState[MatchStateFieldName::END_REASON] = MatchEndReasonValue::DRAW;
                $matchState[MatchStateFieldName::TIMER_REMAINING_MS] = $this->timerRemainingMsGet($matchState);
            }

            $matchState[MatchStateFieldName::DRAW_OFFER] = null;

            return $matchState;
        });
    }

    private function drawMutationRun(AuthContext $authContext, int $matchId, array $validatedBody, string $idempotencyKey, string $operation, callable $mutator): array
    {
        $idempotencyPayload = [
            'operation' => $operation,
            'matchId' => $matchId,
            'body' => $validatedBody,
        ];

        $cachedResponse = $this->_idempotencyService->cachedResponseGet($authContext, $idempotencyKey, $idempotencyPayload);

        if ($cachedResponse !== null) {
            return $cachedResponse;
        }

        $matchState = $this->_matchStateService->matchStateRequire($matchId);
        $role = $this->_matchStateService->participantRoleRequire($authContext, $matchState);

        if ((int)($matchState[MatchStateFieldName::STATUS] ?? -1) !== MatchStatusValue::ACTIVE) {
            throw new LogicException('match is not active');
        }

        $this->_matchStateService->stateVersionFreshRequire($matchState, (int)$validatedBody[MatchRequestFieldName::KNOWN_STATE_VERSION]);

        $accepted = (bool)($validatedBody[MatchRequestFieldName::ACCEPTED] ?? false);
        $matchState = $mutator($matchState, $role, Clock::unixMilliseconds(), $accepted);
        $matchState = $this->_matchStateService->stateVersionIncrement($matchState);
        $this->_matchStateService->matchStateStore($matchState);

        $response = $this->_pollingStateService->matchStateGet($authContext, $matchId, 0);
        $this->_idempotencyService->responseStore($authContext, $idempotencyKey, $idempotencyPayload, $response);

        return $response;
    }

    private function activeDrawOfferGet(array $matchState): ?array
    {
        $drawOffer = $matchState[MatchStateFieldName::DRAW_OFFER] ?? null;

        if (!is_array($drawOffer)) {
            return null;
        }

        if ((int)($drawOffer['expiresAtMs'] ?? 0) <= Clock::unixMilliseconds()) {
            return null;
        }

        return $drawOffer;
    }

    private function participantNameGet(array $matchState, string $role): string
    {
        $participant = $matchState[$role] ?? [];

        return (string)($participant[MatchStateFieldName::NAME] ?? $participant[MatchStateFieldName::USERNAME] ?? $role);
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
