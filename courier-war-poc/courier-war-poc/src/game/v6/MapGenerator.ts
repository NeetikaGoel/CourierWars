
// This is the only file where the map is generated


//yeah so what u r doing 
import { GAME_CONFIG } from "./GameConfig";
import { GAME_CONSTANTS } from "./GameConstants";
import { MAP_CONFIG } from "./MapConfig";
import { TileType, HurdleType } from "./GameEnums";
import type { Area, GameMap, MapTile, Point } from "./GameShapeTypes";


// this is having lets see
// 1. create full building map
// 2. add district roads - creates small city-block roads!
// 3. add big avenues - creates big city-wide roads!!
// 4. add connector roads
// 5. add main routes from start to delivery
// 6. add parks and lakes
// 7. add roads around parks/lakes
// 8. add bridges on lakes
// 9. add tunnels and shortcuts
// 10. add traffic lights
// 11. add construction zones
// 12. add hurdle candidate points
// 13. set start and delivery tiles


//will create random-looking but stable positions!!! Same config = same map every refresh

export class MapGenerator {
  generate(): GameMap {
    const map = this.createBaseMap();

    this.addDistrictRoads(map);
    this.addAvenues(map);
    this.addRandomConnectors(map);
    this.addMainRoutes(map);

    const parks = this.addAreas(map, TileType.Park, MAP_CONFIG.parkCount, MAP_CONFIG.parkMinSize, MAP_CONFIG.parkMaxSize, MAP_CONFIG.parkSalt);
    const lakes = this.addAreas(map, TileType.Water, MAP_CONFIG.lakeCount, MAP_CONFIG.lakeMinSize, MAP_CONFIG.lakeMaxSize, MAP_CONFIG.lakeSalt);

    this.addRings(map, parks, "park-ring");
    this.addRings(map, lakes, "lake-ring");
    this.addLakeBridges(map, lakes);
    this.addSpecialSegments(
      map,
      TileType.Tunnel,
      MAP_CONFIG.tunnelCount,
      MAP_CONFIG.tunnelMinLength,
      MAP_CONFIG.tunnelMaxLength,
      MAP_CONFIG.tunnelSalt,
      "tunnel"
    );
    
    this.addSpecialSegments(
      map,
      TileType.Shortcut,
      MAP_CONFIG.shortcutCount,
      MAP_CONFIG.shortcutMinLength,
      MAP_CONFIG.shortcutMaxLength,
      MAP_CONFIG.shortcutSalt,
      "shortcut"
    );

    this.addConstruction(map);
    this.addTrafficLights(map);
    this.addHurdleCandidates(map);
    this.connectStartAndDelivery(map);

    this.setTile(map, MAP_CONFIG.startPoint, TileType.Start);
    this.setTile(map, MAP_CONFIG.deliveryPoint, TileType.Delivery);

    return map;
  }

  private createBaseMap(): GameMap {
    const map: GameMap = [];

    for (let y = 0; y < MAP_CONFIG.height; y++)
    {
      const row: MapTile[] = [];

      for (let x = 0; x < MAP_CONFIG.width; x++)
      {
        //a function new lets see what u do
        row.push(this.createTile(x, y, TileType.Building));
      }

      map.push(row);
    }

    return map;
  }

  private createTile(x: number, y: number, type: TileType): MapTile {
    return {
      x,
      y,
      type,
      color: GAME_CONFIG.colors[type],
      walkable: GAME_CONFIG.movement.walkable[type],
      movementCost: GAME_CONFIG.movement.costs[type],
      routeIds: [],
      hurdleCandidates: [],
    };
  }

  private setTile(map: GameMap, point: Point, type: TileType) {
    if (!this.isInside(point)) return;

    const oldTile = map[point.y][point.x];

    map[point.y][point.x] = {
      ...oldTile,
      type,
      color: GAME_CONFIG.colors[type],
      walkable: GAME_CONFIG.movement.walkable[type],
      movementCost: GAME_CONFIG.movement.costs[type],
    };
  }

