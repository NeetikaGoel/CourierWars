// MapDataV5.ts
// Creates a balanced 128x128 city map with distributed lakes, parks, roads, bridges, tunnels and hurdle zones

import { GAME_CONFIG } from "./GameConfigV5";
import { GAME_CONSTANTS } from "./GameConstantsV5";

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
  visualVariant: number;
}

export const mapWidth = GAME_CONFIG.map.width;
export const mapHeight = GAME_CONFIG.map.height;

const START_POINT: Point = GAME_CONFIG.cityGeneration.startPoint;
const DELIVERY_POINT: Point = GAME_CONFIG.cityGeneration.deliveryPoint;

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

  addBridgesOnlyOverLakes(map, lakeAreas);
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
  const config = GAME_CONFIG.cityGeneration;

  for (
    let districtY = config.safeBorder;
    districtY < mapHeight - config.safeBorder;
    districtY += config.districtSize
  ) {
    for (
      let districtX = config.safeBorder;
      districtX < mapWidth - config.safeBorder;
      districtX += config.districtSize
    ) {
      const verticalA = clamp(
        districtX + config.districtRoadOffsetA + getSmallJitter(districtX),
        config.safeBorder,
        mapWidth - config.safeBorder
      );

      const verticalB = clamp(
        districtX + config.districtRoadOffsetB + getSmallJitter(districtY),
        config.safeBorder,
        mapWidth - config.safeBorder
      );

      const horizontalA = clamp(
        districtY + config.districtRoadOffsetA + getSmallJitter(districtY),
        config.safeBorder,
        mapHeight - config.safeBorder
      );

      const horizontalB = clamp(
        districtY + config.districtRoadOffsetB + getSmallJitter(districtX),
        config.safeBorder,
        mapHeight - config.safeBorder
      );

      drawLine(map, { x: verticalA, y: districtY }, { x: verticalA, y: districtY + config.districtSize }, "road", "district-road");
      drawLine(map, { x: verticalB, y: districtY }, { x: verticalB, y: districtY + config.districtSize }, "road", "district-road");
      drawLine(map, { x: districtX, y: horizontalA }, { x: districtX + config.districtSize, y: horizontalA }, "road", "district-road");
      drawLine(map, { x: districtX, y: horizontalB }, { x: districtX + config.districtSize, y: horizontalB }, "road", "district-road");
    }
  }
}

function addMajorAvenues(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;

  addRepeatedVerticalRoads(map, config.avenueSpacingA, "major-avenue-a");
  addRepeatedHorizontalRoads(map, config.avenueSpacingB, "major-avenue-b");
  addRepeatedVerticalRoads(map, config.avenueSpacingC, "major-avenue-c");

  drawLine(map, START_POINT, DELIVERY_POINT, "road", "main-delivery-spine");
  drawLine(map, START_POINT, { x: DELIVERY_POINT.x, y: START_POINT.y }, "road", "top-delivery-approach");
  drawLine(map, { x: START_POINT.x, y: DELIVERY_POINT.y }, DELIVERY_POINT, "road", "bottom-delivery-approach");
}

function addRepeatedVerticalRoads(
  map: MapTile[][],
  spacing: number,
  routeId: string
) {
  const config = GAME_CONFIG.cityGeneration;

  for (
    let x = config.safeBorder + spacing;
    x < mapWidth - config.safeBorder;
    x += spacing
  ) {
    const roadX = clamp(x + getSmallJitter(x), config.safeBorder, mapWidth - config.safeBorder);

    drawLine(
      map,
      { x: roadX, y: config.safeBorder },
      { x: roadX, y: mapHeight - config.safeBorder },
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
  const config = GAME_CONFIG.cityGeneration;

  for (
    let y = config.safeBorder + spacing;
    y < mapHeight - config.safeBorder;
    y += spacing
  ) {
    const roadY = clamp(y + getSmallJitter(y), config.safeBorder, mapHeight - config.safeBorder);

    drawLine(
      map,
      { x: config.safeBorder, y: roadY },
      { x: mapWidth - config.safeBorder, y: roadY },
      "road",
      routeId
    );
  }
}

function addOrganicConnectorRoads(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; index < config.connectorRoadCount; index++) {
    const start = getSpreadPoint(index, config.roadPointSpreadSalt);
    const end = getSpreadPoint(index + config.connectorRoadCount, config.roadPointSpreadSalt);

    drawLine(map, start, end, "road", "organic-connector-road");
  }

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; index < config.scenicConnectorCount; index++) {
    const start = getSpreadPoint(index, config.roadPointSpreadSalt + config.scenicConnectorCount);
    const middle = getSpreadPoint(index + config.scenicConnectorCount, config.roadPointSpreadSalt);
    const end = getSpreadPoint(index + config.scenicConnectorCount * config.horizontalDirectionModulo, config.roadPointSpreadSalt);

    drawLine(map, start, middle, "road", "scenic-road");
    drawLine(map, middle, end, "road", "scenic-road");
  }
}

