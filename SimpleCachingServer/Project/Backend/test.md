Run tests

vendor/bin/phpunit


# 1. AuthServiceTest.php

Class under test:

AuthService

LETS DO FOR AUTH SERVICE FIRST
SO WHAT EXECUTION PATHS DO WE HAVE
LETS SEEEE::::::

For authenticate()::

1. Missing API key will return null
2. Empty API key will return null
3. Valid normal key will return normal
4. Valid admin key will return admin
5. Invalid key will return null

For authorize()::

1. Admin who is accessing admin route will return true
2. Admin who is accessing normal route will return true
3. Normal who is accessing normal route will return true
4. Normal who is accessing admin route will return false
5. Unknown role will return false


For running AuthServiceTest.php::: ./vendor/bin/phpunit tests/Unit/AuthServiceTest.php


Helper needed:

private function requestCreate(array $headers): Request


--> This helper creates fake requests with different headers!!

Assertions you need:

$this->assertNull($role);
$this->assertSame(Role::NORMAL, $role);
$this->assertSame(Role::ADMIN, $role);
$this->assertTrue($result);
$this->assertFalse($result);

---

# 2. RequestTest.php

Class under test:

Request

Need to test both:

constructor + getters
createRequestFromRawHttp()


Test paths:

1. constructor stores method path headers query body raw body invalid json flag
2. getMethod returns uppercase method
3. getHeader finds exact header name
4. getHeader finds header case-insensitively
5. getHeader returns null when header missing
6. getQueryParam returns value when present
7. getQueryParam returns null when missing
8. getBodyField returns value when present
9. getBodyField returns null when missing
10. createRequestFromRawHttp parses GET path correctly
11. createRequestFromRawHttp parses query params correctly
12. createRequestFromRawHttp parses headers correctly
13. createRequestFromRawHttp parses valid JSON body
14. createRequestFromRawHttp marks invalid JSON body
15. createRequestFromRawHttp uses / when path cannot be parsed

Example raw request strings:

$rawHttpRequest = "GET /v1/cache/get?key=test.name HTTP/1.1\r\nHost: 127.0.0.1\r\nX-API-Key: abc\r\n\r\n";

For POST:

$rawHttpRequest = "POST /v1/cache/set HTTP/1.1\r\nContent-Type: application/json\r\nX-API-Key: abc\r\nContent-Length: 37\r\n\r\n{\"key\":\"test.name\",\"value\":\"abc\"}";


For bad JSON:

$rawHttpRequest = "POST /v1/cache/set HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{\"key\":\"bad\",";

Assertions:

$this->assertSame('GET', $request->getMethod());
$this->assertSame('/v1/cache/get', $request->getPath());
$this->assertSame('test.name', $request->getQueryParam('key'));
$this->assertSame('abc', $request->getHeader('X-API-Key'));
$this->assertFalse($request->getHasInvalidJson());
$this->assertTrue($request->getHasInvalidJson());


---

# 3. ResponseFactoryTest.php

Class under test:

ResponseFactory


Test paths:

success()
1. creates JsonResponse
2. status code defaults to 200
3. body has success true
4. body has message
5. body has data

error()
6. creates JsonResponse
7. status code can be 400
8. body has success false
9. body has message
10. body has error.id
11. body has error.message
12. body has error.errors


Assertions:

php
$response = $factory->success('Done', ['key' => 'abc']);

$this->assertInstanceOf(JsonResponse::class, $response);
$this->assertSame(200, $response->getStatusCode());

$body = $response->getBody();

$this->assertTrue($body['success']);
$this->assertSame('Done', $body['message']);
$this->assertSame('abc', $body['data']['key']);


For error:

php
$response = $factory->error('Validation failed', 'CACHE-4001', 'Invalid key', ['key' => 'required'], 400);
$body = $response->getBody();

$this->assertFalse($body['success']);
$this->assertSame('CACHE-4001', $body['error']['id']);
$this->assertSame('Invalid key', $body['error']['message']);
$this->assertSame('required', $body['error']['errors']['key']);


---

# 4. CacheItemTest.php

Class under test:

CacheItem


Test paths:

constructor
1. stores key
2. stores value
3. stores ttl
4. sets createdAt
5. sets updatedAt
6. sets expiresAt

refresh()
7. updates value
8. updates ttl
9. updates updatedAt
10. updates expiresAt
11. keeps createdAt same

isExpired()
12. returns false before expiry
13. returns true after expiry

toArray()
14. returns key value ttl
15. returns createdAt updatedAt expiresAt formatted strings


Important tip:

For expiration test, use TTL `1`, then sleep for 1 second:

