<?php
declare(strict_types=1);

//Importing app for time constants
require_once __DIR__ . '/../config/AppConfig.php';
require_once __DIR__ . '/../constants/TimeValue.php';

//refactoring for time logic
class Clock
{
    //this will return current unix time in sec
    public static function unixSeconds(): int
    {
        return time();
    }

    //this will return current unix time in millisec
    public static function unixMilliseconds(): int
    {
        return (int)floor(microtime(true) * TimeValue::MILLISECONDS_PER_SECOND);
    }

    //now for current utc time for api responses and logs
    public static function isoUtcNow(): string
    {
        $now = new DateTimeImmutable('now', new DateTimeZone(AppConfig::DEFAULT_TIMEZONE));
        return $now->format(AppConfig::DEFAULT_TIME_FORMAT);
    }
}