  private addRoute(map: GameMap, point: Point, routeId: string) {
    if (!this.isInside(point)) return;

    if (!map[point.y][point.x].routeIds.includes(routeId)) {
      map[point.y][point.x].routeIds.push(routeId);
    }
  }

  private addDistrictRoads(map: GameMap) {
    for (let y = MAP_CONFIG.safeBorder; y < MAP_CONFIG.height - MAP_CONFIG.safeBorder; y += MAP_CONFIG.districtSize) {
      for (let x = MAP_CONFIG.safeBorder; x < MAP_CONFIG.width - MAP_CONFIG.safeBorder; x += MAP_CONFIG.districtSize) {
        this.drawLine(map, { x: x + MAP_CONFIG.districtRoadOffsetA, y }, { x: x + MAP_CONFIG.districtRoadOffsetA, y: y + MAP_CONFIG.districtSize }, TileType.Road, "district");
        this.drawLine(map, { x: x + MAP_CONFIG.districtRoadOffsetB, y }, { x: x + MAP_CONFIG.districtRoadOffsetB, y: y + MAP_CONFIG.districtSize }, TileType.Road, "district");
        this.drawLine(map, { x, y: y + MAP_CONFIG.districtRoadOffsetA }, { x: x + MAP_CONFIG.districtSize, y: y + MAP_CONFIG.districtRoadOffsetA }, TileType.Road, "district");
        this.drawLine(map, { x, y: y + MAP_CONFIG.districtRoadOffsetB }, { x: x + MAP_CONFIG.districtSize, y: y + MAP_CONFIG.districtRoadOffsetB }, TileType.Road, "district");
      }
    }
  }

  private addAvenues(map: GameMap)
{
  //big city roads should be avenues, not normal small roads
  this.addVerticalRoads(map, MAP_CONFIG.avenueSpacingA, "avenue-a", TileType.Avenue);
  this.addHorizontalRoads(map, MAP_CONFIG.avenueSpacingB, "avenue-b", TileType.Avenue);
  this.addVerticalRoads(map, MAP_CONFIG.avenueSpacingC, "avenue-c", TileType.Avenue);
}

private addVerticalRoads(map: GameMap, spacing: number, routeId: string, type: TileType)
{
  for (let x = MAP_CONFIG.safeBorder + spacing; x < MAP_CONFIG.width - MAP_CONFIG.safeBorder; x += spacing)
  {
    this.drawLine(
      map,
      { x, y: MAP_CONFIG.safeBorder },
      { x, y: MAP_CONFIG.height - MAP_CONFIG.safeBorder },
      type,
      routeId
    );
  }
}

private addHorizontalRoads(map: GameMap, spacing: number, routeId: string, type: TileType)
{
  for (let y = MAP_CONFIG.safeBorder + spacing; y < MAP_CONFIG.height - MAP_CONFIG.safeBorder; y += spacing)
  {
    this.drawLine(
      map,
      { x: MAP_CONFIG.safeBorder, y },
      { x: MAP_CONFIG.width - MAP_CONFIG.safeBorder, y },
      type,
      routeId
    );
  }
}

  private addRandomConnectors(map: GameMap) {
    for (let index = 0; index < MAP_CONFIG.connectorRoadCount; index++) {
      this.drawLine(map, this.spreadPoint(index, MAP_CONFIG.roadSalt), this.spreadPoint(index + MAP_CONFIG.connectorRoadCount, MAP_CONFIG.roadSalt), TileType.Road, "connector");
    }
  }

