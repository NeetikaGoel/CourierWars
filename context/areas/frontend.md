# Frontend
Paths relative to `courier-war-game/frontend/`. Vite + TypeScript + Phaser 4, no UI framework. Scripts: `npm run dev`, `npm run build` (runs `tsc` and then `vite build`), `npx tsc --noEmit`.

- `src/main.ts` is the app shell and screen router. It mounts pages, holds `currentProfile`, and calls `authApi`, `profileApi` and `mapApi`. The match screen uses `game/v7/scene/PhaserMatchGameController`.
- `src/pages/<area>/<Page>/` holds one `.ts`, `.html` (imported with `?raw`) and `.css` per page. The areas are landing, auth (login, register, guest, auth-loading), home setup, and match (waiting, loading, game, disconnected, result). Shared widgets live in `pages/shared/`.
- `src/common/api/` contains `ApiClient` (base `/api/v1`, cookies, CSRF), `AuthApi`, `ProfileApi` and `MapApi`. Response types are in `common/apiType/`.
- `src/game/v7/` is the Phaser game:
  - `scene/`: `MatchGameScene` and its controller
  - `cityMap/`: `rendering/`, `input/` (courier movement, saboteur hover/placement), `rules/` (movement cost, hurdles, signals, zones), `runtime/` (state stores), `camera/`, `generation/` (TS generator, see map-generation)
  - `debug/DebugTextOverlay.ts`: a DOM side-panel HUD (role, courier/hovered tile, placement result, signals). It is gated by `config/DebugDisplayConfig.ts` → `sidePanel.visible` (off by default), throttled to about 5 updates/s, and cleared on scene shutdown.
  - other folders: `config/`, `types/`, `iso/` (isometric math), `utility/`
  - notes: `plan.md`, `working.md` (controls and hurdle placement rules)

Gotchas
- `src/counter.ts` is leftover from the Vite template.
- Match flow is still largely client-side (`MatchPrototypeState`). The backend has no match or matchmaking API yet.
