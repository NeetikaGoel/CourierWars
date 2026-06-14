Backend generates one official readable city map JSON
  ↓
Frontend calls backend map endpoint
  ↓
Frontend renders that backend-generated map in Phaser
  ↓
You can show: roads, zones, parks, lakes, bridges, traffic signals, start, delivery, and isometric camera



GET /api/v1/maps/preview?seed=20260610
  ↓
Backend generates readable map JSON
  ↓
Frontend fetches JSON
  ↓
Frontend renders isometric map in Phaser



Big picture flow
Tomorrow demo flow
Open frontend
  ↓
Go to Match Loading / Map Preview screen
  ↓
Frontend calls backend:
GET /api/v1/maps/preview?seed=20260610
  ↓
Backend creates 96 x 96 generated city map
  ↓
Backend returns full readable JSON
  ↓
Frontend converts JSON into V7 map shape
  ↓
Phaser renders isometric city map
  ↓
Camera can zoom/drag
  ↓
Start and delivery are visible
Full final match flow later
User logs in / guest
  ↓
HomeSetupPage
  ↓
User selects difficulty + role preference
  ↓
POST /api/v1/matches
  ↓
Backend finds/creates match
  ↓
Backend allocates generated map from cache/bootstrap pool
  ↓
Backend stores match map under:
cw:match:{matchId}:map
  ↓
Frontend goes to MatchLoadingPage
  ↓
GET /api/v1/matches/{matchId}/map
  ↓
Frontend renders backend map
  ↓
GET /api/v1/matches/{matchId}/state every 500 ms
  ↓
MatchGameScene updates runtime objects








Backend:
Generate city map data
Validate map
Store map in cache
Send JSON

Frontend:
Receive map JSON
Convert it into renderable objects
Draw it using Phaser



Backend files to make for map generation

Keep the backend structure simpler than the huge frontend V7 structure. PHP should generate arrays and JSON payloads. It does not need a huge entity class for every tile.

Use this:

backend/
  map/
    RandomSeededGenerator.php
    CityMapTileFactory.php
    CityMapZoneBuilder.php
    CityMapRoadNetworkBuilder.php
    CityMapAreaBuilder.php
    CityMapBridgeBuilder.php
    CityMapTunnelBuilder.php
    CityMapShortcutBuilder.php
    CityMapStartDeliveryPlanner.php
    CityMapIntersectionDetector.php
    CityMapTrafficSignalPlanner.php
    CityMapHurdleCandidatePlanner.php
    CityMapValidator.php
    CityMapGenerationBuilder.php
    CityMapPayloadBuilder.php

  service/
    MapGenerationService.php
    MapBootstrapService.php

  cache/
    CacheClient.php
    CacheKeyFactory.php

  api/
    v1/
      MapController.php
      MatchMapController.php later

  public/
    index.php



    Backend Helper Files To Create
backend/map/type/CityTileValue.php
backend/config/CourierMovementConfig.php
backend/map/serializer/CityMapSnapshotSerializer.php
backend/map/serializer/CityMapSnapshotHasher.php
backend/service/MapGenerationService.php
backend/api/v1/MapController.php
Their purpose:

CityTileValue.php: PHP constants for terrain/path/road/feature strings.
CourierMovementConfig.php: movement costs used while generating tiles.
CityMapSnapshotSerializer.php: builds frontend-readable map payload.
CityMapSnapshotHasher.php: creates debug checksum.
MapGenerationService.php: calls builder and returns generated payload.
MapController.php: exposes GET /api/v1/maps/preview?seed=....

If you already use services/ instead of service/, keep your existing naming. The idea is more important than the exact folder name.

Backend file responsibilities
backend/map/RandomSeededGenerator.php

This is the PHP version of frontend RandomSeededGenerator.ts.

Purpose:

Generate deterministic random numbers from a seed
Same seed should produce same map

Functions:

__construct(int $seed)
nextFloat(): float
nextInt(int $min, int $max): int
pick(array $items): mixed
chance(int $percent): bool

