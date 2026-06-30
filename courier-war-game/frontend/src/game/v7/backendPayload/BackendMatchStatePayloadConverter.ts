// this file applies backend-authoritative match state into Phaser runtime state

import { DirectionName, type DirectionName as DirectionNameValue } from "../types/DirectionType";
import { PlayerRole } from "../types/PlayerRoleType";
import { SaboteurHurdleType, type SaboteurHurdleActive } from "../types/SaboteurHurdleType";
import { TrafficSignalStateName, type TrafficSignalRuntimeStateByIdMap } from "../types/TrafficSignalType";
import type { CityMapGenerated, CityTile } from "../types/CityMapType";
import type { CoordinateTilePoint } from "../types/CoordinateType";
import type { ActiveHurdleByIdMap, MatchPrototypeStateShape } from "../types/MatchRuntimeStateType";
import type {
  BackendActiveHurdleState,
  BackendMatchStateResponse,
  BackendTrafficSignalState,
} from "../../../common/apiType/MatchApiType";
import { cityTileKeyFromPointGet } from "../utility/CityTileKeyConverter";

function recordGet(value: unknown): Record<string, unknown> {
  // this safely treats unknown backend payload pieces as records
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

function numberGet(value: unknown, fallbackValue: number): number {
  // this keeps numeric backend values safe
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallbackValue;
}

function stringGet(value: unknown, fallbackValue: string): string {
  // this keeps string backend values safe
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return fallbackValue;
}

function numberRecordGet(value: unknown): Record<string, number> {
  // this keeps cooldown maps numeric before assigning into runtime state
  const rawRecord = recordGet(value);
  const nextRecord: Record<string, number> = {};

  Object.entries(rawRecord).forEach(([key, rawValue]) => {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      nextRecord[key] = rawValue;
    }
  });

  return nextRecord;
}

function tilePointGet(value: unknown, fallbackValue: CoordinateTilePoint): CoordinateTilePoint {
  // this reads x/y tile point from backend payload
  const record = recordGet(value);
  const x = numberGet(record.x, fallbackValue.x);
  const y = numberGet(record.y, fallbackValue.y);

  return { x, y };
}

function cityTileGet(cityMapGenerated: CityMapGenerated, tilePoint: CoordinateTilePoint): CityTile | undefined {
  // this protects against out of range backend or local values
  if (tilePoint.x < 0 || tilePoint.y < 0) {
    return undefined;
  }

  if (tilePoint.x >= cityMapGenerated.widthTiles || tilePoint.y >= cityMapGenerated.heightTiles) {
    return undefined;
  }

  return cityMapGenerated.tileRows[tilePoint.y]?.[tilePoint.x];
}

function directionNameGet(value: unknown): DirectionNameValue {
  // this maps backend direction into frontend direction constants
  if (value === DirectionName.Left) {
    return DirectionName.Left;
  }

  if (value === DirectionName.Right) {
    return DirectionName.Right;
  }

  if (value === DirectionName.Up) {
    return DirectionName.Up;
  }

  if (value === DirectionName.Down) {
    return DirectionName.Down;
  }

  return DirectionName.None;
}

function hurdleTypeGet(value: unknown): SaboteurHurdleType {
  // this maps backend hurdle type into frontend hurdle constants
  if (value === SaboteurHurdleType.RoadBlock) {
    return SaboteurHurdleType.RoadBlock;
  }

  if (value === SaboteurHurdleType.ConstructionWork) {
    return SaboteurHurdleType.ConstructionWork;
  }

  if (value === SaboteurHurdleType.TrafficJam) {
    return SaboteurHurdleType.TrafficJam;
  }

  if (value === SaboteurHurdleType.ClosedGate) {
    return SaboteurHurdleType.ClosedGate;
  }

  if (value === SaboteurHurdleType.WrongDirectionSign) {
    return SaboteurHurdleType.WrongDirectionSign;
  }

  if (value === SaboteurHurdleType.BrokenRoad) {
    return SaboteurHurdleType.BrokenRoad;
  }

  if (value === SaboteurHurdleType.MovingBarrier) {
    return SaboteurHurdleType.MovingBarrier;
  }

  if (value === SaboteurHurdleType.SecurityCheckpoint) {
    return SaboteurHurdleType.SecurityCheckpoint;
  }

  return SaboteurHurdleType.RedTrafficLight;
}

function playerRoleGet(value: unknown): "courier" | "saboteur" {
  // this keeps courier as default and saboteur as explicit role
  return value === PlayerRole.Saboteur ? PlayerRole.Saboteur : PlayerRole.Courier;
}

function trafficSignalStateNameGet(value: unknown): "green" | "red" {
  // this maps backend signal state into frontend signal values
  return value === TrafficSignalStateName.Red ? TrafficSignalStateName.Red : TrafficSignalStateName.Green;
}

