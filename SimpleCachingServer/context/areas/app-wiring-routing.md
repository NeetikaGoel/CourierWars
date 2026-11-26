# App wiring & routing
Paths relative to `Project/Backend/`.

- `src/App/Application.php` — composition root. Constructor order: `ResponseFactory` → `bootstrapLoad()` (`BootstrapLoader` on `config/bootstrap.json`) → `CacheService` → `preloadItemsLoad()` (`CacheService::set` per item; failures logged `PRELOAD_ITEM_FAILED`, skipped) → `authConfigLoad()` (`config/auth.php`; missing file ⇒ `[]` ⇒ all auth fails) → three controllers. `handle()` just calls `cacheRouterDispatch`.
- `public/router.php` — `cacheRouterDispatch(...)` (free function, not a class). Flow: authenticate (`AuthService::authenticate`, 401 `AUTH-4011`) → exact-match on `$request->getPath()` against `ENDPOINT_*` constants → role check (`AuthService::authorize`, 403 `AUTH-4031…4040`, one unique code per route) → controller method. Unknown path ⇒ 404 `CACHE-4040`.
- Router matches **path only**; HTTP method is enforced inside each controller (405 codes).

To add an endpoint: constant in `config/constants.php` → branch in `router.php` (next free `AUTH-40xx`) → controller method (see `controllers-api.md`) → `tests/Unit/` (router itself has no tests).
