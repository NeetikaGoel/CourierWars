Below is the finalized **BSTD14-compliant folder and file plan** for the new Courier War map system.

Use this directly as your `plan.md`.

---

# Courier War V7 Isometric City Map Plan

## 1. Naming Standard Applied

This project will follow **BSTD14 hierarchical naming**.

Names must read:

```txt
generic → category → subcategory → specific trait
```

For TypeScript:

| Entity                          | Convention                                  |
| ------------------------------- | ------------------------------------------- |
| Folders                         | `lowerCamelCase` or lowercase when one word |
| Files                           | `PascalCase.ts`                             |
| Classes                         | `PascalCase`                                |
| Types / interfaces              | `PascalCase`                                |
| Functions / methods             | `camelCase`                                 |
| Variables                       | `camelCase`                                 |
| Config objects                  | `camelCase`                                 |
| True global primitive constants | `UPPER_SNAKE_CASE` only when needed         |

The folder path is considered part of the namespace.

Example:

```txt
src/game/courierWar/v7/cityMap/generation/CityMapRoadNetworkGenerator.ts
```

reads as:

```txt
game → courierWar → v7 → cityMap → generation → roadNetwork → generator
```

So the file name does not need to repeat every parent folder, but it should still be clear when imported.

---

## 2. Final Root Folder

The new version should live here:

```txt
src/game/courierWar/v7/
```

The old prototype can remain untouched:

```txt
src/game/v6/
```

or wherever your current files are.

The new version should not patch the old `MapGenerator.ts` directly.

---

# 3. Final Folder Structure

```txt
src/
  main.ts

  game/
      v7/
        config/
          PhaserGameConfig.ts
          CityMapGenerationConfig.ts
          CityMapVisualConfig.ts
          CourierMovementConfig.ts
          MapCameraConfig.ts
          SaboteurHurdleConfig.ts
          MapAssetDisplayConfig.ts
          DebugDisplayConfig.ts

        types/
          CoordinateType.ts
          DirectionType.ts
          PlayerRoleType.ts
          CityTileType.ts
          CityMapType.ts
          CityZoneType.ts
          TrafficSignalType.ts
          SaboteurHurdleType.ts
          MatchRuntimeStateType.ts
          CityMapValidationType.ts
          MapAssetDisplayType.ts

        utility/
          PhaserColorConverter.ts
          CityTileKeyConverter.ts
          CityTileDistanceCalculator.ts
          DirectionDeltaResolver.ts

        iso/
          IsometricCoordinateCalculator.ts

        cityMap/
          generation/
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
            CityMapGeneratedStore.ts

          runtime/
            MatchPrototypeState.ts
            TrafficSignalStateStore.ts
            ActiveHurdleStateStore.ts
            CourierTrailStateStore.ts
            TileInteractionStateStore.ts

          rules/
            CourierMovementRules.ts
            MovementCostRules.ts
            SaboteurPlacementRules.ts
            ZonePlacementRules.ts
            HurdleSupportRules.ts
            TrafficSignalRules.ts

          rendering/
            CityMapRenderer.ts
            TileBaseRenderer.ts
            TileTerrainRenderer.ts
            TileRoadRenderer.ts
            TileFeatureRenderer.ts
            AssetPlaceholderRenderer.ts
            AssetImageRenderer.ts
            TileOverlayRenderer.ts
            ZoneOverlayRenderer.ts
            CourierRenderer.ts

          camera/
            CameraGameController.ts
            CameraZoneViewCalculator.ts

          input/
            CourierMovementInputController.ts
            PointerTileInputResolver.ts
            SaboteurHoverInputController.ts
            SaboteurPlacementInputController.ts
            PrototypeRoleInputController.ts

        scene/
          MapPrototypeScene.ts

        debug/
          DebugTextOverlay.ts
          DebugKeyboardShortcutController.ts
          DebugMapValidationRenderer.ts
```

---

# 4. Folder Purpose Summary

## `config/`

Contains editable configuration values only.

Examples:

```txt
map size
road width
camera zoom
movement speed
colors
saboteur hurdle duration
asset toggle
debug toggle
```

No generation logic should be here.

---

## `types/`

Contains shared TypeScript interfaces, type aliases, and enum-like constant objects.

This folder defines the shape of the system.

No Phaser rendering, no generation logic, no runtime logic.

---

## `sharedUtility/`

Contains small reusable utility modules.

These files must be specific. No generic `Utils.ts`, `Helpers.ts`, or `Common.ts`.

---

## `isometric/`

Contains coordinate conversion logic.

This is where tile coordinates become isometric screen coordinates, and mouse/screen positions become tile coordinates.

---

## `cityMap/generation/`

Contains city map generation only.

This folder creates the generated city map.

It does not handle runtime red lights, active hurdles, player input, camera, or Phaser scene logic.

---

## `cityMap/runtime/`

Contains match-time state.

Examples:

```txt
traffic signal state
active hurdles
courier visited trail
hovered tile
selected tile
selected saboteur hurdle
```

This is separate from generated map data.

---

## `cityMap/rules/`

Contains rule checks.

Examples:

```txt
can Courier enter tile?
can Saboteur place hurdle?
is tile too close?
does tile support hurdle?
is red light activation valid?
```

Rules do not draw anything.

---

## `cityMap/rendering/`

Contains Phaser drawing logic.

Rendering reads generated map + runtime state and draws them.

It should not decide gameplay rules.

---

## `cityMap/camera/`

Contains camera behavior.

Examples:

```txt
follow Courier
focus current zone
show adjacent zones
zoom to pointer
```

---

## `cityMap/input/`

Contains keyboard and mouse input controllers.

Examples:

```txt
held arrow movement
pointer-to-tile resolving
saboteur hover
saboteur placement click
prototype role toggle
```

---

## `scene/`

Contains the Phaser scene that wires everything together.

The scene should stay small.

---

## `debug/`

Contains prototype-only debug overlays and debug keybinds.

No final gameplay logic should depend on debug files.

---

# 5. Configuration Files

---

## `configuration/PhaserGameConfig.ts`

### Purpose

Contains Phaser-level game setup.

### Main export

```ts
phaserGameConfig
```

### Should contain

```txt
scene key
canvas parent element id
canvas background color
canvas width
canvas height
Phaser renderer mode
```

### Example config groups

```txt
phaserGameConfig.scene.key
phaserGameConfig.canvas.parentElementId
phaserGameConfig.canvas.backgroundColorHex
```

### Should not contain

```txt
map generation values
movement costs
traffic light logic
saboteur rules
colors for tiles
asset paths
```

---

## `configuration/CityMapGenerationConfig.ts`

### Purpose

Contains designer-editable city generation values.

### Main export

```ts
cityMapGenerationConfig
```

### Should contain

```txt
city map width and height
safe border
zone rows and columns
road widths
avenue spacing
district road spacing
local road density
park count and size
lake count and size
bridge count
tunnel count
shortcut count
traffic signal minimum distance
generation retry count
default seed
```

### Recommended values

```txt
cityMap.widthTiles = 96
cityMap.heightTiles = 96
cityMap.safeBorderTiles = 4

cityZone.columnCount = 3
cityZone.rowCount = 3

road.localWidthTiles = 1
road.districtWidthTiles = 2
road.avenueWidthTiles = 3

trafficSignal.minimumDistanceTiles = 7

lake.widthTilesMin = 8
lake.heightTilesMin = 6
```

