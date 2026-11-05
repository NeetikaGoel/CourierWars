# Runtime & scripts
Paths relative to `courier-war-game/`.

- `scripts/start-all.sh` — the one-shot dev launcher: sets env defaults → `start-cache-server.sh` → checks cache PID file + `kill -0` → polls `:8080/v1/cache/get?key=cw:health:backend-ping` → `php backend/scripts/bootstrap-cache.php 1` (generates 1 map into cache) → `start-backend.sh &` → polls `:8000/api/v1/health` → `start-frontend.sh`. Diagram: `scripts/flow.md`.
- `scripts/start-cache-server.sh` — just calls `../SimpleCachingServer/Project/Backend/scripts/start.sh` (see that project's map).
- `scripts/start-backend.sh` — `php -S 127.0.0.1:8000 -t backend/public backend/public/index.php`.
- `scripts/start-frontend.sh` — `cd frontend && npm run dev` (Vite; `/api` proxied to `:8000` in `frontend/vite.config.ts`).

Ports: frontend 5173 (Vite default), backend 8000, cache server 8080, MySQL 3306.

Env (defaults set in start scripts / `backend/config/*`): `CACHE_SERVER_URL`, `CACHE_SERVER_API_KEY` (normal key from SimpleCachingServer `config/auth.php`), `JWT_SECRET` (≥32 chars), `JWT_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` (false locally), `DB_HOST`/`DB_PORT`/… (`config/DatabaseConfig.php`, defaults root@127.0.0.1/courier_war).

Gotchas
- There is no stop script for backend/frontend; stop the cache server with SimpleCachingServer's `stop.sh`.
- Cache is in-memory: restarting the cache server drops bootstrap maps and auth sessions — rerun `bootstrap-cache.php`.
- Quick checks: `php -r` generator one-liner in `planv1.md`; `cd frontend && npx tsc --noEmit`.
