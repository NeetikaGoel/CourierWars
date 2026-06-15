// Imports Saboteur hurdle configuration from the V7 prototype
import { saboteurHurdleConfig } from "../../v7/config/SaboteurHurdleConfig";

// Imports tile key helper
import { cityTileKeyFromCoordinatesGet } from "../../v7/utility/CityTileKeyConverter";

// Imports city map and tile types
import type { CityMapGenerated, CityTile } from "../../v7/types/CityMapType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../v7/types/MatchRuntimeStateType";

// Imports tile layer values
import {
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../v7/types/CityTileType";

// Imports traffic signal state value
import { TrafficSignalStateName } from "../../v7/types/TrafficSignalType";

// Imports Saboteur hurdle types and result shapes
import {
  SaboteurHurdlePlacementFailureReason,
  SaboteurHurdleType,
  type SaboteurHurdlePlacementResult,
} from "../../v7/types/SaboteurHurdleType";

// Defines context for V8 Saboteur placement validation
export interface ManualSaboteurPlacementCheckContext {
  // Stores generated city map
  cityMapGenerated: CityMapGenerated;

  // Stores target city tile
  cityTile: CityTile | undefined;

  // Stores selected hurdle type
  hurdleType: SaboteurHurdleType;

  // Stores current match runtime state
  matchPrototypeState: MatchPrototypeStateShape;

  // Stores current game time in milliseconds
  currentTimeMs: number;
}

// Validates whether Saboteur can place selected hurdle on target tile in V8 prototype
export function manualSaboteurPlacementCheck(
  context: ManualSaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target city tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Rejects start tile
  if (cityTile.start) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileIsStart,
      "Cannot place hurdle on start tile"
    );
  }

  // Rejects delivery tile
  if (cityTile.delivery) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileIsDelivery,
      "Cannot place hurdle on delivery tile"
    );
  }

  // Rejects exact Courier tile only so V8 remains easy to test
  if (
    cityTile.x === context.matchPrototypeState.courier.tilePoint.x &&
    cityTile.y === context.matchPrototypeState.courier.tilePoint.y
  ) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileTooCloseToCourier,
      "Cannot place hurdle directly on Courier"
    );
  }

  // Rejects unsupported hurdle target
  if (!manualHurdleSupportTileCheck(cityTile, context.hurdleType)) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileDoesNotSupportHurdle,
      "Tile does not support selected hurdle"
    );
  }

  // Rejects invalid red traffic light state
  if (context.hurdleType === SaboteurHurdleType.RedTrafficLight) {
    // Stores red light result
    const redLightResult = manualRedTrafficLightPlacementCheck(cityTile, context.matchPrototypeState);

    // Returns red light failure
    if (!redLightResult.valid) {
      return redLightResult;
    }
  }

  // Rejects active hurdle conflict across expanded target tiles
  const activeHurdleResult = manualActiveHurdleConflictCheck(context);

  // Returns active hurdle failure
  if (!activeHurdleResult.valid) {
    return activeHurdleResult;
  }

  // Rejects insufficient energy
  const energyResult = manualEnergyCheck(context);

  // Returns energy failure
  if (!energyResult.valid) {
    return energyResult;
  }

  // Rejects active cooldown
  const cooldownResult = manualCooldownCheck(context);

  // Returns cooldown failure
  if (!cooldownResult.valid) {
    return cooldownResult;
  }

  // Returns valid result
  return {
    valid: true,
    message: "V8 placement is valid",
  };
}

// Gets every tile that should receive this V8 hurdle activation
export function manualSaboteurPlacementTargetTileListGet(
  cityMapGenerated: CityMapGenerated,
  cityTile: CityTile,
  hurdleType: SaboteurHurdleType
): CityTile[] {
  // Keeps signal and route-sign style hurdles as one tile
  if (
    hurdleType === SaboteurHurdleType.RedTrafficLight ||
    hurdleType === SaboteurHurdleType.ClosedGate ||
    hurdleType === SaboteurHurdleType.WrongDirectionSign
  ) {
    return [cityTile];
  }

  // Expands road-based hurdles across the road width
  if (manualNormalRoadTileCheck(cityTile)) {
    return manualRoadWidthTileListGet(cityMapGenerated, cityTile);
  }

  // Returns selected tile fallback
  return [cityTile];
}

