# Auth, cache client, database
Paths relative to `courier-war-game/backend/`.

Auth (`auth/`, design notes `auth/auth.md`)
- Users are registered or guest. JWT access + refresh tokens in HttpOnly cookies (`JwtTokenService`, `JwtSigner`, `JwtVerifier`, `config/JwtConfig.php`); CSRF double-submit cookie/header for POSTs (`CsrfTokenService`, `config/CsrfConfig.php`). `AuthRequestAuthenticator` → `AuthContext` for protected routes. Passwords via `PasswordHasher`.
- Sessions are kept in the cache server (`service/AuthSessionCacheService.php`, key `authSessionKey(sidHash)`).

Cache client (`cache/`, notes `cache/cache.md`)
- `CacheServerClient` — HTTP client for SimpleCachingServer `/v1/cache/{set,get,delete}` with `X-API-Key`. Config in `config/CacheServerConfig.php` (URL default `http://127.0.0.1:8080`, value max 8 MB for map JSON), TTLs in `CacheServerTtlConfig.php`.
- `CacheServerKeyFactory` — **all keys built here**, prefix `cw:` with `:` separators: auth session, matchmaking waiting, `map:bootstrap:<ver>:list` / item, match state, match map.
- Server-side behaviour (auth, limits, TTL semantics) → `SimpleCachingServer/context/REPO_MAP.md`.

Database (MySQL via `mysqli`)
- `database/dbConnect.php`, `dbManager.php`, `ormManager.php`; per table: `entity/Cw*` ← `mapper/Cw*Mapper` ← `query/Cw*Query` ← `repository/Cw*Repository`.
- Tables: `schema/create_cw_users.sql`, `create_cw_user_stats.sql`, `create_cw_match_history.sql`. Derived stats are intentionally not stored (`schema/extra.md`).
- Field limits: `constants/UserFieldLimit.php`.