Why needed:

Map generation must be stable for same seed
Backend needs repeatable generated layouts

Copy logic from:

frontend/src/game/v7/cityMap/generation/RandomSeededGenerator.ts

Convert TypeScript class syntax to PHP.

backend/map/CityMapTileFactory.php

Purpose:

Create one default tile array

The backend tile should use the same readable field names that frontend expects.

Tile shape:

[
    'x' => 0,
    'y' => 0,
    'terrainType' => 'building',
    'roadClass' => 'none',
    'pathKind' => 'none',
    'featureKindList' => [],
    'zoneId' => 'zone-0-0',
    'walkable' => false,
    'baseMovementCost' => 999,
    'intersectionId' => null,
    'trafficSignalId' => null,
    'bridgeId' => null,
    'tunnelId' => null,
    'shortcutId' => null,
    'tunnelEntrance' => false,
    'shortcutEntrance' => false,
    'bridgeEntrance' => false,
    'start' => false,
    'delivery' => false,
    'hurdleCandidateList' => [],
]

Functions:

createTile(int $x, int $y): array
createEmptyRows(int $width, int $height): array

Why needed:

Every tile starts from a consistent base
Later builders modify terrain/roads/features safely
backend/map/CityMapZoneBuilder.php

Purpose:

Divide 96 x 96 map into 3 x 3 zones
Assign zone id to every tile
Return zone list for frontend overlays

Functions:

buildZones(): array
assignZonesToTiles(array &$tileRows, array $zoneList): void
zoneIdForTile(int $x, int $y): string

Zone payload:

[
    'zoneId' => 'zone-0-0',
    'columnIndex' => 0,
    'rowIndex' => 0,
    'startX' => 0,
    'startY' => 0,
    'endX' => 31,
    'endY' => 31,
]

Why needed:

Courier camera focus uses zone
Saboteur placement rules use current zone
Frontend can draw zone overlay

The GDD requires map zones and placement states for gameplay readability.

backend/map/CityMapRoadNetworkBuilder.php

Purpose:

Create main city road structure

For tomorrow, keep road generation simple but sensible:

Avenues: width 3, major vertical/horizontal roads
District roads: width 2, zone-level roads
Local roads: width 1, smaller connecting roads
Important corridor: guaranteed connected path from start side to delivery side

Functions:

buildRoads(array &$tileRows, RandomSeededGenerator $random): void
drawRoadLine(array &$tileRows, int $x1, int $y1, int $x2, int $y2, string $roadClass, int $width): void
setRoadTile(array &$tileRows, int $x, int $y, string $roadClass): void

Road priority:

avenue > district > local

Why needed:

Map should look like city road network, not random walkable dots
Avenues should not be overwritten by tiny roads

Copy logic from:

CityMapRoadNetworkGenerator.ts
CityMapRoadPriorityRules.ts

but simplify for PHP.

backend/map/CityMapAreaBuilder.php

Purpose:

Place parks and lakes in unused building blocks

Functions:

placeParks(array &$tileRows, RandomSeededGenerator $random): array
placeLakes(array &$tileRows, RandomSeededGenerator $random): array
canPlaceArea(array $tileRows, int $startX, int $startY, int $width, int $height): bool
fillArea(array &$tileRows, int $startX, int $startY, int $width, int $height, string $terrainType): void

Rules:

Do not overwrite roads
Do not overwrite existing park/lake
Do not create tiny 1-tile lakes
Keep parks/lakes as rectangular-ish city blocks for now

Why needed:

The GDD wants lakes/parks/buildings but not random clutter
backend/map/CityMapBridgeBuilder.php

Purpose:

Create bridges only over lakes/water

Functions:

placeBridges(array &$tileRows, array $lakeList, RandomSeededGenerator $random): array
canBridgeAcrossLake(array $tileRows, array $lake): bool

Rules:

