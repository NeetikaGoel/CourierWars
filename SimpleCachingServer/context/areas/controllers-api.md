# Controllers & HTTP API
Paths relative to `Project/Backend/`. Spec: `../../simple_caching_server_requirements.txt` (§7–8). Constructors take `(CacheService, ResponseFactory)`.

| Endpoint (const in `config/constants.php`) | Method | Role | Handler |
|---|---|---|---|
| `/v1/cache/set` | POST | normal+ | `CacheController::set` |
| `/v1/cache/get?key=` | GET | normal+ | `CacheController::get` |
| `/v1/cache/delete` | POST/DELETE | normal+ | `CacheController::delete` |
| `/v1/admin/cache/bulk-set` | POST | admin | `AdminCacheController::bulkSet` |
| `/v1/admin/cache/purge-selected` | POST | admin | `AdminCacheController::purgeSelected` |
| `/v1/admin/cache/purge-all` | POST | admin | `AdminCacheController::purgeAll` |
| `/v1/admin/cache/list?limit=` | GET | admin | `AdminCacheController::list` |
| `/v1/admin/cache/uptime`, `/size`, `/health` | GET | admin | `AdminCacheMetricsController::{uptime,size,health}` |

Handler pattern: method check → JSON check → field validation (`ValidationUtilities`) → `SanitizationUtilities::sanitizeKey` → rate-limit/idempotency placeholders (admin write/list) → `CacheService` → `ResponseFactory::success|error`, with `AuditLoggerUtilities` calls at each exit.

Error-code families (suffix = HTTP status + index): `CACHE-4xxx` (CacheController), `ADMIN-CACHE-4xxx` (AdminCacheController; metrics controller likewise — grep the file), `AUTH-4011/40xx` (router), `SERVER-5001`.

Gotchas
- `delete` accepts POST or DELETE (inline check, not `validateMethodDelete`).
- Rate-limit/idempotency checks are wired into admin controllers but always return true (see `utilities-logging.md`).
- Tests: `tests/Unit/CacheControllerTest.php`, `AdminCacheControllerTest.php`, `AdminCacheMetricsControllerTest.php`.