### Important rule

`96 x 96` is preferred because it divides cleanly into `3 x 3` zones.

Each zone becomes:

```txt
32 x 32 tiles
```

---

## `configuration/CityMapVisualConfig.ts`

### Purpose

Contains all editable colors in `#` string format.

### Main export

```ts
cityMapVisualConfig
```

### Color format

Correct:

```ts
"#22c55e"
```

Incorrect:

```ts
0x22c55e
```

Phaser conversion must happen in:

```txt
sharedUtility/PhaserColorConverter.ts
```

### Should contain colors for

```txt
building
land
park
water

local road
district road
avenue road

bridge
tunnel
shortcut

traffic signal green
traffic signal red

current Courier zone glow
allowed Saboteur zone glow

hover valid tile
hover invalid tile
selected tile
visited tile
active hurdle outline

Courier body
Courier outline

HUD/debug text if needed
```

---

## `configuration/CourierMovementConfig.ts`

### Purpose

Contains Courier movement speed and tile movement cost values.

### Main export

```ts
courierMovementConfig
```

### Should contain

```txt
base move duration
red traffic light stop duration
local road movement cost
district road movement cost
avenue road movement cost
bridge movement cost
tunnel movement cost
shortcut movement cost
traffic jam multiplier
construction multiplier
```

### Suggested starting values

```txt
baseMoveDurationMs = 120

localRoadCost = 1.15
districtRoadCost = 1.0
avenueRoadCost = 0.85
bridgeCost = 0.9
tunnelCost = 0.8
shortcutCost = 1.35

redTrafficLightStopMs = 4000
```

---

## `configuration/MapCameraConfig.ts`

### Purpose

Contains camera behavior values.

### Main export

```ts
mapCameraConfig
```

### Should contain

```txt
start zoom
minimum zoom
maximum zoom
zoom step
drag speed multiplier
camera pan duration
camera follow lerp
zone padding tiles
whether Courier follow is enabled
whether manual drag is enabled
```

### Required behavior

```txt
Camera follows Courier automatically.
Camera keeps current Courier zone visible.
C key can exist for debug recenter but should not be required.
```

---

## `configuration/SaboteurHurdleConfig.ts`

### Purpose

Contains Saboteur hurdle balance and placement rules.

### Main export

```ts
saboteurHurdleConfig
```

### Should contain global rules

```txt
minimumHurdleDistanceFromCourierTiles
placementInCourierCurrentZoneDisabled
placementInDifferentZoneVisitedTileAllowed
placementInPreviousZoneAllowed
```

### Required values

```txt
minimumHurdleDistanceFromCourierTiles = 6
placementInCourierCurrentZoneDisabled = true
placementInDifferentZoneVisitedTileAllowed = true
placementInPreviousZoneAllowed = true
```

### Should contain per-hurdle values

For each hurdle:

```txt
durationMs
cooldownMs
energyCost
```

Hurdles:

```txt
RedTrafficLight
RoadBlock
ConstructionWork
TrafficJam
ClosedGate
WrongDirectionSign
BrokenRoad
MovingBarrier
SecurityCheckpoint
```

---

## `configuration/MapAssetDisplayConfig.ts`

### Purpose

Controls real assets, placeholder assets, and asset visibility.

### Main export

```ts
mapAssetDisplayConfig
```

### Should contain

```txt
real assets enabled
placeholder assets enabled
building placeholders enabled
traffic signal placeholders enabled
tunnel entrance placeholders enabled
bridge placeholders enabled
shortcut placeholders enabled
hurdle placeholders enabled
```

### Future asset metadata

Each asset can have:

```txt
asset key
asset path
width pixels
height pixels
anchor x
anchor y
depth offset
enabled
```

### Important rule

Map logic must not change when real assets are added.

Only asset configuration and asset rendering should change.

---

## `configuration/DebugDisplayConfig.ts`

### Purpose

Controls prototype/debug visuals.

### Main export

```ts
debugDisplayConfig
```

### Should contain

```txt
zone overlay visible
current Courier zone visible
allowed Saboteur zone visible
intersection overlay visible
traffic signal debug visible
hurdle candidate debug visible
visited tile debug visible
validation report visible
role toggle enabled
map regeneration enabled
asset toggle enabled
```

---

# 6. Type Files

---

## `types/CoordinateType.ts`

### Purpose

Defines shared coordinate shapes.

### Main exports

```txt
CoordinateTilePoint
CoordinateScreenPoint
CoordinateWorldPoint
CoordinateRectangleBounds
```

### Should contain

```txt
tile x/y coordinate shape
screen x/y coordinate shape
world x/y coordinate shape
rectangle bounds shape
```

### Example concepts

```txt
CoordinateTilePoint = tile grid position
CoordinateScreenPoint = raw pointer/screen position
CoordinateWorldPoint = Phaser world position
CoordinateRectangleBounds = camera/world bounds
```

---

## `types/DirectionType.ts`

### Purpose

Defines movement direction names.

### Main exports

```txt
DirectionName
DirectionDelta
```

### Direction values

```txt
Left
Right
Up
Down
None
```

### Should be used by

```txt
CourierMovementInputController
DirectionDeltaResolver
ZonePlacementRules
```

---

## `types/PlayerRoleType.ts`

### Purpose

Defines player role names.

### Main exports

```txt
PlayerRole
```

### Role values

```txt
Courier
Saboteur
```

### Used by

```txt
MatchPrototypeState
PrototypeRoleInputController
CourierWarMapPrototypeScene
```

---

## `types/CityTileType.ts`

### Purpose

Defines tile-layer concepts.

This replaces the old overloaded `TileType`.

### Main exports

```txt
CityTileTerrainType
CityTileRoadClass
CityTilePathKind
CityTileFeatureKind
```

### Terrain types

```txt
Building
Land
Park
Water
```

### Road classes

```txt
None
LocalRoad
DistrictRoad
AvenueRoad
```

### Path kinds

```txt
None
Road
Bridge
Tunnel
Shortcut
```

### Feature kinds

```txt
None
TrafficSignal
TunnelEntrance
ShortcutEntrance
BridgeEntrance
```

### Important rule

Traffic light is not a tile type.

Construction is not a tile type.

They are runtime features/hurdles.

---

## `types/CityMapType.ts`

### Purpose

Defines the generated city map and tile shape.

### Main exports

```txt
CityTile
CityMapGenerated
CityMapTileRows
CityMapGenerationMetadata
```

### `CityTile` should contain

```txt
tile x
tile y

terrain type
road class
path kind
zone id

walkable flag
base movement cost

intersection id optional
traffic signal id optional

bridge id optional
tunnel id optional
shortcut id optional

tunnel entrance flag
shortcut entrance flag
bridge entrance flag

start flag
delivery flag

visual variant optional

route id list
hurdle candidate list
```

### Important rule

One tile can now represent layered data.

Example:

```txt
terrain = Water
pathKind = Bridge
roadClass = DistrictRoad
walkable = true
```

Another example:

```txt
terrain = Building
pathKind = Tunnel
roadClass = LocalRoad
walkable = true
```

---

## `types/CityZoneType.ts`

### Purpose

Defines map zone shape.

### Main exports

```txt
CityZone
CityZoneId
CityZoneBounds
CityZoneRelation
```

### `CityZone` should contain