  private addMainRoutes(map: GameMap) {
    for (let routeIndex = 0; routeIndex < MAP_CONFIG.routeCount; routeIndex++) {
        let previous: Point = {
            x: MAP_CONFIG.startPoint.x,
            y: MAP_CONFIG.startPoint.y,
          };

      for (let index = 0; index < MAP_CONFIG.routeWaypointCount; index++) {
        const next = this.spreadPoint(routeIndex * MAP_CONFIG.routeWaypointCount + index, MAP_CONFIG.seedA + routeIndex);
        this.drawLine(map, previous, next, TileType.Road, `route-${routeIndex}`);
        previous = next;
      }

      this.drawLine(map, previous, MAP_CONFIG.deliveryPoint, TileType.Road, `route-${routeIndex}`);
    }
  }

  private addAreas(map: GameMap, type: TileType, count: number, minSize: number, maxSize: number, salt: number): Area[] {
    const areas: Area[] = [];

    for (let index = 0; index < count; index++) {
      const area = this.areaInCell(index, count, minSize, maxSize, salt);
      this.fillArea(map, area, type);
      areas.push(area);
    }

    return areas;
  }

  private addRings(map: GameMap, areas: Area[], routeId: string) {
    for (const area of areas) {
      const left = area.startX - MAP_CONFIG.roadRingPadding;
      const right = area.startX + area.width + MAP_CONFIG.roadRingPadding;
      const top = area.startY - MAP_CONFIG.roadRingPadding;
      const bottom = area.startY + area.height + MAP_CONFIG.roadRingPadding;

      this.drawLine(map, { x: left, y: top }, { x: right, y: top }, TileType.Road, routeId);
      this.drawLine(map, { x: right, y: top }, { x: right, y: bottom }, TileType.Road, routeId);
      this.drawLine(map, { x: right, y: bottom }, { x: left, y: bottom }, TileType.Road, routeId);
      this.drawLine(map, { x: left, y: bottom }, { x: left, y: top }, TileType.Road, routeId);
    }
  }

  private addLakeBridges(map: GameMap, lakes: Area[]) {
    for (let index = 0; index < MAP_CONFIG.bridgeCount; index++) {
      const lake = lakes[index % lakes.length];
      const bridgeY = lake.startY + Math.floor(lake.height / GAME_CONSTANTS.math.half);

      for (let x = lake.startX; x < lake.startX + lake.width; x++) {
        this.setTile(map, { x, y: bridgeY }, TileType.Bridge);
        this.addRoute(map, { x, y: bridgeY }, "bridge");
      }
    }
  }

  private addSpecialSegments(
    map: GameMap,
    type: TileType,
    count: number,
    minLength: number,
    maxLength: number,
    salt: number,
    routeId: string
  ) {
    const points = this.distributedRoadPoints(map, count, salt);
  
    points.forEach((point, index) => {
      const length = this.range(index + salt, minLength, maxLength);
  
      const end =
        index % GAME_CONSTANTS.math.half === GAME_CONSTANTS.math.zero
          ? { x: point.x + length, y: point.y }
          : { x: point.x, y: point.y + length };
  
      this.drawLine(map, point, end, type, routeId);
    });
  }

  private distributedJunctionPoints(map: GameMap, count: number, salt: number): Point[] {
    const junctions = this.collectJunctionPoints(map);
    const result: Point[] = [];
  
    const step = Math.max(
      GAME_CONSTANTS.math.one,
      Math.floor(junctions.length / count)
    );
  
    for (
      let index = GAME_CONSTANTS.math.zero;
      index < junctions.length && result.length < count;
      index += step
    ) {
      const selectedIndex =
        Math.abs(index * MAP_CONFIG.featureCellStride + salt) % junctions.length;
  
      const point = junctions[selectedIndex];
  
      if (!result.some((item) => item.x === point.x && item.y === point.y)) {
        result.push(point);
      }
    }
  
    return result;
  }

