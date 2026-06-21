CLIENT
(Postman / curl / frontend / internal app)
    |
    |
    v

LONG RUNNING PHP PROCESS
php server.php
    |
    |
    v

server.php
    |
    |---- starts socket server
    |         stream_socket_server()
    |
    |---- creates Application ONCE
    |
    |---- creates CacheService ONCE
    |
    |---- memory stays alive forever
    |
    |---- waits for incoming requests
    |
    |---- accepts raw HTTP request
    |
    |---- converts raw HTTP into Request object
    |         using:
    |         Request::createRequestFromRawHttp()
    |
    |---- sends Request to Application
    |
    v

Application.php
    |
    |---- loads bootstrap.json ONCE
    |
    |---- creates CacheService ONCE
    |
    |---- preload bootstrap cache items ONCE
    |
    |---- loads auth.php ONCE
    |
    |---- creates AuthService ONCE
    |
    |---- creates ResponseFactory ONCE
    |
    |---- creates CacheController ONCE
    |
    |---- creates AdminCacheController ONCE
    |
    |---- calls router
    |
    v

router.php
    |
    |---- authenticate request
    |
    |---- authorize request
    |
    |---- match route path
    |
    |---- call controller
    |
    v

Controller
    |
    |---- validate request
    |
    |---- sanitize input
    |
    |---- rate-limit check
    |
    |---- idempotency check
    |
    |---- delegate business logic
    |
    v

CacheService.php
    |
    |---- SAME MEMORY FOR ALL REQUESTS
    |
    |---- cache survives across requests
    |
    |---- set/get/delete/list/purge
    |
    |---- cleanup expired items
    |
    v

CacheItem.php
    |
    |---- stores cache entry metadata
    |
    v

Controller
    |
    |---- builds JsonResponse
    |
    v

JsonResponse.php
    |
    |---- converts response to HTTP JSON
    |
    v

CLIENT GETS RESPONSE




A socket server is a program that opens a network door and waits for client!!!

thats why used stream_socket_server , when curl sends a request, it is considered by php as raw text



How cache is being built

When server starts:

$application = new Application(__DIR__);

Inside Application:

loads bootstrap.json
creates CacheService
loads preload items into CacheService
creates controllers

So memory looks like:

Application
    └── CacheService
            └── $_cacheItemsMap
                    └── config.mode

Then when you call set:

POST /v1/cache/set

Flow:

server.php
→ Request object
→ Application
→ router
→ CacheController
→ CacheService->set()
→ $_cacheItemsMap["test.name"] = CacheItem

Now memory becomes:

$_cacheItemsMap
    ├── config.mode
    └── test.name

Then when you call get:

GET /v1/cache/get?key=test.name

Same running PHP process checks same array:

$_cacheItemsMap["test.name"]

and returns it.



\n = new line
\r = carriage return



Most HTTP messages use:

\r\n

to end each line.