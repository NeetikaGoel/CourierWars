
CLIENT
(Postman / curl / frontend / internal app)
    |
    |
    v

PHP BUILT-IN SERVER
php -S 127.0.0.1:8080 server.php
    |
    |
    v

server.php
    |
    |---- creates Request object
    |         using:
    |         Request::createRequestFromGlobals()
    |
    |---- creates Application object
    |         new Application(__DIR__)
    |
    |---- sends Request to Application
    |
    v

Application.php
    |
    |---- loads bootstrap.json
    |         using BootstrapLoader
    |
    |---- creates CacheService
    |
    |---- preload bootstrap cache items
    |
    |---- loads auth.php
    |
    |---- creates AuthService
    |
    |---- creates ResponseFactory
    |
    |---- creates CacheController
    |
    |---- creates AdminCacheController
    |
    |---- calls router
    |
    v

router.php
    |
    |---- authenticate request
    |         AuthService->authenticate()
    |
    |---- if auth fails
    |         return 401
    |
    |---- authorize request
    |         AuthService->authorize()
    |
    |---- if role fails
    |         return 403
    |
    |---- match route path
    |
    |---- calls controller method
    |
    v

CacheController.php
OR
AdminCacheController.php
    |
    |---- validate method
    |
    |---- validate JSON
    |
    |---- validate params/body/query
    |
    |---- sanitize values
    |
    |---- rate-limit check
    |
    |---- idempotency check
    |
    |---- audit logging
    |
    |---- delegate business logic
    |
    v

CacheService.php
    |
    |---- validate key/value/ttl
    |
    |---- set/get/delete/list/purge
    |
    |---- cleanup expired items
    |
    |---- create/update CacheItem
    |
    v

CacheItem.php
    |
    |---- stores:
    |         key
    |         value
    |         ttl
    |         createdAt
    |         updatedAt
    |         expiresAt
    |
    |---- checks expiration
    |
    |---- converts to response array
    |
    v

CacheService.php
    |
    |---- returns result to controller
    |
    v

Controller
    |
    |---- creates success/error response
    |         using ResponseFactory
    |
    v

JsonResponse.php
    |
    |---- sets HTTP status code
    |
    |---- sets security headers
    |
    |---- converts array to JSON
    |
    |---- echoes response
    |
    v

CLIENT GETS RESPONSE

