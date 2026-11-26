# Cache core & bootstrap
Paths relative to `Project/Backend/`.

- `src/Cache/CacheItem.php` — value object: key, value, createdAt, updatedAt, ttl, expiresAt; `refresh(value, ttl)` on overwrite, `isExpired()`, `toArray()` (API shape).
- `src/Cache/CacheService.php` — in-memory `array<string,CacheItem>`. `set/get/delete/purgeAll/list/size/uptime/health`. Expiry: lazy in `get`; `cleanupExpired()` sweeps in `list/size/health`. No background sweeper.
- `src/Bootstrap/BootstrapLoader.php` — `load()` reads `config/bootstrap.json`; on missing/bad file writes/uses defaults (`createDefaultBootstrapFile`, `getDefaultConfig`); `configSalvage`/`itemsSalvage` drop invalid config/items with warnings; returns `{loaded, warnings, errors, config, items}` consumed by `Application`.
- `config/bootstrap.json` — `config` (ttlDefault, ttlMax, host, port, logFile) + `items[]` (key, value, ttl) preloaded at startup. Currently holds Courier-War seed keys (`cw:*`).

Gotchas
- `CacheService::validateKey` is public but its calls inside `set/get/delete`, and `validateTtl/validateValue`, are **commented out**. Real validation happens upstream: `Utility/ValidationUtilities` (controllers) and `BootstrapLoader` (preload). `CacheService::set` expects an already-resolved int TTL.
- Limits (`config/constants.php`): TTL default 7200 / max 604800, value string ≤1024, key ≤255 matching `CACHE_ITEM_KEY_REGEX`, list limit default 50 / max 1000. Duplicate constants exist (`CACHE_KEY_LENGTH_MAX` vs `CACHE_ITEM_KEY_LENGTH_MAX`, `CACHE_VALUE_STRING_LENGTH_MAX` vs `CACHE_ITEM_VALUE_LENGTH_MAX`); different files use different ones — change both.
- `bootstrap.json` `ttlDefault/ttlMax` are validated by the loader but the runtime TTL rules use the `constants.php` values.
- Tests: `tests/Unit/CacheServiceTest.php`, `CacheItemTest.php`, `BootstrapLoaderTest.php`.
