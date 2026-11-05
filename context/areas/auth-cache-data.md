# Auth, cache client, database
Paths relative to `courier-war-game/backend/`.

Auth (`auth/`, design notes `auth/auth.md`)
- Users are registered or guest. JWT access + refresh tokens in HttpOnly cookies (`JwtTokenService`, `JwtSigner`, `JwtVerifier`, `config/JwtConfig.php`); CSRF double-submit cookie/header for POSTs (`CsrfTokenService`, `config/CsrfConfig.php`). `AuthRequestAuthenticator` → `AuthContext` for protected routes. Passwords via `PasswordHasher`.
- Sessions are kept in the cache server (`service/AuthSessionCacheService.php`, key `authSessionKey(sidHash)`). Logout and guest-forget revoke the session by setting `revokedAtMs`; the key stays until its TTL ends.
- `POST /auth/guest/forget` (guest sessions only, CSRF required; `AuthService::guestForget`) also deletes the guest's `cw_users` row, and `cw_user_stats` goes with it through `ON DELETE CASCADE`. The exception is a guest who appears in `cw_match_history` (foreign keys `ON DELETE RESTRICT`): their rows are kept so the opponent's history stays intact, and the response has `guestDataDeleted: false`. Rows are deleted before the session is revoked, so a DB failure leaves the session usable for a retry.

Cache client (`cache/`, notes `cache/cache.md`)
- `CacheServerClient` — HTTP client for SimpleCachingServer `/v1/cache/{set,get,delete}` with `X-API-Key`. Config in `config/CacheServerConfig.php` (URL default `http://127.0.0.1:8080`, value max 8 MB for map JSON), TTLs in `CacheServerTtlConfig.php`.
- `CacheServerKeyFactory` — **all keys built here**, prefix `cw:` with `:` separators: auth session, matchmaking waiting, `map:bootstrap:<ver>:list` / item, match state, match map.
- Server-side behaviour (auth, limits, TTL semantics) → `SimpleCachingServer/context/REPO_MAP.md`.

Database (MySQL via `mysqli`)
- `database/DbConnect.php` → `DbManager.php` (class `DBManager`) → `OrmManager.php`; per table: `entity/Cw*` ← `mapper/Cw*Mapper` ← `query/Cw*Query` ← `repository/Cw*Repository`. Filenames are case-sensitive on Linux, so a `require_once` must match the file's exact case.
- Tables: `schema/create_cw_users.sql`, `create_cw_user_stats.sql`, `create_cw_match_history.sql`, applied in that order (foreign keys reference `cw_users`). Apply them with `scripts/setup-database.sh` (or `php backend/scripts/database-setup.php apply-schema`). They hardcode the DB name `courier_war` and collation `utf8mb4_0900_ai_ci` (fine on MySQL 8 and MariaDB ≥11.4). Derived stats are intentionally not stored (`schema/extra.md`).
- Connection: `config/DatabaseConfig.php`, defaults `root` / `work` @ `127.0.0.1:3306`, with `DB_*` env overrides.
- Field limits: `constants/UserFieldLimit.php`.
