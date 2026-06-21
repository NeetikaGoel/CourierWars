
# Short summary

```text
The server is now a custom long-running PHP socket server

It opens 127.0.0.1:8080 using stream_socket_server and keeps running in a while true loop

For every incoming curl request, stream_socket_accept gives us a client connection

We read raw HTTP text from that connection using fread

Then Request parses method path headers query params and body

Application sends it to router, router checks auth and calls the correct controller

Controller validates input and calls CacheService

CacheService stores data in an in-memory array of CacheItem objects

Because Application and CacheService are created only once before the loop, the cache array survives across multiple requests

Finally server.php converts JsonResponse into raw HTTP response and writes it back using fwrite
```

---

# File-by-file summary

## `server.php`

Starts the custom long-running socket server

Responsibilities:

```text
open 127.0.0.1:8080
create Application once
wait for requests forever
read raw HTTP request
convert it to Request object
send to Application
convert JsonResponse to raw HTTP
send response back
catch unexpected errors
```

---

## `src/App/Application.php`

Main wiring class

Responsibilities:

```text
load bootstrap config
create CacheService
load preload items
load auth config
create AuthService
create controllers
call router for each request
```

Important:

```text
Application is created once
so CacheService is created once
```

---

## `public/router.php`

Route dispatcher

Responsibilities:

```text
authenticate request
authorize role
match path
call correct controller method
return 404 for unknown route
```

Example:

```text
/v1/cache/set → CacheController->set()
/v1/admin/cache/health → AdminCacheController->health()
```

---

## `Http/Request.php`

Request parser and holder

Responsibilities:

```text
convert raw HTTP request into clean object
store method
store path
store headers
store query params
store JSON body
tell if JSON was invalid
provide getters for controllers
```

---

## `Http/JsonResponse.php`

Represents response

Responsibilities:

```text
hold status code
hold response body
send JSON response in old built-in-server flow
```

In new socket flow, server reads:

```php
$response->getStatusCode()
$response->getBody()
```

and builds raw HTTP response itself

---

## `Http/ResponseFactory.php`

Standard response builder

Responsibilities:

```text
create success response in common format
create error response in common format
```

So all APIs return same shape

---

## `Auth/Role.php`

Role constants

Responsibilities:

```text
define normal role
define admin role
```

Used by router and auth service

---

## `Auth/AuthService.php`

Authentication and authorization

Responsibilities:

```text
read X-API-Key header
compare with config/auth.php
return normal/admin/null
check if user role can access required role
```

---

## `config/auth.php`

Stores API keys

Responsibilities:

```text
normalApiKey
adminApiKey
```

---

## `config/bootstrap.json`

Startup config and preload file

Responsibilities:

```text
ttl defaults
host/port/log file config
preload cache items
```

---

## `src/Bootstrap/BootstrapLoader.php`

Loads and salvages bootstrap config

Responsibilities:

```text
read bootstrap.json
fallback to defaults if missing or invalid
create default bootstrap file if missing
load valid preload items
skip invalid preload items
log warnings
```

---

## `src/Cache/CacheItem.php`

Single cache entry

Responsibilities:

```text
store key
store value
store ttl
store createdAt
store updatedAt
store expiresAt
check if expired
convert item to array for response
```

---

## `src/Cache/CacheService.php`

Main cache logic

Responsibilities:

```text
hold cacheItemsMap in memory
set item
get item
delete item
bulk used through controller loop
purge all
list live items
return uptime
return size
return health
cleanup expired items
validate key ttl value
```

This is where real cache memory lives:

```php
private array $_cacheItemsMap = [];
```

---

## `Controller/CacheController.php`

Normal API boundary

Responsibilities:

```text
handle /v1/cache/set
handle /v1/cache/get
handle /v1/cache/delete
validate method
validate JSON
validate key value ttl
sanitize key
rate limit placeholder
idempotency placeholder
call CacheService
return JsonResponse
audit log
```

---

## `Controller/AdminCacheController.php`

Admin API boundary

Responsibilities:

```text
handle bulk set
handle purge selected
handle purge all
handle list
handle uptime
handle size
handle health
validate admin request input
call CacheService
return JsonResponse
audit log
```

---

## `Logging/Logger.php`

Simple JSON logger

Responsibilities:

```text
write structured logs
create logs folder/file if missing
append logs to logs/cache-server.log
support info warn error
```

---

## `scripts/start.sh`

Starts server

Responsibilities:

```text
go to backend root
create logs and run folders
check existing PID
avoid duplicate server start
run php server.php in background
save PID
```

---

## `scripts/stop.sh`

Stops server

Responsibilities:

```text
read PID file
send stop signal
force kill if needed
remove PID file
```

---

## `scripts/restart.sh`

Restarts server

Responsibilities:

```text
run stop.sh
run start.sh
```

---

## `logs/cache-server.log`

Runtime log file

Contains:

```text
server startup logs
auth failures
validation failures
cache mutations
unexpected errors
```

---

## `run/cache-server.pid`

Stores running process ID

Used by:

```text
start.sh to avoid duplicate start
stop.sh to know what to stop
restart.sh indirectly
```

---

## `README.md`

Project documentation

Responsibilities:

```text
explain project
show features
show flow
show endpoints
show run commands
show curl examples
```

---

## `TerminalRunGuide.md`

Manual testing guide

Responsibilities:

```text
commands to test all good and bad cases
auth tests
normal endpoint tests
admin endpoint tests
ttl test
restart test
```

---

## `flowchart.md` and `newflowchart.md`

Architecture understanding docs

Responsibilities:

```text
old flow explanation
new long-running socket server flow explanation
```

---

## `understanding.md`

Learning notes

Responsibilities:

```text
your explanations and concepts
how server works
how cache works
```

---

## `begin.md`

Likely your planning/start notes

Responsibilities:

```text
initial task breakdown
implementation notes
```

---

## `run.md`

Likely command notes

Responsibilities:

```text
run commands
manual test notes
```

---

# One sentence summary of whole project

```text
This project is a local PHP socket server that keeps one CacheService object alive in memory and exposes authenticated JSON APIs to set get delete and administrate TTL based cache items
```