```txt
id
row index
column index
start tile x
start tile y
end tile x
end tile y
center tile x
center tile y
```

### Required zone layout

For a `96 x 96` map with `3 x 3` zones:

```txt
zone-0: x 0-31,  y 0-31
zone-1: x 32-63, y 0-31
zone-2: x 64-95, y 0-31

zone-3: x 0-31,  y 32-63
zone-4: x 32-63, y 32-63
zone-5: x 64-95, y 32-63

zone-6: x 0-31,  y 64-95
zone-7: x 32-63, y 64-95
zone-8: x 64-95, y 64-95
```

---

## `types/TrafficSignalType.ts`

### Purpose

Defines generated and runtime traffic signal data.

### Main exports

```txt
TrafficSignalGenerated
TrafficSignalRuntimeState
TrafficSignalStateName
```

### Generated signal should contain

```txt
traffic signal id
tile x
tile y
intersection id
```

### Runtime signal state should contain

```txt
state name
red until timestamp
activated by Saboteur flag
```

### Signal states

```txt
Green
Red
```

### Important rule

Traffic signals are green by default.

Saboteur activation changes runtime signal state, not the tile type.

---

## `types/SaboteurHurdleType.ts`

### Purpose

Defines Saboteur hurdle types and placement result types.

### Main exports

```txt
SaboteurHurdleType
SaboteurHurdleActivationRequest
SaboteurHurdleActive
SaboteurHurdlePlacementResult
SaboteurHurdlePlacementFailureReason
```

### Hurdle values

```txt
RedTrafficLight
RoadBlock
ConstructionWork
TrafficJam
ClosedGate
WrongDirectionSign
BrokenRoad
MovingBarrier
SecurityCheckpoint
```

### Placement failure reasons

```txt
TileMissing
TileTooCloseToCourier
TileInCourierCurrentZone
TileVisitedInCourierCurrentZone
TileZoneNotAllowed
TileDoesNotSupportHurdle
TileIsStart
TileIsDelivery
TileHasActiveHurdle
TrafficSignalMissing
TrafficSignalAlreadyRed
SaboteurEnergyInsufficient
SaboteurHurdleCooldownActive
```

---

## `types/MatchRuntimeStateType.ts`

### Purpose

Defines local prototype match state.

### Main exports

```txt
MatchPrototypeStateShape
CourierRuntimeState
SaboteurRuntimeState
TileInteractionRuntimeState
```

### Should contain state for

```txt
current role
map seed
Courier tile position
Courier direction
current Courier zone id
previous Courier zone id
traffic signal runtime states
active hurdle states
Courier visited tile keys
hovered tile
selected tile
selected Saboteur hurdle
```

---

## `types/CityMapValidationType.ts`

### Purpose

Defines validation result shape.

### Main exports

```txt
CityMapValidationResult
CityMapValidationError
CityMapValidationWarning
CityMapGenerationStats
```

### Validation result should contain

```txt
valid flag
error list
warning list
generation stats
```

### Validation errors should include

```txt
unreachable delivery
invalid traffic signal
traffic signals too close
bridge not on water
bridge not connected
tunnel disconnected
shortcut disconnected
zone has no roads
lake too thin
invalid hurdle candidate
```

---

## `types/MapAssetDisplayType.ts`

### Purpose

Defines asset display metadata.

### Main exports

```txt
MapAssetDisplayMode
MapAssetDefinition
MapAssetAnchor
```

### Asset definition should contain

```txt
asset key
asset path
enabled flag
width pixels
height pixels
anchor x
anchor y
depth offset
```

---

# 7. Shared Utility Files

---

## `sharedUtility/PhaserColorConverter.ts`

### Purpose

Converts editable `#` colors into Phaser numeric colors.

### Main exports

```txt
phaserColorNumberFromHexGet
```

### Responsibility

Convert:

```txt
"#22c55e"
```

into:

```txt
0x22c55e
```

### Should not contain

```txt
visual config
tile rendering
asset rendering
```

---

## `sharedUtility/CityTileKeyConverter.ts`

### Purpose

Creates and parses stable tile keys.

### Main exports

```txt
cityTileKeyFromPointGet
cityTileKeyFromCoordinatesGet
cityTilePointFromKeyGet
```

### Example tile key

```txt
"12,44"
```

### Used by

```txt
CourierTrailStateStore
ActiveHurdleStateStore
TileInteractionStateStore
SaboteurPlacementRules
```

---

## `sharedUtility/CityTileDistanceCalculator.ts`

### Purpose

Calculates distance between tile points.

### Main exports

```txt
cityTileDistanceManhattanGet
cityTileDistanceChebyshevGet
cityTileDistanceSquaredGet
cityTileDistanceWithinLimitCheck
```

### Important use

Saboteur placement should use this to reject tiles too close to Courier.

Recommended first rule:

```txt
Manhattan distance < 6 = invalid
```

---

## `sharedUtility/DirectionDeltaResolver.ts`

### Purpose

Maps direction names to tile deltas.

### Main exports

```txt
directionDeltaFromNameGet
directionNameFromDeltaGet
directionNameOppositeGet
```

### Example

```txt
Left  -> { x: -1, y: 0 }
Right -> { x: 1, y: 0 }
Up    -> { x: 0, y: -1 }
Down  -> { x: 0, y: 1 }
```

---

# 8. Isometric File

---

## `isometric/IsometricCoordinateCalculator.ts`

### Purpose

Handles coordinate conversion for the isometric map.

### Main exports

```txt
isometricScreenPointFromTilePointGet
isometricWorldPointFromTilePointGet
isometricTilePointFromWorldPointGet
isometricTileDiamondPointListGet
```

### Responsibilities

```txt
convert tile coordinates to isometric screen/world coordinates
convert pointer/world coordinates back to tile coordinates
return diamond corner points for drawing
```

### Important

The old `isoToScreen` logic stays conceptually, but this file also needs the reverse calculation for Saboteur hover/click.

---

# 9. City Map Generation Files

---

## `cityMap/generation/RandomSeededGenerator.ts`

### Purpose

Deterministic random generator.

### Main class

```txt
RandomSeededGenerator
```

### Main methods

```txt
numberNext()
numberIntegerGet(min, max)
numberFloatGet(min, max)
booleanChanceCheck(probability)
arrayItemPick(items)
arrayShuffle(items)
```

### Important rule

Same seed must produce the same generated city.

Different seed can produce a different city.

---

## `cityMap/generation/CityMapEmptyFactory.ts`

### Purpose

Creates the initial empty city map.

### Main class

```txt
CityMapEmptyFactory
```

### Main methods

```txt
cityMapEmptyCreate()
cityTileEmptyCreate(tilePoint)
```

### Initial tile state

```txt
terrain = Building
roadClass = None
pathKind = None
walkable = false
zoneId = empty until zone assignment
```

### Should not contain

```txt
roads
parks
lakes
traffic lights
bridges
tunnels
shortcuts
```

---

## `cityMap/generation/CityMapZoneBuilder.ts`

### Purpose

Builds and assigns 3x3 zones.

### Main class

```txt
CityMapZoneBuilder
```

### Main methods

```txt
cityZoneListBuild()
cityTileZoneIdAssign(cityTileRows, cityZoneList)
cityZoneIdFromTilePointGet(tilePoint)
cityZoneFromIdGet(cityZoneList, cityZoneId)
cityZoneAdjacentIdListGet(cityZoneId)
cityZoneDirectionalIdListGet(cityZoneId, directionName)
```