  private collectJunctionPoints(map: GameMap): Point[] {
    const junctions: Point[] = [];
  
    for (let y = MAP_CONFIG.safeBorder; y < MAP_CONFIG.height - MAP_CONFIG.safeBorder; y++) {
      for (let x = MAP_CONFIG.safeBorder; x < MAP_CONFIG.width - MAP_CONFIG.safeBorder; x++) {
        const point = { x, y };
  
        if (this.isTrafficLightJunction(map, point)) {
          junctions.push(point);
        }
      }
    }
  
    return junctions;
  }

  private isTrafficLightJunction(map: GameMap, point: Point): boolean {
    if (!this.isInside(point)) return false;
  
    const tile = map[point.y][point.x];
  
    if (tile.type !== TileType.Road && tile.type !== TileType.Avenue) {
      return false;
    }
  
    const hasHorizontalRoad =
      this.isTrafficRoad(map, { x: point.x - GAME_CONSTANTS.math.one, y: point.y }) ||
      this.isTrafficRoad(map, { x: point.x + GAME_CONSTANTS.math.one, y: point.y });
  
    const hasVerticalRoad =
      this.isTrafficRoad(map, { x: point.x, y: point.y - GAME_CONSTANTS.math.one }) ||
      this.isTrafficRoad(map, { x: point.x, y: point.y + GAME_CONSTANTS.math.one });
  
    return hasHorizontalRoad && hasVerticalRoad;
  }


  private isTrafficRoad(map: GameMap, point: Point): boolean {
    if (!this.isInside(point)) return false;
  
    const tile = map[point.y][point.x];
  
    return tile.type === TileType.Road || tile.type === TileType.Avenue;
  }


  private addTrafficLights(map: GameMap) {
    const junctions = this.distributedJunctionPoints(
      map,
      MAP_CONFIG.trafficLightCount,
      MAP_CONFIG.trafficSalt
    );
  
    for (const point of junctions) {
      this.setTile(map, point, TileType.TrafficLight);
      this.addRoute(map, point, "traffic-light");
    }
  }

  // private addConstruction(map: GameMap) {
  //   const points = this.distributedRoadPoints(map, MAP_CONFIG.constructionZoneCount, MAP_CONFIG.constructionSalt);

  //   points.forEach((point, index) => {
  //     const length = this.range(index, MAP_CONFIG.constructionMinLength, MAP_CONFIG.constructionMaxLength);
  //     this.drawLine(map, point, { x: point.x + length, y: point.y }, TileType.Construction, "construction");
  //   });
  // }

  private addConstruction(map: GameMap) {
    const points = this.distributedPlainRoadPoints(
      map,
      MAP_CONFIG.constructionZoneCount,
      MAP_CONFIG.constructionSalt
    );
  
    points.forEach((point, index) => {
      const length = this.range(
        index,
        MAP_CONFIG.constructionMinLength,
        MAP_CONFIG.constructionMaxLength
      );
  
      this.drawLine(
        map,
        point,
        { x: point.x + length, y: point.y },
        TileType.Construction,
        "construction"
      );
    });
  }


  private distributedPlainRoadPoints(map: GameMap, count: number, salt: number): Point[] {
    const result: Point[] = [];
  
    const totalCells =
      MAP_CONFIG.featureGridColumns * MAP_CONFIG.featureGridRows;
  
    for (let index = GAME_CONSTANTS.math.zero; result.length < count; index++) {
      const cellIndex =
        Math.abs(index * MAP_CONFIG.featureCellStride + salt) % totalCells;
  
      const point = this.findPlainRoadPointInsideCell(map, cellIndex, salt + index);
  
      if (point && !result.some((item) => item.x === point.x && item.y === point.y)) {
        result.push(point);
      }
    }
  
    return result;
  }


