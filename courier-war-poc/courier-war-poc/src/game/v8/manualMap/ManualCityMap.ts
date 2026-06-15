// Imports generated map and tile shapes from the V7 renderer contract
import type { CityMapGenerated, CityTile } from "../../v7/types/CityMapType";

// Imports coordinate shapes
import type { CoordinateTilePoint } from "../../v7/types/CoordinateType";

// Imports zone shape
import type { CityZone } from "../../v7/types/CityZoneType";

// Imports traffic signal shape
import type { TrafficSignalGenerated } from "../../v7/types/TrafficSignalType";

// Imports tile layer values
import {
  CityTileFeatureKind,
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../v7/types/CityTileType";

// Imports Saboteur hurdle type values
import { SaboteurHurdleType } from "../../v7/types/SaboteurHurdleType";

// Stores the manual map width
const manualMapWidthTiles = 96;

// Stores the manual map height
const manualMapHeightTiles = 96;

// Stores fixed manual map seed so later cache/bootstrap can identify this layout
const manualMapSeed = 80000001;

// Stores the tile point where Courier starts
const manualStartTilePoint: CoordinateTilePoint = {
  // Stores start x coordinate
  x: 8,

  // Stores start y coordinate
  y: 8,
};

// Stores the tile point where package is delivered
const manualDeliveryTilePoint: CoordinateTilePoint = {
  // Stores delivery x coordinate
  x: 88,

  // Stores delivery y coordinate
  y: 88,
};

// Defines a named rectangular feature area
interface ManualRectangleArea {
  // Stores stable id for debug and visual variants
  id: string;

  // Stores top left x coordinate
  startX: number;

  // Stores top left y coordinate
  startY: number;

  // Stores area width
  widthTiles: number;

  // Stores area height
  heightTiles: number;
}

// Defines a named ellipse feature area
interface ManualEllipseArea {
  // Stores stable id for debug and visual variants
  id: string;

  // Stores center x coordinate
  centerX: number;

  // Stores center y coordinate
  centerY: number;

  // Stores horizontal radius
  radiusX: number;

  // Stores vertical radius
  radiusY: number;
}

// Defines a point based hidden path
interface ManualPathPlan {
  // Stores stable path id
  id: string;

  // Stores ordered tile points used by the path
  pointList: CoordinateTilePoint[];
}

// Defines a planned road segment
interface ManualRoadSegment {
  // Stores stable route id
  id: string;

  // Stores road orientation
  orientation: "horizontal" | "vertical";

  // Stores fixed x coordinate for vertical roads or start x for horizontal roads
  x: number;

  // Stores fixed y coordinate for horizontal roads or start y for vertical roads
  y: number;

  // Stores segment end coordinate on the changing axis
  end: number;

  // Stores road width in tiles
  widthTiles: number;

  // Stores road class
  roadClass: CityTileRoadClass;
}

// Stores fixed water bodies for the handcrafted city
const manualWaterAreaList: ManualEllipseArea[] = [
  {
    // central lake splits the city and forces visible bridges
    id: "central-lake",
    centerX: 47,
    centerY: 40,
    radiusX: 12,
    radiusY: 7,
  },
  {
    // east reservoir creates a second bridge decision point
    id: "east-reservoir",
    centerX: 76,
    centerY: 65,
    radiusX: 11,
    radiusY: 8,
  },
  {
    // west canal makes the city feel less like a square grid
    id: "west-canal",
    centerX: 27,
    centerY: 57,
    radiusX: 8,
    radiusY: 10,
  },
];

// Stores fixed parks and civic spaces
const manualParkAreaList: ManualEllipseArea[] = [
  {
    // civic park becomes a recognizable mid-map landmark
    id: "civic-park",
    centerX: 47,
    centerY: 61,
    radiusX: 9,
    radiusY: 7,
  },
  {
    // north market green gives zone-0 readable non-road structure
    id: "market-green",
    centerX: 14,
    centerY: 27,
    radiusX: 7,
    radiusY: 5,
  },
  {
    // east plaza helps the upper east district feel planned
    id: "east-plaza",
    centerX: 74,
    centerY: 26,
    radiusX: 8,
    radiusY: 6,
  },
  {
    // south garden breaks up the delivery side roads
    id: "south-garden",
    centerX: 27,
    centerY: 83,
    radiusX: 8,
    radiusY: 5,
  },
];

// Stores fixed road segments for a planned 3x3 city grid
const manualRoadSegmentList: ManualRoadSegment[] = [
  // major north-south avenues
  { id: "road-v-avenue-west", orientation: "vertical", x: 18, y: 4, end: 91, widthTiles: 3, roadClass: CityTileRoadClass.AvenueRoad },
  { id: "road-v-avenue-center", orientation: "vertical", x: 48, y: 4, end: 91, widthTiles: 3, roadClass: CityTileRoadClass.AvenueRoad },
  { id: "road-v-avenue-east", orientation: "vertical", x: 78, y: 4, end: 91, widthTiles: 3, roadClass: CityTileRoadClass.AvenueRoad },

  // major east-west avenues
  { id: "road-h-avenue-north", orientation: "horizontal", x: 4, y: 18, end: 91, widthTiles: 3, roadClass: CityTileRoadClass.AvenueRoad },
  { id: "road-h-avenue-center", orientation: "horizontal", x: 4, y: 50, end: 91, widthTiles: 3, roadClass: CityTileRoadClass.AvenueRoad },
  { id: "road-h-avenue-south", orientation: "horizontal", x: 4, y: 78, end: 91, widthTiles: 3, roadClass: CityTileRoadClass.AvenueRoad },

  // district connector roads
  { id: "road-v-district-far-west", orientation: "vertical", x: 8, y: 4, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },
  { id: "road-v-district-west", orientation: "vertical", x: 32, y: 4, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },
  { id: "road-v-district-east", orientation: "vertical", x: 64, y: 4, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },
  { id: "road-v-district-far-east", orientation: "vertical", x: 88, y: 4, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },
  { id: "road-h-district-north", orientation: "horizontal", x: 4, y: 8, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },
  { id: "road-h-district-upper", orientation: "horizontal", x: 4, y: 32, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },
  { id: "road-h-district-lower", orientation: "horizontal", x: 4, y: 64, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },
  { id: "road-h-district-south", orientation: "horizontal", x: 4, y: 88, end: 91, widthTiles: 2, roadClass: CityTileRoadClass.DistrictRoad },

  // local neighborhood roads that form believable blocks instead of random branches
  { id: "road-h-local-nw-market-front", orientation: "horizontal", x: 7, y: 21, end: 30, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-v-local-nw-service", orientation: "vertical", x: 25, y: 9, end: 31, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-h-local-north-campus", orientation: "horizontal", x: 38, y: 27, end: 58, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-v-local-north-campus", orientation: "vertical", x: 56, y: 10, end: 31, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-h-local-east-plaza-front", orientation: "horizontal", x: 66, y: 36, end: 89, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-v-local-east-service", orientation: "vertical", x: 70, y: 8, end: 37, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-h-local-west-canal-front", orientation: "horizontal", x: 8, y: 58, end: 40, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-v-local-west-canal-service", orientation: "vertical", x: 38, y: 40, end: 67, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-h-local-civic-loop-north", orientation: "horizontal", x: 37, y: 53, end: 59, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-h-local-civic-loop-south", orientation: "horizontal", x: 37, y: 69, end: 59, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-v-local-civic-loop-west", orientation: "vertical", x: 36, y: 53, end: 70, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-v-local-civic-loop-east", orientation: "vertical", x: 60, y: 53, end: 70, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-h-local-delivery-west", orientation: "horizontal", x: 63, y: 82, end: 91, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
  { id: "road-v-local-delivery-service", orientation: "vertical", x: 83, y: 66, end: 91, widthTiles: 1, roadClass: CityTileRoadClass.LocalRoad },
];

// Stores fixed bridge corridors over planned water
const manualBridgePathList: ManualPathPlan[] = [
  {
    // vertical central bridge keeps the middle avenue connected across the lake
    id: "bridge-central-avenue",
    pointList: manualLinePointListCreate({ x: 48, y: 32 }, { x: 48, y: 48 }),
  },
  {
    // horizontal lake bridge gives a second crossing decision
    id: "bridge-central-market",
    pointList: manualLinePointListCreate({ x: 36, y: 40 }, { x: 58, y: 40 }),
  },
  {
    // east reservoir bridge sits on the lower district road
    id: "bridge-east-reservoir",
    pointList: manualLinePointListCreate({ x: 64, y: 64 }, { x: 87, y: 64 }),
  },
  {
    // west canal bridge connects the west delivery corridor
    id: "bridge-west-canal",
    pointList: manualLinePointListCreate({ x: 18, y: 56 }, { x: 34, y: 56 }),
  },
];

// Stores fixed tunnels through dense building blocks
const manualTunnelPathList: ManualPathPlan[] = [
  {
    // north tunnel cuts through the dense business block
    id: "tunnel-north-business",
    pointList: manualLinePointListCreate({ x: 19, y: 42 }, { x: 31, y: 42 }),
  },
  {
    // east tunnel links the plaza district to the central avenue
    id: "tunnel-east-plaza",
    pointList: manualLinePointListCreate({ x: 70, y: 33 }, { x: 70, y: 49 }),
  },
  {
    // south tunnel creates a fast but hidden cross-town option
    id: "tunnel-south-service",
    pointList: manualLinePointListCreate({ x: 49, y: 72 }, { x: 63, y: 72 }),
  },
];

// Stores fixed shortcuts through alleys and service passages
const manualShortcutPathList: ManualPathPlan[] = [
  {
    // orthogonal alley near the start area gives early route choice
    id: "shortcut-start-market-alley",
    pointList: [
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 12, y: 10 },
      { x: 13, y: 10 },
      { x: 14, y: 10 },
      { x: 15, y: 10 },
      { x: 16, y: 10 },
      { x: 17, y: 10 },
      { x: 17, y: 11 },
      { x: 17, y: 12 },
      { x: 17, y: 13 },
      { x: 17, y: 14 },
      { x: 17, y: 15 },
      { x: 17, y: 16 },
      { x: 17, y: 17 },
    ],
  },
  {
    // civic service alley runs above the park instead of cutting through it
    id: "shortcut-civic-arcade",
    pointList: [
      { x: 37, y: 52 },
      { x: 38, y: 52 },
      { x: 39, y: 52 },
      { x: 40, y: 52 },
      { x: 41, y: 52 },
      { x: 42, y: 52 },
      { x: 43, y: 52 },
      { x: 44, y: 52 },
      { x: 45, y: 52 },
      { x: 46, y: 52 },
      { x: 47, y: 52 },
      { x: 48, y: 52 },
      { x: 49, y: 52 },
      { x: 50, y: 52 },
      { x: 51, y: 52 },
      { x: 52, y: 52 },
      { x: 53, y: 52 },
      { x: 54, y: 52 },
      { x: 55, y: 52 },
      { x: 56, y: 52 },
      { x: 57, y: 52 },
      { x: 58, y: 52 },
      { x: 59, y: 52 },
    ],
  },
  {
    // delivery-side alley offers a risky late orthogonal shortcut
    id: "shortcut-delivery-lane",
    pointList: [
      { x: 79, y: 80 },
      { x: 79, y: 81 },
      { x: 79, y: 82 },
      { x: 79, y: 83 },
      { x: 79, y: 84 },
      { x: 79, y: 85 },
      { x: 79, y: 86 },
      { x: 79, y: 87 },
      { x: 80, y: 87 },
      { x: 81, y: 87 },
      { x: 82, y: 87 },
      { x: 83, y: 87 },
      { x: 84, y: 87 },
      { x: 85, y: 87 },
      { x: 86, y: 87 },
      { x: 87, y: 87 },
    ],
  },
];

// Stores hand-selected signal locations on meaningful road crossings
const manualTrafficSignalPointList: CoordinateTilePoint[] = [
  { x: 8, y: 8 },
  { x: 18, y: 8 },
  { x: 48, y: 8 },
  { x: 78, y: 8 },
  { x: 88, y: 8 },
  { x: 8, y: 18 },
  { x: 18, y: 18 },
  { x: 32, y: 18 },
  { x: 48, y: 18 },
  { x: 64, y: 18 },
  { x: 78, y: 18 },
  { x: 88, y: 18 },
  { x: 18, y: 32 },
  { x: 32, y: 32 },
  { x: 48, y: 32 },
  { x: 64, y: 32 },
  { x: 78, y: 32 },
  { x: 18, y: 50 },
  { x: 32, y: 50 },
  { x: 48, y: 50 },
  { x: 64, y: 50 },
  { x: 78, y: 50 },
  { x: 88, y: 50 },
  { x: 8, y: 64 },
  { x: 18, y: 64 },
  { x: 32, y: 64 },
  { x: 48, y: 64 },
  { x: 64, y: 64 },
  { x: 78, y: 64 },
  { x: 88, y: 64 },
  { x: 8, y: 78 },
  { x: 18, y: 78 },
  { x: 32, y: 78 },
  { x: 48, y: 78 },
  { x: 64, y: 78 },
  { x: 78, y: 78 },
  { x: 88, y: 78 },
  { x: 8, y: 88 },
  { x: 18, y: 88 },
  { x: 48, y: 88 },
  { x: 78, y: 88 },
];

// Creates the complete V8 manual city map
export function manualCityMapCreate(): CityMapGenerated {
  // Creates zone list first so tiles can reference zone ids
  const zoneList = manualZoneListCreate();

  // Creates base tile rows
  const tileRows = manualEmptyTileRowsCreate(zoneList);

  // Creates generated map shell
  const cityMapGenerated: CityMapGenerated = {
    // Stores map width
    widthTiles: manualMapWidthTiles,

    // Stores map height
    heightTiles: manualMapHeightTiles,

    // Stores generated tile rows
    tileRows,

    // Stores generated zones
    zoneList,

    // Stores generated traffic signals, filled later
    trafficSignalList: [],

    // Stores Courier start point
    startTilePoint: manualStartTilePoint,

    // Stores delivery point
    deliveryTilePoint: manualDeliveryTilePoint,

    // Stores map metadata
    metadata: {
      // Stores fixed manual seed
      seed: manualMapSeed,

      // Manual maps do not retry generation
      attemptCount: 1,

      // Stores timestamp for debug display
      generatedAtMs: Date.now(),

      // Manual map is curated, so warning count starts at zero
      validationWarningCount: 0,
    },
  };

  // Applies fixed water bodies before roads
  manualWaterAreasApply(cityMapGenerated);

  // Applies fixed parks before roads
  manualParkAreasApply(cityMapGenerated);

  // Applies fixed roads and neighborhood blocks
  manualRoadNetworkApply(cityMapGenerated);

  // Applies bridge paths over water
  manualBridgePathsApply(cityMapGenerated);

  // Applies tunnels through building blocks
  manualTunnelPathsApply(cityMapGenerated);

  // Applies shortcut paths through alleys
  manualShortcutPathsApply(cityMapGenerated);

  // Marks start and delivery points
  manualStartDeliveryApply(cityMapGenerated);

  // Marks road intersections from route ids
  manualIntersectionIdsApply(cityMapGenerated);

  // Places fixed traffic signals at real intersections
  manualTrafficSignalsApply(cityMapGenerated);

  // Adds Saboteur hurdle candidates from final tile layers
  manualHurdleCandidatesApply(cityMapGenerated);

  // Returns completed manual city map
  return cityMapGenerated;
}

// Creates all 3x3 zones
function manualZoneListCreate(): CityZone[] {
  // Stores zone list
  const cityZoneList: CityZone[] = [];

  // Stores tile width for each zone
  const zoneWidthTiles = manualMapWidthTiles / 3;

  // Stores tile height for each zone
  const zoneHeightTiles = manualMapHeightTiles / 3;

  // Loops through zone rows
  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    // Loops through zone columns
    for (let columnIndex = 0; columnIndex < 3; columnIndex += 1) {
      // Stores zone id
      const zoneId = `zone-${rowIndex * 3 + columnIndex}`;

      // Stores bounds
      const startX = columnIndex * zoneWidthTiles;
      const startY = rowIndex * zoneHeightTiles;
      const endX = startX + zoneWidthTiles - 1;
      const endY = startY + zoneHeightTiles - 1;

      // Adds zone
      cityZoneList.push({
        // Stores stable zone id
        id: zoneId,

        // Stores row index
        rowIndex,

        // Stores column index
        columnIndex,

        // Stores first tile x
        startX,

        // Stores first tile y
        startY,

        // Stores last tile x
        endX,

        // Stores last tile y
        endY,

        // Stores center x for camera
        centerX: Math.floor((startX + endX) / 2),

        // Stores center y for camera
        centerY: Math.floor((startY + endY) / 2),

        // Stores reusable bounds
        bounds: {
          startX,
          startY,
          endX,
          endY,
        },
      });
    }
  }

  // Returns zones
  return cityZoneList;
}

