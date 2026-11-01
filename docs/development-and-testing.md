# Development and testing

## Prerequisites

- Node.js/npm for the Vite frontends (Node 22.12+ supports the frontend toolchain and the test runner's type stripping).
- PHP 8+ with PDO MySQL for the main backend; MySQL 8+ with the Courier War schema loaded for account, profile, and history features.
- Bash-compatible shell for the supplied `.sh` scripts.
- The sibling `SimpleCachingServer/Project/Backend` service for auth sessions, matchmaking, bootstrap maps, and active match state.

## Main app startup

Run scripts from `courier-war-game/` (or invoke them from its `scripts/` directory):

```bash
bash scripts/start-all.sh
```

This starts the cache service, writes the initial map bootstrap, starts PHP at `127.0.0.1:8000`, waits for `/api/v1/health`, then starts Vite. The scripts assume the sibling cache server exists at `../SimpleCachingServer/Project/Backend`. The MySQL server and schema are not created by this script.

To start pieces separately:

```bash
bash scripts/start-cache-server.sh
bash scripts/start-backend.sh
bash scripts/start-frontend.sh
```

Frontend-only development from `courier-war-game/frontend/`:

```bash
npm install
npm run dev
npm test
```

The Vite proxy in `vite.config.ts` routes `/api` to port 8000. Frontend build/type-check command is `npm run build` (script runs `tsc && vite build`). `npm test` runs the polling/version regression tests with Node's built-in test runner.

Schema scripts to inspect/apply manually are under `courier-war-game/backend/schema/`. Keep credentials and production secrets out of context files. Config classes include environment-variable readers; use environment variables instead of local fallbacks for any shared or deployed environment.

## Automated tests and latest verification

- Frontend regression tests: `cd courier-war-game/frontend && npm test`. They cover state-version advancement, serial polling, disposal of in-flight responses, and retry after poll errors.
- Main backend regression tests: `cd courier-war-game/backend && php tests/run.php`. They cover polling projection, participant roles, version/change reporting, timer expiry persistence, result retrieval, and `knownVersion` validation without MySQL or the cache server.
- The standalone cache server has PHPUnit unit tests under `SimpleCachingServer/Project/Backend/tests/Unit/`, configured by its `phpunit.xml`. They cover that service but do not validate Courier War integration. Running the suite requires PHP's `mbstring` extension.

Verification run on 2026-10-30:

- `npm test`: 5 frontend tests passed.
- `npm run build`: TypeScript check and Vite production build passed. Vite reported the existing large JavaScript chunk warning.
- `php tests/run.php`: 34 backend polling assertions passed.
- PHP syntax check: all 141 main-backend PHP files passed `php -l`.
- Direct seeded map generation and backend HTTP map preview returned a 96 x 96 map with 32 traffic signals.
- Local Vite-to-PHP smoke check returned the frontend page, `/api/v1/health`, and the seeded map preview successfully.
- Cache-service PHPUnit tests could not start because this PHP runtime lacks `mbstring`.

These checks do not replace a two-player browser playthrough. Auth, matchmaking, movement/hurdle/ability rules against the live cache service, MySQL persistence, and visual behavior remain unverified in this environment.

## Smoke scenarios to run when testing is requested

1. Start cache, backend, and frontend; confirm health and cache reachability. Confirm the app can connect to MySQL after the SQL schema is loaded.
2. Register a user; login; reload/refresh; check profile; logout. Repeat guest creation and guest-forget. Verify cookie, CSRF failure, invalid input, and duplicate-account paths.
3. Use two browser sessions for role/difficulty matchmaking. Check waiting, opponent assignment, cancellation/forfeit, and reconnect behavior.
4. Preview maps with a fixed seed twice and compare snapshots. Try a range of seeds and confirm map validation, reachability, start/delivery placement, signal locations, and hurdle support.
5. Load the assigned map, verify the renderer/markers/camera, and exercise zoom/pan/recenter at expected viewport sizes.
6. Exercise valid and invalid movement, adjacency, blocked tiles, red/green signal expiry, all hurdle types, placement distance/zone/tile support, energy/cooldown/active limit, and expired effects.
7. Exercise all Courier abilities and their effects/cooldowns; check delivery, lives-zero, timeout, draw offer/accept/reject/expiry, and forfeit endings.
8. Send duplicate idempotency keys and stale `knownStateVersion` actions; verify no duplicate mutation and correct conflict/reconciliation behavior.
9. Verify result retrieval. After match-completion persistence is wired, verify per-role stats, derived stats, and history for registered and guest users. Restart the cache service and document the expected loss of live in-memory state.

These are recommended scenarios, not tests that have already been run.
