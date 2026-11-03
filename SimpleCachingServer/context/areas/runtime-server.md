# Runtime server & lifecycle
Paths relative to `Project/Backend/`.

- `server.php` — entry point. Opens `stream_socket_server` on hardcoded `127.0.0.1:8080`, builds `Application` once, loops accept → `serverHttpRequestRead` → `Request::createRequestFromRawHttp` → `Application::handle` → `serverHttpResponseBuild` → write → close. Catches `Throwable` → `SERVER-5001` 500. Helpers (same file): `serverContentLengthFind`, `serverStatusTextGet`.
- Graceful shutdown: SIGTERM/SIGINT set a flag via `pcntl_signal` (only if pcntl is available); loop uses 1s accept timeout so the flag is noticed.
- `scripts/start.sh` — first runs `dependencies.sh --check`; if missing, runs `dependencies.sh` interactively and aborts (exit 1) unless it succeeds. Then `php server.php >> logs/cache-server.log &`, writes `run/cache-server.pid`, waits 1s and verifies the process is alive (else removes pid, exit 1). Refuses double start, clears stale pid. `stop.sh` — SIGTERM, waits ≤5s, then SIGKILL. `restart.sh` — stop + start. Host/port are also hardcoded in `start.sh` (display only).
- `scripts/dependencies.sh` — required: `php` CLI ≥8; optional: `pcntl` (graceful shutdown). `--check` = silent, exit 0 if required present. Interactive mode prompts y/N, installs via dnf/apt-get/pacman/brew with sudo, re-verifies php afterward; needs a TTY (aborts otherwise). New dependency ⇒ add check + package names here.
- Single-threaded, one request at a time; cache lives only in the `CacheService` instance held by `Application`.

Gotchas
- `config/bootstrap.json` `config.host/port/logFile` are loaded by `BootstrapLoader` but **not used** by `server.php` or `Logger`. Changing the port means editing `server.php` (+ `start.sh` echo).
- `Http\Request::createRequestFromGlobals` is the old `php -S` path; unused by `server.php`.

Read for background: `docs-index.md` → `newflowchart.md`, `finalflow.md`, `understanding.md`, `gracefulshutdown.md`, `run.md`.
