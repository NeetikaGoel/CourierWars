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
  if (!cityTile) {
    return false;
  }

  if (hurdleType === SaboteurHurdleType.RedTrafficLight) {
    return hurdleSupportRedTrafficLightCheck(cityTile);
  }

  if (hurdleType === SaboteurHurdleType.ClosedGate) {
    return hurdleSupportClosedGateCheck(cityTile);
  }

  if (hurdleType === SaboteurHurdleType.WrongDirectionSign) {
    return hurdleSupportWrongDirectionSignCheck(cityTile);
  }

  // road block, construction, traffic jam, broken road, moving barrier,
  // and security checkpoint should all work on normal road tiles
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports red traffic light
export function hurdleSupportRedTrafficLightCheck(cityTile: CityTile): boolean {
  return Boolean(cityTile.trafficSignalId);
}

// Checks whether tile supports road block
export function hurdleSupportRoadBlockCheck(cityTile: CityTile): boolean {
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports construction work
export function hurdleSupportConstructionWorkCheck(cityTile: CityTile): boolean {
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports traffic jam
export function hurdleSupportTrafficJamCheck(cityTile: CityTile): boolean {
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports closed gate
export function hurdleSupportClosedGateCheck(cityTile: CityTile): boolean {
  return cityTile.tunnelEntrance || cityTile.shortcutEntrance || cityTile.bridgeEntrance;
}

// Checks whether tile supports wrong direction sign
export function hurdleSupportWrongDirectionSignCheck(cityTile: CityTile): boolean {
  return Boolean(cityTile.intersectionId) || cityTile.tunnelEntrance || cityTile.shortcutEntrance;
}

// Checks whether tile supports broken road
export function hurdleSupportBrokenRoadCheck(cityTile: CityTile): boolean {
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports moving barrier
export function hurdleSupportMovingBarrierCheck(cityTile: CityTile): boolean {
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile supports security checkpoint
export function hurdleSupportSecurityCheckpointCheck(cityTile: CityTile): boolean {
  return hurdleSupportNormalRoadTileCheck(cityTile);
}

// Checks whether tile is a valid normal road tile for common road hurdles
export function hurdleSupportNormalRoadTileCheck(cityTile: CityTile): boolean {
  if (cityTile.start || cityTile.delivery) {
    return false;
  }

  if (!cityTile.walkable) {
    return false;
  }

  if (cityTile.pathKind !== CityTilePathKind.Road) {
    return false;
  }

  if (cityTile.roadClass === CityTileRoadClass.None) {
    return false;
  }

  if (
    cityTile.terrainType === CityTileTerrainType.Water ||
    cityTile.terrainType === CityTileTerrainType.Park ||
    cityTile.terrainType === CityTileTerrainType.Building
  ) {
    return false;
  }

  return true;
}