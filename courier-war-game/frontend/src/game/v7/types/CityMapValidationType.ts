// Imports tile point shape for validation issue locations
import type { CoordinateTilePoint } from "./CoordinateType";

// Defines validation issue code values
export const CityMapValidationIssueCode = {
  // Represents delivery being unreachable from start
  DeliveryUnreachable: "deliveryUnreachable",

  // Represents a zone without enough walkable roads
  ZoneRoadCoverageMissing: "zoneRoadCoverageMissing",

  // Represents traffic signal on invalid tile
  TrafficSignalInvalidTile: "trafficSignalInvalidTile",

  // Represents traffic signals placed too close together
  TrafficSignalTooClose: "trafficSignalTooClose",

  // Represents bridge not placed on water
  BridgeNotOnWater: "bridgeNotOnWater",

  // Represents bridge not connected to road network
  BridgeDisconnected: "bridgeDisconnected",

  // Represents tunnel without connected entrances
  TunnelDisconnected: "tunnelDisconnected",

  // Represents shortcut without useful connected endpoints
  ShortcutDisconnected: "shortcutDisconnected",

  // Represents lake shape that is too thin or too small
  LakeShapeInvalid: "lakeShapeInvalid",

  // Represents invalid hurdle candidate assignment
  HurdleCandidateInvalid: "hurdleCandidateInvalid",

  // Represents general road network disconnection
  RoadConnectivityInvalid: "roadConnectivityInvalid",
} as const;

// Creates a string union type from validation issue code values
export type CityMapValidationIssueCode =
  (typeof CityMapValidationIssueCode)[keyof typeof CityMapValidationIssueCode];

// Defines validation error shape
export interface CityMapValidationError {
  // Stores validation error code
  code: CityMapValidationIssueCode;

  // Stores readable validation error message
  message: string;

  // Stores optional tile point related to the error
  tilePoint?: CoordinateTilePoint;

  // Stores optional related generated object id
  relatedId?: string;
}

// Defines validation warning shape
export interface CityMapValidationWarning {
  // Stores validation warning code
  code: CityMapValidationIssueCode;

  // Stores readable validation warning message
  message: string;

  // Stores optional tile point related to the warning
  tilePoint?: CoordinateTilePoint;

  // Stores optional related generated object id
  relatedId?: string;
}

// Defines generated map statistics from validation
export interface CityMapGenerationStats {
  // Stores total walkable tile count
  walkableTileCount: number;

  // Stores total road tile count
  roadTileCount: number;

  // Stores total bridge tile count
  bridgeTileCount: number;

  // Stores total tunnel tile count
  tunnelTileCount: number;

  // Stores total shortcut tile count
  shortcutTileCount: number;

  // Stores total traffic signal count
  trafficSignalCount: number;

  // Stores total hurdle candidate tile count
  hurdleCandidateTileCount: number;
}

// Defines complete validation result
export interface CityMapValidationResult {
  // Stores whether generated map passed validation
  valid: boolean;

  // Stores validation errors
  errorList: CityMapValidationError[];

  // Stores validation warnings
  warningList: CityMapValidationWarning[];

  // Stores generated map statistics
  stats: CityMapGenerationStats;
}