# Runtime server & lifecycle
Paths relative to `Project/Backend/`.

- `server.php` — entry point. Opens `stream_socket_server` on hardcoded `127.0.0.1:8080`, builds `Application` once, loops accept → `serverHttpRequestRead` → `Request::createRequestFromRawHttp` → `Application::handle` → `serverHttpResponseBuild` → write → close. Catches `Throwable` → `SERVER-5001` 500. Helpers (same file): `serverContentLengthFind`, `serverStatusTextGet`.
- Graceful shutdown: SIGTERM/SIGINT set a flag via `pcntl_signal` (only if pcntl is available); loop uses 1s accept timeout so the flag is noticed.
- `scripts/start.sh` — `php server.php >> logs/cache-server.log &`, writes `run/cache-server.pid`; refuses double start, clears stale pid. `stop.sh` — SIGTERM, waits ≤5s, then SIGKILL. `restart.sh` — stop + start. Host/port are also hardcoded in `start.sh` (display only).
- Single-threaded, one request at a time; cache lives only in the `CacheService` instance held by `Application`.

Gotchas
- `config/bootstrap.json` `config.host/port/logFile` are loaded by `BootstrapLoader` but **not used** by `server.php` or `Logger`. Changing the port means editing `server.php` (+ `start.sh` echo).
- `Http\Request::createRequestFromGlobals` is the old `php -S` path; unused by `server.php`.

Read for background: `docs-index.md` → `newflowchart.md`, `finalflow.md`, `understanding.md`, `gracefulshutdown.md`, `run.md`.