// Checks whether selected tile supports selected hurdle
function manualHurdleSupportTileCheck(cityTile: CityTile, hurdleType: SaboteurHurdleType): boolean {
  // Supports red traffic light on signal tiles
  if (hurdleType === SaboteurHurdleType.RedTrafficLight) {
    return Boolean(cityTile.trafficSignalId);
  }

  // Supports closed gate on hidden route and bridge entrances
  if (hurdleType === SaboteurHurdleType.ClosedGate) {
    return cityTile.tunnelEntrance || cityTile.shortcutEntrance || cityTile.bridgeEntrance;
  }

  // Supports wrong direction sign on intersections and hidden route entrances
  if (hurdleType === SaboteurHurdleType.WrongDirectionSign) {
    return Boolean(cityTile.intersectionId) || cityTile.tunnelEntrance || cityTile.shortcutEntrance;
  }

  // Supports all road pressure hurdles on any normal road tile in V8
  return manualNormalRoadTileCheck(cityTile);
}

// Checks whether tile is a normal road
function manualNormalRoadTileCheck(cityTile: CityTile): boolean {
  // Rejects important marker tiles
  if (cityTile.start || cityTile.delivery) {
    return false;
  }

  // Rejects non walkable tiles
  if (!cityTile.walkable) {
    return false;
  }

  // Rejects non road path kinds
  if (cityTile.pathKind !== CityTilePathKind.Road) {
    return false;
  }

  // Rejects no road class
  if (cityTile.roadClass === CityTileRoadClass.None) {
    return false;
  }

  // Rejects invalid terrain
  if (
    cityTile.terrainType === CityTileTerrainType.Water ||
    cityTile.terrainType === CityTileTerrainType.Park ||
    cityTile.terrainType === CityTileTerrainType.Building
  ) {
    return false;
  }

  // Returns true for normal road tile
  return true;
}

// Checks red traffic light state
function manualRedTrafficLightPlacementCheck(
  cityTile: CityTile,
  matchPrototypeState: MatchPrototypeStateShape
): SaboteurHurdlePlacementResult {
  // Rejects missing traffic signal
  if (!cityTile.trafficSignalId) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TrafficSignalMissing,
      "Traffic signal is missing"
    );
  }

  // Stores signal state
  const trafficSignalState = matchPrototypeState.trafficSignalStateById[cityTile.trafficSignalId];

  // Rejects already red signal
  if (trafficSignalState?.stateName === TrafficSignalStateName.Red) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TrafficSignalAlreadyRed,
      "Traffic signal is already red"
    );
  }

  // Returns valid result
  return manualPlacementValidCreate();
}

// Checks active hurdle conflicts for all target tiles
function manualActiveHurdleConflictCheck(
  context: ManualSaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Returns missing tile failure
  if (!context.cityTile) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Stores expanded target tile key set
  const targetTileKeySet = new Set(
    manualSaboteurPlacementTargetTileListGet(context.cityMapGenerated, context.cityTile, context.hurdleType)
      .map((targetTile) => cityTileKeyFromCoordinatesGet(targetTile.x, targetTile.y))
  );

  // Stores whether conflict exists
  const activeHurdleExists = Object.values(context.matchPrototypeState.activeHurdleById).some((activeHurdle) => {
    // Stores active hurdle tile key
    const activeHurdleTileKey = cityTileKeyFromCoordinatesGet(activeHurdle.tilePoint.x, activeHurdle.tilePoint.y);

    // Returns whether hurdle exists on any target tile
    return targetTileKeySet.has(activeHurdleTileKey);
  });

  // Rejects when conflict exists
  if (activeHurdleExists) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileHasActiveHurdle,
      "Target road section already has an active hurdle"
    );
  }

  // Returns valid result
  return manualPlacementValidCreate();
}

// Checks energy
function manualEnergyCheck(context: ManualSaboteurPlacementCheckContext): SaboteurHurdlePlacementResult {
  // Stores hurdle config
  const hurdleConfig = saboteurHurdleConfig.hurdle[context.hurdleType];

  // Rejects when energy is insufficient
  if (context.matchPrototypeState.saboteur.energyCurrent < hurdleConfig.energyCost) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.SaboteurEnergyInsufficient,
      "Saboteur energy is insufficient"
    );
  }

  // Returns valid result
  return manualPlacementValidCreate();
}

