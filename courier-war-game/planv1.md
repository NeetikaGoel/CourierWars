Run backend like this when testing:

php -S 127.0.0.1:8000 -t backend/public



Then frontend:

npm run dev



Test Commands
Backend generator direct test:

php -r 'require_once "backend/map/generation/CityMapGenerationBuilder.php"; $builder = new CityMapGenerationBuilder(); $map = $builder->cityMapGenerate(20260531); echo "ok " . $map["widthTiles"] . "x" . $map["heightTiles"] . " signals=" . count($map["trafficSignalList"]) . PHP_EOL;'



Frontend type check:

npx tsc --noEmit
Backend endpoint after starting PHP server:

http://127.0.0.1:8000/api/v1/maps/preview?seed=20260531




# Courier War Continuation Plan

## Summary
- No files were changed in this planning pass. This is the proposed `PLAN.md` content.
- Project root: `/Users/neetika.goel/Desktop/Version2/Courier-War-Game/neetika-goel-courier-war-game`.
- Source of truth decisions:
  - Backend owns map generation.
  - Backend generates one bootstrap map at app startup for now, stores it in the existing external PHP cache server, and returns it to the frontend through backend APIs.
  - Frontend owns Phaser rendering only.
  - Current code/file naming wins over older GDD/TAD wording; docs should be updated later to match implementation names.

## Current State
- Main frontend has polished landing, login, register, guest, auth-loading, home, waiting, placeholder loading/game/result pages, but still uses fake APIs in `frontend/src/main.ts`.
- Main frontend does not yet contain the full `game/v7` Phaser system from the POC.
- Backend has configs, constants, schemas, entities, repositories, and HTTP helper classes started.
- Backend does not yet have working controllers, services, cache client, auth service, map generation, or public routing wired.
- POC V7 already has the strongest gameplay foundation: seeded city generation, layered tiles, validation, camera, Courier movement, Saboteur hover/placement, traffic signals, hurdles, overlays, and debug HUD.
- Local `GameDesignDocument.md` is empty, so the pasted GDD/TAD plus local POC/backend docs are the planning source.

## Implementation Order
1. **Stabilize baseline**
   - Add the final `PLAN.md` later when file edits are allowed.
   - Fix known compile/runtime blockers first: fake API routing cleanup, `HomeSetupPage.ts` undefined variables, backend filename case mismatches, idempotency length check, match status value mismatch, and CSRF/comment/config inconsistencies.
2. **Backend map generation**
   - Port POC V7 map generation from TypeScript to PHP under `backend/map/generation/`.
   - Keep the same readable payload fields as the frontend V7 `CityMapGenerated` shape.
   - Implement deterministic seed generation, validation retries, and one official bootstrap map.
3. **Cache server integration**
   - Use the existing cache server as an external service.
   - Configure cache bootstrap/auth values for Courier War.
   - Add backend `CacheServerClient` and key factory.
   - Store bootstrap map at startup under a stable key such as `cw:map:bootstrap:current`.
4. **Startup scripts**
   - Add shell scripts later to start cache server, verify DB connectivity, start PHP backend, and start Vite frontend in order.
   - `start-all.sh` should fail loudly if cache or DB is unreachable.
5. **Frontend map rendering**
   - Copy/migrate POC V7 renderer/runtime/input/camera/types into main frontend.
   - Add `MapApi`, map payload types, and backend payload converter.
   - Wire `MatchLoadingPage` to fetch the cached backend map, then launch `MatchGamePage` / `MatchGameScene`.
6. **Match shell**
   - Use the same cached bootstrap map for all matches initially.
   - Add match create/waiting/loading flow around this map before adding real matchmaking complexity.
7. **Server-authoritative gameplay**
   - Add active match state in cache, state version polling, Courier move API, Saboteur hurdle API, energy/cooldowns, traffic signal runtime state, and active hurdle expiry.
   - Frontend preview rules remain for hover feedback, but backend response is final.
8. **Auth, stats, and results**
   - Wire real register/login/guest/profile APIs.
   - Add result persistence and stats updates after gameplay loop is stable.
   - Add abilities, lives-zero ending, result screen, play-again, and logout/guest-forget flows.
9. **Polish**
   - Replace placeholders with assets, tune map generation, balance hurdle costs/timers, and add visual QA across desktop sizes.

## Updated File Structure
Use paths relative to the project root above.