// Creates base tile rows filled with building terrain
function manualEmptyTileRowsCreate(zoneList: CityZone[]): CityTile[][] {
  // Stores tile rows
  const tileRows: CityTile[][] = [];

  // Loops through y rows
  for (let y = 0; y < manualMapHeightTiles; y += 1) {
    // Stores one tile row
    const tileRow: CityTile[] = [];

    // Loops through x columns
    for (let x = 0; x < manualMapWidthTiles; x += 1) {
      // Adds base building tile
      tileRow.push(manualTileCreate(x, y, manualZoneIdForTileGet(zoneList, x, y)));
    }

    // Adds row
    tileRows.push(tileRow);
  }

  // Returns rows
  return tileRows;
}

// Creates one base tile
function manualTileCreate(x: number, y: number, zoneId: string): CityTile {
  // Returns complete base tile
  return {
    // Stores x coordinate
    x,

    // Stores y coordinate
    y,

    // Starts as dense building terrain
    terrainType: CityTileTerrainType.Building,

    // Starts with no road
    roadClass: CityTileRoadClass.None,

    // Starts with no path
    pathKind: CityTilePathKind.None,

    // Starts with no features
    featureKindList: [],

    // Stores owning zone id
    zoneId,

    // Building tile is not walkable by default
    walkable: false,

    // Default movement cost is neutral
    baseMovementCost: 1,

    // Starts without tunnel entrance
    tunnelEntrance: false,

    // Starts without shortcut entrance
    shortcutEntrance: false,

    // Starts without bridge entrance
    bridgeEntrance: false,

    // Starts without start marker
    start: false,

    // Starts without delivery marker
    delivery: false,

    // Starts without route ids
    routeIdList: [],

    // Starts without hurdle candidates
    hurdleCandidateList: [],
  };
}