Bridge must be on water
Bridge must connect roads or create road connection
Bridge is walkable
Bridge gets bridgeId
Bridge entrances are marked

Why needed:

The old issue was bridges appearing on normal land
This guarantees bridge only exists where water exists
backend/map/CityMapTunnelBuilder.php

Purpose:

Create hidden/faster walkable paths through building terrain

Functions:

placeTunnels(array &$tileRows, RandomSeededGenerator $random): array
findTunnelEndpoints(array $tileRows, RandomSeededGenerator $random): ?array
drawTunnel(array &$tileRows, array $start, array $end, string $tunnelId): void

Rules:

Tunnel can pass through building
Tunnel cannot pass through lake/water
Tunnel cannot pass through park
Tunnel endpoints should touch road
Tunnel entrance tiles are marked
Tunnel tiles are walkable

Why needed:

GDD wants subtle tunnels, not HUD-spoonfed shortcuts

For tomorrow, tunnels can be simple straight/angled paths. They can be improved later.

backend/map/CityMapShortcutBuilder.php

Purpose:

Create subtle shorter but slower shortcut paths

Functions:

placeShortcuts(array &$tileRows, RandomSeededGenerator $random): array
findShortcutEndpoints(array $tileRows, RandomSeededGenerator $random): ?array
drawShortcut(array &$tileRows, array $start, array $end, string $shortcutId): void

Rules:

Shortcut connects useful roads
Shortcut does not cross water/parks
Shortcut is walkable
Shortcut has higher movement cost than normal road
Shortcut entrance is subtly marked

Why needed:

Courier gets route choice: shorter distance but slower movement

For tomorrow, if time is short, implement tunnels first and shortcuts second.

backend/map/CityMapStartDeliveryPlanner.php

Purpose:

Place visible start and delivery tiles on valid roads

Functions:

placeStartAndDelivery(array &$tileRows, RandomSeededGenerator $random): array
findStartTile(array $tileRows): array
findDeliveryTile(array $tileRows): array

Rules:

Start on road
Delivery on road
Not traffic signal
Not bridge/tunnel/shortcut entrance
Reachability required
Usually far apart

Payload:

[
    'startTilePoint' => ['x' => 4, 'y' => 5],
    'deliveryTilePoint' => ['x' => 91, 'y' => 90],
]

Why needed:

Tomorrow demo must clearly show where Courier starts and where delivery is
backend/map/CityMapIntersectionDetector.php

Purpose:

Find road intersections where signals/signs can exist

Functions:

detectIntersections(array &$tileRows): array
isIntersection(array $tileRows, int $x, int $y): bool
hasHorizontalRoad(array $tileRows, int $x, int $y): bool
hasVerticalRoad(array $tileRows, int $x, int $y): bool

Valid intersection:

Walkable road
Has horizontal road neighbor
Has vertical road neighbor
Not start/delivery
Not tunnel/shortcut/bridge

Why needed:

Traffic signals should appear at sensible junctions, not dead ends
backend/map/CityMapTrafficSignalPlanner.php

Purpose:

Place green traffic signals on valid intersections

Functions:

placeTrafficSignals(array &$tileRows, array $intersectionList, RandomSeededGenerator $random): array
isFarEnoughFromOtherSignals(array $signalList, int $x, int $y): bool

Rules:

Only at intersections
Minimum distance 7 tiles
Prefer avenue/district intersections
Green by default
Runtime red state is not generated map terrain

Traffic signal payload:

[
    'trafficSignalId' => 'signal-1',
    'tilePoint' => ['x' => 20, 'y' => 16],
    'stateDefault' => 'green',
]

Why needed:

GDD says green by default, red only when Saboteur activates it
backend/map/CityMapHurdleCandidatePlanner.php

Purpose:

Mark which Saboteur hurdles each tile supports

Functions:

assignHurdleCandidates(array &$tileRows): void
candidateListForTile(array $tile): array

Examples:

traffic signal tile -> redTrafficLight
road tile -> roadBlock, brokenRoad
district/avenue road -> constructionWork, trafficJam, movingBarrier, securityCheckpoint
bridge/tunnel/shortcut entrance -> closedGate
intersection -> wrongDirectionSign

Why needed:

Frontend hover preview can show valid/invalid tile
Backend later uses same candidate list for authoritative validation
backend/map/CityMapValidator.php

Purpose:

Reject bad maps before sending to frontend

Functions:

validate(array $mapPayload): array
validateStartDeliveryReachable(array $tileRows, array $start, array $delivery): array
validateTrafficSignals(array $tileRows, array $signals): array
validateBridges(array $tileRows): array
validateZones(array $tileRows, array $zones): array

Validation result:

[
    'valid' => true,
    'errorList' => [],
    'warningList' => [],
    'stats' => [
        'walkableTileCount' => 1200,
        'trafficSignalCount' => 44,
        'parkCount' => 7,
        'lakeCount' => 4,
    ],
]

Why needed:

The map generator can retry if layout is invalid
Start and delivery must always be reachable

BSTD4 requires server-side validation. Client validation is not security.

backend/map/CityMapGenerationBuilder.php

Purpose:

Orchestrate full generation in correct order

Function:

generate(int $seed): array

Generation order should be:

Create empty map
Build zones
Assign zone ids
Generate roads
Generate parks/lakes
Generate bridges
Generate tunnels
Generate shortcuts
Place start/delivery
Detect intersections
Place traffic signals
Assign hurdle candidates
Validate
Retry with seed offset if invalid
Return final map payload

This follows the map design document’s generation order.

backend/map/CityMapPayloadBuilder.php

Purpose:

Build final readable JSON payload returned to frontend

Function:

buildPayload(int $seed, array $tileRows, array $zoneList, array $trafficSignalList, array $startTilePoint, array $deliveryTilePoint, array $validationResult): array

Payload shape:

[
    'mapVersion' => 'v1',
    'mapGenerationVersion' => 'city_map_generation_v7',
    'mapSeed' => 20260610,
    'widthTiles' => 96,
    'heightTiles' => 96,
    'zoneColumns' => 3,
    'zoneRows' => 3,
    'tileSize' => [
        'widthPixels' => 32,
        'heightPixels' => 16,
    ],
    'startTilePoint' => ['x' => 4, 'y' => 5],
    'deliveryTilePoint' => ['x' => 91, 'y' => 90],
    'zoneList' => [],
    'trafficSignalList' => [],
    'tileRows' => [],
    'validation' => [],
]

Why needed:

Frontend should receive one clean map object
Debugging is easier because JSON is readable
Backend services to make
backend/service/MapGenerationService.php

Purpose:

Public service used by controllers and match creation

Functions:

generateMapForSeed(int $seed): array
generateMapWithRandomSeed(): array
getCurrentMapMetadata(): array

Uses:

MapGenerationConfig
CityMapGenerationBuilder
Logger later

Why needed:

Controller should not directly run map generation files
Service gives one clean API
backend/service/MapBootstrapService.php

Purpose:

Pre-generate around 10 maps and store them in cache

Functions:

bootstrapInitialMaps(): void
getAvailableBootstrapMap(): ?array
storeGeneratedMap(array $mapPayload): void

Cache key idea:

cw:map:bootstrap:list
cw:map:bootstrap:{mapSeed}

Why needed:

TAD says pre-generate around 10 maps for quick allocation
This avoids delay when match starts

This can wait until after tomorrow demo if needed.

Backend cache files needed

If not already made, create these before map bootstrap.

backend/cache/CacheClient.php

Purpose:

Call the custom PHP cache server

Functions:

set(string $key, array $value, int $ttlSeconds): bool
get(string $key): ?array
delete(string $key): bool

For tomorrow, if cache client is not ready, you can first return generated map directly from controller and add cache right after.

backend/cache/CacheKeyFactory.php

Purpose:

Create consistent cache keys

Functions:

