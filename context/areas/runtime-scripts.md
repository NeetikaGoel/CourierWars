# Runtime & scripts
Paths relative to `courier-war-game/`.

- `scripts/dependencies.sh` — required: php ≥8 + `mysqli` + `allow_url_fopen`, `curl`, node ≥20.19 + npm, `frontend/node_modules` (via `npm ci`), and a **ready database** (`setup-database.sh --check`). `--check` = silent, exit 0/1. Interactive mode prompts y/N per item, installs via dnf/apt-get/pacman/brew (sudo), re-verifies after install, installs the MySQL/MariaDB server if DB_HOST is local, then hands off to `setup-database.sh`; needs a TTY. New dependency ⇒ add a check fn + package names here. Cache-server deps are checked separately by SimpleCachingServer's own `dependencies.sh`.
- `scripts/setup-database.sh` — gets the DB ready in three steps, asking before each: start the service (`sudo systemctl enable --now mariadb|mysqld|mysql`, or `brew services`), fix the login (`sudo mariadb -u root` → for `root`, `ALTER USER … IDENTIFIED VIA unix_socket OR mysql_native_password`, socket login kept; otherwise create the user and grant on DB_NAME), apply `backend/schema/*.sql`. `--check` = silent, exit 0/1. State comes from `php backend/scripts/database-setup.php check|apply-schema` (exit 0 ready, 2 unreachable, 3 access denied, 4 schema missing). That script uses `DatabaseConfig`, so `DB_*` env overrides apply. Schema apply is idempotent (`IF NOT EXISTS`).
- `scripts/start-all.sh` — the one-shot dev launcher: runs `dependencies.sh --check` (falls back to interactive install, aborts on failure) → sets env defaults → `start-cache-server.sh` → checks cache PID file + `kill -0` → polls `:8080/v1/cache/get?key=cw:health:backend-ping` → `php backend/scripts/bootstrap-cache.php 1` (generates 1 map into cache) → `start-backend.sh &` → polls `:8000/api/v1/health` → `start-frontend.sh`. Diagram: `scripts/flow.md`.
- `scripts/start-cache-server.sh` — just calls `../SimpleCachingServer/Project/Backend/scripts/start.sh` (see that project's map).
- `scripts/start-backend.sh` — `php -S 127.0.0.1:8000 -t backend/public backend/public/index.php`.
- `scripts/start-frontend.sh` — `cd frontend && npm run dev` (Vite; `/api` proxied to `:8000` in `frontend/vite.config.ts`).

Ports: frontend 5173 (Vite default), backend 8000, cache server 8080, MySQL 3306.

Env (defaults set in start scripts / `backend/config/*`): `CACHE_SERVER_URL`, `CACHE_SERVER_API_KEY` (normal key from SimpleCachingServer `config/auth.php`), `JWT_SECRET` (≥32 chars), `JWT_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` (false locally), `DB_HOST`/`DB_PORT`/… (`config/DatabaseConfig.php`, defaults root@127.0.0.1/courier_war).

Gotchas
- There is no stop script for backend/frontend; stop the cache server with SimpleCachingServer's `stop.sh`.
- Cache is in-memory: restarting the cache server drops bootstrap maps and auth sessions — rerun `bootstrap-cache.php`.
- Every sign-in path (including guest) writes to MySQL, so without a ready DB every auth request returns 500. Logout only marks a session `revokedAtMs`; the key stays in the cache until its TTL ends.
- Fresh MariaDB installs set `root@localhost` to `mysql_native_password USING 'invalid' OR unix_socket`, so a password login fails with error **1698**, not 1045. `database-setup.php` treats 1044, 1045 and 1698 as access denied.
- To test against a throwaway DB, run `mariadb-install-db` + `mariadbd` on another port and set `DB_PORT`. Keep the `--socket` path ≤107 chars, and use the default auth (not `--auth-root-authentication-method=normal`) so it matches a real install.
- Quick checks: `php -r` generator one-liner in `planv1.md`; `cd frontend && npx tsc --noEmit`.