// Checks cooldown
function manualCooldownCheck(context: ManualSaboteurPlacementCheckContext): SaboteurHurdlePlacementResult {
  // Stores cooldown end time
  const cooldownUntilMs = context.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[context.hurdleType];

  // Returns valid when cooldown is missing
  if (cooldownUntilMs === undefined) {
    return manualPlacementValidCreate();
  }

  // Rejects when cooldown is still active
  if (context.currentTimeMs < cooldownUntilMs) {
    return manualPlacementInvalidCreate(
      SaboteurHurdlePlacementFailureReason.SaboteurHurdleCooldownActive,
      "Saboteur hurdle cooldown is active"
    );
  }

  // Returns valid result
  return manualPlacementValidCreate();
}

// Gets road-width target tiles using route ids stored by the manual map
function manualRoadWidthTileListGet(cityMapGenerated: CityMapGenerated, cityTile: CityTile): CityTile[] {
  // Stores candidate route ids
  const roadRouteIdList = cityTile.routeIdList.filter((routeId) => routeId.startsWith("road-h-") || routeId.startsWith("road-v-"));

  // Returns selected tile if no route id exists
  if (roadRouteIdList.length === 0) {
    return [cityTile];
  }

  // Stores expanded target map
  const targetTileByKeyMap = new Map<string, CityTile>();

  // Loops through route ids touching this tile
  for (const routeId of roadRouteIdList) {
    // Adds horizontal road width tiles
    if (routeId.startsWith("road-h-")) {
      manualRoadWidthTileListForHorizontalRouteAdd(cityMapGenerated, cityTile, routeId, targetTileByKeyMap);
      continue;
    }

    // Adds vertical road width tiles
    manualRoadWidthTileListForVerticalRouteAdd(cityMapGenerated, cityTile, routeId, targetTileByKeyMap);
  }

  // Returns target tiles
  return [...targetTileByKeyMap.values()];
}

// Adds horizontal road width tiles at selected x
function manualRoadWidthTileListForHorizontalRouteAdd(
  cityMapGenerated: CityMapGenerated,
  cityTile: CityTile,
  routeId: string,
  targetTileByKeyMap: Map<string, CityTile>
): void {
  // Checks nearby y offsets because road width is crosswise for horizontal route
  for (let y = cityTile.y - 4; y <= cityTile.y + 4; y += 1) {
    // Skips out of bounds
    if (y < 0 || y >= cityMapGenerated.heightTiles) {
      continue;
    }

    // Stores candidate tile
    const targetTile = cityMapGenerated.tileRows[y][cityTile.x];

    // Adds matching route tile
    manualRoadWidthTargetTileAdd(targetTile, routeId, targetTileByKeyMap);
  }
}

// Adds vertical road width tiles at selected y
function manualRoadWidthTileListForVerticalRouteAdd(
  cityMapGenerated: CityMapGenerated,
  cityTile: CityTile,
  routeId: string,
  targetTileByKeyMap: Map<string, CityTile>
): void {
  // Checks nearby x offsets because road width is crosswise for vertical route
  for (let x = cityTile.x - 4; x <= cityTile.x + 4; x += 1) {
    // Skips out of bounds
    if (x < 0 || x >= cityMapGenerated.widthTiles) {
      continue;
    }

    // Stores candidate tile
    const targetTile = cityMapGenerated.tileRows[cityTile.y][x];

    // Adds matching route tile
    manualRoadWidthTargetTileAdd(targetTile, routeId, targetTileByKeyMap);
  }
}

// Adds road width tile when it belongs to the same route
function manualRoadWidthTargetTileAdd(
  targetTile: CityTile,
  routeId: string,
  targetTileByKeyMap: Map<string, CityTile>
): void {
  // Skips start and delivery
  if (targetTile.start || targetTile.delivery) {
    return;
  }

  // Skips non matching route
  if (!targetTile.routeIdList.includes(routeId)) {
    return;
  }

  // Skips non normal road tiles
  if (!manualNormalRoadTileCheck(targetTile)) {
    return;
  }

  // Stores target tile key
  const targetTileKey = cityTileKeyFromCoordinatesGet(targetTile.x, targetTile.y);

  // Adds tile
  targetTileByKeyMap.set(targetTileKey, targetTile);
}

// Creates valid placement result
function manualPlacementValidCreate(): SaboteurHurdlePlacementResult {
  // Returns valid result
  return {
    valid: true,
  };
}

// Creates invalid placement result
function manualPlacementInvalidCreate(
  failureReason: SaboteurHurdlePlacementFailureReason,
  message: string
): SaboteurHurdlePlacementResult {
  // Returns invalid result
  return {
    valid: false,
    failureReason,
    message,
  };
}