mapBootstrapList(): string
mapBootstrapBySeed(int $seed): string
matchMap(string|int $matchId): string

Cache keys:

cw:map:bootstrap:list
cw:map:bootstrap:{seed}
cw:match:{matchId}:map
Backend controller files
backend/api/v1/MapController.php

For tomorrow, this should support:

GET /api/v1/maps/current
GET /api/v1/maps/preview?seed=20260610
GET /api/v1/maps/current

Returns metadata only:

{
  "mapVersion": "v1",
  "mapGenerationVersion": "city_map_generation_v7",
  "widthTiles": 96,
  "heightTiles": 96,
  "zoneColumns": 3,
  "zoneRows": 3,
  "tileSize": {
    "widthPixels": 32,
    "heightPixels": 16
  }
}
GET /api/v1/maps/preview?seed=20260610

Returns full generated readable map JSON.

Boundary checks:

method must be GET
seed optional
seed must be int if present
seed must be between MAP_SEED_MIN and MAP_SEED_MAX
no request body
return 400 for invalid seed
return 500 only for unexpected error

This preview endpoint is for local development/demo. Later, real match uses MatchMapController.

backend/api/v1/MatchMapController.php

Not needed for tomorrow unless match creation is ready.

Later endpoint:

GET /api/v1/matches/{matchId}/map

Boundary checks:

method GET
auth required
matchId valid
caller must be participant
map must exist in cache
if cache missing -> match disconnected/cancelled path
public/index.php routing for tomorrow

Add only these routes first:

GET /api/v1/maps/current
GET /api/v1/maps/preview

Do not route full match APIs yet unless needed.

Frontend files to make/update

The latest frontend structure already has MapApi, map payload types, backend payload converter, and Phaser V7 rendering folders planned.

For tomorrow, make only this subset work.

frontend/src/common/api/
  MapApi.ts

frontend/src/common/apiType/
  MapApiType.ts

frontend/src/game/v7/types/
  BackendCityMapPayloadType.ts

frontend/src/game/v7/backendPayload/
  BackendCityMapPayloadConverter.ts

frontend/src/game/v7/scene/
  MatchGameScene.ts

frontend/src/pages/match/match-loading/
  MatchLoadingPage.ts
  MatchLoadingPage.html
  MatchLoadingPage.css

frontend/src/pages/match/match-game/
  MatchGamePage.ts
  MatchGamePage.html
  MatchGamePage.css
Frontend file responsibilities
frontend/src/common/api/MapApi.ts

Purpose:

Call backend map endpoints

Functions:

mapMetadataGet(): Promise<MapMetadataResponse>
mapPreviewGet(seed?: number): Promise<BackendCityMapPayload>
matchMapGet(matchId: number): Promise<BackendCityMapPayload> later

For tomorrow:

GET /api/v1/maps/preview?seed=20260610
frontend/src/common/apiType/MapApiType.ts

Purpose:

TypeScript types for backend map response

Should contain:

MapMetadataResponse
BackendCityMapPayload
BackendCityTilePayload
BackendCityZonePayload
BackendTrafficSignalPayload

Keep the same property names as backend JSON.

frontend/src/game/v7/types/BackendCityMapPayloadType.ts

Purpose:

Game-layer map payload type

You can either:

Option A: re-export MapApiType BackendCityMapPayload
Option B: keep game-specific duplicate type

For simplicity, choose Option A:

export type { BackendCityMapPayload } from "../../../common/apiType/MapApiType";

Avoid duplicate types if possible.

frontend/src/game/v7/backendPayload/BackendCityMapPayloadConverter.ts

Purpose:

Convert backend readable JSON into whatever CityMapRenderer expects

Best approach:

Make backend payload use same shape as frontend CityMapGenerated as much as possible
Then converter stays small

Functions:

convert(payload: BackendCityMapPayload): CityMapGenerated

If existing renderer expects tileRows, zoneList, etc., the converter may mostly return the same object.

frontend/src/game/v7/scene/MatchGameScene.ts