// Gets zone id for one tile
function manualZoneIdForTileGet(zoneList: CityZone[], x: number, y: number): string {
  // Finds zone containing tile
  const cityZone = zoneList.find((zone) =>
    x >= zone.startX &&
    x <= zone.endX &&
    y >= zone.startY &&
    y <= zone.endY
  );

  // Returns found zone id
  return cityZone?.id ?? "zone-0";
}

// Applies water bodies
function manualWaterAreasApply(cityMapGenerated: CityMapGenerated): void {
  // Loops through water areas
  for (const waterArea of manualWaterAreaList) {
    // Applies water ellipse
    manualEllipseTerrainApply(cityMapGenerated, waterArea, CityTileTerrainType.Water);
  }
}

// Applies parks
function manualParkAreasApply(cityMapGenerated: CityMapGenerated): void {
  // Loops through park areas
  for (const parkArea of manualParkAreaList) {
    // Applies park ellipse
    manualEllipseTerrainApply(cityMapGenerated, parkArea, CityTileTerrainType.Park);
  }

  // Adds small rectangular plazas that are easier to read in isometric view
  manualRectangleTerrainApply(cityMapGenerated, {
    id: "station-square",
    startX: 39,
    startY: 12,
    widthTiles: 9,
    heightTiles: 5,
  }, CityTileTerrainType.Park);
}