function addCourierRoutes(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;

  for (let routeIndex = GAME_CONSTANTS.mapGeneration.firstIndex; routeIndex < config.routeCount; routeIndex++) {
    const routeId = `route-${routeIndex + config.routeDisplayOffset}`;
    const waypoints = createRouteWaypoints(routeIndex);

    for (let pointIndex = GAME_CONSTANTS.mapGeneration.firstIndex; pointIndex < waypoints.length - config.areaStepOffset; pointIndex++) {
      drawLine(
        map,
        waypoints[pointIndex],
        waypoints[pointIndex + config.areaStepOffset],
        "road",
        routeId
      );
    }
  }
}

function createRouteWaypoints(routeIndex: number): Point[] {
  const config = GAME_CONFIG.cityGeneration;
  const points: Point[] = [START_POINT];

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; index < config.routeWaypointCount; index++) {
    points.push(
      getSpreadPoint(
        routeIndex * config.routeWaypointCount + index,
        config.seedMultiplierA + routeIndex
      )
    );
  }

  points.push(DELIVERY_POINT);

  return points;
}

function addParks(map: MapTile[][]): Area[] {
  const config = GAME_CONFIG.cityGeneration;

  return addDistributedAreas(
    map,
    config.parkCount,
    "park",
    config.parkMinSize,
    config.parkMaxSize,
    config.seedMultiplierB
  );
}

function addLakes(map: MapTile[][]): Area[] {
  const config = GAME_CONFIG.cityGeneration;

  return addDistributedAreas(
    map,
    config.lakeCount,
    "water",
    config.lakeMinSize,
    config.lakeMaxSize,
    config.seedMultiplierC
  );
}

function addDistributedAreas(
  map: MapTile[][],
  count: number,
  type: TileType,
  minSize: number,
  maxSize: number,
  salt: number
): Area[] {
  const areas: Area[] = [];

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; index < count; index++) {
    const area = createAreaInDistributedCell(index, count, minSize, maxSize, salt);

    fillArea(map, area, type);
    areas.push(area);
  }

  return areas;
}

function createAreaInDistributedCell(
  index: number,
  totalCount: number,
  minSize: number,
  maxSize: number,
  salt: number
): Area {
  const config = GAME_CONFIG.cityGeneration;

  const columns = config.areaGridColumns;
  const rows = config.areaGridRows;
  const cellCount = columns * rows;
  const cellIndex = getDistributedCellIndex(index, salt, cellCount, config.areaCellStride);

  const cellColumn = cellIndex % columns;
  const cellRow = Math.floor(cellIndex / columns) % rows;

  const cellWidth = Math.floor(mapWidth / columns);
  const cellHeight = Math.floor(mapHeight / rows);

  const width = getDeterministicRange(index + salt, minSize, maxSize);
  const height = getDeterministicRange(index + salt + totalCount, minSize, maxSize);

  const localMaxX = Math.max(config.areaStepOffset, cellWidth - width - config.safeBorder);
  const localMaxY = Math.max(config.areaStepOffset, cellHeight - height - config.safeBorder);

  const localX = getDeterministicRange(index + salt, config.safeBorder, localMaxX);
  const localY = getDeterministicRange(index + salt + totalCount, config.safeBorder, localMaxY);

  return {
    startX: clamp(cellColumn * cellWidth + localX, config.safeBorder, mapWidth - width - config.safeBorder),
    startY: clamp(cellRow * cellHeight + localY, config.safeBorder, mapHeight - height - config.safeBorder),
    width,
    height,
  };
}

