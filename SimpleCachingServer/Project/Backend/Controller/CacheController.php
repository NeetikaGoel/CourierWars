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

class CacheController
{
    //we need cache service obj
    private CacheService $_cacheService;

    //also a response factory obj
    private ResponseFactory $_responseFactory;


    public function __construct(CacheService $_cacheService, ResponseFactory $_responseFactory)
    {
        $this->_cacheService = $_cacheService;
        $this->_responseFactory = $_responseFactory;
    }

    //Boundary function for POST /v1/cache/set.
    public function set(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodPost($request);
        } catch (InvalidArgumentException $exception) {
            //Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'CACHE-4051', $exception->getMessage(), [], 405);
        }

        try {
            ValidationUtilities::validateJson($request);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_set_invalid_json', []);

            //return 400
            return $this->_responseFactory->error('Validation failed', 'CACHE-4001', $exception->getMessage(), [], 400);
        }

        //get key from request body
        $key = $request->getBodyField('key');

        //get value now
        $value = $request->getBodyField('value');

        //Get ttl now
        $ttl = $request->getBodyField('ttl');

        try {
            ValidationUtilities::validateKey($key);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_set_validation_failed', ['reason' => 'key missing or invalid']);

            //return 400
            return $this->_responseFactory->error('Validation failed', 'CACHE-4002', $exception->getMessage(), ['key' => 'required string'], 400);
        }

        try {
            //sanitize key now
            $key = SanitizationUtilities::sanitizeKey($key);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_set_validation_failed', ['reason' => 'key format invalid']);

            //return 400
            return $this->_responseFactory->error('Validation failed', 'CACHE-4006', $exception->getMessage(), ['key' => 'invalid format'], 400);
        }

        try {
            ValidationUtilities::validateValue($value, array_key_exists('value', $request->getBody()));
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_set_validation_failed', ['reason' => 'value invalid', 'key' => $key]);

            //return 400
            return $this->_responseFactory->error('Validation failed', 'CACHE-4003', $exception->getMessage(), ['value' => 'required and max 1024 chars if string'], 400);
        }

        try {
            ValidationUtilities::validateTtl($ttl);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_set_validation_failed', ['reason' => 'ttl invalid', 'key' => $key]);
            return $this->_responseFactory->error('Validation failed', 'CACHE-4004', $exception->getMessage(), ['ttl' => 'integer between 1 and 604800'], 400);
        }

        //rate-limit placeholder
        if (RateLimitUtilities::cacheSetRateLimitCheck($request) !== true) {

            AuditLoggerUtilities::cacheAuditLog('cache_set_rate_limit_failed', ['key' => $key]);
            return $this->_responseFactory->error('Rate limit exceeded', 'CACHE-4291', 'Too many requests', [], 429);
        }

        //idempotency placeholder
        if (IdempotencyUtilities::cacheSetIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::cacheAuditLog('cache_set_idempotency_failed', ['key' => $key]);
            return $this->_responseFactory->error('Duplicate request', 'CACHE-4091', 'Duplicate request detected', [], 409);
        }

        //WE DONT NEED TRY CATCH WITH INTERNAL SERVICES!!!!
        //delegation now
        $item = $this->_cacheService->set($key, $value, $ttl);

