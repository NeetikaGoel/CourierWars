# Known gaps, TODOs, and unverified scenarios

This list separates observed repo gaps from suggested checks. It is a context snapshot; update it when the implementation or verification status changes.

## Fixed and verified in this task

- Repeated same-version match polls used to reapply the same backend snapshot to Phaser every 500 ms. Since the scene force-focused the camera during state application, this repeatedly reset manual pan and zoom. The page now keeps timer/HUD refreshes but applies game state only when `stateVersion` advances; the scene also ignores repeated versions and only follows the camera when the Courier tile changes.
- Active match polling previously returned a zero timer without ending the match, so neither client received a terminal state to open the result screen. Polling now stores a completed timeout state, assigns the Saboteur as winner, and increments the state version. The result service then returns the timeout result.
- Added focused frontend and backend tests for polling/version handling and timeout/result progression. See [development-and-testing.md](development-and-testing.md) for exact commands and outcomes.

## Confirmed gaps / limitations

- The new tests cover polling and timeout paths only. The main app still needs broad automated coverage for auth, matchmaking, gameplay rules, map conversion, action retries/concurrency, and result/history persistence. The Phaser POC has no project-owned test suite.
- The cache server is in-memory and process-local. Restarting it loses auth session metadata, matchmaking queues, bootstrap maps, idempotency/rate-limit state, and active match state. This is a local/internal service design, not durable persistence.
- The main app has SQL schema files but no migration runner, `.env.example`, or documented deployment setup. Startup scripts set local development defaults; production configuration and deployment behavior are not established by those scripts.
- `backend/config/DatabaseConfig.php` contains a built-in local database password fallback, and the startup scripts define development cache/JWT defaults. Set secrets explicitly through environment variables and remove local fallbacks before shared deployment.
- Some Home navigation/settings items currently display “not available in the prototype yet”. Check `frontend/src/pages/home/HomeSetupPage.ts` before treating those sections as implemented.
- User-stat and match-history schemas/repositories exist, but current match/result services do not call the match-history write repository, and no match-completion stats update path was found. Result screens read live/cached match state; persistence after a completed match is an implementation gap to resolve before relying on long-term stats/history.
- The root `README.md` is minimal and `GameDesignDocument.md` is empty. `courier-war-game/planv1.md`, `frontend/src/game/v7/plan.md`, `backend/mapgeneration.md`, and several prototype `working.md`/`todo.md` files contain plans or instructions from earlier development stages. They are not reliable descriptions of current completion.
- `backend/auth/JwtVerifier.php` has comments saying base64url decoding is unfinished, although the implementation exists below those comments. This is stale commentary; verify behavior before changing code based on that wording.

## Next useful work

1. Expand automated coverage across main backend gameplay rules/services, API contracts, frontend payload conversion, and Phaser-independent movement/input rules.
2. Verify deterministic map snapshots and validation over a seed set, including start-to-delivery reachability and all generated feature constraints.
3. Exercise the complete two-session gameplay loop and all endings, including reconciling concurrent actions and out-of-order polling.
4. Wire and verify match-completion history and stats persistence; verify DB schema setup, cache/bootstrap startup, and user-visible failure paths when DB/cache is unavailable.
5. Replace or complete the home navigation placeholders once their intended behavior is defined; update the root README and retire/update stale implementation plans as part of future feature work.
6. Decide and document production-grade secret/configuration, database migration, and cache durability/deployment requirements before deployment work.

## Not yet verified in this repository

Targeted polling, version, timeout, build, map-generation, and local HTTP proxy checks have been recorded in [development-and-testing.md](development-and-testing.md). Treat the following as open until someone records evidence:

- Auth lifecycle, cookies, CSRF enforcement, refresh rotation, guest cleanup, and account validation against a real DB.
- Match queue correctness across role preferences, difficulty, cancellation, multiple sessions, stale entries, and concurrent requests.
- Main backend map output across seeds and agreement between serialized PHP maps and frontend renderer expectations.
- Game action rule coverage, idempotency under retries, stale-version conflicts, and client state recovery after a rejected action.
- All hurdle and ability effects, expirations, timer resolution, draw/forfeit flows, and final stat/history writes.
- Cache restart/failure handling while users are queued or matches are active.
- Full visual playthrough at relevant desktop sizes, including loading/waiting/disconnected/result screens.

When a scenario is tested later, add command/setup and outcome here; do not promote a planned test to a completed one without a recorded result.