// Applies one ellipse terrain area
function manualEllipseTerrainApply(
  cityMapGenerated: CityMapGenerated,
  area: ManualEllipseArea,
  terrainType: CityTileTerrainType
): void {
  // Stores x bounds
  const startX = Math.max(0, area.centerX - area.radiusX);
  const endX = Math.min(cityMapGenerated.widthTiles - 1, area.centerX + area.radiusX);

  // Stores y bounds
  const startY = Math.max(0, area.centerY - area.radiusY);
  const endY = Math.min(cityMapGenerated.heightTiles - 1, area.centerY + area.radiusY);

  // Loops through ellipse bounds
  for (let y = startY; y <= endY; y += 1) {
    // Loops through columns
    for (let x = startX; x <= endX; x += 1) {
      // Stores normalized x distance
      const distanceX = (x - area.centerX) / area.radiusX;

      // Stores normalized y distance
      const distanceY = (y - area.centerY) / area.radiusY;

      // Skips points outside ellipse
      if (distanceX * distanceX + distanceY * distanceY > 1) {
        continue;
      }

      // Applies terrain
      manualTerrainTileApply(cityMapGenerated.tileRows[y][x], terrainType, area.id);
    }
  }
}

// Applies one rectangular terrain area
function manualRectangleTerrainApply(
  cityMapGenerated: CityMapGenerated,
  area: ManualRectangleArea,
  terrainType: CityTileTerrainType
): void {
  // Loops through rectangle rows
  for (let y = area.startY; y < area.startY + area.heightTiles; y += 1) {
    // Loops through rectangle columns
    for (let x = area.startX; x < area.startX + area.widthTiles; x += 1) {
      // Skips outside bounds
      if (!manualTileInBoundsCheck(cityMapGenerated, x, y)) {
        continue;
      }

      // Applies terrain
      manualTerrainTileApply(cityMapGenerated.tileRows[y][x], terrainType, area.id);
    }
  }
}

