<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../config/MatchConfig.php';
require_once __DIR__ . '/../constants/MatchEndReasonValue.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/../constants/MatchStatusValue.php';
require_once __DIR__ . '/../constants/RoleValue.php';
require_once __DIR__ . '/../service/MatchStateService.php';
require_once __DIR__ . '/../service/PollingStateService.php';
require_once __DIR__ . '/../service/ResultService.php';
require_once __DIR__ . '/../validation/MatchRequestValidator.php';

final class InMemoryMatchStateService extends MatchStateService
{
    private array $state;
    private int $storeCount = 0;

    public function __construct(array $state)
    {
        $this->state = $state;
    }

    public function matchStateRequire(int $matchId): array
    {
        if ((int)$this->state[MatchStateFieldName::MATCH_ID] !== $matchId) {
            throw new RuntimeException('test match was not found');
        }

        return $this->state;
    }

    public function matchStateStore(array $matchState): void
    {
        $this->state = $matchState;
        $this->storeCount++;
    }

    public function storedState(): array
    {
        return $this->state;
    }

    public function storeCount(): int
    {
        return $this->storeCount;
    }
}

$assertionCount = 0;

function expectSame(mixed $expected, mixed $actual, string $message): void
{
    global $assertionCount;
    $assertionCount++;

    if ($expected !== $actual) {
        throw new RuntimeException($message . '; expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
}

function expectTrue(bool $condition, string $message): void
{
    expectSame(true, $condition, $message);
}

function expectThrows(callable $callback, string $message): void
{
    global $assertionCount;
    $assertionCount++;

    try {
        $callback();
    } catch (Throwable) {
        return;
    }

    throw new RuntimeException($message . '; expected an exception');
}

function matchStateFixture(int $startedAtMs, int $timerTotalMs, int $status = MatchStatusValue::ACTIVE): array
{
    return [
        MatchStateFieldName::MATCH_ID => 731,
        MatchStateFieldName::STATUS => $status,
        MatchStateFieldName::STATE_VERSION => 8,
        MatchStateFieldName::DIFFICULTY => 'medium',
        MatchStateFieldName::TIMER_TOTAL_MS => $timerTotalMs,
        MatchStateFieldName::STARTED_AT_MS => $startedAtMs,
        MatchStateFieldName::TIMER_REMAINING_MS => $timerTotalMs,
        MatchStateFieldName::COURIER => [
            MatchStateFieldName::USER_ID => 41,
            MatchStateFieldName::USERNAME => 'rider',
            MatchStateFieldName::LIVES => 2,
        ],
        MatchStateFieldName::SABOTEUR => [
            MatchStateFieldName::USER_ID => 42,
            MatchStateFieldName::USERNAME => 'blocker',
            MatchStateFieldName::ENERGY_CURRENT => 35,
            MatchStateFieldName::ENERGY_MAX => 100,
            MatchStateFieldName::ENERGY_SPENT => 65,
            MatchStateFieldName::ACTIVE_HURDLE_COUNT => 1,
        ],
        MatchStateFieldName::DRAW_OFFER => null,
        'deliveryProgressPct' => 120,
    ];
}

function authContextFor(int $userId): AuthContext
{
    return new AuthContext($userId, 'test-user', null, false, 'test-session', 'test-token', 'csrf-hash');
}

function poll(array $state, int $userId, int $knownVersion): array
{
    $stateService = new InMemoryMatchStateService($state);
    $pollingService = new PollingStateService($stateService);

    return [$pollingService->matchStateGet(authContextFor($userId), 731, $knownVersion), $stateService];
}

// Current state projection remains compatible and timer-only changes do not advance game version.
$startedAtMs = (int)floor(microtime(true) * 1000) - 1000;
[$sameVersionPayload] = poll(matchStateFixture($startedAtMs, 300000), 41, 8);
expectSame(8, $sameVersionPayload[MatchStateFieldName::STATE_VERSION], 'same-version poll keeps the state version');
expectSame(false, $sameVersionPayload['hasChanges'], 'same-version poll reports no gameplay changes');
expectSame(RoleValue::COURIER, $sameVersionPayload['assignedRole'], 'courier participant receives courier role');
expectSame(RoleValue::SABOTEUR, $sameVersionPayload['opponentRole'], 'courier participant sees saboteur opponent');
expectSame(2, $sameVersionPayload['courierLivesRemaining'], 'poll projects courier lives for HUD');
expectSame(35, $sameVersionPayload['obstacleEnergyRemaining'], 'poll projects saboteur energy for HUD');
expectSame(100, $sameVersionPayload['deliveryProgressPct'], 'poll clamps delivery progress to its public range');
expectSame('rider', $sameVersionPayload['courierName'], 'poll projects the courier display name');
expectTrue($sameVersionPayload[MatchStateFieldName::TIMER_REMAINING_MS] <= 299000, 'active timer ticks down during polling');
expectTrue($sameVersionPayload[MatchStateFieldName::TIMER_REMAINING_MS] > 0, 'active timer stays positive before expiry');

[$changedVersionPayload] = poll(matchStateFixture($startedAtMs, 300000), 42, 7);
expectSame(true, $changedVersionPayload['hasChanges'], 'older client version reports a state update');
expectSame(RoleValue::SABOTEUR, $changedVersionPayload['assignedRole'], 'saboteur participant receives saboteur role');

// Polling an expired match writes a terminal version so both clients navigate to results.
$expiredState = matchStateFixture((int)floor(microtime(true) * 1000) - 1000, 100);
[$expiredPayload, $expiredStateService] = poll($expiredState, 41, 8);
expectSame(MatchStatusValue::COMPLETED, $expiredPayload[MatchStateFieldName::STATUS], 'expired timer ends the match');
expectSame(RoleValue::SABOTEUR, $expiredPayload[MatchStateFieldName::WINNER_ROLE], 'saboteur wins by timeout');
expectSame(MatchEndReasonValue::TIMER_EXPIRED, $expiredPayload[MatchStateFieldName::END_REASON], 'timeout reason is returned');
expectSame(0, $expiredPayload[MatchStateFieldName::TIMER_REMAINING_MS], 'expired timer is clamped at zero');
expectSame(9, $expiredPayload[MatchStateFieldName::STATE_VERSION], 'timeout advances the state version');
expectSame(true, $expiredPayload['hasChanges'], 'timeout is visible as a state change');
expectSame(1, $expiredStateService->storeCount(), 'timeout is persisted once');
expectSame(MatchStatusValue::COMPLETED, $expiredStateService->storedState()[MatchStateFieldName::STATUS], 'persisted match is terminal');

$pollingService = new PollingStateService($expiredStateService);
$secondTimeoutPoll = $pollingService->matchStateGet(authContextFor(42), 731, 9);
expectSame(9, $secondTimeoutPoll[MatchStateFieldName::STATE_VERSION], 'repeated polls do not increment a completed match');
expectSame(false, $secondTimeoutPoll['hasChanges'], 'both players converge on the final version');
expectSame(1, $expiredStateService->storeCount(), 'repeated polls do not rewrite timeout state');

$resultService = new ResultService($expiredStateService);
$timeoutResult = $resultService->resultGet(authContextFor(41), 731);
expectSame(RoleValue::SABOTEUR, $timeoutResult['winnerRole'], 'completed timeout can be retrieved by the result endpoint');
expectSame(MatchEndReasonValue::TIMER_EXPIRED, $timeoutResult['endReason'], 'result endpoint preserves timeout reason');
expectSame(0, $timeoutResult['timeRemainingMs'], 'result endpoint reports zero time after timeout');

// Waiting matches retain their full timer until the second player starts them.
$waitingState = matchStateFixture(0, 5000, MatchStatusValue::WAITING);
$waitingState[MatchStateFieldName::STARTED_AT_MS] = null;
[$waitingPayload, $waitingStateService] = poll($waitingState, 41, 8);
expectSame(MatchStatusValue::WAITING, $waitingPayload[MatchStateFieldName::STATUS], 'waiting match does not expire');
expectSame(5000, $waitingPayload[MatchStateFieldName::TIMER_REMAINING_MS], 'waiting match keeps full timer');
expectSame(0, $waitingStateService->storeCount(), 'waiting poll does not write match state');

// Request validation matches the frontend query parameter and rejects malformed versions.
$validator = new MatchRequestValidator();
expectSame(['knownVersion' => 0], $validator->statePollValidate([]), 'first poll defaults to version zero');
expectSame(['knownVersion' => 17], $validator->statePollValidate(['knownVersion' => '17']), 'poll accepts the knownVersion query string');
expectThrows(fn() => $validator->statePollValidate(['knownVersion' => '17x']), 'poll rejects malformed version values');
expectThrows(fn() => $validator->statePollValidate(['knownVersion' => '4294967296']), 'poll rejects versions beyond the API range');
expectThrows(fn() => poll(matchStateFixture($startedAtMs, 300000), 99, 8), 'poll rejects users outside the match');

fwrite(STDOUT, 'PASS ' . $assertionCount . " backend polling assertions\n");
