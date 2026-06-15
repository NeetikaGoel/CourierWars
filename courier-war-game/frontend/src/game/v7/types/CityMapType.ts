// Imports tile point shape used by generated map data
import type { CoordinateTilePoint } from "./CoordinateType";

// Imports tile layer value types
import type {
  CityTileFeatureKind,
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "./CityTileType";

// Imports zone id and zone shape used by generated map data
import type { CityZone, CityZoneId } from "./CityZoneType";

// Imports generated traffic signal shape
import type { TrafficSignalGenerated } from "./TrafficSignalType";

// Imports Saboteur hurdle type used by hurdle candidates
import type { SaboteurHurdleType } from "./SaboteurHurdleType";

// Defines one generated city tile with layered data
export interface CityTile {
  // Stores tile x coordinate
  x: number;

  // Stores tile y coordinate
  y: number;

  // Stores base terrain type
  terrainType: CityTileTerrainType;

  // Stores road class layered on the tile
  roadClass: CityTileRoadClass;

  // Stores path kind layered on the tile
  pathKind: CityTilePathKind;

  // Stores generated feature kinds layered on the tile
  featureKindList: CityTileFeatureKind[];

  // Stores zone id for camera and Saboteur placement rules
  zoneId: CityZoneId;

  // Stores whether Courier can enter this tile before runtime hurdles
  walkable: boolean;

  // Stores base movement cost before runtime hurdle multipliers
  baseMovementCost: number;

  // Stores road intersection id when this tile is an intersection
  intersectionId?: string;

  // Stores traffic signal id when this tile has a signal feature
  trafficSignalId?: string;

  // Stores bridge id when this tile belongs to a bridge
  bridgeId?: string;

  // Stores tunnel id when this tile belongs to a tunnel
  tunnelId?: string;

  // Stores shortcut id when this tile belongs to a shortcut
  shortcutId?: string;

  // Stores whether this tile is a tunnel entrance
  tunnelEntrance: boolean;

  // Stores whether this tile is a shortcut entrance
  shortcutEntrance: boolean;

  // Stores whether this tile is a bridge entrance
  bridgeEntrance: boolean;

  // Stores whether this tile is the Courier start tile
  start: boolean;

  // Stores whether this tile is the delivery tile
  delivery: boolean;

  // Stores optional visual variant name for renderer variety
  visualVariant?: string;

  // Stores route ids that generated or touched this tile
  routeIdList: string[];

  // Stores hurdle types that can be placed on this tile
  hurdleCandidateList: SaboteurHurdleType[];
}

// Defines generated map rows as a 2D tile array
export type CityMapTileRows = CityTile[][];

// Defines metadata for a generated city map
export interface CityMapGenerationMetadata {
  // Stores seed used to generate the map
  seed: number;

  // Stores generation attempt count that produced the final map
  attemptCount: number;

  // Stores creation timestamp in milliseconds
  generatedAtMs: number;

  // Stores validation warning count after generation
  validationWarningCount: number;
}

// Defines complete generated city map data
export interface CityMapGenerated {
  // Stores generated map width in tiles
  widthTiles: number;

  // Stores generated map height in tiles
  heightTiles: number;

  // Stores generated tile rows
  tileRows: CityMapTileRows;

  // Stores generated zone list
  zoneList: CityZone[];

  // Stores generated traffic signal list
  trafficSignalList: TrafficSignalGenerated[];

  // Stores Courier start tile point
  startTilePoint: CoordinateTilePoint;

  // Stores delivery tile point
  deliveryTilePoint: CoordinateTilePoint;

  // Stores generated map metadata
  metadata: CityMapGenerationMetadata;
}