// Applies terrain to a tile and clears walkable layers
function manualTerrainTileApply(
  cityTile: CityTile,
  terrainType: CityTileTerrainType,
  visualVariant: string
): void {
  // Updates terrain
  cityTile.terrainType = terrainType;

  // Clears road class
  cityTile.roadClass = CityTileRoadClass.None;

  // Clears path kind
  cityTile.pathKind = CityTilePathKind.None;

  // Clears feature list
  cityTile.featureKindList = [];

  // Clears walkable flag
  cityTile.walkable = false;

  // Stores visual variant id
  cityTile.visualVariant = visualVariant;

  // Clears route ids because area terrain owns this tile
  cityTile.routeIdList = [];
}

// Applies all planned road segments
function manualRoadNetworkApply(cityMapGenerated: CityMapGenerated): void {
  // Applies each road segment
  for (const roadSegment of manualRoadSegmentList) {
    // Applies horizontal road
    if (roadSegment.orientation === "horizontal") {
      manualHorizontalRoadApply(cityMapGenerated, roadSegment);
      continue;
    }

    // Applies vertical road
    manualVerticalRoadApply(cityMapGenerated, roadSegment);
  }
}

// Applies one horizontal road segment
function manualHorizontalRoadApply(cityMapGenerated: CityMapGenerated, roadSegment: ManualRoadSegment): void {
  // Gets road offsets for width
  const offsetList = manualRoadWidthOffsetListGet(roadSegment.widthTiles);

  // Loops along x axis
  for (let x = roadSegment.x; x <= roadSegment.end; x += 1) {
    // Loops through road width offsets
    for (const offset of offsetList) {
      // Applies road tile
      manualRoadTileApply(cityMapGenerated, x, roadSegment.y + offset, roadSegment.roadClass, roadSegment.id, false);
    }
  }
}

// Applies one vertical road segment
function manualVerticalRoadApply(cityMapGenerated: CityMapGenerated, roadSegment: ManualRoadSegment): void {
  // Gets road offsets for width
  const offsetList = manualRoadWidthOffsetListGet(roadSegment.widthTiles);

  // Loops along y axis
  for (let y = roadSegment.y; y <= roadSegment.end; y += 1) {
    // Loops through road width offsets
    for (const offset of offsetList) {
      // Applies road tile
      manualRoadTileApply(cityMapGenerated, roadSegment.x + offset, y, roadSegment.roadClass, roadSegment.id, false);
    }
  }
}

// Gets offsets for road width
function manualRoadWidthOffsetListGet(widthTiles: number): number[] {
  // Returns centered width for three tile avenues
  if (widthTiles === 3) {
    return [-1, 0, 1];
  }

  // Returns two tile roads biased forward for easier integer placement
  if (widthTiles === 2) {
    return [0, 1];
  }

  // Returns one tile local road
  return [0];
}

