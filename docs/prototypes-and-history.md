# Prototypes and historical documents

## Which project to edit

- `courier-war-game/` is the integrated application: Vite/TypeScript frontend, PHP API, SQL schema, and client for the cache service. Use this for product features unless the request names another folder.
- `courier-war-poc/courier-war-poc/` is a standalone Phaser/Vite experiment with multiple generations (`src/game/v1` through `v8`). It has no backend integration or test runner. V7 contains the broad random-map/gameplay prototype; V8 is a deterministic hand-authored 96 x 96 map experiment reusing V7 renderer systems. The V8 README describes the intent.
- `SimpleCachingServer/Project/Backend/` is a separate PHP socket server exposing an authenticated JSON cache API. `courier-war-game/scripts/start-cache-server.sh` starts it from the sibling path. The Courier War backend talks to it through `backend/cache/CacheServerClient.php`.

## Prototype notes

The integrated frontend `courier-war-game/frontend/src/game/v7/` shares many V7 map/rendering ideas, but its `MatchGameScene` consumes backend map and match-state payloads. The POC's `v8/manualMap/ManualCityMap.ts` is not the official map source for the integrated app. Do not copy manual-map experiments into backend generation without comparing the current PHP payload/type contract and map versioning.

V1–V6 POC files are exploratory and may contain abandoned approaches. V7 `plan.md` is a detailed design proposal, not a current implementation checklist. POC `todo.md` and `working.md` files may refer to old working states.

## Historical project documents

- `courier-war-game/planv1.md`: continuation plan written before much of the now-present backend, frontend wiring, and scripts existed. It says many implemented systems are absent. Use only for original sequencing/intent.
- `courier-war-game/backend/mapgeneration.md`: older map demo plan; use live `backend/config/MapGenerationConfig.php`, `backend/map/generation/`, and `backend/service/MapGenerationService.php` for current behavior.
- `courier-war-game/frontend/src/game/v7/plan.md`: older frontend map architecture and naming plan. Useful for design intent; live tree and current imports win.
- `courier-war-game/scripts/flow.md`: compact startup sequence, still useful alongside the actual shell scripts.
- `courier-war-game/backend/auth/auth.md`, `backend/cache/cache.md`, and `backend/http/how.md`: explanatory notes for those areas; verify details against current PHP implementation.
- `SimpleCachingServer/Project/Backend/README.md`: cache service lifecycle and its in-memory behavior.

Generated artifacts and dependencies such as `node_modules/`, `vendor/`, `.phpunit.cache/`, and `coverage-report/` are not project source or current design documentation.
