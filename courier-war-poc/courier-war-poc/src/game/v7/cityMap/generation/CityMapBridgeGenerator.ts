// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports Courier movement configuration for bridge movement cost
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports tile layer values
import {
  CityTileFeatureKind,
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../types/CityTileType";

// Imports seeded random generator type
import type { RandomSeededGenerator } from "./RandomSeededGenerator";

// Imports generated area type
import type { CityMapAreaPlaced } from "./CityMapAreaGenerator";

// Defines bridge orientation values
const CityMapBridgeOrientation = {
  // Represents bridge running horizontally
  Horizontal: "horizontal",

  // Represents bridge running vertically
  Vertical: "vertical",
} as const;

// Creates bridge orientation union type
type CityMapBridgeOrientation =
  (typeof CityMapBridgeOrientation)[keyof typeof CityMapBridgeOrientation];

// Generates bridges across lake water only
export class CityMapBridgeGenerator {
  // Generates bridges for generated lake areas
  cityMapBridgeListGenerate(
    cityMapGenerated: CityMapGenerated,
    lakeAreaList: CityMapAreaPlaced[],
    randomSeededGenerator: RandomSeededGenerator
  ): void {
    // Stops when there are no lake areas
    if (lakeAreaList.length === 0) {
      // Ends bridge generation
      return;
    }

    // Stores bridge count
    const bridgeCount = randomSeededGenerator.numberIntegerGet(
      cityMapGenerationConfig.bridge.countMin,
      cityMapGenerationConfig.bridge.countMax
    );

    // Places each bridge
    for (let bridgeIndex = 0; bridgeIndex < bridgeCount; bridgeIndex++) {
      // Picks lake area by cycling through lake list
      const lakeArea = lakeAreaList[bridgeIndex % lakeAreaList.length];

      // Picks bridge orientation
      const bridgeOrientation = randomSeededGenerator.booleanChanceCheck(0.5)
        ? CityMapBridgeOrientation.Horizontal
        : CityMapBridgeOrientation.Vertical;

      // Places bridge across selected lake
      this.cityMapBridgeAcrossLakePlace(
        cityMapGenerated,
        lakeArea,
        bridgeOrientation,
        `bridge-${bridgeIndex}`
      );
    }
  }

  // Places one bridge across a lake area
  cityMapBridgeAcrossLakePlace(
    cityMapGenerated: CityMapGenerated,
    lakeArea: CityMapAreaPlaced,
    bridgeOrientation: CityMapBridgeOrientation,
    bridgeId: string
  ): void {
    // Stores lake tile area
    const tileArea = lakeArea.tileArea;

    // Places horizontal bridge
    if (bridgeOrientation === CityMapBridgeOrientation.Horizontal) {
      // Stores center y coordinate
      const bridgeY = Math.floor(tileArea.startY + tileArea.heightTiles / 2);

      // Stores first bridge x coordinate
      const bridgeStartX = tileArea.startX;

      // Stores last bridge x coordinate
      const bridgeEndX = tileArea.startX + tileArea.widthTiles - 1;

      // Draws bridge tiles
      for (let tileX = bridgeStartX; tileX <= bridgeEndX; tileX++) {
        // Sets bridge tile
        this.cityMapBridgeTileSet(cityMapGenerated, { x: tileX, y: bridgeY }, bridgeId);
      }

      // Marks first bridge entrance
      this.cityMapBridgeEntranceMark(cityMapGenerated, { x: bridgeStartX, y: bridgeY }, bridgeId);

      // Marks second bridge entrance
      this.cityMapBridgeEntranceMark(cityMapGenerated, { x: bridgeEndX, y: bridgeY }, bridgeId);

      // Connects first bridge end to road
      this.cityMapBridgeEndRoadsConnect(cityMapGenerated, { x: bridgeStartX - 1, y: bridgeY }, bridgeId);

      // Connects second bridge end to road
      this.cityMapBridgeEndRoadsConnect(cityMapGenerated, { x: bridgeEndX + 1, y: bridgeY }, bridgeId);

      // Ends horizontal bridge placement
      return;
    }

    // Stores center x coordinate
    const bridgeX = Math.floor(tileArea.startX + tileArea.widthTiles / 2);

    // Stores first bridge y coordinate
    const bridgeStartY = tileArea.startY;

    // Stores last bridge y coordinate
    const bridgeEndY = tileArea.startY + tileArea.heightTiles - 1;

    // Draws bridge tiles
    for (let tileY = bridgeStartY; tileY <= bridgeEndY; tileY++) {
      // Sets bridge tile
      this.cityMapBridgeTileSet(cityMapGenerated, { x: bridgeX, y: tileY }, bridgeId);
    }

    // Marks first bridge entrance
    this.cityMapBridgeEntranceMark(cityMapGenerated, { x: bridgeX, y: bridgeStartY }, bridgeId);

    // Marks second bridge entrance
    this.cityMapBridgeEntranceMark(cityMapGenerated, { x: bridgeX, y: bridgeEndY }, bridgeId);

    // Connects first bridge end to road
    this.cityMapBridgeEndRoadsConnect(cityMapGenerated, { x: bridgeX, y: bridgeStartY - 1 }, bridgeId);

    // Connects second bridge end to road
    this.cityMapBridgeEndRoadsConnect(cityMapGenerated, { x: bridgeX, y: bridgeEndY + 1 }, bridgeId);
  }

  // Connects dry land road to bridge entrance
  cityMapBridgeEndRoadsConnect(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    bridgeId: string
  ): void {
    // Gets target tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends bridge connector placement
      return;
    }

    // Skips water tile
    if (cityTile.terrainType === CityTileTerrainType.Water) {
      // Ends because bridge body should handle water
      return;
    }

    // Skips park tile
    if (cityTile.terrainType === CityTileTerrainType.Park) {
      // Ends because connector should not cut through park
      return;
    }

    // Sets terrain to land
    cityTile.terrainType = CityTileTerrainType.Land;

    // Sets connector road class
    cityTile.roadClass = CityTileRoadClass.DistrictRoad;

    // Sets path kind to road
    cityTile.pathKind = CityTilePathKind.Road;

    // Marks connector walkable
    cityTile.walkable = true;

    // Sets district road movement cost
    cityTile.baseMovementCost = courierMovementConfig.cost.districtRoad;

    // Adds connector route id
    this.cityTileRouteIdAdd(cityTile, `${bridgeId}-connector`);
  }

  // Checks whether bridge tile placement is valid
  cityMapBridgeTileValidCheck(cityTile: CityTile): boolean {
    // Returns true only when bridge is over water
    return cityTile.terrainType === CityTileTerrainType.Water;
  }

  // Sets one bridge tile
  private cityMapBridgeTileSet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    bridgeId: string
  ): void {
    // Gets target tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends bridge tile placement
      return;
    }

    // Skips invalid bridge tile
    if (!this.cityMapBridgeTileValidCheck(cityTile)) {
      // Ends because bridge must be on water
      return;
    }

    // Sets path kind to bridge
    cityTile.pathKind = CityTilePathKind.Bridge;

    // Sets bridge road class
    cityTile.roadClass = CityTileRoadClass.DistrictRoad;

    // Marks bridge walkable
    cityTile.walkable = true;

    // Sets bridge movement cost
    cityTile.baseMovementCost = courierMovementConfig.cost.bridge;

    // Stores bridge id
    cityTile.bridgeId = bridgeId;

    // Adds bridge route id
    this.cityTileRouteIdAdd(cityTile, bridgeId);
  }

  // Marks bridge entrance feature
  private cityMapBridgeEntranceMark(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    bridgeId: string
  ): void {
    // Gets target tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends entrance mark
      return;
    }

    // Marks bridge entrance flag
    cityTile.bridgeEntrance = true;

    // Stores bridge id
    cityTile.bridgeId = bridgeId;

    // Adds bridge entrance feature
    this.cityTileFeatureAdd(cityTile, CityTileFeatureKind.BridgeEntrance);
  }

  // Adds feature kind when missing
  private cityTileFeatureAdd(cityTile: CityTile, featureKind: CityTileFeatureKind): void {
    // Checks whether feature already exists
    const featureExists = cityTile.featureKindList.includes(featureKind);

    // Adds missing feature
    if (!featureExists) {
      // Pushes feature kind
      cityTile.featureKindList.push(featureKind);
    }
  }

  // Adds route id when missing
  private cityTileRouteIdAdd(cityTile: CityTile, routeId: string): void {
    // Checks whether route already exists
    const routeExists = cityTile.routeIdList.includes(routeId);

    // Adds missing route
    if (!routeExists) {
      // Pushes route id
      cityTile.routeIdList.push(routeId);
    }
  }

  // Gets tile from generated map
  private cityMapTileGet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint
  ): CityTile | undefined {
    // Checks x lower bound
    const tileXMinValid = tilePoint.x >= 0;

    // Checks y lower bound
    const tileYMinValid = tilePoint.y >= 0;

    // Checks x upper bound
    const tileXMaxValid = tilePoint.x < cityMapGenerated.widthTiles;

    // Checks y upper bound
    const tileYMaxValid = tilePoint.y < cityMapGenerated.heightTiles;

    // Returns undefined when outside map
    if (!tileXMinValid || !tileYMinValid || !tileXMaxValid || !tileYMaxValid) {
      // Returns missing tile
      return undefined;
    }

    // Returns tile from map rows
    return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }
}