// Applies one road tile
function manualRoadTileApply(
  cityMapGenerated: CityMapGenerated,
  tileX: number,
  tileY: number,
  roadClass: CityTileRoadClass,
  routeId: string,
  force: boolean
): void {
  // Skips out of bounds tiles
  if (!manualTileInBoundsCheck(cityMapGenerated, tileX, tileY)) {
    return;
  }

  // Stores tile
  const cityTile = cityMapGenerated.tileRows[tileY][tileX];

  // Keeps water and parks clear unless this is a bridge style forced path
  if (!force && (cityTile.terrainType === CityTileTerrainType.Water || cityTile.terrainType === CityTileTerrainType.Park)) {
    return;
  }

  // Keeps hidden paths from being overwritten by roads unless forced
  if (!force && (cityTile.pathKind === CityTilePathKind.Tunnel || cityTile.pathKind === CityTilePathKind.Shortcut)) {
    return;
  }

  // Stores current priority
  const currentPriority = manualRoadClassPriorityGet(cityTile.roadClass);

  // Stores next priority
  const nextPriority = manualRoadClassPriorityGet(roadClass);

  // Keeps stronger roads when lower priority road touches same tile
  if (!force && currentPriority > nextPriority) {
    manualRouteIdAdd(cityTile, routeId);
    return;
  }

  // Makes the tile land road
  cityTile.terrainType = CityTileTerrainType.Land;
  cityTile.pathKind = CityTilePathKind.Road;
  cityTile.roadClass = roadClass;
  cityTile.walkable = true;
  cityTile.baseMovementCost = manualMovementCostForRoadClassGet(roadClass);
  cityTile.visualVariant = routeId;

  // Adds route id for intersection and future full-width hurdle expansion
  manualRouteIdAdd(cityTile, routeId);
}

// Gets road class priority
function manualRoadClassPriorityGet(roadClass: CityTileRoadClass): number {
  // Returns avenue priority
  if (roadClass === CityTileRoadClass.AvenueRoad) {
    return 3;
  }

  // Returns district road priority
  if (roadClass === CityTileRoadClass.DistrictRoad) {
    return 2;
  }

  // Returns local road priority
  if (roadClass === CityTileRoadClass.LocalRoad) {
    return 1;
  }

  // Returns no road priority
  return 0;
}

// Gets movement cost for road class
function manualMovementCostForRoadClassGet(roadClass: CityTileRoadClass): number {
  // Returns avenue cost
  if (roadClass === CityTileRoadClass.AvenueRoad) {
    return 0.85;
  }

  // Returns district cost
  if (roadClass === CityTileRoadClass.DistrictRoad) {
    return 1;
  }

  // Returns local road cost
  if (roadClass === CityTileRoadClass.LocalRoad) {
    return 1.15;
  }

  // Returns neutral cost
  return 1;
}

// Applies bridge paths
function manualBridgePathsApply(cityMapGenerated: CityMapGenerated): void {
  // Loops through bridge paths
  for (const bridgePath of manualBridgePathList) {
    // Applies bridge path
    manualPathApply(cityMapGenerated, bridgePath, CityTilePathKind.Bridge);
  }
}

// Applies tunnel paths
function manualTunnelPathsApply(cityMapGenerated: CityMapGenerated): void {
  // Loops through tunnel paths
  for (const tunnelPath of manualTunnelPathList) {
    // Applies tunnel path
    manualPathApply(cityMapGenerated, tunnelPath, CityTilePathKind.Tunnel);
  }
}

// Applies shortcut paths
function manualShortcutPathsApply(cityMapGenerated: CityMapGenerated): void {
  // Loops through shortcut paths
  for (const shortcutPath of manualShortcutPathList) {
    // Applies shortcut path
    manualPathApply(cityMapGenerated, shortcutPath, CityTilePathKind.Shortcut);
  }
}

// Applies a special path kind
function manualPathApply(
  cityMapGenerated: CityMapGenerated,
  pathPlan: ManualPathPlan,
  pathKind: CityTilePathKind
): void {
  // Loops through path points
  for (let pointIndex = 0; pointIndex < pathPlan.pointList.length; pointIndex += 1) {
    // Stores point
    const tilePoint = pathPlan.pointList[pointIndex];

    // Skips out of bounds tiles
    if (!manualTileInBoundsCheck(cityMapGenerated, tilePoint.x, tilePoint.y)) {
      continue;
    }

    // Stores tile
    const cityTile = cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];

    // Applies bridge over water or land only
    if (pathKind === CityTilePathKind.Bridge) {
      manualBridgeTileApply(cityTile, pathPlan.id, pointIndex, pathPlan.pointList.length);
      continue;
    }

    // Applies tunnel through building or land
    if (pathKind === CityTilePathKind.Tunnel) {
      manualTunnelTileApply(cityTile, pathPlan.id, pointIndex, pathPlan.pointList.length);
      continue;
    }

    // Applies shortcut through buildings and land but never water
    manualShortcutTileApply(cityTile, pathPlan.id, pointIndex, pathPlan.pointList.length);
  }
}

// Applies one bridge tile
function manualBridgeTileApply(cityTile: CityTile, bridgeId: string, pointIndex: number, pointCount: number): void {
  // Bridge visually belongs to water when it crosses water, otherwise it is a land bridge approach
  if (cityTile.terrainType !== CityTileTerrainType.Water) {
    cityTile.terrainType = CityTileTerrainType.Land;
  }

  // Sets bridge path
  cityTile.pathKind = CityTilePathKind.Bridge;
  cityTile.roadClass = CityTileRoadClass.DistrictRoad;
  cityTile.walkable = true;
  cityTile.baseMovementCost = 0.9;
  cityTile.bridgeId = bridgeId;
  cityTile.visualVariant = bridgeId;

  // Adds bridge route id
  manualRouteIdAdd(cityTile, `bridge-${bridgeId}`);

  // Marks first and last points as bridge entrances
  if (pointIndex === 0 || pointIndex === pointCount - 1) {
    cityTile.bridgeEntrance = true;
    manualFeatureAdd(cityTile, CityTileFeatureKind.BridgeEntrance);
  }
}

