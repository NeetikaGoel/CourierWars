# Frontend
Paths relative to `courier-war-game/frontend/`. Vite + TypeScript + Phaser 4, no UI framework. Scripts: `npm run dev`, `npm run build` (runs `tsc` and then `vite build`), `npx tsc --noEmit`.

- `src/main.ts` is the app shell and screen router. It mounts pages, holds `currentProfile`, and calls `authApi`, `profileApi` and `mapApi`. The match screen uses `game/v7/scene/PhaserMatchGameController`.
- `src/pages/<area>/<Page>/` holds one `.ts`, `.html` (imported with `?raw`) and `.css` per page. The areas are landing, auth (login, register, guest, auth-loading), home setup, and match (waiting, loading, game, disconnected, result). Shared widgets live in `pages/shared/`.
- `src/common/api/` contains `ApiClient` (base `/api/v1`, cookies, CSRF), `AuthApi`, `ProfileApi`, `MapApi` and `MatchApi`. `MatchApi` keeps the per-tab `playerToken` in memory and estimates the backend clock offset from `serverNowMs`. Response types are in `common/apiType/` (the match sync contract is in `MatchApiType.ts`).
- `src/game/v7/` is the Phaser game:
  - `scene/`: `MatchGameScene` and its controller
  - `cityMap/`: `rendering/`, `input/` (courier movement, saboteur hover/placement), `rules/` (movement cost, hurdles, signals, zones), `runtime/` (state stores), `camera/`, `generation/` (TS generator, see map-generation)
  - `debug/DebugTextOverlay.ts`: a DOM side-panel HUD (role, courier/hovered tile, placement result, signals). It is gated by `config/DebugDisplayConfig.ts` → `sidePanel.visible` (off by default), throttled to about 5 updates/s, and cleared on scene shutdown.
  - other folders: `config/`, `types/`, `iso/` (isometric math), `utility/`
  - notes: `plan.md`, `working.md` (controls and hurdle placement rules)

Gotchas
- `src/counter.ts` is leftover from the Vite template.
- Online match sync: `pages/match/match-game/MatchGamePage.ts` owns the network side. It runs a `setTimeout` poll loop (one request in flight, interval from `pollIntervalMs`, 5 s while the tab is hidden, stale versions dropped), merges `changed:false` replies into the last full state, batches courier steps (150 ms) and posts saboteur placements. `MatchGameScene.matchStateApply` turns backend state into the runtime stores: hurdles and red signals are converted to the scene clock, and the saboteur animates the remote courier along `courier.trail`. The courier can only move while the status is `ACTIVE`. The match ends on both screens when a poll or a move reply reports `COMPLETED`/`DRAW`.
- `PhaserMatchGameController` must look the scene up lazily (`sceneGet`). `game.scene.getScene()` returns null until Phaser boots, and state can reach the scene before `create()` runs, so the scene buffers it.
- Refreshing the page loses the in-memory `playerToken`, and with it the match.
- Saboteur deck (`pages/match/match-game/SaboteurDeckController.ts`): builds the 9 hurdle cards from the backend `hurdleRules` (cost, cooldown, duration range) and keeps them in step with keys 1–9. In an online match a map click only picks and checks the target tile; **Activate Hurdle**, Space or Enter places it with the slider's duration. It also drives the live panels: active hurdles x/max, the active hurdle list, red light status, energy recovery and card cooldowns. A local prototype scene (no `saboteurPlacementRequested` callback) keeps click-to-place.
- The courier's ability buttons (Speed Boost, Shield, Reveal Route) have no game rules or backend action yet and only show "not available yet".