php
$item = new CacheItem('test.key', 'value', 1);

sleep(1);

$this->assertTrue($item->isExpired();


For non-expired:

php
$item = new CacheItem('test.key', 'value', 60);

$this->assertFalse($item->isExpired());


Assertions:

php
$this->assertSame('test.key', $item->getKey());
$this->assertSame('value', $item->getValue());
$this->assertSame(60, $item->getTtl());
$this->assertIsInt($item->getCreatedAt());
$this->assertIsArray($item->toArray());
$this->assertArrayHasKey('expiresAt', $item->toArray());


---

# 5. CacheServiceTest.php

Class under test:

CacheService

This is core business logic!!!

Test paths:

set()
1. set creates new item
2. set stores string value
3. set stores array value
4. set with ttl null uses default ttl
5. set same key overwrites value
6. set same key keeps createdAt same? currently CacheItem refresh keeps createdAt same

get()
7. get existing key returns CacheItem
8. get missing key returns null
9. get expired key returns null

delete()
10. delete existing key returns deleted true and old value
11. delete missing key returns deleted false and value null

purgeAll()
12. removes all items
13. returns removed count

list()
14. returns live items only
15. respects limit
16. removes expired items before listing

size()
17. returns itemCount
18. returns processMemoryBytes

uptime()
19. returns startedAt
20. returns uptimeSeconds

health()
21. returns status ok
22. returns itemCount
23. returns uptimeSeconds

Example checks:

php
$cacheService = new CacheService();

$item = $cacheService->set('test.key', 'abc', 60);

$this->assertSame('test.key', $item->getKey());
$this->assertSame('abc', $item->getValue());


Overwrite:

php
$cacheService->set('test.key', 'first', 60);
$item = $cacheService->set('test.key', 'second', 60);

$this->assertSame('second', $item->getValue());


Expired:

php
$cacheService->set('short.key', 'abc', 1);

sleep(1);

$item = $cacheService->get('short.key');

$this->assertNull($item);


List limit:

php
$cacheService->set('key.one', 'one', 60);
$cacheService->set('key.two', 'two', 60);

$items = $cacheService->list(1);

$this->assertCount(1, $items);


---

# 6. BootstrapLoaderTest.php

Class under test:

BootstrapLoader


This one touches files, so make temporary test files.

Helper you need:

php
private function tempBootstrapPathCreate(string $fileName): string


Maybe use:

php
sys_get_temp_dir()


Test paths:

1. missing bootstrap file creates default file
2. missing bootstrap returns loaded false
3. malformed JSON returns loaded false and errors
4. valid config returns loaded true
5. partially invalid config salvages valid values
6. valid preload items are returned
7. invalid preload item without key is skipped
8. invalid preload item without value is skipped
9. invalid preload item with invalid ttl is skipped
10. valid item without ttl returns ttl null


Example missing file path:

php
$filePath = sys_get_temp_dir() . '/bootstrap_missing_' . uniqid() . '.json';

$loader = new BootstrapLoader($filePath);
$result = $loader->load();

$this->assertFalse($result['loaded']);
$this->assertFileExists($filePath);


Example malformed JSON:

php
$filePath = sys_get_temp_dir() . '/bootstrap_bad_' . uniqid() . '.json';

file_put_contents($filePath, '{"config":');

$loader = new BootstrapLoader($filePath);
$result = $loader->load();

$this->assertFalse($result['loaded']);
$this->assertNotEmpty($result['errors']);


Example valid:

php
file_put_contents($filePath, json_encode([
    'config' => [
        'ttlDefault' => 100,
        'ttlMax' => 1000,
        'host' => '127.0.0.1',
        'port' => 8080,
        'logFile' => 'logs/test.log'
    ],
    'items' => [
        [
            'key' => 'config.mode',
            'value' => 'classic',
            'ttl' => 60
        ]
    ]
]));

$loader = new BootstrapLoader($filePath);
$result = $loader->load();

$this->assertTrue($result['loaded']);
$this->assertSame(100, $result['config']['ttlDefault']);
$this->assertCount(1, $result['items']);


---

# Controller tests later

Controller tests are important, but do them after small classes.

## CacheController execution paths

For `set()`:

1. wrong method returns 405
2. invalid JSON returns 400
3. missing key returns 400
4. non-string key returns 400
5. missing value returns 400
6. non-int ttl returns 400
7. successful set returns 200


For `get()`:

1. wrong method returns 405
2. missing key returns 400
3. non-string key returns 400
4. missing cache item returns 404
5. existing cache item returns 200


For `delete()`:

1. wrong method returns 405
2. invalid JSON returns 400
3. missing key returns 400
4. non-string key returns 400
5. existing key returns deleted true
6. missing key returns deleted false


## AdminCacheController execution paths

For `bulkSet()`:

1. wrong method returns 405
2. invalid JSON returns 400
3. items missing/not array returns 400
4. item is not object skipped
5. item missing key skipped
6. item missing value skipped
7. item invalid ttl skipped
8. valid items stored


For `purgeSelected()`:

1. wrong method returns 405
2. invalid JSON returns 400
3. keys missing/not array returns 400
4. invalid key skipped
5. existing key removed
6. missing key counted as notFound


For `purgeAll()`:

1. wrong method returns 405
2. success returns removed count


For `list()`:

1. wrong method returns 405
2. non-numeric limit returns 400
3. limit below 1 returns 400
4. limit above 1000 returns 400
5. success returns count limit items


For `uptime()`, `size()`, `health()`:

1. wrong method returns 405
2. success returns 200


---

# Order to write tests


1. AuthServiceTest -  simple
2. ResponseFactoryTest -  simple
3. CacheItemTest -  only 1 obj
4. CacheServiceTest -  main cache logic here
5. RequestTest -  raw http parsing testing
6. BootstrapLoaderTest -  files handling
7. CacheControllerTest -  simple normal user controller checks
8. AdminCacheControllerTest -  admin extra controller checks

---

# Commands to run!!!!

Run all:

bash
./vendor/bin/phpunit


Run one file:

bash
./vendor/bin/phpunit tests/Unit/AuthServiceTest.php


Run one method:

bash
./vendor/bin/phpunit --filter testAuthenticateWhenNormalApiKeyValidReturnsNormalRole


Run with test names readable:

bash
./vendor/bin/phpunit --testdox


Run with coverage:

bash
XDEBUG_MODE=coverage ./vendor/bin/phpunit --coverage


or with PCOV:

bash
php -d pcov.enabled=1 ./vendor/bin/phpunit --coverage


---



//left and why

RouterTest.php becoz router is pure function and easy to test
ApplicationTest.php as integration-ish becoz it loads real config and wires dependencies
LoggerTest.php only if required, becoz it writes actual files
JsonResponseTest.php only getters easily, but send() is harder becoz it sends headers
shell scripts should be tested manually or with integration tests, not PHPUnit unit tests


TO RUN ALL::

./vendor/bin/phpunit






##########################################################################################################



`D` means **deprecation warning**, not test failure. Something in code/tests/PHPUnit config is using syntax or behavior that PHPUnit/PHP says may be removed later.

Run these to find exact files and lines:

```bash
./vendor/bin/phpunit --display-deprecations
```

More detailed:

```bash
./vendor/bin/phpunit --display-all-issues
```

Run individual test files:

```bash
./vendor/bin/phpunit tests/Unit/AuthServiceTest.php --display-deprecations
```

```bash
./vendor/bin/phpunit tests/Unit/RequestTest.php --display-deprecations
```

```bash
./vendor/bin/phpunit tests/Unit/ResponseFactoryTest.php --display-deprecations
```

```bash
./vendor/bin/phpunit tests/Unit/CacheItemTest.php --display-deprecations
```

```bash
./vendor/bin/phpunit tests/Unit/CacheServiceTest.php --display-deprecations
```

```bash
./vendor/bin/phpunit tests/Unit/BootstrapLoaderTest.php --display-deprecations
```

```bash
./vendor/bin/phpunit tests/Unit/CacheControllerTest.php --display-deprecations
```

```bash
./vendor/bin/phpunit tests/Unit/AdminCacheControllerTest.php --display-deprecations
```

To stop immediately when deprecation appears:

```bash
./vendor/bin/phpunit --stop-on-deprecation --display-deprecations
```

To check only one test method:

```bash
./vendor/bin/phpunit --filter testMethodName
```

Example:

```bash
./vendor/bin/phpunit --filter testSetCreatesNewCacheItem --display-deprecations
```

##############################################################################################################

FOR TEST COVERAGE::::


Run this from Project/Backend:

./vendor/bin/phpunit --coverage-text

If it says no coverage driver, check:

php -m | grep -E "pcov|xdebug"

For PCOV coverage:

php -d pcov.enabled=1 ./vendor/bin/phpunit --coverage-text

For HTML coverage report:

php -d pcov.enabled=1 ./vendor/bin/phpunit --coverage-html coverage-report

Then open:

open coverage-report/index.html




::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Useful commands:

php -d pcov.enabled=1 ./vendor/bin/phpunit --coverage-text
php -d pcov.enabled=1 ./vendor/bin/phpunit --coverage-html coverage-report
open coverage-report/index.html