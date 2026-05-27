// MapDataV5.ts
// Procedural 256x256 Courier War city map.
// Better version: distributed roads, lights, hurdles, parks, lakes, bridges,
// tunnels, shortcuts, and many route choices across the whole city.

import { GAME_CONFIG } from "./GameConfigV4";
import { GAME_CONSTANTS } from "./GameConstantsV4";

export type TileType =
  | "building"
  | "road"
  | "start"
  | "delivery"
  | "trafficLight"
  | "construction"
  | "bridge"
  | "tunnel"
  | "shortcut"
  | "park"
  | "water";

export type HurdleCandidateType =
  | "roadBlock"
  | "trafficJam"
  | "closedGate"
  | "wrongDirectionSign"
  | "brokenRoad"
  | "movingBarrier"
  | "securityCheckpoint";

export interface Point {
  x: number;
  y: number;
}

export interface Area {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export interface MapTile {
  x: number;
  y: number;
  type: TileType;
  walkable: boolean;
  movementCost: number;
  routeIds: string[];
  hurdleCandidates: HurdleCandidateType[];
}

export const mapWidth = GAME_CONFIG.map.width;
export const mapHeight = GAME_CONFIG.map.height;

const START_POINT: Point = GAME_CONFIG.cityGeneration.startPoint;
const DELIVERY_POINT: Point = GAME_CONFIG.cityGeneration.deliveryPoint;

const MAP_STYLE = {
  seedMultiplierA: 73856093,
  seedMultiplierB: 19349663,
  seedMultiplierC: 83492791,

  safeBorder: 4,

  districtSize: 32,
  districtRoadOffsetA: 8,
  districtRoadOffsetB: 18,

  avenueSpacingA: 17,
  avenueSpacingB: 23,
  avenueSpacingC: 31,

  connectorRoadCount: 420,
  scenicConnectorCount: 120,
  routeCount: 16,

  trafficLightCount: 120,
  constructionZoneCount: 42,

  roadBlockCandidateCount: 36,
  trafficJamCandidateCount: 36,
  closedGateCandidateCount: 24,
  wrongDirectionCandidateCount: 24,
  brokenRoadCandidateCount: 24,
  movingBarrierCandidateCount: 24,
  securityCheckpointCandidateCount: 24,

  parkCount: 16,
  lakeCount: 9,
  bridgeCount: 12,
  tunnelCount: 12,
  shortcutCount: 10,

  parkMinSize: 8,
  parkMaxSize: 18,
  lakeMinSize: 7,
  lakeMaxSize: 16,

  constructionMinLength: 5,
  constructionMaxLength: 13,

  bridgeLength: 11,
  tunnelLength: 16,
  shortcutLength: 26,

  roadRingPadding: 1,

  routeWaypointCount: 8,

  roadPointSpreadSalt: 97,
  hurdleSpreadSalt: 211,
  trafficSpreadSalt: 313,
  constructionSpreadSalt: 419,

  firstAreaIndex: 0,
  firstPointIndex: 0,
  areaStepOffset: 1,
  routeDisplayOffset: 1,

  horizontalDirectionModulo: 2,
  threeWayModulo: 3,
} as const;

export const mapTiles: MapTile[][] = createCourierWarCityMap();

function createCourierWarCityMap(): MapTile[][] {
  const map = createBaseMap();

  addDistrictRoadNetwork(map);
  addMajorAvenues(map);
  addOrganicConnectorRoads(map);
  addCourierRoutes(map);

  const parkAreas = addParks(map);
  const lakeAreas = addLakes(map);

  addRoadRingsAroundAreas(map, parkAreas, "park-ring-road");
  addRoadRingsAroundAreas(map, lakeAreas, "lake-ring-road");

  addBridges(map, lakeAreas);
  addTunnels(map);
  addShortcuts(map);

  addTrafficLights(map);
  addConstructionZones(map);
  addHurdleCandidates(map);

  connectStartAndDelivery(map);

  setTileType(map, START_POINT.x, START_POINT.y, "start");
  setTileType(map, DELIVERY_POINT.x, DELIVERY_POINT.y, "delivery");

  return map;
}

function createBaseMap(): MapTile[][] {
  const map: MapTile[][] = [];

  for (let y = GAME_CONSTANTS.mapGeneration.firstIndex; y < mapHeight; y++) {
    const row: MapTile[] = [];

    for (let x = GAME_CONSTANTS.mapGeneration.firstIndex; x < mapWidth; x++) {
      row.push(createTile(x, y, "building"));
    }

    map.push(row);
  }

  return map;
}

function addDistrictRoadNetwork(map: MapTile[][]) {
  for (
    let districtY = MAP_STYLE.safeBorder;
    districtY < mapHeight - MAP_STYLE.safeBorder;
    districtY += MAP_STYLE.districtSize
  ) {
    for (
      let districtX = MAP_STYLE.safeBorder;
      districtX < mapWidth - MAP_STYLE.safeBorder;
      districtX += MAP_STYLE.districtSize
    ) {
      const verticalA = clamp(
        districtX + MAP_STYLE.districtRoadOffsetA,
        MAP_STYLE.safeBorder,
        mapWidth - MAP_STYLE.safeBorder
      );

      const verticalB = clamp(
        districtX + MAP_STYLE.districtRoadOffsetB,
        MAP_STYLE.safeBorder,
        mapWidth - MAP_STYLE.safeBorder
      );

      const horizontalA = clamp(
        districtY + MAP_STYLE.districtRoadOffsetA,
        MAP_STYLE.safeBorder,
        mapHeight - MAP_STYLE.safeBorder
      );

      const horizontalB = clamp(
        districtY + MAP_STYLE.districtRoadOffsetB,
        MAP_STYLE.safeBorder,
        mapHeight - MAP_STYLE.safeBorder
      );

      drawLine(
        map,
        { x: verticalA, y: districtY },
        { x: verticalA, y: districtY + MAP_STYLE.districtSize },
        "road",
        "district-road"
      );

      drawLine(
        map,
        { x: verticalB, y: districtY },
        { x: verticalB, y: districtY + MAP_STYLE.districtSize },
        "road",
        "district-road"
      );

      drawLine(
        map,
        { x: districtX, y: horizontalA },
        { x: districtX + MAP_STYLE.districtSize, y: horizontalA },
        "road",
        "district-road"
      );

      drawLine(
        map,
        { x: districtX, y: horizontalB },
        { x: districtX + MAP_STYLE.districtSize, y: horizontalB },
        "road",
        "district-road"
      );
    }
  }
}

function addMajorAvenues(map: MapTile[][]) {
  addRepeatedVerticalRoads(map, MAP_STYLE.avenueSpacingA, "major-avenue-a");
  addRepeatedHorizontalRoads(map, MAP_STYLE.avenueSpacingB, "major-avenue-b");
  addRepeatedVerticalRoads(map, MAP_STYLE.avenueSpacingC, "major-avenue-c");

  drawLine(map, START_POINT, DELIVERY_POINT, "road", "main-delivery-spine");

  drawLine(
    map,
    { x: START_POINT.x, y: DELIVERY_POINT.y },
    DELIVERY_POINT,
    "road",
    "bottom-delivery-approach"
  );

  drawLine(
    map,
    START_POINT,
    { x: DELIVERY_POINT.x, y: START_POINT.y },
    "road",
    "top-delivery-approach"
  );
}

function addRepeatedVerticalRoads(
  map: MapTile[][],
  spacing: number,
  routeId: string
) {
  for (
    let x = MAP_STYLE.safeBorder + spacing;
    x < mapWidth - MAP_STYLE.safeBorder;
    x += spacing
  ) {
    const jitter = getSmallJitter(x);
    const roadX = clamp(x + jitter, MAP_STYLE.safeBorder, mapWidth - MAP_STYLE.safeBorder);

    drawLine(
      map,
      { x: roadX, y: MAP_STYLE.safeBorder },
      { x: roadX, y: mapHeight - MAP_STYLE.safeBorder },
      "road",
      routeId
    );
  }
}

function addRepeatedHorizontalRoads(
  map: MapTile[][],
  spacing: number,
  routeId: string
) {
  for (
    let y = MAP_STYLE.safeBorder + spacing;
    y < mapHeight - MAP_STYLE.safeBorder;
    y += spacing
  ) {
    const jitter = getSmallJitter(y);
    const roadY = clamp(y + jitter, MAP_STYLE.safeBorder, mapHeight - MAP_STYLE.safeBorder);

    drawLine(
      map,
      { x: MAP_STYLE.safeBorder, y: roadY },
      { x: mapWidth - MAP_STYLE.safeBorder, y: roadY },
      "road",
      routeId
    );
  }
}

function addOrganicConnectorRoads(map: MapTile[][]) {
  for (let index = MAP_STYLE.firstPointIndex; index < MAP_STYLE.connectorRoadCount; index++) {
    const start = getSpreadPoint(index, MAP_STYLE.roadPointSpreadSalt);
    const end = getSpreadPoint(index + MAP_STYLE.connectorRoadCount, MAP_STYLE.roadPointSpreadSalt);

    drawLine(
      map,
      start,
      end,
      "road",
      "organic-connector-road"
    );
  }

  for (let index = MAP_STYLE.firstPointIndex; index < MAP_STYLE.scenicConnectorCount; index++) {
    const start = getSpreadPoint(index, MAP_STYLE.roadPointSpreadSalt + MAP_STYLE.scenicConnectorCount);
    const mid = getSpreadPoint(index + MAP_STYLE.scenicConnectorCount, MAP_STYLE.roadPointSpreadSalt);
    const end = getSpreadPoint(index + MAP_STYLE.scenicConnectorCount * MAP_STYLE.horizontalDirectionModulo, MAP_STYLE.roadPointSpreadSalt);

    drawLine(map, start, mid, "road", "scenic-zigzag-road");
    drawLine(map, mid, end, "road", "scenic-zigzag-road");
  }
}

function addCourierRoutes(map: MapTile[][]) {
  for (let routeIndex = MAP_STYLE.firstPointIndex; routeIndex < MAP_STYLE.routeCount; routeIndex++) {
    const routeId = `route-${routeIndex + MAP_STYLE.routeDisplayOffset}`;
    const waypoints = createRouteWaypoints(routeIndex);

    for (let pointIndex = MAP_STYLE.firstPointIndex; pointIndex < waypoints.length - MAP_STYLE.areaStepOffset; pointIndex++) {
      drawLine(
        map,
        waypoints[pointIndex],
        waypoints[pointIndex + MAP_STYLE.areaStepOffset],
        "road",
        routeId
      );
    }
  }
}

function createRouteWaypoints(routeIndex: number): Point[] {
  const points: Point[] = [START_POINT];

  for (let index = MAP_STYLE.firstPointIndex; index < MAP_STYLE.routeWaypointCount; index++) {
    points.push(
      getSpreadPoint(
        routeIndex * MAP_STYLE.routeWaypointCount + index,
        MAP_STYLE.seedMultiplierA + routeIndex
      )
    );
  }

  points.push(DELIVERY_POINT);

  return points;
}

function addParks(map: MapTile[][]): Area[] {
  return addAreas(
    map,
    MAP_STYLE.parkCount,
    "park",
    MAP_STYLE.parkMinSize,
    MAP_STYLE.parkMaxSize,
    MAP_STYLE.seedMultiplierB
  );
}

function addLakes(map: MapTile[][]): Area[] {
  return addAreas(
    map,
    MAP_STYLE.lakeCount,
    "water",
    MAP_STYLE.lakeMinSize,
    MAP_STYLE.lakeMaxSize,
    MAP_STYLE.seedMultiplierC
  );
}

function addAreas(
  map: MapTile[][],
  count: number,
  type: TileType,
  minSize: number,
  maxSize: number,
  salt: number
): Area[] {
  const areas: Area[] = [];

  for (let index = MAP_STYLE.firstAreaIndex; index < count; index++) {
    const point = getSpreadPoint(index, salt);
    const width = getDeterministicRange(index + salt, minSize, maxSize);
    const height = getDeterministicRange(index + salt + count, minSize, maxSize);

    const area: Area = {
      startX: clamp(point.x, MAP_STYLE.safeBorder, mapWidth - width - MAP_STYLE.safeBorder),
      startY: clamp(point.y, MAP_STYLE.safeBorder, mapHeight - height - MAP_STYLE.safeBorder),
      width,
      height,
    };

    fillArea(map, area, type);
    areas.push(area);
  }

  return areas;
}

function addRoadRingsAroundAreas(
  map: MapTile[][],
  areas: Area[],
  routeId: string
) {
  for (const area of areas) {
    const left = clamp(area.startX - MAP_STYLE.roadRingPadding, MAP_STYLE.safeBorder, mapWidth - MAP_STYLE.safeBorder);
    const right = clamp(area.startX + area.width + MAP_STYLE.roadRingPadding, MAP_STYLE.safeBorder, mapWidth - MAP_STYLE.safeBorder);
    const top = clamp(area.startY - MAP_STYLE.roadRingPadding, MAP_STYLE.safeBorder, mapHeight - MAP_STYLE.safeBorder);
    const bottom = clamp(area.startY + area.height + MAP_STYLE.roadRingPadding, MAP_STYLE.safeBorder, mapHeight - MAP_STYLE.safeBorder);

    drawLine(map, { x: left, y: top }, { x: right, y: top }, "road", routeId);
    drawLine(map, { x: right, y: top }, { x: right, y: bottom }, "road", routeId);
    drawLine(map, { x: right, y: bottom }, { x: left, y: bottom }, "road", routeId);
    drawLine(map, { x: left, y: bottom }, { x: left, y: top }, "road", routeId);
  }
}

function addBridges(map: MapTile[][], lakeAreas: Area[]) {
  for (let index = MAP_STYLE.firstPointIndex; index < MAP_STYLE.bridgeCount; index++) {
    const area = lakeAreas[index % lakeAreas.length];

    const bridgeY = clamp(
      area.startY + Math.floor(area.height / GAME_CONSTANTS.tileMath.halfDivisor),
      MAP_STYLE.safeBorder,
      mapHeight - MAP_STYLE.safeBorder
    );

    drawLine(
      map,
      { x: area.startX - MAP_STYLE.roadRingPadding, y: bridgeY },
      { x: area.startX + area.width + MAP_STYLE.roadRingPadding, y: bridgeY },
      "bridge",
      "bridge-route"
    );
  }
}

function addTunnels(map: MapTile[][]) {
  for (let index = MAP_STYLE.firstPointIndex; index < MAP_STYLE.tunnelCount; index++) {
    const point = getSpreadPoint(index, MAP_STYLE.seedMultiplierA + MAP_STYLE.tunnelCount);

    if (index % MAP_STYLE.horizontalDirectionModulo === MAP_STYLE.firstPointIndex) {
      drawHorizontalSegment(map, point, MAP_STYLE.tunnelLength, "tunnel", "tunnel-route");
    } else {
      drawVerticalSegment(map, point, MAP_STYLE.tunnelLength, "tunnel", "tunnel-route");
    }
  }
}

function addShortcuts(map: MapTile[][]) {
  for (let index = MAP_STYLE.firstPointIndex; index < MAP_STYLE.shortcutCount; index++) {
    const point = getSpreadPoint(index, MAP_STYLE.seedMultiplierB + MAP_STYLE.shortcutCount);

    if (index % MAP_STYLE.horizontalDirectionModulo === MAP_STYLE.firstPointIndex) {
      drawHorizontalSegment(map, point, MAP_STYLE.shortcutLength, "shortcut", "shortcut-route");
    } else {
      drawVerticalSegment(map, point, MAP_STYLE.shortcutLength, "shortcut", "shortcut-route");
    }
  }
}

function addTrafficLights(map: MapTile[][]) {
  const roadPoints = getDistributedRoadPoints(
    map,
    MAP_STYLE.trafficLightCount,
    MAP_STYLE.trafficSpreadSalt
  );

  for (const point of roadPoints) {
    setTileType(map, point.x, point.y, "trafficLight");
    addRouteId(map, point.x, point.y, "traffic-light-zone");
  }
}

function addConstructionZones(map: MapTile[][]) {
  const constructionStarts = getDistributedRoadPoints(
    map,
    MAP_STYLE.constructionZoneCount,
    MAP_STYLE.constructionSpreadSalt
  );

  constructionStarts.forEach((point, index) => {
    const length = getDeterministicRange(
      index,
      MAP_STYLE.constructionMinLength,
      MAP_STYLE.constructionMaxLength
    );

    if (index % MAP_STYLE.horizontalDirectionModulo === MAP_STYLE.firstPointIndex) {
      drawHorizontalSegment(map, point, length, "construction", "construction-zone");
    } else {
      drawVerticalSegment(map, point, length, "construction", "construction-zone");
    }
  });
}

function addHurdleCandidates(map: MapTile[][]) {
  addHurdleCandidateType(map, "roadBlock", MAP_STYLE.roadBlockCandidateCount, MAP_STYLE.hurdleSpreadSalt);
  addHurdleCandidateType(map, "trafficJam", MAP_STYLE.trafficJamCandidateCount, MAP_STYLE.hurdleSpreadSalt + MAP_STYLE.trafficJamCandidateCount);
  addHurdleCandidateType(map, "closedGate", MAP_STYLE.closedGateCandidateCount, MAP_STYLE.hurdleSpreadSalt + MAP_STYLE.closedGateCandidateCount);
  addHurdleCandidateType(map, "wrongDirectionSign", MAP_STYLE.wrongDirectionCandidateCount, MAP_STYLE.hurdleSpreadSalt + MAP_STYLE.wrongDirectionCandidateCount);
  addHurdleCandidateType(map, "brokenRoad", MAP_STYLE.brokenRoadCandidateCount, MAP_STYLE.hurdleSpreadSalt + MAP_STYLE.brokenRoadCandidateCount);
  addHurdleCandidateType(map, "movingBarrier", MAP_STYLE.movingBarrierCandidateCount, MAP_STYLE.hurdleSpreadSalt + MAP_STYLE.movingBarrierCandidateCount);
  addHurdleCandidateType(map, "securityCheckpoint", MAP_STYLE.securityCheckpointCandidateCount, MAP_STYLE.hurdleSpreadSalt + MAP_STYLE.securityCheckpointCandidateCount);
}

function addHurdleCandidateType(
  map: MapTile[][],
  type: HurdleCandidateType,
  count: number,
  salt: number
) {
  const points = getDistributedRoadPoints(map, count, salt);

  for (const point of points) {
    map[point.y][point.x].hurdleCandidates.push(type);
  }
}

function connectStartAndDelivery(map: MapTile[][]) {
  drawLine(
    map,
    START_POINT,
    { x: START_POINT.x, y: START_POINT.y + MAP_STYLE.districtSize },
    "road",
    "start-connector"
  );

  drawLine(
    map,
    { x: START_POINT.x, y: START_POINT.y + MAP_STYLE.districtSize },
    { x: START_POINT.x + MAP_STYLE.districtSize, y: START_POINT.y + MAP_STYLE.districtSize },
    "road",
    "start-connector"
  );

  drawLine(
    map,
    DELIVERY_POINT,
    { x: DELIVERY_POINT.x - MAP_STYLE.districtSize, y: DELIVERY_POINT.y },
    "road",
    "delivery-connector"
  );

  drawLine(
    map,
    { x: DELIVERY_POINT.x - MAP_STYLE.districtSize, y: DELIVERY_POINT.y },
    { x: DELIVERY_POINT.x - MAP_STYLE.districtSize, y: DELIVERY_POINT.y - MAP_STYLE.districtSize },
    "road",
    "delivery-connector"
  );
}

function getDistributedRoadPoints(
  map: MapTile[][],
  count: number,
  salt: number
): Point[] {
  const allRoadPoints = collectPlayableRoadPoints(map);

  const sortedRoadPoints = [...allRoadPoints].sort((a, b) => {
    const scoreA = hashPoint(a.x, a.y, salt);
    const scoreB = hashPoint(b.x, b.y, salt);
    return scoreA - scoreB;
  });

  const result: Point[] = [];
  const step = Math.max(
    MAP_STYLE.areaStepOffset,
    Math.floor(sortedRoadPoints.length / count)
  );

  for (
    let index = MAP_STYLE.firstPointIndex;
    index < sortedRoadPoints.length && result.length < count;
    index += step
  ) {
    result.push(sortedRoadPoints[index]);
  }

  return result;
}

function collectPlayableRoadPoints(map: MapTile[][]): Point[] {
  const points: Point[] = [];

  for (let y = MAP_STYLE.safeBorder; y < mapHeight - MAP_STYLE.safeBorder; y++) {
    for (let x = MAP_STYLE.safeBorder; x < mapWidth - MAP_STYLE.safeBorder; x++) {
      const tile = map[y][x];

      if (!tile.walkable) continue;
      if (tile.type === "start") continue;
      if (tile.type === "delivery") continue;
      if (tile.type === "water") continue;
      if (tile.type === "park") continue;

      points.push({ x, y });
    }
  }

  return points;
}

function drawHorizontalSegment(
  map: MapTile[][],
  start: Point,
  length: number,
  type: TileType,
  routeId: string
) {
  drawLine(
    map,
    start,
    {
      x: clamp(start.x + length, MAP_STYLE.safeBorder, mapWidth - MAP_STYLE.safeBorder),
      y: start.y,
    },
    type,
    routeId
  );
}

function drawVerticalSegment(
  map: MapTile[][],
  start: Point,
  length: number,
  type: TileType,
  routeId: string
) {
  drawLine(
    map,
    start,
    {
      x: start.x,
      y: clamp(start.y + length, MAP_STYLE.safeBorder, mapHeight - MAP_STYLE.safeBorder),
    },
    type,
    routeId
  );
}

function drawLine(
  map: MapTile[][],
  start: Point,
  end: Point,
  type: TileType,
  routeId: string
) {
  let currentX = clamp(start.x, MAP_STYLE.safeBorder, mapWidth - MAP_STYLE.safeBorder);
  let currentY = clamp(start.y, MAP_STYLE.safeBorder, mapHeight - MAP_STYLE.safeBorder);

  const endX = clamp(end.x, MAP_STYLE.safeBorder, mapWidth - MAP_STYLE.safeBorder);
  const endY = clamp(end.y, MAP_STYLE.safeBorder, mapHeight - MAP_STYLE.safeBorder);

  const stepX = getStep(currentX, endX);
  const stepY = getStep(currentY, endY);

  while (currentX !== endX) {
    setTileType(map, currentX, currentY, type);
    addRouteId(map, currentX, currentY, routeId);
    currentX += stepX;
  }

  while (currentY !== endY) {
    setTileType(map, currentX, currentY, type);
    addRouteId(map, currentX, currentY, routeId);
    currentY += stepY;
  }

  setTileType(map, endX, endY, type);
  addRouteId(map, endX, endY, routeId);
}

function fillArea(map: MapTile[][], area: Area, type: TileType) {
  for (let y = area.startY; y < area.startY + area.height; y++) {
    for (let x = area.startX; x < area.startX + area.width; x++) {
      setTileType(map, x, y, type);
    }
  }
}

function createTile(x: number, y: number, type: TileType): MapTile {
  return {
    x,
    y,
    type,
    walkable: GAME_CONFIG.movement.walkable[type],
    movementCost: GAME_CONFIG.movement.movementCost[type],
    routeIds: [],
    hurdleCandidates: [],
  };
}

function setTileType(map: MapTile[][], x: number, y: number, type: TileType) {
  if (!isInsideMap(x, y)) return;

  const oldTile = map[y][x];

  map[y][x] = {
    ...oldTile,
    type,
    walkable: GAME_CONFIG.movement.walkable[type],
    movementCost: GAME_CONFIG.movement.movementCost[type],
  };
}

function addRouteId(map: MapTile[][], x: number, y: number, routeId: string) {
  if (!isInsideMap(x, y)) return;

  const tile = map[y][x];

  if (!tile.routeIds.includes(routeId)) {
    tile.routeIds.push(routeId);
  }
}

function getSpreadPoint(index: number, salt: number): Point {
  return {
    x: clamp(
      hashNumber(index, salt, mapWidth),
      MAP_STYLE.safeBorder,
      mapWidth - MAP_STYLE.safeBorder
    ),
    y: clamp(
      hashNumber(index + salt, salt, mapHeight),
      MAP_STYLE.safeBorder,
      mapHeight - MAP_STYLE.safeBorder
    ),
  };
}

function getDeterministicRange(index: number, min: number, max: number): number {
  const raw = Math.abs(
    Math.sin(index * MAP_STYLE.seedMultiplierA) * MAP_STYLE.seedMultiplierB
  );

  return Math.floor(min + (raw % (max - min + MAP_STYLE.areaStepOffset)));
}

function getSmallJitter(value: number): number {
  const shouldMovePositive = value % MAP_STYLE.threeWayModulo === MAP_STYLE.firstPointIndex;
  const shouldMoveNegative = value % MAP_STYLE.threeWayModulo === MAP_STYLE.areaStepOffset;

  if (shouldMovePositive) return MAP_STYLE.roadRingPadding;
  if (shouldMoveNegative) return -MAP_STYLE.roadRingPadding;

  return GAME_CONSTANTS.mapGeneration.firstIndex;
}

function hashNumber(index: number, salt: number, limit: number): number {
  const raw =
    index * MAP_STYLE.seedMultiplierA +
    salt * MAP_STYLE.seedMultiplierB +
    index * salt * MAP_STYLE.seedMultiplierC;

  return Math.abs(raw) % limit;
}

function hashPoint(x: number, y: number, salt: number): number {
  return Math.abs(
    x * MAP_STYLE.seedMultiplierA +
      y * MAP_STYLE.seedMultiplierB +
      salt * MAP_STYLE.seedMultiplierC
  );
}

function getStep(current: number, target: number): number {
  if (current < target) return GAME_CONSTANTS.mapGeneration.signPositive;
  if (current > target) return GAME_CONSTANTS.mapGeneration.signNegative;
  return GAME_CONSTANTS.mapGeneration.signZero;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isInsideMap(x: number, y: number): boolean {
  return (
    x >= GAME_CONSTANTS.mapGeneration.firstIndex &&
    x < mapWidth &&
    y >= GAME_CONSTANTS.mapGeneration.firstIndex &&
    y < mapHeight
  );
}

export function findStartTile(): MapTile {
  return mapTiles[START_POINT.y][START_POINT.x];
}

export function findDeliveryTile(): MapTile {
  return mapTiles[DELIVERY_POINT.y][DELIVERY_POINT.x];
}