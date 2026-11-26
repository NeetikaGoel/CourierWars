# Utilities, logging, constants
Paths relative to `Project/Backend/`.

- `Utility/ValidationUtilities.php` — static; throw `InvalidArgumentException` caught by controllers: `validateMethodPost/Get/Delete`, `validateJson`, `validateKey`, `validateTtl` (returns int, default if null), `validateValue`, `validateItemsArray`, `validateItemArray`, `validateLimit`. **This is the active validation layer.**
- `Utility/SanitizationUtilities.php` — `sanitizeKey` (trim + length + regex, throws).
- `Utility/RateLimitUtilities.php`, `Utility/IdempotencyUtilities.php` — **placeholders**, every method returns `true`. Hook points exist per endpoint; implement here, not in controllers.
- `Utility/AuditLoggerUtilities.php` — thin wrappers over `Logger::logInfo` (components `CacheController` / `AdminCacheController`).
- `Logging/Logger.php` — static `logInfo/logWarn/logError`; writes one JSON line per event (timestamp, level, component, errorCode, stackTrace, context) to `logs/cache-server.log`. Path is hardcoded in `writeLog`; `correlationId` and `durationMs` are stubs (`'00000'`, `0`).
- `config/constants.php` — all limits and `ENDPOINT_*` paths; see gotchas in `cache-core.md` (duplicate constants, unused `HOST_DEFAULT/PORT_DEFAULT/LOG_FILE_DEFAULT` outside `BootstrapLoader`).

Tests: none for utilities or Logger.
