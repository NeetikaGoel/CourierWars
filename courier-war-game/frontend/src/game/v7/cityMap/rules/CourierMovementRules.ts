// Imports Courier movement configuration
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports tile key helper
import { cityTileKeyFromCoordinatesGet } from "../../utility/CityTileKeyConverter";

// Imports city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports traffic signal state names
import { TrafficSignalStateName } from "../../types/TrafficSignalType";

// Imports Saboteur hurdle names
import { SaboteurHurdleType } from "../../types/SaboteurHurdleType";

// Imports movement duration rule
import { movementDurationMsGet } from "./MovementCostRules";

// Defines context needed for Courier movement checks
export interface CourierMovementTileContext {
  // Stores target city tile
  cityTile: CityTile | undefined;

  // Stores current match runtime state
  matchPrototypeState: MatchPrototypeStateShape;
}

// Checks whether Courier can enter a tile
export function courierMovementTileEnterCheck(
  context: CourierMovementTileContext
): boolean {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns false for missing tile
    return false;
  }

  // Rejects non walkable generated tile
  if (!context.cityTile.walkable) {
    // Returns false for blocked base tile
    return false;
  }

  // Rejects runtime blocking hurdle
  if (courierMovementTileBlockCheck(context)) {
    // Returns false for active block
    return false;
  }

  // Returns true when Courier can enter tile
  return true;
}

// Checks whether Courier should stop on a tile after entering it
export function courierMovementTileStopCheck(
  context: CourierMovementTileContext
): boolean {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns false because missing tile cannot be entered
    return false;
  }

  // Returns true when tile has active red signal
  if (courierMovementTileRedSignalCheck(context)) {
    // Returns true for red signal stop
    return true;
  }

  // Returns true when tile has active security checkpoint
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.SecurityCheckpoint)) {
    // Returns true for checkpoint stop
    return true;
  }

  // Returns false when no stop effect exists
  return false;
}

// Checks whether tile blocks Courier movement
export function courierMovementTileBlockCheck(
  context: CourierMovementTileContext
): boolean {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns true because missing tile blocks movement
    return true;
  }

  // Returns true when tile has road block
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.RoadBlock)) {
    // Returns true for road block
    return true;
  }

  // Returns true when tile has closed gate
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.ClosedGate)) {
    // Returns true for closed gate
    return true;
  }

  // Returns true when tile has broken road
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.BrokenRoad)) {
    // Returns true for broken road
    return true;
  }

  // Returns false when no blocking hurdle exists
  return false;
}

// Checks whether tile slows Courier movement
export function courierMovementTileSlowCheck(
  context: CourierMovementTileContext
): boolean {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns false because missing tile cannot be slowed
    return false;
  }

  // Returns true when tile has construction work
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.ConstructionWork)) {
    // Returns true for construction slowdown
    return true;
  }

  // Returns true when tile has traffic jam
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.TrafficJam)) {
    // Returns true for traffic jam slowdown
    return true;
  }

  // Returns true when tile has security checkpoint
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.SecurityCheckpoint)) {
    // Returns true for checkpoint slowdown
    return true;
  }

  // Returns false when no slowing hurdle exists
  return false;
}

// Checks whether tile causes life loss hazard
export function courierMovementTileLifeLossHazardCheck(
  context: CourierMovementTileContext
): boolean {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns false because missing tile cannot apply hazard
    return false;
  }

  // Returns true when tile has moving barrier
  return courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.MovingBarrier);
}

// Gets movement duration for entering tile
export function courierMovementTileDurationMsGet(
  context: CourierMovementTileContext
): number {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns zero for missing tile
    return 0;
  }

  // Returns movement duration from movement cost rules
  return movementDurationMsGet(context.cityTile, context.matchPrototypeState);
}

// Gets stop duration for a tile after Courier enters it
export function courierMovementTileStopDurationMsGet(
  context: CourierMovementTileContext
): number {
  // Returns red signal stop duration
  if (courierMovementTileRedSignalCheck(context)) {
    // Returns configured red signal stop duration
    return courierMovementConfig.timing.redTrafficSignalStopMs;
  }

  // Returns checkpoint stop duration
  if (courierMovementTileActiveHurdleTypeCheck(context, SaboteurHurdleType.SecurityCheckpoint)) {
    // Returns configured shorter checkpoint stop duration
    return Math.floor(courierMovementConfig.timing.redTrafficSignalStopMs / 2);
  }

  // Returns zero when tile does not stop Courier
  return 0;
}

// Checks whether tile has active red traffic signal
export function courierMovementTileRedSignalCheck(
  context: CourierMovementTileContext
): boolean {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns false for missing tile
    return false;
  }

  // Rejects tile without traffic signal
  if (!context.cityTile.trafficSignalId) {
    // Returns false when no signal exists
    return false;
  }

  // Stores signal runtime state
  const trafficSignalState = context.matchPrototypeState.trafficSignalStateById[context.cityTile.trafficSignalId];

  // Returns false when signal state is missing
  if (!trafficSignalState) {
    // Returns false for missing runtime signal state
    return false;
  }

  // Returns whether signal state is red
  return trafficSignalState.stateName === TrafficSignalStateName.Red;
}

// Checks whether target tile has active hurdle type
export function courierMovementTileActiveHurdleTypeCheck(
  context: CourierMovementTileContext,
  hurdleType: SaboteurHurdleType
): boolean {
  // Rejects missing tile
  if (!context.cityTile) {
    // Returns false for missing tile
    return false;
  }

  // Stores target tile key
  const tileKey = cityTileKeyFromCoordinatesGet(context.cityTile.x, context.cityTile.y);

  // Returns whether active hurdle of requested type exists on tile
  return Object.values(context.matchPrototypeState.activeHurdleById).some((activeHurdle) => {
    // Stores active hurdle tile key
    const activeHurdleTileKey = cityTileKeyFromCoordinatesGet(
      activeHurdle.tilePoint.x,
      activeHurdle.tilePoint.y
    );

    // Returns false when active hurdle is on different tile
    if (activeHurdleTileKey !== tileKey) {
      // Returns false for different tile
      return false;
    }

    // Returns whether active hurdle type matches requested type
    return activeHurdle.hurdleType === hurdleType;
  });
}