# Backend API (routing, HTTP, controllers, services)
Paths relative to `courier-war-game/backend/`. Plain PHP 8, no framework/composer; files wired with `require_once`.

- `public/index.php` — single entry. Builds `HttpRequest::fromGlobals()`, registers all routes on `HttpRouter`, dispatches, `send()`. **Add an endpoint here** + a controller method.
- Routes (`AppConfig::API_BASE_PATH` = `/api/v1`): `GET /health`; `POST /auth/{register,login,guest,refresh,logout,guest/forget}` → `AuthController`; `GET /profile` → `ProfileController::profileGet`; `GET /maps/current`, `GET /maps/preview?seed=` → `MapController`.
- `http/` — request/response glue (rationale in `http/how.md`): `HttpRequest` (+ `HttpRequestGlobalReader`, `HttpJsonBodyParser`), `HttpRequestBoundary` (method, content-type, size, CSRF header, cookies, idempotency checks), `HttpResponseFactory` (envelope `success/data/error/meta`), `HttpJsonResponse`, `HttpCookieFactory`, `HttpRouter`.
- `api/v1/*Controller.php` — thin: boundary checks → service → response factory. Handler signature `(HttpRequest $request, array $pathParams): HttpJsonResponse`.
- `service/` — `AuthService`, `AuthSessionCacheService`, `ProfileService`, `MapGenerationService`, `MapBootstrapService` (bootstrap maps + per-match map in cache).
- `validation/` — `AuthRequestValidator`, `CommonFieldValidator`. `constants/` — enum-like value classes (`ApiErrorCode`, `HttpStatusCode`, `MatchStatusValue`, `HurdleTypeValue`, …). `config/` — one class per concern (`AppConfig`, `PollingConfig`, `DifficultyConfig`, `HurdleConfig`, `CourierMovementConfig`, …). `utility/` — `Clock`, `HashFactory`, `JsonSafeEncoder`.

Conventions: no hardcoded literals — put them in `constants/` or `config/`; method names are noun-first verb-last (`profileGet`, `bootstrapMapsStore`).

Gotchas
- Matchmaking/match-state endpoints don't exist yet; cache keys for them are already in `CacheServerKeyFactory`.
- `config/JwtFormatValue.php` and `constants/JwtFormatValue.php` both exist — check which is required before editing.