Purpose:

Phaser scene that renders backend map

For tomorrow, do not implement movement/hurdles yet.

Scene should:

receive backend map payload through Phaser scene init data
convert payload
draw map
draw start marker
draw delivery marker
draw traffic signals
setup camera zoom/drag

Copy from:

MapPrototypeScene.ts

Then remove/disable:

local map generation
prototype role switching
Saboteur placement
Courier movement if not needed
debug-only local state

Keep:

MapRenderer
camera setup
isometric rendering
start/delivery marker rendering
traffic signal rendering
zone overlay if available
MatchLoadingPage.ts

Purpose:

Fetch backend map JSON before starting Phaser

For tomorrow:

call MapApi.mapPreviewGet(20260610)
then go to MatchGamePage with map payload

Later:

call MatchApi.getMatchMap(matchId)
call MatchApi.getMatchState(matchId)
MatchGamePage.ts

Purpose:

Host Phaser canvas
Start MatchGameScene with map payload

For tomorrow:

create Phaser game instance
start MatchGameScene
pass mapPayload in scene data

Later:

also start polling match state every 500 ms
wire CourierActionApi/SaboteurActionApi
What code to copy from existing frontend V7

Copy these V7 files into the new frontend if not already copied:

game/v7/config/
  PhaserGameConfig.ts
  CityMapVisualConfig.ts
  MapCameraConfig.ts
  MapAssetDisplayConfig.ts
  DebugDisplayConfig.ts

game/v7/utility/
  PhaserColorConverter.ts
  CityTileKeyConverter.ts
  CityTileDistanceCalculator.ts

game/v7/iso/
  IsometricCoordinateCalculator.ts

game/v7/rendering/
  CityMapRenderer.ts
  TileBaseRenderer.ts
  TileTerrainRenderer.ts
  TileRoadRenderer.ts
  TileFeatureRenderer.ts
  AssetPlaceholderRenderer.ts
  TileOverlayRenderer.ts
  ZoneOverlayRenderer.ts
  CourierRenderer.ts

game/v7/camera/
  CameraGameController.ts
  CameraZoneViewCalculator.ts

Keep these only for local prototype/debug, not official map generation:

game/v7/cityMap/generation/

Do not depend on frontend generation for official match map.

What code to port from TypeScript to PHP

Port this logic from TypeScript into PHP backend:

RandomSeededGenerator.ts
CityMapEmptyFactory.ts
CityMapZoneBuilder.ts
CityMapRoadPriorityRules.ts
CityMapRoadNetworkGenerator.ts
CityMapAreaGenerator.ts
CityMapBridgeGenerator.ts
CityMapTunnelGenerator.ts
CityMapShortcutGenerator.ts
CityMapStartDeliveryPlanner.ts
CityMapRoadIntersectionDetector.ts
CityMapTrafficSignalPlanner.ts
CityMapHurdleCandidatePlanner.ts
CityMapValidator.ts
CityMapGenerationBuilder.ts

But for tomorrow, do not port everything perfectly.

Use this priority:

1. RandomSeededGenerator
2. CityMapTileFactory
3. CityMapZoneBuilder
4. CityMapRoadNetworkBuilder
5. CityMapAreaBuilder
6. CityMapBridgeBuilder
7. CityMapStartDeliveryPlanner
8. CityMapIntersectionDetector
9. CityMapTrafficSignalPlanner
10. CityMapHurdleCandidatePlanner
11. CityMapValidator
12. CityMapPayloadBuilder
13. CityMapGenerationBuilder

Then, if time remains:

14. CityMapTunnelBuilder
15. CityMapShortcutBuilder

Reason:

Roads + zones + parks + lakes + bridges + signals + start/delivery already create a good demo
Tunnels/shortcuts can be added after because they are subtler
Exact implementation order
Step 1 — Define backend payload contract

Make this final before coding.

Use this payload:

