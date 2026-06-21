<?php

declare(strict_types=1);

require_once __DIR__ . '/../Http/Request.php';
require_once __DIR__ . '/../Http/ResponseFactory.php'; //controller returns standard success/error responses
require_once __DIR__ . '/../src/Cache/CacheService.php'; //controller delegates cache work to service
require_once __DIR__ . '/../Logging/Logger.php';
require_once __DIR__ . '/../Utility/IdempotencyUtilities.php'; //for idempotency check placeholders
require_once __DIR__ . '/../Utility/RateLimitUtilities.php'; //for rate-limit check placeholders
require_once __DIR__ . '/../Utility/ValidationUtilities.php'; //for validation helper functions
require_once __DIR__ . '/../Utility/AuditLoggerUtilities.php';
require_once __DIR__ . '/../Utility/SanitizationUtilities.php'; //for sanitization helper functions
require_once __DIR__ . '/../config/constants.php'; //for cache related constants

class AdminCacheMetricsController
{
    //we need cache service obj
    private CacheService $_cacheService;

    // also a response factory obj
    private ResponseFactory $_responseFactory;

    public function __construct(CacheService $_cacheService, ResponseFactory $_responseFactory)
    {
        $this->_cacheService = $_cacheService;
        $this->_responseFactory = $_responseFactory;
    }

    // Boundary function for GET /v1/admin/cache/uptime
    public function uptime(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodGet($request);
        } catch (InvalidArgumentException $exception) {
            // Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'ADMIN-CACHE-4055', $exception->getMessage(), [], 405);
        }

        // rate-limit placeholder
        if (RateLimitUtilities::adminCacheRateLimitCheck($request) !== true) {

            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_uptime_rate_limit_failed', []);
            return $this->_responseFactory->error('Rate limit exceeded', 'ADMIN-CACHE-4295', 'Too many requests', [], 429);
        }

        // idempotency placeholder
        if (IdempotencyUtilities::adminCacheIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_uptime_idempotency_failed', []);
            return $this->_responseFactory->error('Duplicate request', 'ADMIN-CACHE-4095', 'Duplicate request detected', [], 409);
        }

        // delegation now
        $data = $this->_cacheService->uptime();
        // audit success!!!!!!!
        AuditLoggerUtilities::adminCacheAuditLog('admin_cache_uptime_success', []);
        // return final result
        return $this->_responseFactory->success('Cache server uptime fetched', $data, 200);
    }

    // Boundary function for GET /v1/admin/cache/size
    public function size(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodGet($request);
        } catch (InvalidArgumentException $exception) {
            // Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'ADMIN-CACHE-4056', $exception->getMessage(), [], 405);
        }

        // rate-limit placeholder
        if (RateLimitUtilities::adminCacheRateLimitCheck($request) !== true) {

            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_size_rate_limit_failed', []);
            return $this->_responseFactory->error('Rate limit exceeded', 'ADMIN-CACHE-4296', 'Too many requests', [], 429);
        }

        // idempotency placeholder
        if (IdempotencyUtilities::adminCacheIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_size_idempotency_failed', []);
            return $this->_responseFactory->error('Duplicate request', 'ADMIN-CACHE-4096', 'Duplicate request detected', [], 409);
        }

        // delegation now
        $data = $this->_cacheService->size();
        // audit success!!!!!!!
        AuditLoggerUtilities::adminCacheAuditLog('admin_cache_size_success', []);
        // return final result
        return $this->_responseFactory->success('Cache size fetched', $data, 200);
    }

    // Boundary function for GET /v1/admin/cache/health
    public function health(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodGet($request);
        } catch (InvalidArgumentException $exception) {
            // Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'ADMIN-CACHE-4057', $exception->getMessage(), [], 405);
        }

        // rate-limit placeholder
        if (RateLimitUtilities::adminCacheRateLimitCheck($request) !== true) {

            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_health_rate_limit_failed', []);
            return $this->_responseFactory->error('Rate limit exceeded', 'ADMIN-CACHE-4297', 'Too many requests', [], 429);
        }

        // idempotency placeholder
        if (IdempotencyUtilities::adminCacheIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_health_idempotency_failed', []);
            return $this->_responseFactory->error('Duplicate request', 'ADMIN-CACHE-4097', 'Duplicate request detected', [], 409);
        }

        // delegation now
        $data = $this->_cacheService->health();
        // audit success!!!!!!!
        AuditLoggerUtilities::adminCacheAuditLog('admin_cache_health_success', []);
        // return final result
        return $this->_responseFactory->success('Cache server health fetched', $data, 200);
    }
}