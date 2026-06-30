<?php

declare(strict_types=1);

require_once __DIR__ . '/../constants/MatchStatusValue.php';

class MatchConfig
{
    public const MATCH_ID_MIN = 1; // smallest accepted match id

    public const MATCH_ID_MAX = 2147483647; // biggest generated match id for this phase

    public const MATCH_ID_RANDOM_RETRY_MAX = 8; // retry count when random match id collides in cache

    public const STATE_VERSION_INITIAL = 1; // first state version for a new match

    public const STATE_VERSION_STEP = 1; // version increase after accepted state change

    public const STATE_VERSION_MIN = 0; // lowest accepted client known state version

    public const STATE_VERSION_MAX = 4294967295; // highest accepted client known state version

    public const COURIER_LIVES_START = 3; // courier starts with three lives

    public const DELIVERY_PROGRESS_MIN = 0; // lowest delivery progress percent

    public const DELIVERY_PROGRESS_MAX = 100; // highest delivery progress percent

    public const CLIENT_ACTION_ID_LENGTH_MIN = 8; // shortest safe client action id

    public const CLIENT_ACTION_ID_LENGTH_MAX = 64; // longest safe client action id

    public const CLIENT_ACTION_ID_REGEX = '/^[A-Za-z0-9._:-]+$/'; // allowed characters for client action id

    public const REQUESTED_DURATION_MS_MIN = 1000; // shortest optional hurdle duration accepted by validator

    public const REQUESTED_DURATION_MS_MAX = 60000; // longest optional hurdle duration accepted by validator

    public const TIMER_REMAINING_MIN_MS = 0; // timer response must not go below zero
    public const DRAW_OFFER_TTL_MS = 30000; // draw offer waits thirty seconds for opponent response

    public static function initialStateVersion(): int
    {
        return self::STATE_VERSION_INITIAL; // returns first version for new match state
    }

    public static function nextStateVersion(int $stateVersion): int
    {
        return $stateVersion + self::STATE_VERSION_STEP; // increments version after accepted action
    }

    public static function matchStatusIsEnded(int $matchStatus): bool
    {
        return in_array(
            $matchStatus,
            [MatchStatusValue::COMPLETED, MatchStatusValue::DRAW],
            true
        ); // checks whether match should stop gameplay actions
    }

    public static function deliveryProgressClamp(int $deliveryProgressPct): int
    {
        return max(
            self::DELIVERY_PROGRESS_MIN,
            min(self::DELIVERY_PROGRESS_MAX, $deliveryProgressPct)
        ); // keeps progress safe for frontend and database
    }

    public static function timerRemainingClamp(int $timerRemainingMs): int
    {
        return max(self::TIMER_REMAINING_MIN_MS, $timerRemainingMs); // keeps timer safe for response payload
    }

    public static function clientActionIdLooksValid(string $clientActionId): bool
    {
        if (strlen($clientActionId) < self::CLIENT_ACTION_ID_LENGTH_MIN) {
            return false; // rejects ids that are too short
        }

        if (strlen($clientActionId) > self::CLIENT_ACTION_ID_LENGTH_MAX) {
            return false; // rejects ids that are too long
        }

        return preg_match(self::CLIENT_ACTION_ID_REGEX, $clientActionId) === 1; // rejects unsafe characters
    }
}
