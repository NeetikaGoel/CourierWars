// Imports tile key converter helpers
import {
  cityTileKeyFromPointGet,
  cityTileKeyFromCoordinatesGet,
} from "../../utility/CityTileKeyConverter";

// Imports tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports zone id type
import type { CityZoneId } from "../../types/CityZoneType";

// Tracks tiles visited by Courier during the match
export class CourierTrailStateStore {
  // Stores tile keys visited by Courier
  private courierVisitedTileKeySet = new Set<string>();

  // Marks a tile as visited by Courier
  courierTrailTileVisitedMark(tilePoint: CoordinateTilePoint): void {
    // Stores tile key
    const tileKey = cityTileKeyFromPointGet(tilePoint);

    // Adds tile key to visited set
    this.courierVisitedTileKeySet.add(tileKey);
  }

  // Marks a tile as visited by x and y coordinates
  courierTrailTileVisitedByCoordinatesMark(tileX: number, tileY: number): void {
    // Stores tile key
    const tileKey = cityTileKeyFromCoordinatesGet(tileX, tileY);

    // Adds tile key to visited set
    this.courierVisitedTileKeySet.add(tileKey);
  }

  // Checks whether Courier visited a tile point
  courierTrailTileVisitedCheck(tilePoint: CoordinateTilePoint): boolean {
    // Stores tile key
    const tileKey = cityTileKeyFromPointGet(tilePoint);

    // Returns whether tile key exists in visited set
    return this.courierVisitedTileKeySet.has(tileKey);
  }

  // Checks whether Courier visited x and y coordinates
  courierTrailTileVisitedByCoordinatesCheck(tileX: number, tileY: number): boolean {
    // Stores tile key
    const tileKey = cityTileKeyFromCoordinatesGet(tileX, tileY);

    // Returns whether tile key exists in visited set
    return this.courierVisitedTileKeySet.has(tileKey);
  }

  // Gets visited tile key set
  courierTrailTileKeySetGet(): Set<string> {
    // Returns visited tile key set
    return this.courierVisitedTileKeySet;
  }

  // Replaces visited tile key set
  courierTrailTileKeySetSet(tileKeySet: Set<string>): void {
    // Stores provided tile key set
    this.courierVisitedTileKeySet = tileKeySet;
  }

  // Checks whether a visited tile is in a different zone from Courier current zone
  courierTrailTileDifferentZoneCheck(
    cityTile: CityTile,
    courierZoneIdCurrent: CityZoneId
  ): boolean {
    // Returns false when tile was not visited
    if (!this.courierTrailTileVisitedByCoordinatesCheck(cityTile.x, cityTile.y)) {
      // Returns false because different zone visited rule only applies to visited tiles
      return false;
    }

    // Returns whether visited tile zone differs from Courier current zone
    return cityTile.zoneId !== courierZoneIdCurrent;
  }

  // Checks whether visited tile is in Courier current zone
  courierTrailTileCurrentZoneCheck(
    cityTile: CityTile,
    courierZoneIdCurrent: CityZoneId
  ): boolean {
    // Returns false when tile was not visited
    if (!this.courierTrailTileVisitedByCoordinatesCheck(cityTile.x, cityTile.y)) {
      // Returns false because current zone visited rule only applies to visited tiles
      return false;
    }

    // Returns whether visited tile zone matches Courier current zone
    return cityTile.zoneId === courierZoneIdCurrent;
  }

  // Clears all visited tiles
  courierTrailClear(): void {
    // Clears visited tile key set
    this.courierVisitedTileKeySet.clear();
  }
}