function addRoadRingsAroundAreas(
  map: MapTile[][],
  areas: Area[],
  routeId: string
) {
  const config = GAME_CONFIG.cityGeneration;

  for (const area of areas) {
    const left = clamp(area.startX - config.roadRingPadding, config.safeBorder, mapWidth - config.safeBorder);
    const right = clamp(area.startX + area.width + config.roadRingPadding, config.safeBorder, mapWidth - config.safeBorder);
    const top = clamp(area.startY - config.roadRingPadding, config.safeBorder, mapHeight - config.safeBorder);
    const bottom = clamp(area.startY + area.height + config.roadRingPadding, config.safeBorder, mapHeight - config.safeBorder);

    drawLine(map, { x: left, y: top }, { x: right, y: top }, "road", routeId);
    drawLine(map, { x: right, y: top }, { x: right, y: bottom }, "road", routeId);
    drawLine(map, { x: right, y: bottom }, { x: left, y: bottom }, "road", routeId);
    drawLine(map, { x: left, y: bottom }, { x: left, y: top }, "road", routeId);
  }
}

function addBridgesOnlyOverLakes(map: MapTile[][], lakeAreas: Area[]) {
  const config = GAME_CONFIG.cityGeneration;

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; index < config.bridgeCount; index++) {
    const lake = lakeAreas[index % lakeAreas.length];

    const bridgeY = clamp(
      lake.startY + Math.floor(lake.height / GAME_CONSTANTS.tileMath.halfDivisor),
      lake.startY,
      lake.startY + lake.height - config.areaStepOffset
    );

    for (let x = lake.startX; x < lake.startX + lake.width; x++) {
      setTileType(map, x, bridgeY, "bridge");
      addRouteId(map, x, bridgeY, "bridge-over-lake");
    }

    setTileType(map, lake.startX - config.roadRingPadding, bridgeY, "road");
    setTileType(map, lake.startX + lake.width, bridgeY, "road");
  }
}

function addTunnels(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; index < config.tunnelCount; index++) {
    const point = getDistributedRoadPoints(map, config.tunnelCount, config.seedMultiplierA + config.tunnelCount)[index];

    if (index % config.horizontalDirectionModulo === GAME_CONSTANTS.mapGeneration.firstIndex) {
      drawHorizontalSegment(map, point, config.tunnelLength, "tunnel", "tunnel-route");
    } else {
      drawVerticalSegment(map, point, config.tunnelLength, "tunnel", "tunnel-route");
    }
  }
}

function addShortcuts(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; index < config.shortcutCount; index++) {
    const point = getDistributedRoadPoints(map, config.shortcutCount, config.seedMultiplierB + config.shortcutCount)[index];

    if (index % config.horizontalDirectionModulo === GAME_CONSTANTS.mapGeneration.firstIndex) {
      drawHorizontalSegment(map, point, config.shortcutLength, "shortcut", "shortcut-route");
    } else {
      drawVerticalSegment(map, point, config.shortcutLength, "shortcut", "shortcut-route");
    }
  }
}

function addTrafficLights(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;
  const roadPoints = getDistributedRoadPoints(map, config.trafficLightCount, config.trafficSpreadSalt);

  for (const point of roadPoints) {
    setTileType(map, point.x, point.y, "trafficLight");
    addRouteId(map, point.x, point.y, "traffic-light-zone");
  }
}

function addConstructionZones(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;
  const constructionStarts = getDistributedRoadPoints(map, config.constructionZoneCount, config.constructionSpreadSalt);

  constructionStarts.forEach((point, index) => {
    const length = getDeterministicRange(index, config.constructionMinLength, config.constructionMaxLength);

    if (index % config.horizontalDirectionModulo === GAME_CONSTANTS.mapGeneration.firstIndex) {
      drawHorizontalSegment(map, point, length, "construction", "construction-zone");
    } else {
      drawVerticalSegment(map, point, length, "construction", "construction-zone");
    }
  });
}

