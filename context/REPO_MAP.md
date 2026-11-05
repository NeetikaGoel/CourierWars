# CourierWars — repo map
Isometric 1v1 city game: Courier delivers across a seeded city map while Saboteur places hurdles. PHP 8 JSON API + TypeScript/Phaser 4 (Vite) frontend, backed by the in-repo SimpleCachingServer and MySQL.

Sub-projects:
- `courier-war-game/` — the real game (`backend/` PHP, `frontend/` TS/Phaser, `scripts/` launchers).
- `SimpleCachingServer/` — external KV cache the game backend talks to over HTTP. **Has its own map: `SimpleCachingServer/context/REPO_MAP.md` — use it for any cache-server task.**
- `courier-war-poc/courier-war-poc/` — frontend-only prototypes `src/game/v1…v8`; V7 was ported into the game.

Flow: browser → Vite `:5173` (proxies `/api` → `:8000`) → `backend/public/index.php` → `HttpRouter` → `api/v1/*Controller` → `service/*` → `cache/CacheServerClient` (→ SimpleCachingServer `:8080`) / `database/*Repository` (MySQL).

## Task → read
| Task | Open |
|---|---|
| Run/stop the stack, ports, env vars | `areas/runtime-scripts.md` |
| Routes, HTTP layer, controllers, services | `areas/backend-api.md` |
| Auth (JWT/CSRF/guest), cache keys/client, DB schema/repos | `areas/auth-cache-data.md` |
| City map generation, seeds, map payload | `areas/map-generation.md` |
| Pages, API client, Phaser scene, gameplay rules | `areas/frontend.md` |
| Prototype versions, assets | `areas/poc.md` |
| Cache server internals (endpoints, TTL, keys, scripts) | `../SimpleCachingServer/context/REPO_MAP.md` |

Paths in `areas/*.md` are relative to `courier-war-game/` unless stated.

## Gotchas
- The root `.gitignore` is the Visual Studio template. Its `[Dd]ebug/`, `[Rr]elease/` and `**/[Bb]in/*` rules once hid source folders and `vendor/bin/`, and negations at the end of the file now restore them. After adding a file, check with `git status` that it isn't silently ignored (`git check-ignore -v <path>`).

## Ignore
`node_modules/`, `dist/`, POC `public/` asset packs (KayKit, isometricLandscape, kenney tiles), `GameDesignDocument.md` (empty). `courier-war-game/planv1.md` is an older plan — parts are stale.