function backendTrafficSignalsApply(
  backendTrafficSignals: Record<string, BackendTrafficSignalState> | undefined,
  currentTrafficSignals: TrafficSignalRuntimeStateByIdMap
): TrafficSignalRuntimeStateByIdMap {
  // this keeps existing generated signal list when backend sends no runtime update
  const nextTrafficSignals: TrafficSignalRuntimeStateByIdMap = { ...currentTrafficSignals };

  if (!backendTrafficSignals) {
    return nextTrafficSignals;
  }

  const nowMs = Date.now();

  Object.entries(backendTrafficSignals).forEach(([signalId, backendSignal]) => {
    const stateName = trafficSignalStateNameGet(backendSignal.stateName);
    const redUntilMs = backendSignal.redUntilMs ?? null;
    const redExpired = stateName === TrafficSignalStateName.Red && typeof redUntilMs === "number" && redUntilMs <= nowMs;

    nextTrafficSignals[signalId] = {
      signalId,
      stateName: redExpired ? TrafficSignalStateName.Green : stateName,
      redUntilMs: redExpired ? null : redUntilMs,
      activatedBySaboteur: redExpired ? false : Boolean(backendSignal.activatedBySaboteur),
    };
  });

  return nextTrafficSignals;
}

function activeHurdleArrayGet(value: unknown): BackendActiveHurdleState[] {
  // this supports backend activeHurdles as object map or array
  if (Array.isArray(value)) {
    return value as BackendActiveHurdleState[];
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, BackendActiveHurdleState>);
  }

  return [];
}

function trafficSignalIdForHurdleGet(cityMapGenerated: CityMapGenerated, hurdle: BackendActiveHurdleState): string | undefined {
  // this links red traffic light hurdle to generated signal id when backend omits it
  if (hurdle.trafficSignalId) {
    return hurdle.trafficSignalId;
  }

  if (hurdle.hurdleType !== SaboteurHurdleType.RedTrafficLight) {
    return undefined;
  }

  const tilePoint = tilePointGet(hurdle.tilePoint, { x: -1, y: -1 });
  const cityTile = cityTileGet(cityMapGenerated, tilePoint);

  return cityTile?.trafficSignalId;
}

function backendActiveHurdlesApply(
  cityMapGenerated: CityMapGenerated,
  backendActiveHurdles: unknown
): ActiveHurdleByIdMap {
  // this filters expired hurdles locally because polling may return stale cache state
  const nowMs = Date.now();
  const activeHurdleById: ActiveHurdleByIdMap = {};

  activeHurdleArrayGet(backendActiveHurdles).forEach((backendHurdle, index) => {
    const startedAtMs = numberGet(backendHurdle.startedAtMs, nowMs);
    const expiresAtMs = numberGet(backendHurdle.expiresAtMs, nowMs);

    if (expiresAtMs <= nowMs) {
      return;
    }

    const id = stringGet(backendHurdle.id, `active-hurdle-${index}`);
    const tilePoint = tilePointGet(backendHurdle.tilePoint, { x: 0, y: 0 });
    const hurdleType = hurdleTypeGet(backendHurdle.hurdleType);

    const activeHurdle: SaboteurHurdleActive = {
      id,
      hurdleType,
      tilePoint,
      startedAtMs,
      expiresAtMs,
      trafficSignalId: trafficSignalIdForHurdleGet(cityMapGenerated, backendHurdle),
    };

    activeHurdleById[id] = activeHurdle;
  });

  return activeHurdleById;
}

export function backendMatchStateApplyToPrototypeState(
  cityMapGenerated: CityMapGenerated,
  matchPrototypeState: MatchPrototypeStateShape,
  backendMatchState: BackendMatchStateResponse
): void {
  // this updates current local player role from backend assigned role
  matchPrototypeState.playerRole = playerRoleGet(backendMatchState.assignedRole);

  const courierRecord = recordGet(backendMatchState.courier);
  const saboteurRecord = recordGet(backendMatchState.saboteur);

  const courierTilePoint = tilePointGet(courierRecord.position, matchPrototypeState.courier.tilePoint);
  const courierTile = cityTileGet(cityMapGenerated, courierTilePoint);

  if (courierTile) {
    const previousZoneId = matchPrototypeState.courier.zoneIdCurrent;

    matchPrototypeState.courier.tilePoint = courierTilePoint;
    matchPrototypeState.courier.zoneIdCurrent = courierTile.zoneId;

    if (previousZoneId !== courierTile.zoneId) {
      matchPrototypeState.courier.zoneIdPrevious = previousZoneId;
    }
  }

  matchPrototypeState.courier.directionName = directionNameGet(courierRecord.direction);
  matchPrototypeState.courier.livesCurrent = numberGet(courierRecord.lives, matchPrototypeState.courier.livesCurrent);

  const visitedTileKeys = Array.isArray(courierRecord.visitedTileKeys)
    ? courierRecord.visitedTileKeys.filter((tileKey): tileKey is string => typeof tileKey === "string")
    : [];

  matchPrototypeState.courierVisitedTileKeySet = new Set<string>(
    visitedTileKeys.length > 0 ? visitedTileKeys : [cityTileKeyFromPointGet(matchPrototypeState.courier.tilePoint)]
  );

  matchPrototypeState.saboteur.energyCurrent = numberGet(
    saboteurRecord.energyCurrent,
    matchPrototypeState.saboteur.energyCurrent
  );
  matchPrototypeState.saboteur.energyMax = numberGet(
    saboteurRecord.energyMax,
    matchPrototypeState.saboteur.energyMax
  );
  matchPrototypeState.saboteur.hurdleCooldownUntilMsByType = numberRecordGet(saboteurRecord.cooldowns);

  matchPrototypeState.trafficSignalStateById = backendTrafficSignalsApply(
    backendMatchState.trafficSignals,
    matchPrototypeState.trafficSignalStateById
  );

  matchPrototypeState.activeHurdleById = backendActiveHurdlesApply(
    cityMapGenerated,
    backendMatchState.activeHurdles
  );
}