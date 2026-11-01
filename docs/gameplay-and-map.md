# Gameplay and map reference

## Match loop

Two authenticated players (registered or guest) are matched by role preference and difficulty. One is assigned Courier and the other Saboteur. The Courier moves across a generated city to reach delivery before the timer expires. The Saboteur predicts the route and spends energy to delay movement or block paths. Server-side services validate actions; frontend checks are for input feedback and rendering only.

Implemented feature areas are visible in the current route/controller/service tree:

- Courier movement and abilities (Speed Boost, Shield, Reveal Route)
- Saboteur hurdle placement, energy recovery/spending, cooldowns, active hurdle limits, and expiry
- Traffic-signal runtime state, match timer/lives/delivery progress, versioned state polling
- Draw offer/response, forfeit, and result retrieval/display. Stats and history schemas/repositories are present, but match-completion writes are not wired into the current service flow.

Exact values belong in `backend/config/` and `frontend/src/game/v7/config/`; keep backend game rules authoritative and align client display/prediction values deliberately.

## Official map path

The main app uses backend-generated maps. `MapGenerationService` orchestrates the PHP generators under `backend/map/generation/`, then serializes a readable snapshot through `backend/map/serializer/`. `MapBootstrapService` stores bootstrap maps and match map snapshots in the cache. `MatchMapController` serves the map assigned to a participant. `MapController` also exposes current metadata and a seeded preview endpoint for development.

Current map generation settings in `backend/config/MapGenerationConfig.php` describe a 96 x 96 tile map, 3 x 3 zones, 32 x 16 pixel isometric tiles, seed-based generation and validation retries. The generator composes zones, roads, parks/lakes, bridges, tunnels, shortcuts, start/delivery points, traffic signals, and hurdle candidates. Use that config and the generator implementation for current values; older markdown contains proposals that may no longer match.

The frontend receives `BackendCityMapPayload`, converts it with `frontend/src/game/v7/backendPayload/BackendCityMapPayloadConverter.ts`, and renders via `game/v7/scene/MatchGameScene.ts` and `cityMap/rendering/`. `BackendMatchStatePayloadConverter.ts` maps server runtime state into the scene's rendering/runtime model.

Map payload types live in `frontend/src/common/apiType/MapApiType.ts` and `frontend/src/game/v7/types/`. Keep static generated map data separate from match runtime state (Courier location/lives, active hurdles, signal state, timer, role, and state version).

## Rules and controls

- Courier input is arrow-key movement; mouse drag pans the map, wheel zooms, and camera controls can recenter/focus.
- Saboteur selects a hurdle from the HUD and clicks a tile. Phaser previews hover validity, then submits an API action; server rejection is final.
- The frontend V7 `cityMap/rules/` and `cityMap/generation/` modules remain useful for local prediction/prototype and inspection. Do not use local client state as proof that a request is valid or authoritative.
- Hurdle tile support, role/zone/distance rules, energy costs, durations, ability effects, and match ending logic live in PHP services/config/constants. Read the relevant service before changing a rule.

For older manual curated layouts and prototype controls, read [prototypes-and-history.md](prototypes-and-history.md).
