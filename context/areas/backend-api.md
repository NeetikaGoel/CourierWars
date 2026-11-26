# Backend API (routing, HTTP, controllers, services)
Paths relative to `courier-war-game/backend/`. Plain PHP 8, no framework/composer; files wired with `require_once`.

- `public/index.php` — single entry. Builds `HttpRequest::fromGlobals()`, registers all routes on `HttpRouter`, dispatches, `send()`. **Add an endpoint here** + a controller method.
- Routes (`AppConfig::API_BASE_PATH` = `/api/v1`): `GET /health`; `POST /auth/{register,login,guest,refresh,logout,guest/forget}` → `AuthController`; `GET /profile` → `ProfileController::profileGet`; `GET /maps/current`, `GET /maps/preview?seed=` → `MapController` (seeded maps get `Cache-Control: immutable`); match routes → `MatchController`, below.
- Match API (`api/v1/MatchController.php` → `service/MatchService.php`). `POST /matches {difficulty, rolePreference}` joins a waiting match that needs that role or opens one, and returns a per-tab `playerToken`. Every later call sends it (query param on GET, body field on POST; POSTs also need CSRF): `GET /matches/{id}/state?knownVersion=`, `GET /matches/{id}/result`, `POST /matches/{id}/{ready,moves,hurdles,cancel,draw}`.
  - The backend is authoritative. Courier steps arrive as `{seq,x,y}` batches and are checked for adjacency, walkability, active blocking hurdles and a speed budget. Reaching the delivery tile ends the match (`COMPLETED`, `delivered`). Hurdles are checked for energy, cooldown, active count, start/delivery tiles and courier distance (`config/HurdleConfig.php`). An optional `durationMs` is clamped to the type's `durationMsMin`–`durationMsMax`. The create reply and any `knownVersion=0` read include `hurdleRules` (cost, cooldown and duration range per type). The frontend uses them for the deck and the local energy check, and only falls back to `SaboteurHurdleConfig` for local prototype scenes. Timer expiry is applied lazily on the next read.
  - Status: `WAITING` → `READY` (opponent joined) → `ACTIVE` (`START_COUNTDOWN_MS` after both sent `ready`, or `READY_WAIT_MAX_MS` after the join) → `COMPLETED`/`DRAW`. `cancel` while waiting cancels the match; after that it is a forfeit.
  - Bandwidth: `stateVersion` only moves on changes a client must redraw. A poll whose `knownVersion` matches gets `changed:false` plus the fields that tick (timer, energy). The full state is about 1 KB.
  - Concurrency: the cache server has no compare-and-set, so every read-modify-write runs under a `flock` file lock per match (and one for matchmaking) in `sys_get_temp_dir()/courier-war-match-locks/`. Tunables are in `config/MatchConfig.php`.
- `HttpJsonResponse::send()` gzips bodies ≥2 KB when the client accepts gzip, which cuts the 4.4 MB map JSON to about 84 KB.
- `http/` — request/response glue (rationale in `http/how.md`): `HttpRequest` (+ `HttpRequestGlobalReader`, `HttpJsonBodyParser`), `HttpRequestBoundary` (method, content-type, size, CSRF header, cookies, idempotency checks), `HttpResponseFactory` (envelope `success/data/error/meta`), `HttpJsonResponse`, `HttpCookieFactory`, `HttpRouter`.
- `api/v1/*Controller.php` — thin: boundary checks → service → response factory. Handler signature `(HttpRequest $request, array $pathParams): HttpJsonResponse`.
- `service/` — `AuthService`, `AuthSessionCacheService`, `ProfileService`, `MapGenerationService`, `MapBootstrapService` (bootstrap maps + per-match map in cache), `MatchService` (+ `MatchServiceException`, which carries the API error code and HTTP status).
- `validation/` — `AuthRequestValidator`, `CommonFieldValidator`. `constants/` — enum-like value classes (`ApiErrorCode`, `HttpStatusCode`, `MatchStatusValue`, `HurdleTypeValue`, …). `config/` — one class per concern (`AppConfig`, `PollingConfig`, `DifficultyConfig`, `HurdleConfig`, `CourierMovementConfig`, …). `utility/` — `Clock`, `HashFactory`, `JsonSafeEncoder`.

Conventions: no hardcoded literals — put them in `constants/` or `config/`; method names are noun-first verb-last (`profileGet`, `bootstrapMapsStore`).

Gotchas
- Match state lives only in the in-memory cache server: restarting it drops every running match. The PHP built-in server is single-worker by default, so long-polling would block every other request. Keep polls short.
- Matches don't write to `cw_match_history` / `cw_user_stats` yet.
- `config/JwtFormatValue.php` and `constants/JwtFormatValue.php` both exist — check which is required before editing.
