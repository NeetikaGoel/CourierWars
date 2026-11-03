# Auth & security
Paths relative to `Project/Backend/`.

- `Auth/Role.php` — string constants `NORMAL`, `ADMIN` (non-instantiable).
- `Auth/AuthService.php` — `authenticate(Request): ?string` reads header `X-API-Key`, compares with `hash_equals` against `normalApiKey` / `adminApiKey`; returns role or null. `authorize(userRole, requiredRole)`: admin passes everything; normal passes only normal.
- `config/auth.php` — returns `['normalApiKey'=>…, 'adminApiKey'=>…]` (32 chars each). **Placeholder keys are committed to git**; a commented template is in the same file. Loaded by `Application::authConfigLoad`.
- Enforcement point: `public/router.php` (authenticate first, then per-route authorize). Server binds to `127.0.0.1` only (`server.php`).

Tests: `tests/Unit/AuthServiceTest.php`.