### Required behavior

Every tile gets a zone id.

The current Courier zone can later be highlighted.

Saboteur rules use the zone id to decide placement validity.

---

## `cityMap/generation/CityMapRoadPriorityRules.ts`

### Purpose

Prevents lower-priority roads from overwriting higher-priority roads.

### Main exports

```txt
cityMapRoadClassReplaceCheck
cityMapRoadClassHigherGet
cityMapRoadClassPriorityGet
```

### Priority order

```txt
AvenueRoad > DistrictRoad > LocalRoad > None
```

### Required rule

A district road must not downgrade an avenue.

A local road must not downgrade a district road or avenue.

---

## `cityMap/generation/CityMapRoadNetworkGenerator.ts`

### Purpose

Generates the planned city road network.

### Main class

```txt
CityMapRoadNetworkGenerator
```

### Main methods

```txt
cityMapRoadNetworkGenerate()
cityMapAvenueRoadsDraw()
cityMapDistrictRoadsDraw()
cityMapLocalRoadsDraw()
cityMapRoadLineDraw()
cityMapRoadTileSet()
cityMapZoneRoadsConnect()
cityMapImportantCorridorEnsure()
```

### Road classes

```txt
LocalRoad = 1 tile wide
DistrictRoad = 2 tiles wide
AvenueRoad = 3 tiles wide
```

### Road generation rules

Avenues:

```txt
long continuous roads
cross multiple zones
faster movement
major traffic signal candidates
```

District roads:

```txt
connect avenues
form city blocks
some traffic signal candidates
```

Local roads:

```txt
small internal streets
slower
usually no traffic lights
```

### Must avoid

```txt
random road spaghetti
district roads cutting through avenues incorrectly
roads that do not connect to useful routes
```

---

## `cityMap/generation/CityMapAreaGenerator.ts`

### Purpose

Generates parks and lakes.

### Main class

```txt
CityMapAreaGenerator
```

### Main methods

```txt
cityMapParkAreaListGenerate()
cityMapLakeAreaListGenerate()
cityMapAreaCandidateFind()
cityMapParkAreaPlace()
cityMapLakeAreaPlace()
cityMapAreaRingRoadAdd()
cityMapAreaImportantRoadOverlapCheck()
cityMapAreaStartDeliveryOverlapCheck()
```

### Park rules

```txt
inside city blocks
not over start/delivery
not destroying main roads
optional ring road around large parks
```

### Lake rules

```txt
must not be 1-tile strips
minimum width and height required
not over start/delivery
not destroying full connectivity
bridges added separately
```

### Recommended lake minimum

```txt
width >= 8 tiles
height >= 6 tiles
```

---

## `cityMap/generation/CityMapBridgeGenerator.ts`

### Purpose

Generates bridges only across water.

### Main class

```txt
CityMapBridgeGenerator
```

### Main methods

```txt
cityMapBridgeListGenerate()
cityMapBridgeCandidateFind()
cityMapBridgeAcrossLakePlace()
cityMapBridgeEndRoadsConnect()
cityMapBridgeTileValidCheck()
```

### Bridge tile rule

Bridge tile must have:

```txt
terrain = Water
pathKind = Bridge
roadClass = DistrictRoad or AvenueRoad
walkable = true
```

### Must avoid

```txt
bridge on dry land
bridge in random road
bridge disconnected from roads
```

---

## `cityMap/generation/CityMapTunnelGenerator.ts`

### Purpose

Generates tunnels through buildings with accessible entrances.

### Main class

```txt
CityMapTunnelGenerator
```

### Main methods

```txt
cityMapTunnelListGenerate()
cityMapTunnelEndpointPairFind()
cityMapTunnelPathDraw()
cityMapTunnelEntranceMark()
cityMapTunnelValidCheck()
```

### Tunnel rules

```txt
tunnel can pass through buildings
tunnel body is walkable
tunnel start connects to road
tunnel end connects to road
tunnel entrance has subtle visual hint
no HUD message for tunnel discovery
```

### Tunnel tile example

```txt
terrain = Building
pathKind = Tunnel
roadClass = LocalRoad
walkable = true
```

---

## `cityMap/generation/CityMapShortcutGenerator.ts`

### Purpose

Generates useful shorter but slower routes.

### Main class

```txt
CityMapShortcutGenerator
```

### Main methods

```txt
cityMapShortcutListGenerate()
cityMapShortcutEndpointPairFind()
cityMapShortcutPathDraw()
cityMapShortcutEntranceMark()
cityMapShortcutValidCheck()
```

### Shortcut rules

```txt
connects useful road points
should reduce distance
slower movement cost
subtle visual hint only
no HUD message
```

### Shortcut tile example

```txt
pathKind = Shortcut
roadClass = LocalRoad
walkable = true
```

---

## `cityMap/generation/CityMapStartDeliveryPlanner.ts`

### Purpose

Places start and delivery on valid connected roads.

### Main class

```txt
CityMapStartDeliveryPlanner
```

### Main methods

```txt
cityMapStartDeliveryPlace()
cityMapStartTileFind()
cityMapDeliveryTileFind()
cityMapNearestValidRoadTileFind()
cityMapStartTileSet()
cityMapDeliveryTileSet()
```

### Placement rules

Start should be near:

```txt
zone-0
```

Delivery should be near:

```txt
zone-8
```

But both must be on valid connected walkable road/path tiles.

### Invalid start/delivery locations

```txt
building
park
water without bridge
tunnel body
traffic signal tile
bridge middle
shortcut hidden body
```

---

## `cityMap/generation/CityMapRoadIntersectionDetector.ts`

### Purpose

Detects real road intersections after roads are generated.

### Main class

```txt
CityMapRoadIntersectionDetector
```

### Main methods

```txt
cityMapRoadIntersectionListDetect()
cityMapRoadConnectionDegreeGet()
cityMapRoadHorizontalConnectionCheck()
cityMapRoadVerticalConnectionCheck()
cityMapRoadConnectedClassListGet()
cityMapRoadDeadEndCheck()
cityMapTrafficSignalIntersectionCandidateCheck()
```

### Good traffic signal candidates

```txt
avenue + avenue
avenue + district
district + district
```

### Bad traffic signal candidates

```txt
dead end
local-only road
tunnel body
shortcut body
bridge body unless later allowed
```

---

## `cityMap/generation/CityMapTrafficSignalPlanner.ts`

### Purpose

Places green traffic signals at sensible intersections.

### Main class

```txt
CityMapTrafficSignalPlanner
```

### Main methods

```txt
cityMapTrafficSignalListPlace()
cityMapTrafficSignalRequiredCheck()
cityMapTrafficSignalOptionalCheck()
cityMapTrafficSignalDistanceValidCheck()
cityMapTrafficSignalAttachToTile()
```

### Rules

```txt
traffic signals are green by default
signals are features, not tile types
signals only appear at meaningful intersections
signals cannot be too close to each other
signals cannot be on start/delivery
signals cannot be on park/water/building
signals cannot be inside tunnel
signals cannot appear at dead ends
```

### Recommended spacing

```txt
minimum distance between signals = 7 tiles
```

---

## `cityMap/generation/CityMapHurdleCandidatePlanner.ts`

### Purpose

Marks which hurdles each tile can support.

### Main class

