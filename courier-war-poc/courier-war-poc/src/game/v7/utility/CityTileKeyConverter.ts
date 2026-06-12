// Imports tile point shape used by tile key conversion
import type { CoordinateTilePoint } from "../types/CoordinateType";

// Defines the separator used inside tile keys
const cityTileKeySeparator = ",";

// Creates a stable tile key from x and y coordinates
export function cityTileKeyFromCoordinatesGet(x: number, y: number): string {
  // Returns tile key in x,y format
  return `${x}${cityTileKeySeparator}${y}`;
}

// Creates a stable tile key from a tile point
export function cityTileKeyFromPointGet(tilePoint: CoordinateTilePoint): string {
  // Returns tile key using the tile point coordinates
  return cityTileKeyFromCoordinatesGet(tilePoint.x, tilePoint.y);
}

// Converts a tile key back into a tile point
export function cityTilePointFromKeyGet(tileKey: string): CoordinateTilePoint {
  // Splits the tile key into x and y string values
  const tileKeyPartList = tileKey.split(cityTileKeySeparator);

  // Checks that the tile key has exactly two coordinate parts
  if (tileKeyPartList.length !== 2) {
    // Throws a clear error when tile key shape is invalid
    throw new Error(`Invalid city tile key ${tileKey}`);
  }

  // Converts x coordinate text into a number
  const tileX = Number(tileKeyPartList[0]);

  // Converts y coordinate text into a number
  const tileY = Number(tileKeyPartList[1]);

  // Checks that x coordinate is a valid finite number
  const tileXValid = Number.isFinite(tileX);

  // Checks that y coordinate is a valid finite number
  const tileYValid = Number.isFinite(tileY);

  // Stops conversion when either coordinate is invalid
  if (!tileXValid || !tileYValid) {
    // Throws a clear error when tile key contains invalid numbers
    throw new Error(`Invalid city tile key coordinates ${tileKey}`);
  }

  // Returns tile point reconstructed from the tile key
  return {
    // Stores parsed x coordinate
    x: tileX,

    // Stores parsed y coordinate
    y: tileY,
  };
}

// Checks whether a tile key string has valid basic format
export function cityTileKeyValidCheck(tileKey: string): boolean {
  // Splits the tile key into x and y string values
  const tileKeyPartList = tileKey.split(cityTileKeySeparator);

  // Rejects tile key when it does not contain exactly two parts
  if (tileKeyPartList.length !== 2) {
    // Returns false for invalid tile key shape
    return false;
  }

  // Converts x coordinate text into a number
  const tileX = Number(tileKeyPartList[0]);

  // Converts y coordinate text into a number
  const tileY = Number(tileKeyPartList[1]);

  // Returns whether both coordinates are finite numbers
  return Number.isFinite(tileX) && Number.isFinite(tileY);
}