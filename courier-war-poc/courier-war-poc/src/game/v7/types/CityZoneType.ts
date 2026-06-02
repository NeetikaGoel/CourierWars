// Imports tile bounds shape used by zone bounds
import type { CoordinateTileBounds } from "./CoordinateType";

// Defines city zone id as a string
export type CityZoneId = string;

// Defines a generated city zone
export interface CityZone {
  // Stores stable zone id like zone-0
  id: CityZoneId;

  // Stores zero based zone row index
  rowIndex: number;

  // Stores zero based zone column index
  columnIndex: number;

  // Stores first tile x coordinate included in this zone
  startX: number;

  // Stores first tile y coordinate included in this zone
  startY: number;

  // Stores last tile x coordinate included in this zone
  endX: number;

  // Stores last tile y coordinate included in this zone
  endY: number;

  // Stores center tile x coordinate for camera targeting
  centerX: number;

  // Stores center tile y coordinate for camera targeting
  centerY: number;

  // Stores zone bounds as a reusable shape
  bounds: CoordinateTileBounds;
}

// Defines zone relationship names used by placement logic
export const CityZoneRelation = {
  // Represents Courier current zone
  Current: "current",

  // Represents Courier previous zone
  Previous: "previous",

  // Represents zone touching current zone
  Adjacent: "adjacent",

  // Represents zone in Courier movement direction
  DirectionalFuture: "directionalFuture",

  // Represents zone outside the main placement area
  Other: "other",
} as const;

// Creates a string union type from zone relation values
export type CityZoneRelation = (typeof CityZoneRelation)[keyof typeof CityZoneRelation];