```txt
CityMapHurdleCandidatePlanner
```

### Main methods

```txt
cityMapHurdleCandidateListGenerate()
cityMapRoadBlockCandidateAdd()
cityMapConstructionWorkCandidateAdd()
cityMapTrafficJamCandidateAdd()
cityMapRedTrafficLightCandidateAdd()
cityMapClosedGateCandidateAdd()
cityMapWrongDirectionSignCandidateAdd()
cityMapBrokenRoadCandidateAdd()
cityMapMovingBarrierCandidateAdd()
cityMapSecurityCheckpointCandidateAdd()
```

### Important

This file does not activate hurdles.

It only marks possible valid placement tiles.

### Examples

Traffic signal tile supports:

```txt
RedTrafficLight
```

Avenue/district road tile supports:

```txt
RoadBlock
TrafficJam
BrokenRoad
SecurityCheckpoint
```

District/avenue road without signal supports:

```txt
ConstructionWork
```

Tunnel/shortcut/bridge entrance supports:

```txt
ClosedGate
WrongDirectionSign
```

Building, park, water without bridge support:

```txt
nothing
```

---

## `cityMap/generation/CityMapValidator.ts`

### Purpose

Validates the generated city before gameplay starts.

### Main class

```txt
CityMapValidator
```

### Main methods

```txt
cityMapValidate()
cityMapStartDeliveryReachableValidate()
cityMapZoneRoadCoverageValidate()
cityMapTrafficSignalValidate()
cityMapTrafficSignalSpacingValidate()
cityMapBridgeValidate()
cityMapTunnelValidate()
cityMapShortcutValidate()
cityMapLakeSizeValidate()
cityMapHurdleCandidateValidate()
cityMapRoadConnectivityValidate()
```

### Validation checks

```txt
start and delivery reachable
every zone has roads
traffic lights only at valid intersections
traffic lights not too close
bridges only on water
bridges connected to roads
tunnels connected and walkable
shortcuts connected
lakes not thin strips
hurdle candidates only on valid tiles
```

### If invalid

`CityMapGenerationBuilder` retries generation with adjusted attempt seed.

---

## `cityMap/generation/CityMapGenerationBuilder.ts`

### Purpose

Main orchestrator for city generation.

### Main class

```txt
CityMapGenerationBuilder
```

### Main methods

```txt
cityMapGenerate()
cityMapGenerationAttemptCreate()
cityMapGenerationRetrySeedCreate()
```

### Required generation order

```txt
1. create empty city map
2. build zones
3. assign zone ids
4. generate road network
5. generate parks
6. generate lakes
7. add ring roads where needed
8. generate bridges
9. generate tunnels
10. generate shortcuts
11. place start and delivery
12. detect road intersections
13. place green traffic signals
14. generate hurdle candidates
15. validate generated map
16. retry if invalid
17. return generated city map
```

---

## `cityMap/generation/CityMapGeneratedStore.ts`

### Purpose

Temporary local prototype generated-map store.

### Main exports

```txt
cityMapGeneratedGet
cityMapGeneratedCreate
cityMapStartTileGet
cityMapDeliveryTileGet
```

### Used by

```txt
CourierWarMapPrototypeScene
```

### Later replacement

When server match creation exists, this file can be replaced by server-provided seed loading.

---

# 10. City Map Runtime Files

---

## `cityMap/runtime/MatchPrototypeState.ts`

### Purpose

Stores local prototype match state.

### Main class or factory

```txt
MatchPrototypeState
```

### Should contain

```txt
current player role
map seed
Courier tile point
Courier current direction
Courier current zone id
Courier previous zone id
selected Saboteur hurdle type
traffic signal state map
active hurdle state map
Courier visited tile key set
hovered tile
selected tile
```

### Important

This is only for local prototype until real server match state exists.

---

## `cityMap/runtime/TrafficSignalStateStore.ts`

### Purpose

Stores and updates traffic signal runtime state.

### Main class

```txt
TrafficSignalStateStore
```

### Main methods

```txt
trafficSignalStateInitialize()
trafficSignalStateGet()
trafficSignalRedCheck()
trafficSignalRedActivate()
trafficSignalStateUpdate()
trafficSignalGreenRestore()
```

### Rules

```txt
all signals start green
Saboteur can activate red state
red state expires after duration
tile type never changes
```

---

## `cityMap/runtime/ActiveHurdleStateStore.ts`

### Purpose

Stores active runtime hurdles.

### Main class

```txt
ActiveHurdleStateStore
```

### Main methods

```txt
activeHurdleActivate()
activeHurdleExpire()
activeHurdleStateUpdate()
activeHurdleListForTileGet()
activeHurdleBlockingCheck()
activeHurdleSlowingCheck()
```

### Hurdles handled here

```txt
RoadBlock
ConstructionWork
TrafficJam
ClosedGate
WrongDirectionSign
BrokenRoad
MovingBarrier
SecurityCheckpoint
```

### Important

Construction is an active hurdle here, not a generated tile.

---

## `cityMap/runtime/CourierTrailStateStore.ts`

### Purpose

Tracks tiles the Courier has visited.

### Main class

```txt
CourierTrailStateStore
```

### Main methods

```txt
courierTrailTileVisitedMark()
courierTrailTileVisitedCheck()
courierTrailTileKeySetGet()
courierTrailTileDifferentZoneCheck()
```

### Important updated rule

Visited tile does not automatically mean invalid.

Saboteur may place on a visited tile if:

```txt
tile is in a different zone from Courier current zone
tile is far enough from Courier
tile supports selected hurdle
all other placement rules pass
```

---

## `cityMap/runtime/TileInteractionStateStore.ts`

### Purpose

Stores hover and selection state.

### Main class

```txt
TileInteractionStateStore
```

### Main methods

```txt
tileInteractionHoverSet()
tileInteractionHoverClear()
tileInteractionSelectionSet()
tileInteractionSelectionClear()
tileInteractionSelectedHurdleSet()
tileInteractionPlacementResultSet()
```

### Used by

```txt
SaboteurHoverInputController
SaboteurPlacementInputController
TileOverlayRenderer
DebugTextOverlay
```

---

# 11. City Map Rule Files

---

## `cityMap/rules/CourierMovementRules.ts`

### Purpose

Decides whether Courier can enter or be affected by a tile.

### Main exports

```txt
courierMovementTileEnterCheck
courierMovementTileStopCheck
courierMovementTileBlockCheck
courierMovementTileSlowCheck
```

### Rules

```txt
building without tunnel = blocked
park = blocked
water without bridge = blocked

road = walkable
avenue = walkable
bridge = walkable
tunnel = walkable
shortcut = walkable

green traffic signal = no stop
red traffic signal = stop

roadblock = blocked
construction = slower
traffic jam = slower
closed gate = blocks shortcut/tunnel/bridge entrance
```

---

## `cityMap/rules/MovementCostRules.ts`

### Purpose

Calculates final movement duration.

### Main exports

```txt
movementCostBaseGet
movementCostRuntimeMultiplierGet
movementCostFinalGet
movementDurationMsGet
```

### Example

```txt
avenue base cost = 0.85
construction multiplier = 2.5
final cost = 2.125
```

---

## `cityMap/rules/SaboteurPlacementRules.ts`

### Purpose

Main validation for Saboteur hurdle placement.

### Main exports

