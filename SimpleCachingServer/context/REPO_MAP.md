# SimpleCachingServer — repo map
PHP 8 in-memory key/value cache over HTTP JSON; long-running raw-socket server, single process. All code in `Project/Backend/`. Spec: `simple_caching_server_requirements.txt`.

Flow: `server.php` → `Request::createRequestFromRawHttp` → `Application::handle` → `cacheRouterDispatch` (`public/router.php`: auth → role → route) → Controller → `CacheService` → `ResponseFactory` → socket.

## Task → read
| Task | Open |
|---|---|
| Start/stop, port, signals, scripts | `areas/runtime-server.md` |
| Startup wiring, routes, add endpoint | `areas/app-wiring-routing.md` |
| Add/change endpoint behavior, error codes | `areas/controllers-api.md` |
| Cache storage, TTL/expiry, bootstrap preload | `areas/cache-core.md` |
| Request parsing, response shape | `areas/http-layer.md` |
| API keys, roles | `areas/auth-security.md` |
| Validation, limits, logging, rate-limit/idempotency stubs | `areas/utilities-logging.md` |
| Writing/running tests | `areas/tests.md` |
| Background/rationale, which .md is stale | `areas/docs-index.md` |

## Ignore
`vendor/`, `coverage-report/`, `.phpunit.cache/`, `logs/`, `run/*.pid` — third-party, generated or runtime.