{
  "mapVersion": "v1",
  "mapGenerationVersion": "city_map_generation_v7",
  "mapSeed": 20260610,
  "widthTiles": 96,
  "heightTiles": 96,
  "zoneColumns": 3,
  "zoneRows": 3,
  "tileSize": {
    "widthPixels": 32,
    "heightPixels": 16
  },
  "startTilePoint": {
    "x": 4,
    "y": 5
  },
  "deliveryTilePoint": {
    "x": 91,
    "y": 90
  },
  "zoneList": [],
  "trafficSignalList": [],
  "tileRows": [],
  "validation": {
    "valid": true,
    "errorList": [],
    "warningList": [],
    "stats": {}
  }
}

One tile:

{
  "x": 10,
  "y": 12,
  "terrainType": "land",
  "roadClass": "avenueRoad",
  "pathKind": "road",
  "featureKindList": ["trafficSignal"],
  "zoneId": "zone-0-0",
  "walkable": true,
  "baseMovementCost": 0.85,
  "intersectionId": "intersection-10-12",
  "trafficSignalId": "signal-1",
  "bridgeId": null,
  "tunnelId": null,
  "shortcutId": null,
  "tunnelEntrance": false,
  "shortcutEntrance": false,
  "bridgeEntrance": false,
  "start": false,
  "delivery": false,
  "hurdleCandidateList": ["redTrafficLight", "roadBlock"]
}
Step 2 — Make backend map constants

Add:

backend/constants/
  MapTerrainValue.php
  MapRoadClassValue.php
  MapPathKindValue.php
  MapFeatureValue.php
  MapValidationIssueCode.php

Use values like:

terrain:
building, land, park, water

roadClass:
none, localRoad, districtRoad, avenueRoad

pathKind:
none, road, bridge, tunnel, shortcut

feature:
trafficSignal, start, delivery, tunnelEntrance, shortcutEntrance, bridgeEntrance

You already have HurdleTypeValue.php, so reuse that for hurdle candidates.

Step 3 — Build backend map generator without cache first

First make:

MapGenerationService.generateMapForSeed(20260610)

Return array directly.

Do not add cache until generation works.

This avoids debugging two problems at once.

Step 4 — Expose preview API

Add route:

GET /api/v1/maps/preview?seed=20260610

Response:

standard envelope
data = map payload

Example:

{
  "success": true,
  "data": {
    "mapVersion": "v1",
    "tileRows": []
  },
  "error": null,
  "meta": {}
}

Boundary checks:

GET only
seed optional
seed integer if present
seed within allowed range
no raw request body
Step 5 — Test backend only

Open in browser/Postman:

http://localhost:<backend-port>/api/v1/maps/preview?seed=20260610

Check:

JSON opens
tileRows has 96 rows
each row has 96 tiles
startTilePoint exists
deliveryTilePoint exists
trafficSignalList exists
validation.valid = true
Step 6 — Add frontend MapApi

Make frontend call:

GET /api/v1/maps/preview?seed=20260610

Then console log response first.

Do not render until response is correct.

Step 7 — Add frontend converter

Convert backend payload into current renderer shape.

Best case:

converter returns payload as-is

because backend field names match frontend.

Step 8 — Add MatchGameScene render

Use MatchGameScene with scene data:

{
  mapPayload
}

Scene does:

convert payload
draw map
setup camera
draw markers
Step 9 — Wire MatchLoadingPage to MatchGamePage

For tomorrow demo, from Home page or a temporary button:

Click "Preview Map"
  ↓
MatchLoadingPage fetches preview map
  ↓
MatchGamePage renders it

You can later replace preview map with real match map.

Minimal demo folder structure

For tomorrow, make only this new subset.