  private findPlainRoadPointInsideCell(
    map: GameMap,
    cellIndex: number,
    salt: number
  ): Point | undefined {
    const cellColumn = cellIndex % MAP_CONFIG.featureGridColumns;
    const cellRow = Math.floor(cellIndex / MAP_CONFIG.featureGridColumns);
  
    const cellWidth = Math.floor(MAP_CONFIG.width / MAP_CONFIG.featureGridColumns);
    const cellHeight = Math.floor(MAP_CONFIG.height / MAP_CONFIG.featureGridRows);
  
    const minX = cellColumn * cellWidth;
    const minY = cellRow * cellHeight;
    const maxX = minX + cellWidth;
    const maxY = minY + cellHeight;
  
    const candidates: Point[] = [];
  
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        if (!this.isInside({ x, y })) continue;
  
        const tile = map[y][x];
  
        if (tile.type === TileType.Road || tile.type === TileType.Avenue) {
          candidates.push({ x, y });
        }
      }
    }
  
    if (candidates.length === GAME_CONSTANTS.math.zero) {
      return undefined;
    }
  
    const selectedIndex = Math.abs(salt) % candidates.length;
  
    return candidates[selectedIndex];
  }


  private addHurdleCandidates(map: GameMap) {
    const hurdleTypes = [
      HurdleType.RoadBlock,
      HurdleType.TrafficJam,
      HurdleType.ClosedGate,
      HurdleType.WrongDirectionSign,
      HurdleType.BrokenRoad,
      HurdleType.MovingBarrier,
      HurdleType.SecurityCheckpoint,
    ];

    hurdleTypes.forEach((type, index) => {
      for (const point of this.distributedRoadPoints(map, MAP_CONFIG.routeCount, MAP_CONFIG.seedB + index)) {
        map[point.y][point.x].hurdleCandidates.push(type);
      }
    });
  }

  private connectStartAndDelivery(map: GameMap) {
    this.drawLine(map, MAP_CONFIG.startPoint, { x: MAP_CONFIG.deliveryPoint.x, y: MAP_CONFIG.startPoint.y }, TileType.Road, "start-path");
    this.drawLine(map, { x: MAP_CONFIG.startPoint.x, y: MAP_CONFIG.deliveryPoint.y }, MAP_CONFIG.deliveryPoint, TileType.Road, "delivery-path");
  }

  private drawLine(map: GameMap, start: Point, end: Point, type: TileType, routeId: string) {
    let x = this.clamp(start.x, MAP_CONFIG.safeBorder, MAP_CONFIG.width - MAP_CONFIG.safeBorder);
    let y = this.clamp(start.y, MAP_CONFIG.safeBorder, MAP_CONFIG.height - MAP_CONFIG.safeBorder);
    const endX = this.clamp(end.x, MAP_CONFIG.safeBorder, MAP_CONFIG.width - MAP_CONFIG.safeBorder);
    const endY = this.clamp(end.y, MAP_CONFIG.safeBorder, MAP_CONFIG.height - MAP_CONFIG.safeBorder);

    while (x !== endX) {
      this.setTile(map, { x, y }, type);
      this.addRoute(map, { x, y }, routeId);
      x += this.step(x, endX);
    }

    while (y !== endY) {
      this.setTile(map, { x, y }, type);
      this.addRoute(map, { x, y }, routeId);
      y += this.step(y, endY);
    }

    this.setTile(map, { x: endX, y: endY }, type);
    this.addRoute(map, { x: endX, y: endY }, routeId);
  }

  private fillArea(map: GameMap, area: Area, type: TileType) {
    for (let y = area.startY; y < area.startY + area.height; y++) {
      for (let x = area.startX; x < area.startX + area.width; x++) {
        this.setTile(map, { x, y }, type);
      }
    }
  }

  private areaInCell(index: number, count: number, min: number, max: number, salt: number): Area {
    const cellIndex = Math.abs(index * MAP_CONFIG.areaCellStride + salt) % (MAP_CONFIG.areaGridColumns * MAP_CONFIG.areaGridRows);
    const cellWidth = Math.floor(MAP_CONFIG.width / MAP_CONFIG.areaGridColumns);
    const cellHeight = Math.floor(MAP_CONFIG.height / MAP_CONFIG.areaGridRows);
    const width = this.range(index + salt, min, max);
    const height = this.range(index + salt + count, min, max);

    return {
      startX: (cellIndex % MAP_CONFIG.areaGridColumns) * cellWidth + MAP_CONFIG.safeBorder,
      startY: Math.floor(cellIndex / MAP_CONFIG.areaGridColumns) * cellHeight + MAP_CONFIG.safeBorder,
      width,
      height,
    };
  }

  private distributedRoadPoints(map: GameMap, count: number, salt: number): Point[] {
    const result: Point[] = [];
  
    const totalCells =
      MAP_CONFIG.featureGridColumns * MAP_CONFIG.featureGridRows;
  
    for (let index = 0; result.length < count; index++) {
      const cellIndex =
        Math.abs(index * MAP_CONFIG.featureCellStride + salt) % totalCells;
  
      const point = this.findRoadPointInsideCell(map, cellIndex, salt + index);
  
      if (point && !result.some((item) => item.x === point.x && item.y === point.y)) {
        result.push(point);
      }
    }
  
    return result;
  }
    
    
  private findRoadPointInsideCell(
    map: GameMap,
    cellIndex: number,
    salt: number
  ): Point | undefined {
    const cellColumn = cellIndex % MAP_CONFIG.featureGridColumns;
    const cellRow = Math.floor(cellIndex / MAP_CONFIG.featureGridColumns);
  
    const cellWidth = Math.floor(MAP_CONFIG.width / MAP_CONFIG.featureGridColumns);
    const cellHeight = Math.floor(MAP_CONFIG.height / MAP_CONFIG.featureGridRows);
  
    const minX = cellColumn * cellWidth;
    const minY = cellRow * cellHeight;
    const maxX = minX + cellWidth;
    const maxY = minY + cellHeight;
  
    const candidates: Point[] = [];
  
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        if (!this.isInside({ x, y })) continue;
  
        const tile = map[y][x];
  
        if (!tile.walkable) continue;
        if (tile.type === TileType.Start) continue;
        if (tile.type === TileType.Delivery) continue;
        if (tile.type === TileType.Water) continue;
        if (tile.type === TileType.Park) continue;
  
        candidates.push({ x, y });
      }
    }
  
    if (candidates.length === GAME_CONSTANTS.math.zero) {
      return undefined;
    }
  
    const selectedIndex = Math.abs(salt) % candidates.length;
  
    return candidates[selectedIndex];
  }

  private spreadPoint(index: number, salt: number): Point {
    return {
      x: this.clamp(this.hash(index, salt, MAP_CONFIG.width), MAP_CONFIG.safeBorder, MAP_CONFIG.width - MAP_CONFIG.safeBorder),
      y: this.clamp(this.hash(index + salt, salt, MAP_CONFIG.height), MAP_CONFIG.safeBorder, MAP_CONFIG.height - MAP_CONFIG.safeBorder),
    };
  }

  private range(index: number, min: number, max: number) {
    return Math.floor(min + (Math.abs(Math.sin(index * MAP_CONFIG.seedA) * MAP_CONFIG.seedB) % (max - min + GAME_CONSTANTS.math.one)));
  }

  private hash(index: number, salt: number, limit: number) {
    return Math.abs(index * MAP_CONFIG.seedA + salt * MAP_CONFIG.seedB + index * salt * MAP_CONFIG.seedC) % limit;
  }

  private step(current: number, target: number) {
    if (current < target) return GAME_CONSTANTS.math.one;
    if (current > target) return GAME_CONSTANTS.math.negativeOne;
    return GAME_CONSTANTS.math.zero;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  private isInside(point: Point) {
    return point.x >= GAME_CONSTANTS.math.zero && point.x < MAP_CONFIG.width && point.y >= GAME_CONSTANTS.math.zero && point.y < MAP_CONFIG.height;
  }
}