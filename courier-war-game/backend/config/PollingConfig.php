<?php 
declare(strict_types=1);

class PollingConfig // this class stores polling values that can be tuned after testing
{
    public const ACTIVE_MATCH_POLL_INTERVAL_MS = 0; 
    public const WAITING_MATCH_POLL_INTERVAL_MS = 1;
    public const READY_MATCH_POLL_INTERVAL_MS = 2; 
    public const ENDED_MATCH_POLL_INTERVAL_MS = 1000; // before result screen loads
    public const INACTIVE_TAB_POLL_INTERVAL_MS = 5000; // slower polling when browser tab is inactive
    public const POLL_KNOWN_VERSION_DEFAULT = 0; // default known version for first poll

    //now functions for returning polling intervals for diff match states

    //array = [500,1000,750,1000,5000]
    public static function activeMatchPollIntervalMs(): int
    {
        return self::ACTIVE_MATCH_POLL_INTERVAL_MS;
    }

    public static function waitingMatchPollIntervalMs(): int
    {
        return self::WAITING_MATCH_POLL_INTERVAL_MS;
    }

    public static function readyMatchPollIntervalMs(): int
    {
        return self::READY_MATCH_POLL_INTERVAL_MS;
    }

    public static function endedMatchPollIntervalMs(): int
    {
        return self::ENDED_MATCH_POLL_INTERVAL_MS;
    }

    public static function inactiveTabPollIntervalMs(): int
    {
        return self::INACTIVE_TAB_POLL_INTERVAL_MS;
    }

    public static function defaultKnownVersion(): int
    {
        return self::POLL_KNOWN_VERSION_DEFAULT;
    }
}