```txt
saboteurPlacementCheck
saboteurPlacementCourierDistanceCheck
saboteurPlacementCourierCurrentZoneCheck
saboteurPlacementVisitedTileCheck
saboteurPlacementStartDeliveryCheck
saboteurPlacementActiveHurdleCheck
saboteurPlacementEnergyCheck
saboteurPlacementCooldownCheck
```

### Final crossed/visited rule

```txt
If tile was visited by Courier:
  if tile zone is Courier current zone:
    invalid
  else:
    continue checking other rules
```

### Always invalid if

```txt
tile too close to Courier
tile in Courier current zone
tile is start
tile is delivery
tile does not support selected hurdle
tile already has conflicting active hurdle
energy insufficient
cooldown active
```

---

## `cityMap/rules/ZonePlacementRules.ts`

### Purpose

Calculates which zones are valid for Saboteur placement.

### Main exports

```txt
zonePlacementAllowedZoneIdListGet
zonePlacementTileZoneAllowedCheck
zonePlacementPreviousZoneAllowedCheck
zonePlacementDirectionalFutureZoneIdListGet
```

### Starting rule

```txt
Courier current zone = not allowed
adjacent zones = allowed
directional future zone = allowed
previous zone = allowed if configured
visited tile in different zone = allowed if all tile rules pass
```

---

## `cityMap/rules/HurdleSupportRules.ts`

### Purpose

Checks whether a tile supports a selected hurdle.

### Main exports

```txt
hurdleSupportTileCheck
hurdleSupportRedTrafficLightCheck
hurdleSupportRoadBlockCheck
hurdleSupportConstructionWorkCheck
hurdleSupportTrafficJamCheck
hurdleSupportClosedGateCheck
hurdleSupportWrongDirectionSignCheck
```

### Examples

Red Traffic Light requires:

```txt
trafficSignalId exists
```

Construction Work requires:

```txt
district road or avenue
not start
not delivery
not traffic signal tile
not tunnel
not shortcut
not bridge
```

Closed Gate requires:

```txt
tunnel entrance
shortcut entrance
bridge entrance
```

---

## `cityMap/rules/TrafficSignalRules.ts`

### Purpose

Checks traffic signal generation and runtime activation rules.

### Main exports

```txt
trafficSignalTileValidCheck
trafficSignalRedActivationCheck
trafficSignalAlreadyRedCheck
trafficSignalDistanceValidCheck
```

### Activation invalid if

```txt
tile has no signal
signal already red
tile too close to Courier
tile in Courier current zone
tile is start/delivery
```

---

# 12. City Map Rendering Files

---

## Render order

The renderer must draw in this order:

```txt
1. base tile
2. terrain
3. roads/paths
4. bridge/tunnel/shortcut hints
5. traffic signal placeholder or asset
6. building/terrain placeholders or assets
7. active hurdle overlay
8. visited tile overlay
9. hover/selected tile overlay
10. current zone glow
11. Courier outline
12. Courier body
13. debug overlay
```

Courier and hurdle outlines must always appear above map assets.

---

## `cityMap/rendering/CityMapRenderer.ts`

### Purpose

Main rendering coordinator.

### Main class

```txt
CityMapRenderer
```

### Main methods

```txt
cityMapDraw()
cityMapRuntimeLayerRedraw()
cityMapStaticLayerClear()
cityMapRuntimeLayerClear()
```

### Calls

```txt
TileBaseRenderer
TileTerrainRenderer
TileRoadRenderer
TileFeatureRenderer
AssetPlaceholderRenderer
AssetImageRenderer
TileOverlayRenderer
ZoneOverlayRenderer
CourierRenderer
```

---

## `cityMap/rendering/TileBaseRenderer.ts`

### Purpose

Draws basic isometric diamond tile shape.

### Main class

```txt
TileBaseRenderer
```

### Main methods

```txt
tileBaseDraw()
tileDiamondDraw()
```

### Should not know

```txt
traffic light logic
hurdle logic
Courier movement
Saboteur placement
```

---

## `cityMap/rendering/TileTerrainRenderer.ts`

### Purpose

Draws terrain visuals.

### Main class

```txt
TileTerrainRenderer
```

### Main methods

```txt
tileTerrainDraw()
tileTerrainBuildingDraw()
tileTerrainLandDraw()
tileTerrainParkDraw()
tileTerrainWaterDraw()
```

---

## `cityMap/rendering/TileRoadRenderer.ts`

### Purpose

Draws road and path visuals.

### Main class

```txt
TileRoadRenderer
```

### Main methods

```txt
tileRoadDraw()
tileRoadLocalDraw()
tileRoadDistrictDraw()
tileRoadAvenueDraw()
tileRoadBridgeDraw()
tileRoadTunnelDraw()
tileRoadShortcutDraw()
```

### Important

Tunnel and shortcut should be subtle.

No HUD text should reveal them directly.

---

## `cityMap/rendering/TileFeatureRenderer.ts`

### Purpose

Draws generated features that are not full assets.

### Main class

```txt
TileFeatureRenderer
```

### Main methods

```txt
tileFeatureDraw()
tileFeatureTrafficSignalDraw()
tileFeatureTunnelEntranceDraw()
tileFeatureShortcutEntranceDraw()
tileFeatureBridgeEntranceDraw()
```

### Traffic signal rendering

Reads runtime signal state:

```txt
green = draw green signal
red = draw red signal
```

---

## `cityMap/rendering/AssetPlaceholderRenderer.ts`

### Purpose

Draws temporary placeholder graphics using Phaser shapes.

### Main class

```txt
AssetPlaceholderRenderer
```

### Main methods

```txt
assetPlaceholderTrafficSignalDraw()
assetPlaceholderTunnelEntranceDraw()
assetPlaceholderBridgeDraw()
assetPlaceholderShortcutDraw()
assetPlaceholderRoadBlockDraw()
assetPlaceholderConstructionDraw()
assetPlaceholderClosedGateDraw()
```

### Important

These are not final art assets.

They allow testing asset placement and visibility rules early.

---

## `cityMap/rendering/AssetImageRenderer.ts`

### Purpose

Draws real image assets when available.

### Main class

```txt
AssetImageRenderer
```

### Main methods

```txt
assetImageDraw()
assetImageLoadedCheck()
assetImageDepthGet()
assetImageAnchorApply()
```

### Important

If real assets are disabled or unavailable, rendering falls back to placeholder assets or tile colors.

---

## `cityMap/rendering/TileOverlayRenderer.ts`

### Purpose

Draws tile interaction overlays.

### Main class

```txt
TileOverlayRenderer
```

### Main methods

```txt
tileOverlayHoverDraw()
tileOverlaySelectedDraw()
tileOverlayVisitedDraw()
tileOverlayActiveHurdleDraw()
tileOverlayInvalidPlacementDraw()
tileOverlayClear()
```

### Must support

```txt
valid hover color
invalid hover color
selected tile outline
visited tile tint
active hurdle outline
```

### Depth rule

Overlays must stay visible even if a building or placeholder asset overlaps the tile.

---

## `cityMap/rendering/ZoneOverlayRenderer.ts`

### Purpose

Draws current Courier zone and allowed Saboteur zone overlays.

### Main class

```txt
ZoneOverlayRenderer
```

### Main methods

```txt
zoneOverlayCourierCurrentDraw()
zoneOverlaySaboteurAllowedDraw()
zoneOverlayBoundaryDraw()
zoneOverlayClear()
```

