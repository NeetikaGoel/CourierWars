# City map generation
Paths relative to `courier-war-game/`.

- The backend owns generation. `backend/map/generation/CityMapGenerationBuilder::cityMapGenerate(seed)` runs, in order: empty map → zones → roads/intersections → areas → bridges/tunnels/shortcuts → traffic signals → start/delivery → hurdle candidates → `CityMapValidator`, retrying on failure. It is deterministic per seed (`RandomSeededGenerator`). Config: `backend/config/MapGenerationConfig.php` (`MAP_VERSION`, sizes, `GENERATED_MAP_COUNT_INITIAL`). Tile enum: `map/type/CityTileValue.php`.
- `backend/map/serializer/` — `CityMapSnapshotSerializer` (readable JSON payload), `CityMapSnapshotHasher`.
- `service/MapGenerationService` wraps the builder. `MapBootstrapService` pre-generates N maps into cache (`backend/scripts/bootstrap-cache.php <count>`). `MapController` serves `/maps/current` and `/maps/preview?seed=`.
- Frontend: `frontend/src/game/v7/backendPayload/BackendCityMapPayloadConverter.ts` converts the backend payload to the V7 `CityMap` types (`game/v7/types/`).

Gotchas
- PHP `backend/map/generation/*` is a port of TS `frontend/src/game/v7/cityMap/generation/*`, with matching file names. `MatchGameScene` renders the backend payload, which it converts with `backendCityMapPayloadConvert`. The TS generator is still imported for its `CityMapGenerated` types. When you change payload fields, update the PHP serializer, `BackendCityMapPayloadType.ts`, the converter and the TS types together.
- Long design notes: `backend/mapgeneration.md` (1.3k lines, so skim it).
