// Imports city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports tile layer values
import {
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../types/CityTileType";

// Imports Saboteur hurdle names
import { SaboteurHurdleType } from "../../types/SaboteurHurdleType";

// Checks whether tile supports a selected hurdle type
export function hurdleSupportTileCheck(
  cityTile: CityTile | undefined,
  hurdleType: SaboteurHurdleType
): boolean {
  // Rejects missing tile
  if (!cityTile) {
    // Returns false for missing tile
    return false;
  }

  // Routes red traffic light support check
  if (hurdleType === SaboteurHurdleType.RedTrafficLight) {
    // Returns red traffic light support result
    return hurdleSupportRedTrafficLightCheck(cityTile);
  }

  // Routes road block support check
  if (hurdleType === SaboteurHurdleType.RoadBlock) {
    // Returns road block support result
    return hurdleSupportRoadBlockCheck(cityTile);
  }

  // Routes construction work support check
  if (hurdleType === SaboteurHurdleType.ConstructionWork) {
    // Returns construction work support result
    return hurdleSupportConstructionWorkCheck(cityTile);
  }

  // Routes traffic jam support check
  if (hurdleType === SaboteurHurdleType.TrafficJam) {
    // Returns traffic jam support result
    return hurdleSupportTrafficJamCheck(cityTile);
  }

  // Routes closed gate support check
  if (hurdleType === SaboteurHurdleType.ClosedGate) {
    // Returns closed gate support result
    return hurdleSupportClosedGateCheck(cityTile);
  }

  // Routes wrong direction sign support check
  if (hurdleType === SaboteurHurdleType.WrongDirectionSign) {
    // Returns wrong direction sign support result
    return hurdleSupportWrongDirectionSignCheck(cityTile);
  }

  // Routes broken road support check
  if (hurdleType === SaboteurHurdleType.BrokenRoad) {
    // Returns broken road support result
    return hurdleSupportBrokenRoadCheck(cityTile);
  }

  // Routes moving barrier support check
  if (hurdleType === SaboteurHurdleType.MovingBarrier) {
    // Returns moving barrier support result
    return hurdleSupportMovingBarrierCheck(cityTile);
  }

  // Routes security checkpoint support check
  if (hurdleType === SaboteurHurdleType.SecurityCheckpoint) {
    // Returns security checkpoint support result
    return hurdleSupportSecurityCheckpointCheck(cityTile);
  }

  // Returns false for unknown hurdle type
  return false;
}

// Checks whether tile supports red traffic light
export function hurdleSupportRedTrafficLightCheck(cityTile: CityTile): boolean {
  // Returns whether tile has traffic signal id
  return Boolean(cityTile.trafficSignalId);
}

// Checks whether tile supports road block
export function hurdleSupportRoadBlockCheck(cityTile: CityTile): boolean {
  // Returns whether tile is a normal road hurdle tile
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports construction work
export function hurdleSupportConstructionWorkCheck(cityTile: CityTile): boolean {
  // Rejects start or delivery tile
  if (cityTile.start || cityTile.delivery) {
    // Returns false for important gameplay tile
    return false;
  }

  // Rejects traffic signal tile
  if (cityTile.trafficSignalId) {
    // Returns false because construction should not overwrite signal
    return false;
  }

  // Rejects non normal road path
  if (cityTile.pathKind !== CityTilePathKind.Road) {
    // Returns false for tunnel shortcut bridge or no path
    return false;
  }

  // Stores whether road class supports construction
  const roadClassSupported =
    cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
    cityTile.roadClass === CityTileRoadClass.AvenueRoad;

  // Rejects unsupported road class
  if (!roadClassSupported) {
    // Returns false for local roads
    return false;
  }

  // Rejects water terrain
  if (cityTile.terrainType === CityTileTerrainType.Water) {
    // Returns false because construction cannot be in water
    return false;
  }

  // Rejects park terrain
  if (cityTile.terrainType === CityTileTerrainType.Park) {
    // Returns false because construction cannot be in park
    return false;
  }

  // Rejects building terrain
  if (cityTile.terrainType === CityTileTerrainType.Building) {
    // Returns false because construction must be on visible road
    return false;
  }

  // Returns true for supported construction tile
  return true;
}

// Checks whether tile supports traffic jam
export function hurdleSupportTrafficJamCheck(cityTile: CityTile): boolean {
  // Rejects invalid normal road tile
  if (!hurdleSupportNormalRoadTileCheck(cityTile)) {
    // Returns false for invalid road tile
    return false;
  }

  // Returns true for district or avenue road only
  return (
    cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
    cityTile.roadClass === CityTileRoadClass.AvenueRoad
  );
}

// Checks whether tile supports closed gate
export function hurdleSupportClosedGateCheck(cityTile: CityTile): boolean {
  // Returns whether tile is a route entrance that can close
  return cityTile.tunnelEntrance || cityTile.shortcutEntrance || cityTile.bridgeEntrance;
}

// Checks whether tile supports wrong direction sign
export function hurdleSupportWrongDirectionSignCheck(cityTile: CityTile): boolean {
  // Stores whether tile is intersection
  const intersectionTile = Boolean(cityTile.intersectionId);

  // Stores whether tile is hidden route entrance
  const hiddenRouteEntrance = cityTile.tunnelEntrance || cityTile.shortcutEntrance;

  // Returns whether tile can mislead route choice
  return intersectionTile || hiddenRouteEntrance;
}

// Checks whether tile supports broken road
export function hurdleSupportBrokenRoadCheck(cityTile: CityTile): boolean {
  // Returns whether tile is a normal road hurdle tile
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports moving barrier
export function hurdleSupportMovingBarrierCheck(cityTile: CityTile): boolean {
  // Rejects invalid normal road tile
  if (!hurdleSupportNormalRoadTileCheck(cityTile)) {
    // Returns false for invalid road tile
    return false;
  }

  // Returns true for district or avenue road only
  return (
    cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
    cityTile.roadClass === CityTileRoadClass.AvenueRoad
  );
}

// Checks whether tile supports security checkpoint
export function hurdleSupportSecurityCheckpointCheck(cityTile: CityTile): boolean {
  // Rejects invalid normal road tile
  if (!hurdleSupportNormalRoadTileCheck(cityTile)) {
    // Returns false for invalid road tile
    return false;
  }

  // Returns true for district or avenue road only
  return (
    cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
    cityTile.roadClass === CityTileRoadClass.AvenueRoad
  );
}

// Checks whether tile is a valid normal road tile for common road hurdles
export function hurdleSupportNormalRoadTileCheck(cityTile: CityTile): boolean {
  // Rejects start tile
  if (cityTile.start) {
    // Returns false for start tile
    return false;
  }

  // Rejects delivery tile
  if (cityTile.delivery) {
    // Returns false for delivery tile
    return false;
  }

  // Rejects non walkable tile
  if (!cityTile.walkable) {
    // Returns false for blocked tile
    return false;
  }

  // Rejects non road path
  if (cityTile.pathKind !== CityTilePathKind.Road) {
    // Returns false for tunnel shortcut bridge or no path
    return false;
  }

  // Rejects no road class
  if (cityTile.roadClass === CityTileRoadClass.None) {
    // Returns false for non road tile
    return false;
  }

  // Rejects water terrain
  if (cityTile.terrainType === CityTileTerrainType.Water) {
    // Returns false for water tile
    return false;
  }

  // Rejects park terrain
  if (cityTile.terrainType === CityTileTerrainType.Park) {
    // Returns false for park tile
    return false;
  }

  // Returns true for normal road tile
  return true;
}