### Current Courier zone

Should show:

```txt
soft glow
transparent tint
clear boundary
```

This helps both players understand the active zone.

---

## `cityMap/rendering/CourierRenderer.ts`

### Purpose

Draws and moves the Courier.

### Main class

```txt
CourierRenderer
```

### Main methods

```txt
courierCreate()
courierMoveToTile()
courierDepthUpdate()
courierOutlineDraw()
courierBodyDraw()
```

### Visibility rule

Courier outline and body must render above:

```txt
buildings
assets
traffic signals
hurdles
map decorations
```

---

# 13. Camera Files

---

## `cityMap/camera/CameraGameController.ts`

### Purpose

Controls Phaser camera behavior.

### Main class

```txt
CameraGameController
```

### Main methods

```txt
cameraSetup()
cameraCourierUpdate()
cameraPointerZoomApply()
cameraDragEnable()
cameraCourierCenter()
cameraZoneFocus()
```

### Required behavior

```txt
Camera follows Courier automatically.
Camera keeps Courier current zone visible.
Mouse wheel zoom works.
Mouse drag pan can still work.
C key can recenter only as debug.
```

---

## `cityMap/camera/CameraZoneViewCalculator.ts`

### Purpose

Calculates zone-based camera bounds and zoom.

### Main class

```txt
CameraZoneViewCalculator
```

### Main methods

```txt
cameraZoneWorldBoundsGet()
cameraZoneCombinedWorldBoundsGet()
cameraZoneZoomForBoundsGet()
cameraZoneCourierTargetGet()
```

### Courier view

```txt
show current Courier zone with padding
```

### Saboteur prototype view

```txt
show current Courier zone plus allowed nearby placement zones
```

---

# 14. Input Files

---

## `cityMap/input/CourierMovementInputController.ts`

### Purpose

Handles held-arrow-key movement.

### Main class

```txt
CourierMovementInputController
```

### Main methods

```txt
courierMovementKeyboardSetup()
courierMovementUpdate()
courierMovementHeldDirectionGet()
courierMovementStartTry()
courierMovementTileMove()
courierMovementCompleteHandle()
```

### Required behavior

```txt
Hold arrow key.
Courier keeps moving tile-by-tile.
No repeated tapping required.
If direction changes during movement, apply new direction after current tile movement finishes.
```

---

## `cityMap/input/PointerTileInputResolver.ts`

### Purpose

Converts pointer position to map tile.

### Main class

```txt
PointerTileInputResolver
```

### Main methods

```txt
pointerTileFromPointerGet()
pointerTileFromWorldPointGet()
pointerWorldPointGet()
```

### Used by

```txt
SaboteurHoverInputController
SaboteurPlacementInputController
DebugTextOverlay
```

---

## `cityMap/input/SaboteurHoverInputController.ts`

### Purpose

Handles Saboteur hover feedback.

### Main class

```txt
SaboteurHoverInputController
```

### Main methods

```txt
saboteurHoverUpdate()
saboteurHoverClear()
saboteurHoverPlacementResultGet()
```

### Flow

```txt
resolve pointer to tile
read selected hurdle
run SaboteurPlacementRules
store hover placement result
draw valid/invalid overlay
```

---

## `cityMap/input/SaboteurPlacementInputController.ts`

### Purpose

Handles Saboteur hurdle selection and placement click.

### Main class

```txt
SaboteurPlacementInputController
```

### Main methods

```txt
saboteurPlacementHurdleSelect()
saboteurPlacementTileClickHandle()
saboteurPlacementActivationTry()
saboteurPlacementConfirm()
saboteurPlacementCancel()
```

### Prototype keybinds

```txt
1 = Red Traffic Light
2 = Road Block
3 = Construction Work
4 = Traffic Jam
5 = Closed Gate
6 = Wrong Direction Sign
7 = Broken Road
8 = Moving Barrier
9 = Security Checkpoint
```

---

## `cityMap/input/PrototypeRoleInputController.ts`

### Purpose

Temporary role switching for prototype testing.

### Main class

```txt
PrototypeRoleInputController
```

### Main methods

```txt
prototypeRoleCourierSet()
prototypeRoleSaboteurSet()
prototypeRoleToggle()
prototypeRoleCurrentGet()
```

### Suggested keybind

```txt
Tab = toggle Courier/Saboteur prototype mode
```

---

# 15. Scene File

---

## `scene/CourierWarMapPrototypeScene.ts`

### Purpose

Main Phaser scene for this map prototype.

### Main class

```txt
CourierWarMapPrototypeScene
```

### Main methods

```txt
create()
update()
mapSetup()
runtimeStateSetup()
rendererSetup()
cameraSetup()
inputControllerSetup()
debugSetup()
```

### Responsibilities

```txt
create generated city map
create match prototype state
setup renderer
setup camera
setup Courier
setup input controllers
update runtime systems
```

### Should not contain

```txt
road generation logic
traffic light placement logic
saboteur placement rules
movement cost formulas
tile drawing internals
asset placement internals
```

The scene must stay small and only coordinate systems.

---

# 16. Debug Files

---

## `debug/DebugTextOverlay.ts`

### Purpose

Shows useful prototype information.

### Main class

```txt
DebugTextOverlay
```

### Main methods

```txt
debugTextCreate()
debugTextUpdate()
debugTextClear()
```

### Can show

```txt
current role
Courier tile
Courier zone
hovered tile
hovered tile zone
selected hurdle
placement valid/invalid
placement failure reason
traffic signal state
road class
path kind
terrain type
```

### Important

Debug text can reveal information.

Final Courier HUD should not reveal hidden tunnels/shortcuts directly.

---

## `debug/DebugKeyboardShortcutController.ts`

### Purpose

Handles debug-only keybinds.

### Main class

```txt
DebugKeyboardShortcutController
```

### Main methods

```txt
debugKeyboardSetup()
debugKeyboardUpdate()
debugZoneOverlayToggle()
debugIntersectionOverlayToggle()
debugHurdleCandidateOverlayToggle()
debugVisitedTileOverlayToggle()
debugAssetPlaceholderToggle()
debugMapRegenerate()
```

### Suggested debug keys

```txt
C = center camera on Courier
Z = toggle zone overlay
I = toggle intersection overlay
H = toggle hurdle candidate overlay
V = toggle visited tile overlay
A = toggle placeholder assets
R = regenerate map with next seed
Tab = toggle Courier/Saboteur prototype mode
```

---

## `debug/DebugMapValidationRenderer.ts`

### Purpose

Draws map validation problems visually.

### Main class

```txt
DebugMapValidationRenderer
```

### Main methods

```txt
debugMapValidationDraw()
debugMapValidationErrorDraw()
debugMapValidationWarningDraw()
debugMapValidationClear()
```

### Can show

```txt
bad traffic signal
invalid bridge
disconnected tunnel
unreachable delivery
zone without roads
invalid hurdle candidate
```

---

# 17. Main Entry File

---

## `src/main.ts`

### Purpose

Starts Phaser and loads the Courier War V7 scene.

### Should import

```txt
PhaserGameConfig
CourierWarMapPrototypeScene
```

### Should not contain

```txt
map generation
movement logic
rendering logic
input logic
```

---

# 18. Final Generation Flow

The city generation must happen in this exact order:

