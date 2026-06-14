import { saboteurHurdleConfig } from "../../config/SaboteurHurdleConfig";
import { cityTileKeyFromCoordinatesGet } from "../../utility/CityTileKeyConverter";
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";
import type { CityZone } from "../../types/CityZoneType";
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";
import {
  SaboteurHurdlePlacementFailureReason,
  SaboteurHurdleType,
  type SaboteurHurdlePlacementResult,
} from "../../types/SaboteurHurdleType";
import { hurdleSupportNormalRoadTileCheck, hurdleSupportTileCheck } from "./HurdleSupportRules";
import { trafficSignalRedActivationCheck } from "./TrafficSignalRules";

export interface SaboteurPlacementCheckContext {
  cityMapGenerated: CityMapGenerated;
  cityZoneList: CityZone[];
  cityTile: CityTile | undefined;
  hurdleType: SaboteurHurdleType;
  matchPrototypeState: MatchPrototypeStateShape;
  currentTimeMs: number;
}

export function saboteurPlacementCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  const cityTile = context.cityTile;

  if (!cityTile) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  const startDeliveryResult = saboteurPlacementStartDeliveryCheck(cityTile);

  if (!startDeliveryResult.valid) {
    return startDeliveryResult;
  }

  const supportResult = saboteurPlacementHurdleSupportCheck(context);

  if (!supportResult.valid) {
    return supportResult;
  }

  const courierTileResult = saboteurPlacementCourierTargetTileCheck(context);

  if (!courierTileResult.valid) {
    return courierTileResult;
  }

  if (context.hurdleType === SaboteurHurdleType.RedTrafficLight) {
    const trafficSignalResult = trafficSignalRedActivationCheck({
      cityTile,
      matchPrototypeState: context.matchPrototypeState,
    });

    if (!trafficSignalResult.valid) {
      return trafficSignalResult;
    }
  }

  const activeHurdleResult = saboteurPlacementActiveHurdleCheck(context);

  if (!activeHurdleResult.valid) {
    return activeHurdleResult;
  }

  const energyResult = saboteurPlacementEnergyCheck(context);

  if (!energyResult.valid) {
    return energyResult;
  }

  const cooldownResult = saboteurPlacementCooldownCheck(context);

  if (!cooldownResult.valid) {
    return cooldownResult;
  }

  return {
    valid: true,
    message: "Saboteur placement is valid",
  };
}

export function saboteurPlacementTargetTileListGet(
  cityMapGenerated: CityMapGenerated,
  cityTile: CityTile,
  hurdleType: SaboteurHurdleType
): CityTile[] {
  if (
    hurdleType === SaboteurHurdleType.RedTrafficLight ||
    hurdleType === SaboteurHurdleType.ClosedGate ||
    hurdleType === SaboteurHurdleType.WrongDirectionSign
  ) {
    return [cityTile];
  }

  if (hurdleSupportNormalRoadTileCheck(cityTile)) {
    return saboteurPlacementRoadWidthTileListGet(cityMapGenerated, cityTile);
  }

  return [cityTile];
}

export function saboteurPlacementStartDeliveryCheck(
  cityTile: CityTile
): SaboteurHurdlePlacementResult {
  if (cityTile.start) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileIsStart,
      "Cannot place hurdle on start tile"
    );
  }

  if (cityTile.delivery) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileIsDelivery,
      "Cannot place hurdle on delivery tile"
    );
  }

  return saboteurPlacementResultValidCreate();
}

export function saboteurPlacementHurdleSupportCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  if (!hurdleSupportTileCheck(context.cityTile, context.hurdleType)) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileDoesNotSupportHurdle,
      "Tile does not support selected hurdle"
    );
  }

  return saboteurPlacementResultValidCreate();
}

export function saboteurPlacementCourierTargetTileCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  if (!context.cityTile) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  const courierTileKey = cityTileKeyFromCoordinatesGet(
    context.matchPrototypeState.courier.tilePoint.x,
    context.matchPrototypeState.courier.tilePoint.y
  );

  const targetTileList = saboteurPlacementTargetTileListGet(
    context.cityMapGenerated,
    context.cityTile,
    context.hurdleType
  );

  const courierInTargetSection = targetTileList.some((targetTile) => {
    const targetTileKey = cityTileKeyFromCoordinatesGet(targetTile.x, targetTile.y);

    return targetTileKey === courierTileKey;
  });

  if (courierInTargetSection) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileTooCloseToCourier,
      "Cannot place hurdle directly on Courier"
    );
  }

  return saboteurPlacementResultValidCreate();
}

export function saboteurPlacementActiveHurdleCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  if (!context.cityTile) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  const targetTileKeySet = new Set(
    saboteurPlacementTargetTileListGet(
      context.cityMapGenerated,
      context.cityTile,
      context.hurdleType
    ).map((targetTile) => cityTileKeyFromCoordinatesGet(targetTile.x, targetTile.y))
  );

  const activeHurdleExists = Object.values(context.matchPrototypeState.activeHurdleById).some((activeHurdle) => {
    const activeHurdleTileKey = cityTileKeyFromCoordinatesGet(
      activeHurdle.tilePoint.x,
      activeHurdle.tilePoint.y
    );

    return targetTileKeySet.has(activeHurdleTileKey);
  });

  if (activeHurdleExists) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileHasActiveHurdle,
      "Target road section already has an active hurdle"
    );
  }

  return saboteurPlacementResultValidCreate();
}

export function saboteurPlacementEnergyCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  const hurdleConfig = saboteurHurdleConfig.hurdle[context.hurdleType];

  if (context.matchPrototypeState.saboteur.energyCurrent < hurdleConfig.energyCost) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.SaboteurEnergyInsufficient,
      "Saboteur energy is insufficient"
    );
  }

  return saboteurPlacementResultValidCreate();
}

export function saboteurPlacementCooldownCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  const cooldownUntilMs = context.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[context.hurdleType];

  if (cooldownUntilMs === undefined) {
    return saboteurPlacementResultValidCreate();
  }

  if (context.currentTimeMs < cooldownUntilMs) {
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.SaboteurHurdleCooldownActive,
      "Saboteur hurdle cooldown is active"
    );
  }

  return saboteurPlacementResultValidCreate();
}

function saboteurPlacementRoadWidthTileListGet(
  cityMapGenerated: CityMapGenerated,
  cityTile: CityTile
): CityTile[] {
  if (cityTile.routeIdList.length === 0) {
    return [cityTile];
  }

  const targetTileByKeyMap = new Map<string, CityTile>();

  for (const routeId of cityTile.routeIdList) {
    saboteurPlacementHorizontalRoadWidthTilesAdd(cityMapGenerated, cityTile, routeId, targetTileByKeyMap);
    saboteurPlacementVerticalRoadWidthTilesAdd(cityMapGenerated, cityTile, routeId, targetTileByKeyMap);
  }

  if (targetTileByKeyMap.size === 0) {
    return [cityTile];
  }

  return [...targetTileByKeyMap.values()];
}

function saboteurPlacementHorizontalRoadWidthTilesAdd(
  cityMapGenerated: CityMapGenerated,
  cityTile: CityTile,
  routeId: string,
  targetTileByKeyMap: Map<string, CityTile>
): void {
  for (let y = cityTile.y - 4; y <= cityTile.y + 4; y += 1) {
    if (y < 0 || y >= cityMapGenerated.heightTiles) {
      continue;
    }

    const targetTile = cityMapGenerated.tileRows[y][cityTile.x];

    saboteurPlacementRoadWidthTargetTileAdd(targetTile, routeId, targetTileByKeyMap);
  }
}

function saboteurPlacementVerticalRoadWidthTilesAdd(
  cityMapGenerated: CityMapGenerated,
  cityTile: CityTile,
  routeId: string,
  targetTileByKeyMap: Map<string, CityTile>
): void {
  for (let x = cityTile.x - 4; x <= cityTile.x + 4; x += 1) {
    if (x < 0 || x >= cityMapGenerated.widthTiles) {
      continue;
    }

    const targetTile = cityMapGenerated.tileRows[cityTile.y][x];

    saboteurPlacementRoadWidthTargetTileAdd(targetTile, routeId, targetTileByKeyMap);
  }
}

function saboteurPlacementRoadWidthTargetTileAdd(
  targetTile: CityTile,
  routeId: string,
  targetTileByKeyMap: Map<string, CityTile>
): void {
  if (!targetTile.routeIdList.includes(routeId)) {
    return;
  }

  if (!hurdleSupportNormalRoadTileCheck(targetTile)) {
    return;
  }

  const targetTileKey = cityTileKeyFromCoordinatesGet(targetTile.x, targetTile.y);

  targetTileByKeyMap.set(targetTileKey, targetTile);
}

function saboteurPlacementResultValidCreate(): SaboteurHurdlePlacementResult {
  return {
    valid: true,
  };
}

function saboteurPlacementResultInvalidCreate(
  failureReason: SaboteurHurdlePlacementFailureReason,
  message: string
): SaboteurHurdlePlacementResult {
  return {
    valid: false,
    failureReason,
    message,
  };
}