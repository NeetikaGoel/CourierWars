// Imports tile distance helper for signal spacing and placement distance checks
import { cityTileDistanceManhattanGet } from "../../utility/CityTileDistanceCalculator";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports tile layer values
import {
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../types/CityTileType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports traffic signal runtime state names
import { TrafficSignalStateName } from "../../types/TrafficSignalType";

// Imports placement result and failure reason types
import {
  SaboteurHurdlePlacementFailureReason,
  type SaboteurHurdlePlacementResult,
} from "../../types/SaboteurHurdleType";

// Defines context required to validate red signal activation
export interface TrafficSignalRedActivationCheckContext {
  // Stores target city tile
  cityTile: CityTile | undefined;

  // Stores current match runtime state
  matchPrototypeState: MatchPrototypeStateShape;
}

// Checks whether a city tile can hold a traffic signal feature
export function trafficSignalTileValidCheck(cityTile: CityTile | undefined): boolean {
  // Rejects missing tile
  if (!cityTile) {
    // Returns false for missing tile
    return false;
  }

  // Rejects start tile
  if (cityTile.start) {
    // Returns false because traffic signal cannot be on start
    return false;
  }

  // Rejects delivery tile
  if (cityTile.delivery) {
    // Returns false because traffic signal cannot be on delivery
    return false;
  }

  // Rejects non road path
  if (cityTile.pathKind !== CityTilePathKind.Road) {
    // Returns false because signal should only be on normal road
    return false;
  }

  // Rejects no road class
  if (cityTile.roadClass === CityTileRoadClass.None) {
    // Returns false because signal needs a road class
    return false;
  }

  // Rejects water terrain
  if (cityTile.terrainType === CityTileTerrainType.Water) {
    // Returns false because signal cannot be in water
    return false;
  }

  // Rejects park terrain
  if (cityTile.terrainType === CityTileTerrainType.Park) {
    // Returns false because signal cannot be in park
    return false;
  }

  // Rejects building terrain
  if (cityTile.terrainType === CityTileTerrainType.Building) {
    // Returns false because surface signal cannot be inside building
    return false;
  }

  // Returns true for valid traffic signal tile
  return true;
}

// Checks whether a traffic signal is already red
export function trafficSignalAlreadyRedCheck(
  matchPrototypeState: MatchPrototypeStateShape,
  trafficSignalId: string
): boolean {
  // Stores runtime traffic signal state
  const trafficSignalState = matchPrototypeState.trafficSignalStateById[trafficSignalId];

  // Returns false when signal state is missing
  if (!trafficSignalState) {
    // Returns false because missing signal is handled separately
    return false;
  }

  // Returns whether signal state is red
  return trafficSignalState.stateName === TrafficSignalStateName.Red;
}

// Checks whether red traffic signal activation is valid
export function trafficSignalRedActivationCheck(
  context: TrafficSignalRedActivationCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    // Returns missing tile failure
    return {
      // Stores invalid result
      valid: false,

      // Stores failure reason
      failureReason: SaboteurHurdlePlacementFailureReason.TileMissing,

      // Stores debug message
      message: "Tile is missing",
    };
  }

  // Rejects tile without traffic signal id
  if (!cityTile.trafficSignalId) {
    // Returns missing traffic signal failure
    return {
      // Stores invalid result
      valid: false,

      // Stores failure reason
      failureReason: SaboteurHurdlePlacementFailureReason.TrafficSignalMissing,

      // Stores debug message
      message: "Tile has no traffic signal",
    };
  }

  // Rejects invalid signal tile
  if (!trafficSignalTileValidCheck(cityTile)) {
    // Returns invalid tile failure
    return {
      // Stores invalid result
      valid: false,

      // Stores failure reason
      failureReason: SaboteurHurdlePlacementFailureReason.TrafficSignalMissing,

      // Stores debug message
      message: "Traffic signal tile is invalid",
    };
  }

  // Checks whether signal is already red
  const trafficSignalRed = trafficSignalAlreadyRedCheck(
    context.matchPrototypeState,
    cityTile.trafficSignalId
  );

  // Rejects already red signal
  if (trafficSignalRed) {
    // Returns already red failure
    return {
      // Stores invalid result
      valid: false,

      // Stores failure reason
      failureReason: SaboteurHurdlePlacementFailureReason.TrafficSignalAlreadyRed,

      // Stores debug message
      message: "Traffic signal is already red",
    };
  }

  // Returns valid result
  return {
    // Stores valid result
    valid: true,

    // Stores debug message
    message: "Traffic signal can be activated",
  };
}

// Checks whether a traffic signal is far enough from existing signal points
export function trafficSignalDistanceValidCheck(
  tilePoint: CoordinateTilePoint,
  trafficSignalPointList: CoordinateTilePoint[],
  distanceTilesMin: number
): boolean {
  // Loops through existing traffic signal points
  for (const trafficSignalPoint of trafficSignalPointList) {
    // Stores distance to existing signal
    const distanceTiles = cityTileDistanceManhattanGet(tilePoint, trafficSignalPoint);

    // Rejects when signal is too close
    if (distanceTiles < distanceTilesMin) {
      // Returns false for invalid signal spacing
      return false;
    }
  }

  // Returns true when no signal is too close
  return true;
}