function addHurdleCandidates(map: MapTile[][]) {
  const config = GAME_CONFIG.cityGeneration;

  addHurdleCandidateType(map, "roadBlock", config.roadBlockCandidateCount, config.hurdleSpreadSalt);
  addHurdleCandidateType(map, "trafficJam", config.trafficJamCandidateCount, config.hurdleSpreadSalt + config.trafficJamCandidateCount);
  addHurdleCandidateType(map, "closedGate", config.closedGateCandidateCount, config.hurdleSpreadSalt + config.closedGateCandidateCount);
  addHurdleCandidateType(map, "wrongDirectionSign", config.wrongDirectionCandidateCount, config.hurdleSpreadSalt + config.wrongDirectionCandidateCount);
  addHurdleCandidateType(map, "brokenRoad", config.brokenRoadCandidateCount, config.hurdleSpreadSalt + config.brokenRoadCandidateCount);
  addHurdleCandidateType(map, "movingBarrier", config.movingBarrierCandidateCount, config.hurdleSpreadSalt + config.movingBarrierCandidateCount);
  addHurdleCandidateType(map, "securityCheckpoint", config.securityCheckpointCandidateCount, config.hurdleSpreadSalt + config.securityCheckpointCandidateCount);
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
  const config = GAME_CONFIG.cityGeneration;

  drawLine(
    map,
    START_POINT,
    { x: START_POINT.x, y: START_POINT.y + config.districtSize },
    "road",
    "start-connector"
  );

  drawLine(
    map,
    { x: START_POINT.x, y: START_POINT.y + config.districtSize },
    { x: START_POINT.x + config.districtSize, y: START_POINT.y + config.districtSize },
    "road",
    "start-connector"
  );

  drawLine(
    map,
    DELIVERY_POINT,
    { x: DELIVERY_POINT.x - config.districtSize, y: DELIVERY_POINT.y },
    "road",
    "delivery-connector"
  );

  drawLine(
    map,
    { x: DELIVERY_POINT.x - config.districtSize, y: DELIVERY_POINT.y },
    { x: DELIVERY_POINT.x - config.districtSize, y: DELIVERY_POINT.y - config.districtSize },
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
  const result: Point[] = [];
  const config = GAME_CONFIG.cityGeneration;
  const cellCount = config.featureGridColumns * config.featureGridRows;

  for (let index = GAME_CONSTANTS.mapGeneration.firstIndex; result.length < count; index++) {
    const cellIndex = getDistributedCellIndex(index, salt, cellCount, config.featureCellStride);
    const point = getRoadPointInFeatureCell(allRoadPoints, cellIndex, salt + index);

    if (point && !hasPoint(result, point)) {
      result.push(point);
    }
  }

  return result;
}

function getRoadPointInFeatureCell(
  points: Point[],
  cellIndex: number,
  salt: number
): Point | undefined {
  const config = GAME_CONFIG.cityGeneration;
  const cellColumn = cellIndex % config.featureGridColumns;
  const cellRow = Math.floor(cellIndex / config.featureGridColumns) % config.featureGridRows;
  const cellWidth = Math.floor(mapWidth / config.featureGridColumns);
  const cellHeight = Math.floor(mapHeight / config.featureGridRows);
  const minX = cellColumn * cellWidth;
  const minY = cellRow * cellHeight;
  const maxX = minX + cellWidth;
  const maxY = minY + cellHeight;
  const pointsInCell = points.filter((point) => {
    return point.x >= minX && point.x < maxX && point.y >= minY && point.y < maxY;
  });
  const candidates = pointsInCell.length > GAME_CONSTANTS.mapGeneration.firstIndex ? pointsInCell : points;

  return candidates.reduce<Point | undefined>((bestPoint, point) => {
    if (!bestPoint) return point;

    return hashPoint(point.x, point.y, salt) < hashPoint(bestPoint.x, bestPoint.y, salt)
      ? point
      : bestPoint;
  }, undefined);
}

function getDistributedCellIndex(
  index: number,
  salt: number,
  cellCount: number,
  stride: number
): number {
  return Math.abs(index * stride + salt) % cellCount;
}

function hasPoint(points: Point[], target: Point): boolean {
  return points.some((point) => point.x === target.x && point.y === target.y);
}

function collectPlayableRoadPoints(map: MapTile[][]): Point[] {
  const config = GAME_CONFIG.cityGeneration;
  const points: Point[] = [];

  for (let y = config.safeBorder; y < mapHeight - config.safeBorder; y++) {
    for (let x = config.safeBorder; x < mapWidth - config.safeBorder; x++) {
      const tile = map[y][x];

      if (!tile.walkable) continue;
      if (tile.type === "start") continue;
      if (tile.type === "delivery") continue;
      if (tile.type === "park") continue;
      if (tile.type === "water") continue;

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
      x: clamp(start.x + length, GAME_CONFIG.cityGeneration.safeBorder, mapWidth - GAME_CONFIG.cityGeneration.safeBorder),
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
      y: clamp(start.y + length, GAME_CONFIG.cityGeneration.safeBorder, mapHeight - GAME_CONFIG.cityGeneration.safeBorder),
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
  let currentX = clamp(start.x, GAME_CONFIG.cityGeneration.safeBorder, mapWidth - GAME_CONFIG.cityGeneration.safeBorder);
  let currentY = clamp(start.y, GAME_CONFIG.cityGeneration.safeBorder, mapHeight - GAME_CONFIG.cityGeneration.safeBorder);

  const endX = clamp(end.x, GAME_CONFIG.cityGeneration.safeBorder, mapWidth - GAME_CONFIG.cityGeneration.safeBorder);
  const endY = clamp(end.y, GAME_CONFIG.cityGeneration.safeBorder, mapHeight - GAME_CONFIG.cityGeneration.safeBorder);

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
    visualVariant: getVisualVariant(x, y, type),
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
    visualVariant: getVisualVariant(x, y, type),
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
  const config = GAME_CONFIG.cityGeneration;

  return {
    x: clamp(
      hashNumber(index, salt, mapWidth),
      config.safeBorder,
      mapWidth - config.safeBorder
    ),
    y: clamp(
      hashNumber(index + salt, salt, mapHeight),
      config.safeBorder,
      mapHeight - config.safeBorder
    ),
  };
}

function getDeterministicRange(index: number, min: number, max: number): number {
  const config = GAME_CONFIG.cityGeneration;

  const raw = Math.abs(
    Math.sin(index * config.seedMultiplierA) * config.seedMultiplierB
  );

  return Math.floor(min + (raw % (max - min + config.areaStepOffset)));
}

function getSmallJitter(value: number): number {
  const config = GAME_CONFIG.cityGeneration;

  const shouldMovePositive =
    value % config.threeWayModulo === GAME_CONSTANTS.mapGeneration.firstIndex;

  const shouldMoveNegative =
    value % config.threeWayModulo === config.areaStepOffset;

  if (shouldMovePositive) return config.roadRingPadding;
  if (shouldMoveNegative) return -config.roadRingPadding;

  return GAME_CONSTANTS.mapGeneration.firstIndex;
}

function getVisualVariant(x: number, y: number, type: TileType): number {
  const variantCount = getVariantCount(type);

  if (variantCount === GAME_CONSTANTS.variation.noVariation) {
    return GAME_CONSTANTS.variation.noVariation;
  }

  return hashPoint(x, y, GAME_CONFIG.cityGeneration.seedMultiplierC) % variantCount;
}

function getVariantCount(type: TileType): number {
  const keys = GAME_CONFIG.assets.keys;

  if (type === "road") return keys.road.length;
  if (type === "building") return keys.building.length;
  if (type === "park") return keys.park.length;
  if (type === "water") return keys.water.length;
  if (type === "bridge") return keys.bridge.length;
  if (type === "tunnel") return keys.tunnel.length;
  if (type === "shortcut") return keys.shortcut.length;
  if (type === "trafficLight") return keys.trafficLight.length;
  if (type === "construction") return keys.construction.length;

  return GAME_CONSTANTS.variation.noVariation;
}

function hashNumber(index: number, salt: number, limit: number): number {
  const config = GAME_CONFIG.cityGeneration;

  const raw =
    index * config.seedMultiplierA +
    salt * config.seedMultiplierB +
    index * salt * config.seedMultiplierC;

  return Math.abs(raw) % limit;
}

function hashPoint(x: number, y: number, salt: number): number {
  const config = GAME_CONFIG.cityGeneration;

  return Math.abs(
    x * config.seedMultiplierA +
      y * config.seedMultiplierB +
      salt * config.seedMultiplierC
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
