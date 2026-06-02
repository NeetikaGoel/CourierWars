// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports Courier movement configuration for ring road cost
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports coordinate area and point types
import type { CoordinateTileArea, CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports tile layer values
import {
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../types/CityTileType";

// Imports seeded random generator type
import type { RandomSeededGenerator } from "./RandomSeededGenerator";

// Defines generated city area kinds
export const CityMapAreaKind = {
  // Represents park area
  Park: "park",

  // Represents lake area
  Lake: "lake",
} as const;

// Creates city map area kind union type
export type CityMapAreaKind = (typeof CityMapAreaKind)[keyof typeof CityMapAreaKind];

// Defines generated city area data
export interface CityMapAreaPlaced {
  // Stores stable area id
  id: string;

  // Stores area kind
  kind: CityMapAreaKind;

  // Stores tile area dimensions
  tileArea: CoordinateTileArea;
}

// Generates parks and lakes inside city blocks
export class CityMapAreaGenerator {
  // Generates park areas
  // Generates park areas
  cityMapParkAreaListGenerate(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): CityMapAreaPlaced[] {
    // Stores random park target count
    const parkCountTarget = randomSeededGenerator.numberIntegerGet(
      cityMapGenerationConfig.park.countMin,
      cityMapGenerationConfig.park.countMax
    );

    // Stores generated park areas
    const parkAreaList: CityMapAreaPlaced[] = [];

    // Stores maximum placement attempts
    const placementAttemptCountMax = parkCountTarget * 30;

    // Stores placement attempt index
    let placementAttemptIndex = 0;

    // Attempts until target count is reached or attempt limit is hit
    while (parkAreaList.length < parkCountTarget && placementAttemptIndex < placementAttemptCountMax) {
      // Increments attempt index
      placementAttemptIndex += 1;

      // Finds valid park area candidate
      const tileArea = this.cityMapAreaCandidateFind(
        cityMapGenerated,
        randomSeededGenerator,
        cityMapGenerationConfig.park.widthTilesMin,
        cityMapGenerationConfig.park.widthTilesMax,
        cityMapGenerationConfig.park.heightTilesMin,
        cityMapGenerationConfig.park.heightTilesMax
      );

      // Skips when no valid area exists
      if (!tileArea) {
        // Continues to next attempt
        continue;
      }

      // Creates placed park area
      const parkArea: CityMapAreaPlaced = {
        // Stores stable park id
        id: `park-${parkAreaList.length}`,

        // Stores area kind
        kind: CityMapAreaKind.Park,

        // Stores tile area
        tileArea,
      };

      // Places park area
      this.cityMapParkAreaPlace(cityMapGenerated, parkArea);

      // Adds optional ring road
      if (cityMapGenerationConfig.park.ringRoadAllowed) {
        // Adds ring road around park
        this.cityMapAreaRingRoadAdd(cityMapGenerated, parkArea);
      }

      // Stores placed park
      parkAreaList.push(parkArea);
    }

    // Returns generated park areas
    return parkAreaList;
  }

  // Generates lake areas
  // Generates lake areas
  cityMapLakeAreaListGenerate(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): CityMapAreaPlaced[] {
    // Stores random lake target count
    const lakeCountTarget = randomSeededGenerator.numberIntegerGet(
      cityMapGenerationConfig.lake.countMin,
      cityMapGenerationConfig.lake.countMax
    );

    // Stores generated lake areas
    const lakeAreaList: CityMapAreaPlaced[] = [];

    // Stores maximum placement attempts
    const placementAttemptCountMax = lakeCountTarget * 35;

    // Stores placement attempt index
    let placementAttemptIndex = 0;

    // Attempts until target count is reached or attempt limit is hit
    while (lakeAreaList.length < lakeCountTarget && placementAttemptIndex < placementAttemptCountMax) {
      // Increments attempt index
      placementAttemptIndex += 1;

      // Finds valid lake area candidate
      const tileArea = this.cityMapAreaCandidateFind(
        cityMapGenerated,
        randomSeededGenerator,
        cityMapGenerationConfig.lake.widthTilesMin,
        cityMapGenerationConfig.lake.widthTilesMax,
        cityMapGenerationConfig.lake.heightTilesMin,
        cityMapGenerationConfig.lake.heightTilesMax
      );

      // Skips when no valid area exists
      if (!tileArea) {
        // Continues to next attempt
        continue;
      }

      // Creates placed lake area
      const lakeArea: CityMapAreaPlaced = {
        // Stores stable lake id
        id: `lake-${lakeAreaList.length}`,

        // Stores area kind
        kind: CityMapAreaKind.Lake,

        // Stores tile area
        tileArea,
      };

      // Places lake area
      this.cityMapLakeAreaPlace(cityMapGenerated, lakeArea);

      // Adds optional ring road
      if (cityMapGenerationConfig.lake.ringRoadAllowed) {
        // Adds ring road around lake
        this.cityMapAreaRingRoadAdd(cityMapGenerated, lakeArea);
      }

      // Stores placed lake
      lakeAreaList.push(lakeArea);
    }

    // Returns generated lake areas
    return lakeAreaList;
  }

  // Finds valid area inside one city zone
  cityMapAreaCandidateFind(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator,
    widthTilesMin: number,
    widthTilesMax: number,
    heightTilesMin: number,
    heightTilesMax: number
  ): CoordinateTileArea | undefined {
    // Stores maximum attempts to find valid area
    const attemptCountMax = 80;

    // Attempts candidates until one is valid
    for (let attemptIndex = 0; attemptIndex < attemptCountMax; attemptIndex++) {
      // Picks random zone
      const cityZone = randomSeededGenerator.arrayItemPick(cityMapGenerated.zoneList);

      // Stores random area width
      const widthTiles = randomSeededGenerator.numberIntegerGet(widthTilesMin, widthTilesMax);

      // Stores random area height
      const heightTiles = randomSeededGenerator.numberIntegerGet(heightTilesMin, heightTilesMax);

      // Stores minimum candidate x coordinate
      const startXMin = Math.max(cityZone.startX + 4, cityMapGenerationConfig.map.safeBorderTiles);

      // Stores minimum candidate y coordinate
      const startYMin = Math.max(cityZone.startY + 4, cityMapGenerationConfig.map.safeBorderTiles);

      // Stores maximum candidate x coordinate
      const startXMax = Math.min(
        cityZone.endX - widthTiles - 4,
        cityMapGenerated.widthTiles - widthTiles - 1
      );

      // Stores maximum candidate y coordinate
      const startYMax = Math.min(
        cityZone.endY - heightTiles - 4,
        cityMapGenerated.heightTiles - heightTiles - 1
      );

      // Skips invalid candidate range
      if (startXMax <= startXMin || startYMax <= startYMin) {
        // Continues to next attempt
        continue;
      }

      // Creates candidate area
      const tileArea: CoordinateTileArea = {
        // Stores candidate start x coordinate
        startX: randomSeededGenerator.numberIntegerGet(startXMin, startXMax),

        // Stores candidate start y coordinate
        startY: randomSeededGenerator.numberIntegerGet(startYMin, startYMax),

        // Stores candidate width
        widthTiles,

        // Stores candidate height
        heightTiles,
      };

      // Checks whether candidate overlaps important content
      const areaBlocked = this.cityMapAreaImportantRoadOverlapCheck(cityMapGenerated, tileArea);

      // Returns candidate when not blocked
      if (!areaBlocked) {
        // Returns valid tile area
        return tileArea;
      }
    }

    // Returns undefined when no valid candidate was found
    return undefined;
  }

  // Places park terrain in area
  cityMapParkAreaPlace(cityMapGenerated: CityMapGenerated, cityMapAreaPlaced: CityMapAreaPlaced): void {
    // Fills area with park terrain
    this.cityMapAreaTerrainFill(cityMapGenerated, cityMapAreaPlaced.tileArea, CityTileTerrainType.Park);
  }

  // Places lake terrain in area
  cityMapLakeAreaPlace(cityMapGenerated: CityMapGenerated, cityMapAreaPlaced: CityMapAreaPlaced): void {
    // Fills area with water terrain
    this.cityMapAreaTerrainFill(cityMapGenerated, cityMapAreaPlaced.tileArea, CityTileTerrainType.Water);
  }

  // Adds local ring road around an area
  cityMapAreaRingRoadAdd(cityMapGenerated: CityMapGenerated, cityMapAreaPlaced: CityMapAreaPlaced): void {
    // Stores area data
    const tileArea = cityMapAreaPlaced.tileArea;

    // Stores left ring x coordinate
    const leftX = tileArea.startX - 1;

    // Stores right ring x coordinate
    const rightX = tileArea.startX + tileArea.widthTiles;

    // Stores top ring y coordinate
    const topY = tileArea.startY - 1;

    // Stores bottom ring y coordinate
    const bottomY = tileArea.startY + tileArea.heightTiles;

    // Draws top and bottom ring roads
    for (let tileX = leftX; tileX <= rightX; tileX++) {
      // Sets top ring tile
      this.cityMapAreaRingRoadTileSet(cityMapGenerated, { x: tileX, y: topY }, `ring-${cityMapAreaPlaced.id}`);

      // Sets bottom ring tile
      this.cityMapAreaRingRoadTileSet(cityMapGenerated, { x: tileX, y: bottomY }, `ring-${cityMapAreaPlaced.id}`);
    }

    // Draws left and right ring roads
    for (let tileY = topY; tileY <= bottomY; tileY++) {
      // Sets left ring tile
      this.cityMapAreaRingRoadTileSet(cityMapGenerated, { x: leftX, y: tileY }, `ring-${cityMapAreaPlaced.id}`);

      // Sets right ring tile
      this.cityMapAreaRingRoadTileSet(cityMapGenerated, { x: rightX, y: tileY }, `ring-${cityMapAreaPlaced.id}`);
    }
  }

  // Checks whether area overlaps roads terrain or important gameplay tiles
  cityMapAreaImportantRoadOverlapCheck(
    cityMapGenerated: CityMapGenerated,
    tileArea: CoordinateTileArea
  ): boolean {
    // Loops through area y coordinates
    for (let tileY = tileArea.startY; tileY < tileArea.startY + tileArea.heightTiles; tileY++) {
      // Loops through area x coordinates
      for (let tileX = tileArea.startX; tileX < tileArea.startX + tileArea.widthTiles; tileX++) {
        // Gets tile at coordinate
        const cityTile = this.cityMapTileGet(cityMapGenerated, { x: tileX, y: tileY });

        // Treats missing tile as blocked
        if (!cityTile) {
          // Returns true for blocked area
          return true;
        }

        // Rejects area over existing path
        if (cityTile.pathKind !== CityTilePathKind.None) {
          // Returns true because area should not erase path
          return true;
        }

        // Rejects area over existing road class
        if (cityTile.roadClass !== CityTileRoadClass.None) {
          // Returns true because area should not erase road
          return true;
        }

        // Rejects area over already placed park lake or land road surroundings
        if (cityTile.terrainType !== CityTileTerrainType.Building) {
          // Returns true because new area should only occupy untouched building blocks
          return true;
        }

        // Rejects area over start or delivery
        if (cityTile.start || cityTile.delivery) {
          // Returns true because important tile must remain
          return true;
        }
      }
    }

    // Returns false when area is clear
    return false;
  }

  // Fills an area with terrain
  private cityMapAreaTerrainFill(
    cityMapGenerated: CityMapGenerated,
    tileArea: CoordinateTileArea,
    terrainType: CityTileTerrainType
  ): void {
    // Loops through area y coordinates
    for (let tileY = tileArea.startY; tileY < tileArea.startY + tileArea.heightTiles; tileY++) {
      // Loops through area x coordinates
      for (let tileX = tileArea.startX; tileX < tileArea.startX + tileArea.widthTiles; tileX++) {
        // Gets tile at coordinate
        const cityTile = this.cityMapTileGet(cityMapGenerated, { x: tileX, y: tileY });

        // Skips missing tile
        if (!cityTile) {
          // Continues to next tile
          continue;
        }

        // Sets terrain type
        cityTile.terrainType = terrainType;

        // Clears road class
        cityTile.roadClass = CityTileRoadClass.None;

        // Clears path kind
        cityTile.pathKind = CityTilePathKind.None;

        // Marks tile as non walkable
        cityTile.walkable = false;

        // Sets blocked movement cost
        cityTile.baseMovementCost = Number.POSITIVE_INFINITY;

        // Clears route id list
        cityTile.routeIdList = [];

        // Clears hurdle candidates
        cityTile.hurdleCandidateList = [];
      }
    }
  }

  // Sets one ring road tile
  private cityMapAreaRingRoadTileSet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    routeId: string
  ): void {
    // Gets tile at coordinate
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends ring road tile set
      return;
    }

    // Skips water and park tiles
    if (cityTile.terrainType === CityTileTerrainType.Water || cityTile.terrainType === CityTileTerrainType.Park) {
      // Ends because ring road must stay outside area
      return;
    }

    // Leaves existing roads unchanged so ring roads do not downgrade avenues
    if (cityTile.roadClass !== CityTileRoadClass.None || cityTile.pathKind !== CityTilePathKind.None) {
      // Adds ring route id when the tile is already a road
      if (!cityTile.routeIdList.includes(routeId)) {
        // Pushes ring road route id
        cityTile.routeIdList.push(routeId);
      }

      // Ends without overwriting existing road
      return;
    }

    // Sets terrain to land
    cityTile.terrainType = CityTileTerrainType.Land;

    // Sets road class to local road
    cityTile.roadClass = CityTileRoadClass.LocalRoad;

    // Sets path kind to road
    cityTile.pathKind = CityTilePathKind.Road;

    // Marks tile walkable
    cityTile.walkable = true;

    // Sets local road movement cost
    cityTile.baseMovementCost = courierMovementConfig.cost.localRoad;

    // Adds route id when missing
    if (!cityTile.routeIdList.includes(routeId)) {
      // Pushes ring road route id
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