<?php

declare(strict_types=1);

class AuditLoggerUtilities
{
    // Audit logger for admin cache api
    public static function adminCacheAuditLog(string $action, array $context): void
    {
        Logger::logInfo('AdminCacheController', $action, $context);
    }

    //Audit logger for normal cache api
    public static function cacheAuditLog(string $action, array $context): void
    {
        Logger::logInfo('CacheController', $action, $context);
    }
}