Backend
backend/
  constants/
    MapTerrainValue.php
    MapRoadClassValue.php
    MapPathKindValue.php
    MapFeatureValue.php
    MapValidationIssueCode.php

  map/
    RandomSeededGenerator.php
    CityMapTileFactory.php
    CityMapZoneBuilder.php
    CityMapRoadNetworkBuilder.php
    CityMapAreaBuilder.php
    CityMapBridgeBuilder.php
    CityMapStartDeliveryPlanner.php
    CityMapIntersectionDetector.php
    CityMapTrafficSignalPlanner.php
    CityMapHurdleCandidatePlanner.php
    CityMapValidator.php
    CityMapPayloadBuilder.php
    CityMapGenerationBuilder.php

  service/
    MapGenerationService.php

  api/
    v1/
      MapController.php

  public/
    index.php

Optional after basic render:

backend/map/
  CityMapTunnelBuilder.php
  CityMapShortcutBuilder.php

backend/cache/
  CacheClient.php
  CacheKeyFactory.php

backend/service/
  MapBootstrapService.php
Frontend
frontend/src/common/api/
  MapApi.ts

frontend/src/common/apiType/
  MapApiType.ts

frontend/src/game/v7/types/
  BackendCityMapPayloadType.ts

frontend/src/game/v7/backendPayload/
  BackendCityMapPayloadConverter.ts

frontend/src/game/v7/scene/
  MatchGameScene.ts

frontend/src/pages/match/match-loading/
  MatchLoadingPage.ts

frontend/src/pages/match/match-game/
  MatchGamePage.ts
Backend generation algorithm for first working version

Use this simplified version first:

1. Create 96 x 96 building map
2. Assign 3 x 3 zones
3. Draw avenues every ~24 tiles
4. Draw district roads inside each zone
5. Draw some local connector roads
6. Place parks/lakes in empty building blocks
7. Put bridges across some lakes
8. Place start near top-left road
9. Place delivery near bottom-right road
10. Detect intersections
11. Place traffic signals with minimum spacing
12. Add hurdle candidates
13. Validate reachability
14. Return JSON

This is enough to show a map tomorrow.

Then improve:

15. Add tunnels
16. Add shortcuts
17. Add bootstrap map cache
18. Add match map API
Frontend rendering algorithm for first working version
1. MatchLoadingPage calls MapApi.previewMapGet(seed)
2. Store returned payload temporarily
3. Go to MatchGamePage
4. MatchGamePage creates Phaser game
5. MatchGameScene receives payload
6. BackendCityMapPayloadConverter converts payload
7. CityMapRenderer draws tileRows
8. TileFeatureRenderer draws start/delivery/signals
9. CameraGameController enables zoom/drag
What to show tomorrow

You can show this:

Backend endpoint returning readable generated map JSON
Frontend loading that map from backend
Isometric city rendered from backend payload
3 x 3 zones visible
Start marker visible
Delivery marker visible
Roads/avenues visible
Parks/lakes visible
Bridges visible
Traffic signals visible and green
Camera zoom/drag working
Seed printed in UI or console

This is a strong milestone because it proves:

Backend is official map authority
Frontend is render-only for official map
Full readable JSON payload works
The V7 render system can consume backend data
What not to do before tomorrow

Do not start these yet:

full auth connection
real matchmaking queues
Courier move API
Saboteur hurdle API
active match polling
JWT/CSRF integration with map preview
database match persistence
result screen integration

Those are important, but they will slow down the map proof.

After tomorrow demo, next proper integration order

After map preview works:

1. Add cache client
2. Add bootstrap map cache with 10 generated maps
3. Add POST /api/v1/matches
4. Match creation allocates one cached map
5. Store map under cw:match:{matchId}:map
6. Add GET /api/v1/matches/{matchId}/map
7. MatchLoadingPage calls real match map endpoint
8. MatchGameScene renders real match map
9. Add match state polling
10. Add Courier/Saboteur runtime actions
One tiny decision for you

For tomorrow, I recommend using a clearly local/dev endpoint:

GET /api/v1/maps/preview?seed=20260610

This avoids blocking on auth and matchmaking.

Later, production uses:

GET /api/v1/matches/{matchId}/map

That way you get something visible fast, but the final architecture still follows the TAD.