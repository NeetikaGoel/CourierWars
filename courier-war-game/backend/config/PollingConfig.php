<?php
declare(strict_types=1);

class PollingConfig // this class stores polling values that can be tuned after testing
{
    public const ACTIVE_MATCH_POLL_INTERVAL_INDEX = 0;
    public const WAITING_MATCH_POLL_INTERVAL_INDEX = 1;
    public const READY_MATCH_POLL_INTERVAL_INDEX = 2;
    public const ENDED_MATCH_POLL_INTERVAL_INDEX = 3; // before result screen loads
    public const INACTIVE_TAB_POLL_INTERVAL_INDEX = 4; // slower polling when browser tab is inactive
    public const POLL_KNOWN_VERSION_DEFAULT = 0; // default known version for first poll

    //array = [500,1000,750,1000,5000]
    public const POLL_INTERVAL_MS_LIST = [500,1000,750,1000,5000];

    //now functions for returning polling intervals for diff match states

    public static function activeMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[self::ACTIVE_MATCH_POLL_INTERVAL_INDEX];
    }

    public static function waitingMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[self::WAITING_MATCH_POLL_INTERVAL_INDEX];
    }

    public static function readyMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[self::READY_MATCH_POLL_INTERVAL_INDEX];
    }

    public static function endedMatchPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[self::ENDED_MATCH_POLL_INTERVAL_INDEX];
    }

    public static function inactiveTabPollIntervalMs(): int
    {
        return self::POLL_INTERVAL_MS_LIST[self::INACTIVE_TAB_POLL_INTERVAL_INDEX];
    }

    public static function defaultKnownVersion(): int
    {
        return self::POLL_KNOWN_VERSION_DEFAULT;
    }
}
