// this file defines the exact readable map payload frontend expects from backend
// the backend should keep this shape close to CityMapGenerated so conversion stays simple

import type { CoordinateTileBounds, CoordinateTilePoint } from "./CoordinateType";
import type { CityTileFeatureKind, CityTilePathKind, CityTileRoadClass, CityTileTerrainType } from "./CityTileType";
import type { SaboteurHurdleType } from "./SaboteurHurdleType";

export interface BackendCityZonePayload {
  // this is the stable zone id used by tiles
  id?: string;

  // this supports backend payloads that use zoneId instead of id
  zoneId?: string;

  // this stores zero based zone row index
  rowIndex: number;

  // this stores zero based zone column index
  columnIndex: number;

  // this stores first x tile in this zone
  startX: number;

  // this stores first y tile in this zone
  startY: number;

  // this stores last x tile in this zone
  endX: number;

  // this stores last y tile in this zone
  endY: number;

  // this stores center x tile for camera focus
  centerX?: number;

  // this stores center y tile for camera focus
  centerY?: number;

  // this stores optional tile bounds
  bounds?: CoordinateTileBounds;
}

export interface BackendTrafficSignalPayload {
  // this is the stable signal id
  id: string;

  // this is where the signal is placed
  tilePoint: CoordinateTilePoint;

  // this links the signal to a road intersection
  intersectionId: string;
}

export interface BackendCityTilePayload {
  // this stores tile x coordinate
  x: number;

  // this stores tile y coordinate
  y: number;

  // this stores base terrain type
  terrainType: CityTileTerrainType;

  // this stores road class layered on top of terrain
  roadClass: CityTileRoadClass;

  // this stores path kind layered on top of terrain
  pathKind: CityTilePathKind;

  // this stores generated features like traffic signals and entrances
  featureKindList?: CityTileFeatureKind[];

  // this stores zone id for camera and placement rules
  zoneId: string;

  // this tells whether courier can enter this tile before runtime hurdles
  walkable: boolean;

  // this stores base movement cost for renderer and movement preview
  baseMovementCost?: number;

  // this stores intersection id when tile is an intersection
  intersectionId?: string | null;

  // this stores traffic signal id when tile has a signal
  trafficSignalId?: string | null;

  // this stores bridge id when tile belongs to a bridge
  bridgeId?: string | null;

  // this stores tunnel id when tile belongs to a tunnel
  tunnelId?: string | null;

  // this stores shortcut id when tile belongs to a shortcut
  shortcutId?: string | null;

  // this marks tunnel entrance tiles
  tunnelEntrance?: boolean;

  // this marks shortcut entrance tiles
  shortcutEntrance?: boolean;

  // this marks bridge entrance tiles
  bridgeEntrance?: boolean;

  // this marks courier start tile
  start?: boolean;

  // this marks delivery tile
  delivery?: boolean;

  // this stores optional visual variation
  visualVariant?: string;

  // this stores route ids that touched this tile
  routeIdList?: string[];

  // this stores hurdle types supported on this tile
  hurdleCandidateList?: SaboteurHurdleType[];
}

export interface BackendCityMapValidationPayload {
  // this tells whether backend validator accepted the generated map
  valid: boolean;

  // this stores validation errors
  errorList?: unknown[];

  // this stores validation warnings
  warningList?: unknown[];

  // this stores useful generated map counts
  stats?: unknown;
}

export interface BackendCityMapPayload {
  // this stores readable map payload version
  mapVersion: string;

  // this stores generator version
  mapGenerationVersion: string;

  // this stores seed used by backend
  mapSeed: number;

  // this stores generated map width
  widthTiles: number;

  // this stores generated map height
  heightTiles: number;

  // this stores every tile row
  tileRows: BackendCityTilePayload[][];

  // this stores generated city zones
  zoneList: BackendCityZonePayload[];

  // this stores generated traffic signal list
  trafficSignalList: BackendTrafficSignalPayload[];

  // this stores courier start point
  startTilePoint: CoordinateTilePoint;

  // this stores delivery point
  deliveryTilePoint: CoordinateTilePoint;

  // this stores optional backend generated timestamp
  generatedAtMs?: number;

  // this stores optional retry attempt count
  attemptCount?: number;

  // this stores optional validation result
  validation?: BackendCityMapValidationPayload;
}