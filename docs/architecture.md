# Main application architecture

This describes the implemented app under `courier-war-game/`, not every proposed structure in older plans.

## Repository map

```text
courier-war-game/
  frontend/                    TypeScript/Vite/Phaser browser app
    src/main.ts                page mounting, navigation, dependency wiring
    src/common/api/            shared fetch client and API wrappers
    src/common/apiType/        frontend request/response contracts
    src/pages/                 DOM-based landing, auth, home, match, result screens
    src/game/v7/               Phaser scene, map model, input, runtime, rendering
  backend/
    public/index.php           manual includes and API route registration
    api/v1/                    HTTP controllers
    http/                      request parsing, router, response envelope, cookies
    validation/                boundary/request validation
    service/                   auth, matchmaking, map, match, gameplay, result logic
    auth/                      JWT, CSRF, password hashing, request authentication
    database/                  PDO connection, query, mapper, repository layers
    schema/                    SQL schema scripts
    cache/                     client for the sibling SimpleCachingServer
    config/ constants/         tunables and stable value definitions
  scripts/                     local start scripts for frontend/backend/cache
```

`main.ts` mounts one page at a time and passes API dependencies and navigation callbacks. Page modules own their markup/CSS and return cleanup functions. `MatchGamePage` owns the match HUD and polling lifecycle; `PhaserMatchGameController` launches/stops `MatchGameScene` and passes backend map/state to Phaser.

## Request and state flow

1. Vite serves the browser app and proxies `/api/*` to `http://127.0.0.1:8000`.
2. `backend/public/index.php` loads controllers and registers `/api/v1` routes in the custom router.
3. Controllers check HTTP/JSON boundaries, authentication/authorization, CSRF for mutations, idempotency, and rate limits as applicable.
4. Services enforce business rules. The MySQL schema/repositories define users, user stats, and completed-match history; registration creates initial stats and profile reads them. Match-completion persistence is not currently wired through the match/result services (see [known gaps](known-issues-and-validation.md)). `SimpleCachingServer` holds expiring auth session metadata, matchmaking queues, map snapshots, active match state, rate-limit and idempotency records.
5. Frontend `ApiClient.ts` sends credentialed requests, refreshes auth when appropriate, and unwraps the common response envelope. API wrappers/types are in `common/api` and `common/apiType`.
6. The frontend polls match state (configured at 500 ms by the current main flow) using a `stateVersion`. Every response can refresh the HUD timer, but only a newer version is applied to Phaser; unchanged polls therefore do not reset the user's camera. Older/out-of-order state updates are ignored. Player actions are posted to the API and accepted state is applied to Phaser. Polling finalizes an expired active timer as a versioned completion so both players can reach the result screen.

Do not update only one side of an API contract. Check the controller, validator, service/response shape, API type, wrapper, and consuming page/scene together.

## Current API surface

Routes are registered in `backend/public/index.php`. The current route groups are:

- `GET /api/v1/health`
- `POST /api/v1/auth/{register,login,guest,refresh,logout}` and `POST /api/v1/auth/guest/forget`
- `GET /api/v1/profile`
- `GET /api/v1/maps/{current,preview}`
- `POST /api/v1/matches`; `GET /api/v1/matches/{matchId}/{map,state,result}`
- Match mutations: courier `move`/`ability`, saboteur `hurdle`, draw `offer`/`respond`, and match `forfeit`

Most private mutations require the authenticated session cookie, CSRF token, JSON body, and an idempotency key. The shared frontend API client adds these headers; controllers and `HttpRequestBoundary` validate them.

## Persistence and operations boundary

- SQL schemas are `create_cw_users.sql`, `create_cw_user_stats.sql`, and `create_cw_match_history.sql`. There is no migration framework in the main app; prepare the database separately before using account/profile features. Match completion currently does not write through the match-history repository.
- Configure DB/cache/JWT through the existing config classes and environment variables. Local shell scripts set development defaults. Never treat those defaults as production configuration.
- The cache service is a separate sibling project started by the main scripts. It is a long-running, process-local in-memory cache, not a durable database.

For commands and limitations, read [development-and-testing.md](development-and-testing.md). For game rules and map data, read [gameplay-and-map.md](gameplay-and-map.md).
