// this file converts backend readable map json into the CityMapGenerated shape used by renderers

import type { CityMapGenerated, CityTile } from "../types/CityMapType";
import type { CityZone } from "../types/CityZoneType";
import type { TrafficSignalGenerated } from "../types/TrafficSignalType";
import { CityTilePathKind, CityTileRoadClass, CityTileTerrainType } from "../types/CityTileType";
import type {
  BackendCityMapPayload,
  BackendCityTilePayload,
  BackendCityZonePayload,
  BackendTrafficSignalPayload,
} from "../types/BackendCityMapPayloadType";

function backendZoneIdGet(zonePayload: BackendCityZonePayload, zoneIndex: number): string {
  // this supports both id and zoneId from backend
  return zonePayload.id ?? zonePayload.zoneId ?? `zone-${zoneIndex}`;
}

function backendZoneConvert(zonePayload: BackendCityZonePayload, zoneIndex: number): CityZone {
  // this resolves zone id with fallback
  const zoneId = backendZoneIdGet(zonePayload, zoneIndex);

  // this calculates center x if backend does not send it
  const centerX = zonePayload.centerX ?? Math.floor((zonePayload.startX + zonePayload.endX) / 2);

  // this calculates center y if backend does not send it
  const centerY = zonePayload.centerY ?? Math.floor((zonePayload.startY + zonePayload.endY) / 2);

  // this returns frontend city zone shape
  return {
    id: zoneId,
    rowIndex: zonePayload.rowIndex,
    columnIndex: zonePayload.columnIndex,
    startX: zonePayload.startX,
    startY: zonePayload.startY,
    endX: zonePayload.endX,
    endY: zonePayload.endY,
    centerX,
    centerY,
    bounds: zonePayload.bounds ?? {
      startX: zonePayload.startX,
      startY: zonePayload.startY,
      endX: zonePayload.endX,
      endY: zonePayload.endY,
    },
  };
}

function backendTileConvert(tilePayload: BackendCityTilePayload): CityTile {
  // this fills every field required by the renderer even if backend omits optional keys
  return {
    x: tilePayload.x,
    y: tilePayload.y,
    terrainType: tilePayload.terrainType ?? CityTileTerrainType.Building,
    roadClass: tilePayload.roadClass ?? CityTileRoadClass.None,
    pathKind: tilePayload.pathKind ?? CityTilePathKind.None,
    featureKindList: tilePayload.featureKindList ?? [],
    zoneId: tilePayload.zoneId,
    walkable: Boolean(tilePayload.walkable),
    baseMovementCost: tilePayload.baseMovementCost ?? 999,
    intersectionId: tilePayload.intersectionId ?? undefined,
    trafficSignalId: tilePayload.trafficSignalId ?? undefined,
    bridgeId: tilePayload.bridgeId ?? undefined,
    tunnelId: tilePayload.tunnelId ?? undefined,
    shortcutId: tilePayload.shortcutId ?? undefined,
    tunnelEntrance: Boolean(tilePayload.tunnelEntrance),
    shortcutEntrance: Boolean(tilePayload.shortcutEntrance),
    bridgeEntrance: Boolean(tilePayload.bridgeEntrance),
    start: Boolean(tilePayload.start),
    delivery: Boolean(tilePayload.delivery),
    visualVariant: tilePayload.visualVariant,
    routeIdList: tilePayload.routeIdList ?? [],
    hurdleCandidateList: tilePayload.hurdleCandidateList ?? [],
  };
}

function backendTrafficSignalConvert(signalPayload: BackendTrafficSignalPayload): TrafficSignalGenerated {
  // this keeps generated signal shape exactly what traffic signal runtime store expects
  return {
    id: signalPayload.id,
    tilePoint: signalPayload.tilePoint,
    intersectionId: signalPayload.intersectionId,
  };
}

export function backendCityMapPayloadConvert(payload: BackendCityMapPayload): CityMapGenerated {
  // this converts backend zones into frontend zone objects
  const zoneList = payload.zoneList.map(backendZoneConvert);

  // this converts backend tiles into renderer ready city tiles
  const tileRows = payload.tileRows.map((tileRow) => tileRow.map(backendTileConvert));

  // this converts backend traffic signal list into frontend generated signal objects
  const trafficSignalList = payload.trafficSignalList.map(backendTrafficSignalConvert);

  // this returns the CityMapGenerated shape consumed by CityMapRenderer
  return {
    widthTiles: payload.widthTiles,
    heightTiles: payload.heightTiles,
    tileRows,
    zoneList,
    trafficSignalList,
    startTilePoint: payload.startTilePoint,
    deliveryTilePoint: payload.deliveryTilePoint,
    metadata: {
      seed: payload.mapSeed,
      attemptCount: payload.attemptCount ?? 1,
      generatedAtMs: payload.generatedAtMs ?? Date.now(),
      validationWarningCount: payload.validation?.warningList?.length ?? 0,
    },
  };
}