```txt
1. CityMapEmptyFactory creates empty city map.
2. CityMapZoneBuilder builds 3 x 3 zones.
3. CityMapZoneBuilder assigns zone ids to every tile.
4. CityMapRoadNetworkGenerator draws avenues.
5. CityMapRoadNetworkGenerator draws district roads.
6. CityMapRoadNetworkGenerator draws local roads.
7. CityMapAreaGenerator places parks.
8. CityMapAreaGenerator places lakes.
9. CityMapAreaGenerator adds ring roads where needed.
10. CityMapBridgeGenerator adds bridges across lakes.
11. CityMapTunnelGenerator adds tunnels through buildings.
12. CityMapShortcutGenerator adds shortcuts between useful roads.
13. CityMapStartDeliveryPlanner places start and delivery.
14. CityMapRoadIntersectionDetector detects intersections.
15. CityMapTrafficSignalPlanner places green signals.
16. CityMapHurdleCandidatePlanner marks hurdle candidate tiles.
17. CityMapValidator validates the generated city.
18. CityMapGenerationBuilder retries if invalid.
19. CityMapGenerationBuilder returns final CityMapGenerated.
```

---

# 19. Final Runtime Flow

During gameplay prototype:

```txt
1. CourierWarMapPrototypeScene creates MatchPrototypeState.
2. TrafficSignalStateStore initializes all signals as green.
3. CourierMovementInputController moves Courier by held arrow keys.
4. CourierTrailStateStore records visited tiles.
5. CameraGameController follows Courier and keeps current zone visible.
6. ZoneOverlayRenderer highlights current Courier zone.
7. SaboteurHoverInputController checks hovered tile validity.
8. SaboteurPlacementInputController activates valid hurdle.
9. TrafficSignalStateStore changes selected signal from green to red.
10. ActiveHurdleStateStore stores active non-signal hurdles.
11. CityMapRenderer redraws runtime overlays.
```

---

# 20. Final Saboteur Placement Rule

Saboteur placement validation order:

```txt
1. Tile must exist.
2. Tile must not be start.
3. Tile must not be delivery.
4. Tile must not be too close to Courier.
5. Tile must not be in Courier current zone.
6. If tile was visited by Courier:
     - invalid if same zone as Courier current zone
     - can continue if different zone
7. Tile zone must be allowed.
8. Tile must support selected hurdle.
9. Tile must not have conflicting active hurdle.
10. Saboteur must have enough energy.
11. Hurdle cooldown must be ready.
12. Placement is valid.
```

Most important updated rule:

```txt
Visited tiles are not automatically invalid.
Visited tile in different zone can still be valid.
Visited tile too close to Courier is still invalid.
Visited tile in Courier current zone is invalid.
```

---

# 21. Final Traffic Signal Rule

Generated map:

```txt
tile has trafficSignalId
signal starts green
```

Runtime state:

```txt
TrafficSignalStateStore stores green/red state
```

Saboteur activation:

```txt
selected hurdle = RedTrafficLight
clicked tile must have trafficSignalId
tile must pass Saboteur placement rules
signal turns red for configured duration
signal returns green after duration
```

Courier movement:

```txt
green signal = no stop
red signal = stop
```

Tile type never changes.

---

# 22. Final Asset Rule

The system supports three visual modes:

```txt
1. colored tiles only
2. placeholder assets
3. real image assets
```

Map logic must not know or care which mode is active.

Asset behavior belongs to:

```txt
MapAssetDisplayConfig.ts
AssetPlaceholderRenderer.ts
AssetImageRenderer.ts
```

---

# 23. Final Visibility Rule

Courier and active hurdle outlines must always stay visible.

Depth priority:

```txt
base tiles
terrain
roads
features
assets/buildings
active hurdle overlay
hover/selection overlay
zone overlay
Courier outline
Courier body
debug/HUD
```

Courier body and outline should render above buildings and map assets.

---

# 24. Files Not To Create

Avoid these names:

```txt
Utils.ts
Helpers.ts
Common.ts
Manager.ts
Data.ts
MapData.ts
Config.ts
Types.ts
Renderer.ts
Controller.ts
```

They are too generic.

Allowed only when narrowed clearly:

```txt
CityMapRenderer.ts
CameraGameController.ts
TrafficSignalStateStore.ts
CityMapGeneratedStore.ts
PhaserColorConverter.ts
```

---

# 25. Implementation Phase Order

## Phase 1 — Structure, configuration, and types

Create:

```txt
configuration/
types/
sharedUtility/
isometric/
```

Success criteria:

```txt
all names are locked
all colors are # strings
tile model supports layered city data
isometric conversion supports tile-to-screen and screen-to-tile
```

---

## Phase 2 — Map generation

Create:

```txt
cityMap/generation/
```

Success criteria:

```txt
valid city map is generated
roads look planned
bridges only on water
tunnels are walkable and connected
shortcuts are useful
traffic signals are green and placed at intersections
start and delivery are reachable
```

---

## Phase 3 — Rendering

Create:

```txt
cityMap/rendering/
```

Success criteria:

```txt
map draws in isometric view
road classes are visually different
current Courier zone glow works
traffic signals show green/red state
placeholder assets can be toggled
Courier outline stays visible
```

---

## Phase 4 — Runtime state

Create:

```txt
cityMap/runtime/
```

Success criteria:

```txt
traffic lights can become red and return green
active hurdles can appear and expire
Courier visited trail is tracked
hover/selected tile state is stored
```

---

## Phase 5 — Rules

Create:

```txt
cityMap/rules/
```

Success criteria:

```txt
Courier movement rules work
movement costs work
Saboteur placement rules work
visited tile in different zone can be valid
too-close tile is always invalid
current Courier zone is invalid
```

---

## Phase 6 — Camera and input

Create:

```txt
cityMap/camera/
cityMap/input/
```

Success criteria:

```txt
held arrow movement works
camera follows Courier
current Courier zone remains visible
Saboteur hover works
Saboteur click placement works
prototype role toggle works
```

---

## Phase 7 — Scene and debug

Create:

```txt
scene/
debug/
```

Success criteria:

```txt
scene wires all systems together
debug overlay shows tile/zone/hurdle info
debug keybinds help test generation
map validation problems can be visualized
```

---

# 26. Final Locked Decisions

```txt
Root folder: src/game/courierWar/v7

Map size: 96 x 96
Zone layout: 3 x 3
Each zone: 32 x 32 tiles

Road classes:
- LocalRoad = 1 tile
- DistrictRoad = 2 tiles
- AvenueRoad = 3 tiles

Road priority:
AvenueRoad > DistrictRoad > LocalRoad > None

Traffic signals:
- feature, not tile type
- green by default
- red only through Saboteur activation

Construction:
- not generated permanently
- active Saboteur hurdle only

Bridges:
- only over water

Tunnels:
- may pass through buildings
- must be walkable
- must have connected entrances

Shortcuts:
- subtle
- shorter
- slower
- no HUD spoon-feeding

Camera:
- follows Courier automatically
- current Courier zone stays visible

Saboteur:
- cannot place in Courier current zone
- cannot place too close to Courier
- can place on visited/crossed tiles in a different zone if all other rules pass

Colors:
- stored in # format only

Assets:
- optional from start
- placeholder assets supported
- real assets later without changing map logic

Visibility:
- Courier outline and active hurdle outlines render above assets
```

This is the final folder/file plan to create before coding starts.
