// Imports Saboteur hurdle configuration
import { saboteurHurdleConfig } from "../../config/SaboteurHurdleConfig";

// Imports direction values
import { DirectionName } from "../../types/DirectionType";

// Imports city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports zone types
import type { CityZone, CityZoneId } from "../../types/CityZoneType";

// Defines context needed to calculate allowed Saboteur zones
export interface ZonePlacementAllowedZoneContext {
  // Stores all generated city zones
  cityZoneList: CityZone[];

  // Stores Courier current zone id
  courierZoneIdCurrent: CityZoneId;

  // Stores Courier previous zone id
  courierZoneIdPrevious: CityZoneId | null;

  // Stores Courier current movement direction
  courierDirectionName: DirectionName;
}

// Gets allowed zone ids for Saboteur placement
export function zonePlacementAllowedZoneIdListGet(
  context: ZonePlacementAllowedZoneContext
): CityZoneId[] {
  // Creates allowed zone id set
  const allowedZoneIdSet = new Set<CityZoneId>();

  // Adds adjacent zones
  for (const zoneId of zonePlacementAdjacentZoneIdListGet(context.cityZoneList, context.courierZoneIdCurrent)) {
    // Adds adjacent zone id
    allowedZoneIdSet.add(zoneId);
  }

  // Adds directional future zones
  for (const zoneId of zonePlacementDirectionalFutureZoneIdListGet(
    context.cityZoneList,
    context.courierZoneIdCurrent,
    context.courierDirectionName
  )) {
    // Adds directional future zone id
    allowedZoneIdSet.add(zoneId);
  }

  // Adds previous zone when allowed
  if (
    context.courierZoneIdPrevious &&
    zonePlacementPreviousZoneAllowedCheck(context.courierZoneIdPrevious, context.courierZoneIdCurrent)
  ) {
    // Adds previous zone id
    allowedZoneIdSet.add(context.courierZoneIdPrevious);
  }

  // Removes Courier current zone from allowed set
  allowedZoneIdSet.delete(context.courierZoneIdCurrent);

  // Returns allowed zone id list
  return [...allowedZoneIdSet];
}

// Checks whether a tile zone is allowed for Saboteur placement
export function zonePlacementTileZoneAllowedCheck(
  cityTile: CityTile,
  allowedZoneIdList: CityZoneId[]
): boolean {
  // Returns whether tile zone is inside allowed list
  return allowedZoneIdList.includes(cityTile.zoneId);
}

// Checks whether previous zone can be used
export function zonePlacementPreviousZoneAllowedCheck(
  previousZoneId: CityZoneId,
  currentZoneId: CityZoneId
): boolean {
  // Rejects previous zone when config disables it
  if (!saboteurHurdleConfig.placement.previousZonePlacementAllowed) {
    // Returns false because previous zone placement is disabled
    return false;
  }

  // Rejects previous zone when it equals current zone
  if (previousZoneId === currentZoneId) {
    // Returns false because current zone is never allowed
    return false;
  }

  // Returns true for valid previous zone
  return true;
}

// Gets zone ids adjacent to a zone including diagonals
export function zonePlacementAdjacentZoneIdListGet(
  cityZoneList: CityZone[],
  sourceZoneId: CityZoneId
): CityZoneId[] {
  // Stores source zone
  const sourceZone = zonePlacementZoneFromIdGet(cityZoneList, sourceZoneId);

  // Returns empty list when source zone is missing
  if (!sourceZone) {
    // Returns no adjacent zones
    return [];
  }

  // Returns adjacent zones
  return cityZoneList
    .filter((cityZone) => {
      // Stores row distance
      const rowDistance = Math.abs(cityZone.rowIndex - sourceZone.rowIndex);

      // Stores column distance
      const columnDistance = Math.abs(cityZone.columnIndex - sourceZone.columnIndex);

      // Stores whether candidate is source zone
      const sourceSame = cityZone.id === sourceZone.id;

      // Returns true for adjacent zone
      return !sourceSame && rowDistance <= 1 && columnDistance <= 1;
    })
    .map((cityZone) => cityZone.id);
}

// Gets future zone ids based on Courier direction
export function zonePlacementDirectionalFutureZoneIdListGet(
  cityZoneList: CityZone[],
  sourceZoneId: CityZoneId,
  directionName: DirectionName
): CityZoneId[] {
  // Stores source zone
  const sourceZone = zonePlacementZoneFromIdGet(cityZoneList, sourceZoneId);

  // Returns empty list when source zone is missing
  if (!sourceZone) {
    // Returns no future zones
    return [];
  }

  // Returns empty list when direction is none
  if (directionName === DirectionName.None) {
    // Returns no future zones for no movement direction
    return [];
  }

  // Returns zones directly to the right
  if (directionName === DirectionName.Right) {
    // Returns right side zone ids
    return cityZoneList
      .filter((cityZone) => cityZone.columnIndex === sourceZone.columnIndex + 1)
      .map((cityZone) => cityZone.id);
  }

  // Returns zones directly to the left
  if (directionName === DirectionName.Left) {
    // Returns left side zone ids
    return cityZoneList
      .filter((cityZone) => cityZone.columnIndex === sourceZone.columnIndex - 1)
      .map((cityZone) => cityZone.id);
  }

  // Returns zones directly below
  if (directionName === DirectionName.Down) {
    // Returns lower zone ids
    return cityZoneList
      .filter((cityZone) => cityZone.rowIndex === sourceZone.rowIndex + 1)
      .map((cityZone) => cityZone.id);
  }

  // Returns zones directly above
  if (directionName === DirectionName.Up) {
    // Returns upper zone ids
    return cityZoneList
      .filter((cityZone) => cityZone.rowIndex === sourceZone.rowIndex - 1)
      .map((cityZone) => cityZone.id);
  }

  // Returns empty fallback
  return [];
}

// Gets zone by id
export function zonePlacementZoneFromIdGet(
  cityZoneList: CityZone[],
  cityZoneId: CityZoneId
): CityZone | undefined {
  // Returns first matching zone
  return cityZoneList.find((cityZone) => cityZone.id === cityZoneId);
}