```txt
courier-war-game/
  frontend/
    src/
      common/api/
        ApiClient.ts, AuthApi.ts, ProfileApi.ts, MapApi.ts, MatchApi.ts,
        CourierActionApi.ts, SaboteurActionApi.ts
      common/apiType/
        ApiResponseType.ts, AuthApiType.ts, ProfileApiType.ts, MapApiType.ts,
        MatchApiType.ts, CourierActionApiType.ts, SaboteurActionApiType.ts
      common/state/
        AuthSessionState.ts, ProfileState.ts, MatchSetupState.ts,
        MatchRuntimeState.ts, MatchPollingController.ts,
        AuthRefreshController.ts, ClientActionIdFactory.ts
      game/v7/
        config/, types/, utility/, iso/
        backendPayload/
          BackendCityMapPayloadConverter.ts
          BackendMatchStatePayloadConverter.ts
          BackendHurdlePayloadConverter.ts
          BackendTrafficSignalPayloadConverter.ts
        cityMap/
          generation/     # local debug only after backend is official
          runtime/
          rules/          # frontend preview rules only
          rendering/
          camera/
          input/
        scene/
          MatchGameScene.ts
          MapPrototypeScene.ts
        debug/
      pages/
        landing/, auth/, home/, match/, shared/
  backend/
    api/v1/
      AuthController.php, ProfileController.php, MapController.php,
      MatchController.php, MatchMapController.php, MatchStateController.php,
      CourierActionController.php, SaboteurActionController.php, ResultController.php
    service/
      AuthService.php, ProfileService.php, MapGenerationService.php,
      MapBootstrapService.php, MatchService.php, MatchStateService.php,
      MovementService.php, HurdleService.php, AbilityService.php,
      ResultService.php, StatsService.php
    cache/
      CacheServerClient.php, CacheServerKeyFactory.php, CacheServerTtlConfig.php
    map/
      generation/
        RandomSeededGenerator.php, CityMapEmptyFactory.php, CityMapZoneBuilder.php,
        CityMapRoadPriorityRules.php, CityMapRoadNetworkGenerator.php,
        CityMapAreaGenerator.php, CityMapBridgeGenerator.php,
        CityMapTunnelGenerator.php, CityMapShortcutGenerator.php,
        CityMapStartDeliveryPlanner.php, CityMapRoadIntersectionDetector.php,
        CityMapTrafficSignalPlanner.php, CityMapHurdleCandidatePlanner.php,
        CityMapValidator.php, CityMapGenerationBuilder.php
      serializer/
        CityMapSnapshotSerializer.php, CityMapSnapshotHasher.php
      rule/
        CourierMovementRule.php, MovementCostRule.php, SaboteurPlacementRule.php,
        ZonePlacementRule.php, HurdleSupportRule.php, TrafficSignalRule.php
  scripts/
    start-cache-server.sh, start-backend.sh, start-frontend.sh,
    db-schema-apply.sh, db-seed-dev.sh, start-all.sh
```

## API And Payload Plan
- `GET /api/v1/maps/current`: returns the current cached bootstrap map payload.
- Later: `GET /api/v1/matches/{matchId}/map`: returns the map assigned to a match.
- Map payload must include `mapVersion`, `mapGenerationVersion`, `mapSeed`, `widthTiles`, `heightTiles`, `zoneList`, `trafficSignalList`, `startTilePoint`, `deliveryTilePoint`, `tileRows`, `validation`.
- Runtime state remains separate from generated map data: Courier position, traffic signal red/green state, active hurdles, cooldowns, energy, visited tiles, timer, winner.

## Test Plan
- Backend unit tests: same seed gives same map; start/delivery reachable; signals only on valid intersections; bridges only on water; hurdles only on valid candidate tiles.
- Cache tests: set/get/delete bootstrap map through the real cache server; fail cleanly if cache is unavailable.
- Frontend tests: TypeScript build, map payload converter, Phaser scene launches from backend map, camera zoom/drag, Courier visible.
- Integration smoke: `start-all.sh` starts cache, backend, frontend; frontend fetches `/api/v1/maps/current` and renders the city.
- Gameplay tests later: movement validation, red light expiry, hurdle cooldown/energy, active hurdle max, polling stateVersion, result/stats updates.

## Assumptions
- Existing external cache server is reused, not copied into this repo.
- One backend-generated bootstrap map is reused for all matches in the next milestone.
- Frontend V7 generation remains only for debug/prototype after backend generation is wired.
- Internal code names stay as current files define them; older GDD/TAD wording is updated later.