// Applies one tunnel tile
function manualTunnelTileApply(cityTile: CityTile, tunnelId: string, pointIndex: number, pointCount: number): void {
  // Rejects water and park because tunnel should not cut through those in V8
  if (cityTile.terrainType === CityTileTerrainType.Water || cityTile.terrainType === CityTileTerrainType.Park) {
    return;
  }

  // Sets tunnel path
  cityTile.terrainType = CityTileTerrainType.Building;
  cityTile.pathKind = CityTilePathKind.Tunnel;
  cityTile.roadClass = CityTileRoadClass.None;
  cityTile.walkable = true;
  cityTile.baseMovementCost = 0.8;
  cityTile.tunnelId = tunnelId;
  cityTile.visualVariant = tunnelId;

  // Adds tunnel route id
  manualRouteIdAdd(cityTile, `tunnel-${tunnelId}`);

  // Marks first and last points as tunnel entrances
  if (pointIndex === 0 || pointIndex === pointCount - 1) {
    cityTile.tunnelEntrance = true;
    manualFeatureAdd(cityTile, CityTileFeatureKind.TunnelEntrance);
  }
}

// Applies one shortcut tile
function manualShortcutTileApply(cityTile: CityTile, shortcutId: string, pointIndex: number, pointCount: number): void {
  // Rejects water and park because shortcuts should not cut through blocked scenic areas
  if (cityTile.terrainType === CityTileTerrainType.Water || cityTile.terrainType === CityTileTerrainType.Park) {
    return;
  }

  // Sets shortcut path
  cityTile.terrainType = CityTileTerrainType.Land;
  cityTile.pathKind = CityTilePathKind.Shortcut;
  cityTile.roadClass = CityTileRoadClass.None;
  cityTile.walkable = true;
  cityTile.baseMovementCost = 1.35;
  cityTile.shortcutId = shortcutId;
  cityTile.visualVariant = shortcutId;

  // Adds shortcut route id
  manualRouteIdAdd(cityTile, `shortcut-${shortcutId}`);

  // Marks first and last points as shortcut entrances
  if (pointIndex === 0 || pointIndex === pointCount - 1) {
    cityTile.shortcutEntrance = true;
    manualFeatureAdd(cityTile, CityTileFeatureKind.ShortcutEntrance);
  }
}

// Applies start and delivery markers
function manualStartDeliveryApply(cityMapGenerated: CityMapGenerated): void {
  // Stores start tile
  const startTile = cityMapGenerated.tileRows[manualStartTilePoint.y][manualStartTilePoint.x];

  // Stores delivery tile
  const deliveryTile = cityMapGenerated.tileRows[manualDeliveryTilePoint.y][manualDeliveryTilePoint.x];

  // Ensures start is walkable road
  manualRoadTileApply(cityMapGenerated, manualStartTilePoint.x, manualStartTilePoint.y, CityTileRoadClass.DistrictRoad, "road-start-plaza", true);

  // Ensures delivery is walkable road
  manualRoadTileApply(cityMapGenerated, manualDeliveryTilePoint.x, manualDeliveryTilePoint.y, CityTileRoadClass.DistrictRoad, "road-delivery-plaza", true);

  // Marks start tile
  startTile.start = true;

  // Clears traffic signal id if any
  startTile.trafficSignalId = undefined;

  // Marks delivery tile
  deliveryTile.delivery = true;

  // Clears traffic signal id if any
  deliveryTile.trafficSignalId = undefined;
}

// Applies intersection ids from route ids
function manualIntersectionIdsApply(cityMapGenerated: CityMapGenerated): void {
  // Loops through tile rows
  for (const tileRow of cityMapGenerated.tileRows) {
    // Loops through row tiles
    for (const cityTile of tileRow) {
      // Skips non road tiles
      if (cityTile.pathKind !== CityTilePathKind.Road) {
        continue;
      }

      // Checks whether tile was touched by horizontal road
      const horizontalRouteExists = cityTile.routeIdList.some((routeId) => routeId.startsWith("road-h-"));

      // Checks whether tile was touched by vertical road
      const verticalRouteExists = cityTile.routeIdList.some((routeId) => routeId.startsWith("road-v-"));

      // Marks intersection when both route directions meet
      if (horizontalRouteExists && verticalRouteExists) {
        cityTile.intersectionId = `intersection-${cityTile.x}-${cityTile.y}`;
      }
    }
  }
}

