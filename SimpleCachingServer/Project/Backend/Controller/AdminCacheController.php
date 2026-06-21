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

class AdminCacheController
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

    // Boundary function for POST /v1/admin/cache/bulk-set
    public function bulkSet(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodPost($request);
        } catch (InvalidArgumentException $exception) {
            // Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'ADMIN-CACHE-4051', $exception->getMessage(), [], 405);
        }

        try {
            ValidationUtilities::validateJson($request);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_bulk_set_invalid_json', []);
            // return 400
            return $this->_responseFactory->error('Validation failed', 'ADMIN-CACHE-4001', $exception->getMessage(), [], 400);
        }

        // get items from request body
        $items = $request->getBodyField('items');

        try {
            ValidationUtilities::validateItemsArray($items);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_bulk_set_validation_failed', ['reason' => 'items missing or invalid']);
            // return 400
            return $this->_responseFactory->error('Validation failed', 'ADMIN-CACHE-4002', $exception->getMessage(), ['items' => 'array required'], 400);
        }

        // rate-limit placeholder
        if (RateLimitUtilities::adminCacheRateLimitCheck($request) !== true) {

            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_bulk_set_rate_limit_failed', []);
            return $this->_responseFactory->error('Rate limit exceeded', 'ADMIN-CACHE-4291', 'Too many requests', [], 429);
        }

        // idempotency placeholder
        if (IdempotencyUtilities::adminCacheIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_bulk_set_idempotency_failed', []);
            return $this->_responseFactory->error('Duplicate request', 'ADMIN-CACHE-4091', 'Duplicate request detected', [], 409);
        }

        //total number of items requested
        $requested = count($items);
        //count of items stored successfully
        $stored = 0;
        //count of skipped items hehe
        $skipped = 0;
        //successful item result list
        $itemResults = [];
        //failed item result list
        $itemErrors = [];

        //loop over all submitted items now
        foreach ($items as $index => $item) {
            try {
                ValidationUtilities::validateItemArray($item);
            } catch (InvalidArgumentException $exception) {
                $skipped++;
                $itemErrors[] = ['index' => $index, 'message' => 'Item must be an array!!'];
                continue;
            }

            //get key from item
            $key = $item['key'] ?? null;
            //check value exists because value itself can be null
            $hasValue = array_key_exists('value', $item);
            //get value now
            $value = $hasValue ? $item['value'] : null;
            //get ttl now
            $ttl = $item['ttl'] ?? null;

            try {
                ValidationUtilities::validateKey($key);
            } catch (InvalidArgumentException $exception) {
                $skipped++;
                $itemErrors[] = ['index' => $index, 'message' => $exception->getMessage()];
                continue;
            }

            try {
                SanitizationUtilities::sanitizeKey($key);
            } catch (InvalidArgumentException $exception) {
                $skipped++;
                $itemErrors[] = ['index' => $index, 'key' => is_string($key) ? $key : null, 'message' => $exception->getMessage()];
                continue;
            }

            try {
                ValidationUtilities::validateValue($value, $hasValue);
            } catch (InvalidArgumentException $exception) {
                $skipped++;
                $itemErrors[] = ['index' => $index, 'key' => $key, 'message' => $exception->getMessage()];
                continue;
            }

            try {
                ValidationUtilities::validateTtl($ttl);
            } catch (InvalidArgumentException $exception) {
                $skipped++;
                $itemErrors[] = ['index' => $index, 'key' => $key, 'message' => $exception->getMessage()];
                continue;
            }

            //delegation now
            $storedItem = $this->_cacheService->set($key, $value, $ttl);
            //increasing stored count
            $stored++;
            //adding stored item in final list
            $itemResults[] = $storedItem->toArray();
        }

        // audit success!!!!!!!
        AuditLoggerUtilities::adminCacheAuditLog('admin_cache_bulk_set_completed', ['requested' => $requested, 'stored' => $stored, 'skipped' => $skipped]);

        // return final result
        return $this->_responseFactory->success('Bulk set completed', [
            'requested' => $requested,
            'stored' => $stored,
            'skipped' => $skipped,
            'items' => $itemResults,
            'errors' => $itemErrors
        ], 200);
    }

    // Boundary function for POST /v1/admin/cache/purge-selected
    public function purgeSelected(Request $request): JsonResponse
    {
        try {
            // Validate method
            ValidationUtilities::validateMethodPost($request);
        } catch (InvalidArgumentException $exception) {
            // Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'ADMIN-CACHE-4052', $exception->getMessage(), [], 405);
        }

        try {
            ValidationUtilities::validateJson($request);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_selected_invalid_json', []);
            // return 400
            return $this->_responseFactory->error('Validation failed', 'ADMIN-CACHE-4003', $exception->getMessage(), [], 400);
        }

        // get keys from request body
        $keys = $request->getBodyField('keys');

        try {
            ValidationUtilities::validateItemsArray($keys);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_selected_validation_failed', ['reason' => 'keys missing or invalid']);
            // return 400
            return $this->_responseFactory->error('Validation failed', 'ADMIN-CACHE-4004', $exception->getMessage(), ['keys' => 'array required'], 400);
        }

        // rate-limit placeholder
        if (RateLimitUtilities::adminCacheRateLimitCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_selected_rate_limit_failed', []);
            return $this->_responseFactory->error('Rate limit exceeded', 'ADMIN-CACHE-4292', 'Too many requests', [], 429);
        }

        // idempotency placeholder
        if (IdempotencyUtilities::adminCacheIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_selected_idempotency_failed', []);
            return $this->_responseFactory->error('Duplicate request', 'ADMIN-CACHE-4092', 'Duplicate request detected', [], 409);
        }

        //total requested keys
        $requested = count($keys);
        //count of removed keys
        $removed = 0;
        //count of keys not found
        $notFound = 0;
        //error list
        $errors = [];

        //loop over all keys now
        foreach ($keys as $index => $key) {
            try {
                ValidationUtilities::validateKey($key);
            } catch (InvalidArgumentException $exception) {
                $errors[] = ['index' => $index, 'message' => $exception->getMessage()];
                continue;
            }

            try {
                SanitizationUtilities::sanitizeKey($key);
            } catch (InvalidArgumentException $exception) {
                $errors[] = ['index' => $index, 'key' => is_string($key) ? $key : null, 'message' => $exception->getMessage()];
                continue;
            }

            // delegation now
            $deleteResult = $this->_cacheService->delete($key);
            // check if actually removed
            if ($deleteResult['deleted'] === true) {
                $removed++;
            } else {
                $notFound++;
            }
        }

        // audit success!!!!!!!
        AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_selected_completed', ['requested' => $requested, 'removed' => $removed, 'notFound' => $notFound]);

        // return final result
        return $this->_responseFactory->success('Selected cache keys purged', [
            'requested' => $requested,
            'removed' => $removed,
            'notFound' => $notFound,
            'errors' => $errors
        ], 200);
    }

    // Boundary function for POST /v1/admin/cache/purge-all
    public function purgeAll(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodPost($request);
        } catch (InvalidArgumentException $exception) {
            // Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'ADMIN-CACHE-4053', $exception->getMessage(), [], 405);
        }

        // rate-limit placeholder
        if (RateLimitUtilities::adminCacheRateLimitCheck($request) !== true) {

            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_all_rate_limit_failed', []);
            return $this->_responseFactory->error('Rate limit exceeded', 'ADMIN-CACHE-4293', 'Too many requests', [], 429);
        }

        // idempotency placeholder
        if (IdempotencyUtilities::adminCacheIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_all_idempotency_failed', []);
            return $this->_responseFactory->error('Duplicate request', 'ADMIN-CACHE-4093', 'Duplicate request detected', [], 409);
        }

        // delegation now
        $removed = $this->_cacheService->purgeAll();
        // audit success!!!!!!!
        AuditLoggerUtilities::adminCacheAuditLog('admin_cache_purge_all_completed', ['removed' => $removed]);
        // return final result
        return $this->_responseFactory->success('All cache items purged', ['removed' => $removed], 200);
    }

    // Boundary function for GET /v1/admin/cache/list
    public function list(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodGet($request);
        } catch (InvalidArgumentException $exception) {
            // Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'ADMIN-CACHE-4054', $exception->getMessage(), [], 405);
        }

        // get limit from query params
        $limitRaw = $request->getQueryParam('limit');
        // default limit
        $limit = CACHE_LIST_LIMIT_DEFAULT;

        try {
            $limit = ValidationUtilities::validateLimit($limitRaw);
        } catch (InvalidArgumentException $exception) {
            return $this->_responseFactory->error('Validation failed', 'ADMIN-CACHE-4005', $exception->getMessage(), ['limit' => 'numeric 1 to 1000'], 400);
        }

        // rate-limit placeholder
        if (RateLimitUtilities::adminCacheRateLimitCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_list_rate_limit_failed', []);
            return $this->_responseFactory->error('Rate limit exceeded', 'ADMIN-CACHE-4294', 'Too many requests', [], 429);
        }

        // idempotency placeholder
        if (IdempotencyUtilities::adminCacheIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::adminCacheAuditLog('admin_cache_list_idempotency_failed', []);
            return $this->_responseFactory->error('Duplicate request', 'ADMIN-CACHE-4094', 'Duplicate request detected', [], 409);
        }

        // delegation now
        $items = $this->_cacheService->list($limit);

        // audit success!!!!!!!
        AuditLoggerUtilities::adminCacheAuditLog('admin_cache_list_success', ['limit' => $limit, 'count' => count($items)]);

        // return final result
        return $this->_responseFactory->success('Cache items listed', [
            'count' => count($items),
            'limit' => $limit,
            'items' => $items
        ], 200);
    }
}