        //audit success!!!!!!!
        AuditLoggerUtilities::cacheAuditLog('cache_set_success', ['key' => $key]);
        return $this->_responseFactory->success('Cache item stored', $item->toArray(), 200);
    }

    //Boundary function for GET /v1/cache/get
    public function get(Request $request): JsonResponse
    {
        try {
            ValidationUtilities::validateMethodGet($request);
        } catch (InvalidArgumentException $exception) {
            //Return 405 if wrong method
            return $this->_responseFactory->error('Method not allowed', 'CACHE-4052', $exception->getMessage(), [], 405);
        }

        //Get key from query params
        $key = $request->getQueryParam('key');

        try {
            ValidationUtilities::validateKey($key);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_get_validation_failed', ['reason' => 'key missing or invalid']);
            return $this->_responseFactory->error('Validation failed', 'CACHE-4006', $exception->getMessage(), ['key' => 'required string'], 400);
        }

        try {
            $key = SanitizationUtilities::sanitizeKey($key);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_get_validation_failed', ['reason' => 'key format invalid']);
            return $this->_responseFactory->error('Validation failed', 'CACHE-4007', $exception->getMessage(), ['key' => 'invalid format'], 400);
        }

        //rate-limit placeholder
        if (RateLimitUtilities::cacheGetRateLimitCheck($request) !== true) {
            AuditLoggerUtilities::cacheAuditLog('cache_get_rate_limit_failed', ['key' => $key]);
            return $this->_responseFactory->error('Rate limit exceeded', 'CACHE-4292', 'Too many requests', [], 429);
        }

        //idempotency placeholder
        if (IdempotencyUtilities::cacheGetIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::cacheAuditLog('cache_get_idempotency_failed', ['key' => $key]);
            return $this->_responseFactory->error('Duplicate request', 'CACHE-4092', 'Duplicate request detected', [], 409);
        }

        //delegation now
        $item = $this->_cacheService->get($key);

        //if missing or expired
        if ($item === null) {
            AuditLoggerUtilities::cacheAuditLog('cache_get_not_found', ['key' => $key]);
            return $this->_responseFactory->error('Cache item not found', 'CACHE-4041', 'Key not found or expired', [], 404);
        }

        //audit success!!!!!!!
        AuditLoggerUtilities::cacheAuditLog('cache_get_success', ['key' => $key]);

        //return found item
        return $this->_responseFactory->success('Cache item retrieved', $item->toArray(), 200);
    }

    //Boundary function for POST or DELETE /v1/cache/delete.
    public function delete(Request $request): JsonResponse
    {
        ///need to be updated now coz failures there
        try {
            ///direct method if , lets see
            $method = $request->getMethod();

            if ($method !== 'POST' && $method !== 'DELETE') 
            {
                throw new InvalidArgumentException('POST or DELETE method required');
            }
        } 
        
        catch (InvalidArgumentException $exception) 
        {
            return $this->_responseFactory->error('Method not allowed', 'CACHE-4053', $exception->getMessage(), [], 405);
        }

        try {
            ValidationUtilities::validateJson($request);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_delete_invalid_json', []);

            //return 400
            return $this->_responseFactory->error('Validation failed', 'CACHE-4008', $exception->getMessage(), [], 400);
        }

        //get key from body
        $key = $request->getBodyField('key');

        try {
            ValidationUtilities::validateKey($key);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_delete_validation_failed', ['reason' => 'key missing or invalid']);

            //return 400
            return $this->_responseFactory->error('Validation failed', 'CACHE-4009', $exception->getMessage(), ['key' => 'required string'], 400);
        }

        try {
            SanitizationUtilities::sanitizeKey($key);
        } catch (InvalidArgumentException $exception) {
            AuditLoggerUtilities::cacheAuditLog('cache_delete_validation_failed', ['reason' => 'key format invalid']);

            //return 400
            return $this->_responseFactory->error('Validation failed', 'CACHE-4010', $exception->getMessage(), ['key' => 'invalid format'], 400);
        }

        //rate-limit placeholder
        if (RateLimitUtilities::cacheDeleteRateLimitCheck($request) !== true) {
            AuditLoggerUtilities::cacheAuditLog('cache_delete_rate_limit_failed', ['key' => $key]);
            return $this->_responseFactory->error('Rate limit exceeded', 'CACHE-4293', 'Too many requests', [], 429);
        }

        //idempotency placeholder
        if (IdempotencyUtilities::cacheDeleteIdempotencyCheck($request) !== true) {
            AuditLoggerUtilities::cacheAuditLog('cache_delete_idempotency_failed', ['key' => $key]);
            return $this->_responseFactory->error('Duplicate request', 'CACHE-4093', 'Duplicate request detected', [], 409);
        }

        //delegation now
        $deleteResult = $this->_cacheService->delete($key);

        //audit success!!!!!!!
        AuditLoggerUtilities::cacheAuditLog('cache_delete_success', ['key' => $key, 'deleted' => $deleteResult['deleted']]);

        //return success even if key was missing
        return $this->_responseFactory->success('Cache delete completed', [
            'key' => $key,
            'value' => $deleteResult['value'],
            'deleted' => $deleteResult['deleted']
        ], 200);
    }
}