// Applies fixed traffic signals
function manualTrafficSignalsApply(cityMapGenerated: CityMapGenerated): void {
  // Stores generated traffic signal list
  const trafficSignalList: TrafficSignalGenerated[] = [];

  // Loops through selected signal points
  for (const signalPoint of manualTrafficSignalPointList) {
    // Skips out of bounds points
    if (!manualTileInBoundsCheck(cityMapGenerated, signalPoint.x, signalPoint.y)) {
      continue;
    }

    // Stores target tile
    const cityTile = cityMapGenerated.tileRows[signalPoint.y][signalPoint.x];

    // Skips start and delivery
    if (cityTile.start || cityTile.delivery) {
      continue;
    }

    // Skips non-road points
    if (cityTile.pathKind !== CityTilePathKind.Road) {
      continue;
    }

    // Skips tiles without real intersection
    if (!cityTile.intersectionId) {
      continue;
    }

    // Stores signal id
    const trafficSignalId = `signal-${signalPoint.x}-${signalPoint.y}`;

    // Stores traffic signal id on tile
    cityTile.trafficSignalId = trafficSignalId;

    // Adds traffic signal feature
    manualFeatureAdd(cityTile, CityTileFeatureKind.TrafficSignal);

    // Adds generated signal
    trafficSignalList.push({
      // Stores signal id
      id: trafficSignalId,

      // Stores tile point
      tilePoint: {
        x: signalPoint.x,
        y: signalPoint.y,
      },

      // Stores owning intersection id
      intersectionId: cityTile.intersectionId,
    });
  }

  // Stores generated traffic signal list
  cityMapGenerated.trafficSignalList = trafficSignalList;
}

// Applies hurdle candidates using final tile layers
function manualHurdleCandidatesApply(cityMapGenerated: CityMapGenerated): void {
  // Loops through tile rows
  for (const tileRow of cityMapGenerated.tileRows) {
    // Loops through row tiles
    for (const cityTile of tileRow) {
      // Clears existing candidates
      cityTile.hurdleCandidateList = [];

      // Adds signal action only on traffic signal tiles
      if (cityTile.trafficSignalId) {
        manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.RedTrafficLight);
      }

      // Adds gate on bridge, tunnel, and shortcut entrances
      if ((cityTile.bridgeEntrance || cityTile.tunnelEntrance || cityTile.shortcutEntrance) && !cityTile.start && !cityTile.delivery) {
        manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.ClosedGate);
      }

      // Adds wrong direction sign on intersections and hidden route entrances
      if ((cityTile.intersectionId || cityTile.tunnelEntrance || cityTile.shortcutEntrance) && !cityTile.start && !cityTile.delivery) {
        manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.WrongDirectionSign);
      }

      // Skips remaining candidates on non-normal roads
      if (cityTile.pathKind !== CityTilePathKind.Road || !cityTile.walkable || cityTile.start || cityTile.delivery) {
        continue;
      }

      // Skips water park or building terrain
      if (
        cityTile.terrainType === CityTileTerrainType.Water ||
        cityTile.terrainType === CityTileTerrainType.Park ||
        cityTile.terrainType === CityTileTerrainType.Building
      ) {
        continue;
      }

      // Adds general road blockers
      manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.RoadBlock);
      manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.BrokenRoad);

      // Adds road pressure tools on every normal road tile in V8 prototype
      manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.ConstructionWork);
      manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.TrafficJam);
      manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.MovingBarrier);
      manualHurdleCandidateAdd(cityTile, SaboteurHurdleType.SecurityCheckpoint);
    }
  }
}

// Adds one feature when missing
function manualFeatureAdd(cityTile: CityTile, featureKind: CityTileFeatureKind): void {
  // Adds feature only when missing
  if (!cityTile.featureKindList.includes(featureKind)) {
    cityTile.featureKindList.push(featureKind);
  }
}

// Adds one route id when missing
function manualRouteIdAdd(cityTile: CityTile, routeId: string): void {
  // Adds route id only when missing
  if (!cityTile.routeIdList.includes(routeId)) {
    cityTile.routeIdList.push(routeId);
  }
}

// Adds one hurdle candidate when missing
function manualHurdleCandidateAdd(cityTile: CityTile, hurdleType: SaboteurHurdleType): void {
  // Adds candidate only when missing
  if (!cityTile.hurdleCandidateList.includes(hurdleType)) {
    cityTile.hurdleCandidateList.push(hurdleType);
  }
}

// Checks tile bounds
function manualTileInBoundsCheck(cityMapGenerated: CityMapGenerated, tileX: number, tileY: number): boolean {
  // Returns whether x and y are inside map
  return tileX >= 0 &&
    tileY >= 0 &&
    tileX < cityMapGenerated.widthTiles &&
    tileY < cityMapGenerated.heightTiles;
}

// Creates a straight horizontal or vertical line of tile points
function manualLinePointListCreate(from: CoordinateTilePoint, to: CoordinateTilePoint): CoordinateTilePoint[] {
  // Stores generated point list
  const pointList: CoordinateTilePoint[] = [];

  // Handles vertical line
  if (from.x === to.x) {
    // Stores direction
    const direction = from.y <= to.y ? 1 : -1;

    // Loops through y coordinates
    for (let y = from.y; y !== to.y + direction; y += direction) {
      pointList.push({ x: from.x, y });
    }

    // Returns vertical points
    return pointList;
  }

  // Handles horizontal line
  if (from.y === to.y) {
    // Stores direction
    const direction = from.x <= to.x ? 1 : -1;

    // Loops through x coordinates
    for (let x = from.x; x !== to.x + direction; x += direction) {
      pointList.push({ x, y: from.y });
    }

    // Returns horizontal points
    return pointList;
  }

  // Throws because manual line helper only supports straight lines
  throw new Error("Manual line point list supports only horizontal or vertical paths");
}
