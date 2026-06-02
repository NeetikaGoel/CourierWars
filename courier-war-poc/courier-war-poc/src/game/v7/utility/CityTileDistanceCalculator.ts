// Imports tile point shape used by distance calculations
import type { CoordinateTilePoint } from "../types/CoordinateType";

// Gets absolute x distance between two tile points
export function cityTileDistanceXAbsoluteGet(
  tilePointA: CoordinateTilePoint,
  tilePointB: CoordinateTilePoint
): number {
  // Returns absolute difference between x coordinates
  return Math.abs(tilePointA.x - tilePointB.x);
}

// Gets absolute y distance between two tile points
export function cityTileDistanceYAbsoluteGet(
  tilePointA: CoordinateTilePoint,
  tilePointB: CoordinateTilePoint
): number {
  // Returns absolute difference between y coordinates
  return Math.abs(tilePointA.y - tilePointB.y);
}

// Gets Manhattan distance between two tile points
export function cityTileDistanceManhattanGet(
  tilePointA: CoordinateTilePoint,
  tilePointB: CoordinateTilePoint
): number {
  // Stores absolute x distance
  const distanceX = cityTileDistanceXAbsoluteGet(tilePointA, tilePointB);

  // Stores absolute y distance
  const distanceY = cityTileDistanceYAbsoluteGet(tilePointA, tilePointB);

  // Returns grid movement distance using four directional movement
  return distanceX + distanceY;
}

// Gets Chebyshev distance between two tile points
export function cityTileDistanceChebyshevGet(
  tilePointA: CoordinateTilePoint,
  tilePointB: CoordinateTilePoint
): number {
  // Stores absolute x distance
  const distanceX = cityTileDistanceXAbsoluteGet(tilePointA, tilePointB);

  // Stores absolute y distance
  const distanceY = cityTileDistanceYAbsoluteGet(tilePointA, tilePointB);

  // Returns maximum axis distance
  return Math.max(distanceX, distanceY);
}

// Gets squared Euclidean distance between two tile points
export function cityTileDistanceSquaredGet(
  tilePointA: CoordinateTilePoint,
  tilePointB: CoordinateTilePoint
): number {
  // Stores x coordinate difference
  const distanceX = tilePointA.x - tilePointB.x;

  // Stores y coordinate difference
  const distanceY = tilePointA.y - tilePointB.y;

  // Returns squared distance without square root for faster comparison
  return distanceX * distanceX + distanceY * distanceY;
}

// Checks whether two tile points are within a Manhattan distance limit
export function cityTileDistanceWithinLimitCheck(
  tilePointA: CoordinateTilePoint,
  tilePointB: CoordinateTilePoint,
  distanceLimitTiles: number
): boolean {
  // Stores Manhattan distance between both tile points
  const distanceTiles = cityTileDistanceManhattanGet(tilePointA, tilePointB);

  // Returns whether distance is within the provided limit
  return distanceTiles <= distanceLimitTiles;
}

// Checks whether target tile is too close to source tile using Manhattan distance
export function cityTileDistanceTooCloseCheck(
  sourceTilePoint: CoordinateTilePoint,
  targetTilePoint: CoordinateTilePoint,
  distanceTilesMin: number
): boolean {
  // Stores Manhattan distance between source and target
  const distanceTiles = cityTileDistanceManhattanGet(sourceTilePoint, targetTilePoint);

  // Returns whether distance is lower than minimum allowed distance
  return distanceTiles < distanceTilesMin;
}