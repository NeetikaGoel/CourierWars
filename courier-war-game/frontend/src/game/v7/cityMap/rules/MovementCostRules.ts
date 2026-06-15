// Imports Courier movement configuration
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports tile key converter
import { cityTileKeyFromCoordinatesGet } from "../../utility/CityTileKeyConverter";

// Imports city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports tile layer values
import { CityTilePathKind, CityTileRoadClass } from "../../types/CityTileType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports Saboteur hurdle names
import { SaboteurHurdleType } from "../../types/SaboteurHurdleType";

// Gets base movement cost for a tile
export function movementCostBaseGet(cityTile: CityTile): number {
  // Returns bridge movement cost
  if (cityTile.pathKind === CityTilePathKind.Bridge) {
    // Returns configured bridge cost
    return courierMovementConfig.cost.bridge;
  }

  // Returns tunnel movement cost
  if (cityTile.pathKind === CityTilePathKind.Tunnel) {
    // Returns configured tunnel cost
    return courierMovementConfig.cost.tunnel;
  }

  // Returns shortcut movement cost
  if (cityTile.pathKind === CityTilePathKind.Shortcut) {
    // Returns configured shortcut cost
    return courierMovementConfig.cost.shortcut;
  }

  // Returns local road movement cost
  if (cityTile.roadClass === CityTileRoadClass.LocalRoad) {
    // Returns configured local road cost
    return courierMovementConfig.cost.localRoad;
  }

  // Returns district road movement cost
  if (cityTile.roadClass === CityTileRoadClass.DistrictRoad) {
    // Returns configured district road cost
    return courierMovementConfig.cost.districtRoad;
  }

  // Returns avenue road movement cost
  if (cityTile.roadClass === CityTileRoadClass.AvenueRoad) {
    // Returns configured avenue road cost
    return courierMovementConfig.cost.avenueRoad;
  }

  // Returns stored base movement cost as fallback
  return cityTile.baseMovementCost;
}

// Gets runtime movement multiplier from active hurdles
export function movementCostRuntimeMultiplierGet(
  cityTile: CityTile,
  matchPrototypeState: MatchPrototypeStateShape
): number {
  // Stores target tile key
  const tileKey = cityTileKeyFromCoordinatesGet(cityTile.x, cityTile.y);

  // Stores multiplier values from active hurdles
  const multiplierList: number[] = [];

  // Loops through active hurdles
  for (const activeHurdle of Object.values(matchPrototypeState.activeHurdleById)) {
    // Stores active hurdle tile key
    const activeHurdleTileKey = cityTileKeyFromCoordinatesGet(
      activeHurdle.tilePoint.x,
      activeHurdle.tilePoint.y
    );

    // Skips hurdle on different tile
    if (activeHurdleTileKey !== tileKey) {
      // Continues to next active hurdle
      continue;
    }

    // Adds construction multiplier
    if (activeHurdle.hurdleType === SaboteurHurdleType.ConstructionWork) {
      // Pushes construction multiplier
      multiplierList.push(courierMovementConfig.multiplier.constructionWork);
    }

    // Adds traffic jam multiplier
    if (activeHurdle.hurdleType === SaboteurHurdleType.TrafficJam) {
      // Pushes traffic jam multiplier
      multiplierList.push(courierMovementConfig.multiplier.trafficJam);
    }

    // Adds security checkpoint multiplier
    if (activeHurdle.hurdleType === SaboteurHurdleType.SecurityCheckpoint) {
      // Pushes security checkpoint multiplier
      multiplierList.push(courierMovementConfig.multiplier.securityCheckpoint);
    }
  }

  // Returns neutral multiplier when no slowing hurdle exists
  if (multiplierList.length === 0) {
    // Returns one for no runtime slowdown
    return 1;
  }

  // Returns strongest runtime multiplier
  return Math.max(...multiplierList);
}

// Gets final movement cost after runtime modifiers
export function movementCostFinalGet(
  cityTile: CityTile,
  matchPrototypeState: MatchPrototypeStateShape
): number {
  // Stores base movement cost
  const movementCostBase = movementCostBaseGet(cityTile);

  // Stores runtime multiplier
  const movementMultiplier = movementCostRuntimeMultiplierGet(cityTile, matchPrototypeState);

  // Returns final movement cost
  return movementCostBase * movementMultiplier;
}

// Gets movement duration in milliseconds
export function movementDurationMsGet(
  cityTile: CityTile,
  matchPrototypeState: MatchPrototypeStateShape
): number {
  // Stores final movement cost
  const movementCostFinal = movementCostFinalGet(cityTile, matchPrototypeState);

  // Returns final movement duration
  return courierMovementConfig.timing.baseMoveDurationMs * movementCostFinal;
}