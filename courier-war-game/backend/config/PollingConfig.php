<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/MatchStatusValue.php';

class PollingConfig // this class stores polling values that can be tuned after testing
{
    public const POLL_KNOWN_VERSION_DEFAULT = 0; // default known version for first poll
    public const INACTIVE_TAB_POLL_INTERVAL_MS = 5000; // slower polling when browser tab is inactive

    //array indexes directly use MatchStatusValue values
    //0 waiting, 1 ready, 2 active, 3 completed, 4 draw
    //array = [1000,750,500,1000,1000]
    public const POLL_INTERVAL_MS_LIST = [1000, 750, 500, 1000, 1000];

    //now functions for returning polling intervals for diff match states

    public static function activeMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[MatchStatusValue::ACTIVE];
    }

    public static function waitingMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[MatchStatusValue::WAITING];
    }

    public static function readyMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[MatchStatusValue::READY];
    }

    public static function endedMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[MatchStatusValue::COMPLETED];
    }

    public static function drawMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[MatchStatusValue::DRAW];
    }

    public static function inactiveTabPollIntervalMs(): int
    {
        return self::INACTIVE_TAB_POLL_INTERVAL_MS;
    }

    public static function matchStatusPollIntervalMs(int $matchStatus): int
    {
        return self::POLL_INTERVAL_MS_LIST[$matchStatus] ?? self::waitingMatchPollIntervalMs();
    }

    public static function defaultKnownVersion(): int
    {
        return self::POLL_KNOWN_VERSION_DEFAULT;
    }
}
