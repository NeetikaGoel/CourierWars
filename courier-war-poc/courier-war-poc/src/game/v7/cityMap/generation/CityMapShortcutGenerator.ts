// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports Courier movement configuration for shortcut movement cost
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated map and tile types
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

// Defines shortcut endpoint pair
interface CityMapShortcutEndpointPair {
  // Stores shortcut start point
  startPoint: CoordinateTilePoint;

  // Stores shortcut end point
  endPoint: CoordinateTilePoint;
}

// Generates subtle shorter but slower shortcut paths
export class CityMapShortcutGenerator {
  // Generates shortcut list
  cityMapShortcutListGenerate(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): void {
    // Stores shortcut count
    const shortcutCount = randomSeededGenerator.numberIntegerGet(
      cityMapGenerationConfig.shortcut.countMin,
      cityMapGenerationConfig.shortcut.countMax
    );

    // Generates each shortcut
    for (let shortcutIndex = 0; shortcutIndex < shortcutCount; shortcutIndex++) {
      // Finds shortcut endpoints
      const endpointPair = this.cityMapShortcutEndpointPairFind(cityMapGenerated, randomSeededGenerator);

      // Skips when no endpoints exist
      if (!endpointPair) {
        // Continues to next shortcut
        continue;
      }

      // Stores shortcut id
      const shortcutId = `shortcut-${shortcutIndex}`;

      // Draws shortcut path
      this.cityMapShortcutPathDraw(cityMapGenerated, endpointPair.startPoint, endpointPair.endPoint, shortcutId);

      // Marks first entrance
      this.cityMapShortcutEntranceMark(cityMapGenerated, endpointPair.startPoint, shortcutId);

      // Marks second entrance
      this.cityMapShortcutEntranceMark(cityMapGenerated, endpointPair.endPoint, shortcutId);
    }
  }

  // Finds valid shortcut endpoint pair
  cityMapShortcutEndpointPairFind(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): CityMapShortcutEndpointPair | undefined {
    // Gets endpoint candidates
    const roadTilePointList = this.cityMapShortcutEndpointCandidateListGet(cityMapGenerated);

    // Shuffles endpoint candidates
    const roadTilePointListShuffled = randomSeededGenerator.arrayShuffle(roadTilePointList);

    // Loops through start candidates
    for (const startPoint of roadTilePointListShuffled) {
      // Loops through end candidates
      for (const endPoint of roadTilePointListShuffled) {
        // Skips same point
        if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
          // Continues to next endpoint
          continue;
        }

        // Stores endpoint distance
        const distanceTiles = Math.abs(startPoint.x - endPoint.x) + Math.abs(startPoint.y - endPoint.y);

        // Skips short shortcuts
        if (distanceTiles < cityMapGenerationConfig.shortcut.lengthTilesMin) {
          // Continues to next endpoint
          continue;
        }

        // Skips long shortcuts
        if (distanceTiles > cityMapGenerationConfig.shortcut.lengthTilesMax) {
          // Continues to next endpoint
          continue;
        }

        // Checks path validity
        const shortcutValid = this.cityMapShortcutValidCheck(cityMapGenerated, startPoint, endPoint);

        // Returns endpoint pair when valid
        if (shortcutValid) {
          // Returns shortcut endpoints
          return {
            // Stores start point
            startPoint,

            // Stores end point
            endPoint,
          };
        }
      }
    }

    // Returns undefined when no valid shortcut exists
    return undefined;
  }

  // Draws shortcut path between endpoints
  cityMapShortcutPathDraw(
    cityMapGenerated: CityMapGenerated,
    startPoint: CoordinateTilePoint,
    endPoint: CoordinateTilePoint,
    shortcutId: string
  ): void {
    // Stores current x coordinate
    let currentX = startPoint.x;

    // Stores current y coordinate
    let currentY = startPoint.y;

    // Draws path until end point
    while (currentX !== endPoint.x || currentY !== endPoint.y) {
      // Sets shortcut tile
      this.cityMapShortcutTileSet(cityMapGenerated, { x: currentX, y: currentY }, shortcutId);

      // Moves x toward endpoint
      if (currentX !== endPoint.x) {
        // Updates current x coordinate
        currentX += this.cityMapStepGet(currentX, endPoint.x);
      }

      // Moves y toward endpoint
      else if (currentY !== endPoint.y) {
        // Updates current y coordinate
        currentY += this.cityMapStepGet(currentY, endPoint.y);
      }
    }

    // Sets final shortcut tile
    this.cityMapShortcutTileSet(cityMapGenerated, endPoint, shortcutId);
  }

  // Marks shortcut entrance feature
  cityMapShortcutEntranceMark(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    shortcutId: string
  ): void {
    // Gets target tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends shortcut entrance mark
      return;
    }

    // Marks shortcut entrance
    cityTile.shortcutEntrance = true;

    // Stores shortcut id
    cityTile.shortcutId = shortcutId;

    // Adds shortcut entrance feature
    this.cityTileFeatureAdd(cityTile, CityTileFeatureKind.ShortcutEntrance);
  }

  // Checks whether shortcut path is valid
  cityMapShortcutValidCheck(
    cityMapGenerated: CityMapGenerated,
    startPoint: CoordinateTilePoint,
    endPoint: CoordinateTilePoint
  ): boolean {
    // Stores current x coordinate
    let currentX = startPoint.x;

    // Stores current y coordinate
    let currentY = startPoint.y;

    // Stores whether shortcut crosses at least one building tile
    let buildingTileCrossed = false;

    // Walks through proposed path
    while (currentX !== endPoint.x || currentY !== endPoint.y) {
      // Gets current tile
      const cityTile = this.cityMapTileGet(cityMapGenerated, { x: currentX, y: currentY });

      // Rejects missing tile
      if (!cityTile) {
        // Returns invalid shortcut
        return false;
      }

      // Rejects water
      if (cityTile.terrainType === CityTileTerrainType.Water) {
        // Returns invalid shortcut
        return false;
      }

      // Rejects park
      if (cityTile.terrainType === CityTileTerrainType.Park) {
        // Returns invalid shortcut
        return false;
      }

      // Tracks whether shortcut passes through building block
      if (cityTile.terrainType === CityTileTerrainType.Building) {
        // Marks building tile crossed
        buildingTileCrossed = true;
      }

      // Moves x toward endpoint
      if (currentX !== endPoint.x) {
        // Updates current x coordinate
        currentX += this.cityMapStepGet(currentX, endPoint.x);
      }

      // Moves y toward endpoint
      else if (currentY !== endPoint.y) {
        // Updates current y coordinate
        currentY += this.cityMapStepGet(currentY, endPoint.y);
      }
    }

    // Returns false when shortcut does not pass through any building block
    if (!buildingTileCrossed) {
      // Returns invalid shortcut because it would not feel hidden
      return false;
    }

    // Returns valid shortcut path
    return true;
  }

  // Sets one shortcut tile
  private cityMapShortcutTileSet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    shortcutId: string
  ): void {
    // Gets target tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends shortcut tile set
      return;
    }

    // Skips water or park
    if (cityTile.terrainType === CityTileTerrainType.Water || cityTile.terrainType === CityTileTerrainType.Park) {
      // Ends because shortcut cannot cross invalid terrain
      return;
    }

    // Converts building into subtle land shortcut path
    if (cityTile.terrainType === CityTileTerrainType.Building) {
      // Sets terrain to land
      cityTile.terrainType = CityTileTerrainType.Land;
    }

    // Sets path kind to shortcut
    cityTile.pathKind = CityTilePathKind.Shortcut;

    // Sets road class to local road
    cityTile.roadClass = CityTileRoadClass.LocalRoad;

    // Marks tile walkable
    cityTile.walkable = true;

    // Sets shortcut movement cost
    cityTile.baseMovementCost = courierMovementConfig.cost.shortcut;

    // Stores shortcut id
    cityTile.shortcutId = shortcutId;

    // Adds shortcut route id
    this.cityTileRouteIdAdd(cityTile, shortcutId);
  }

  // Gets candidate road points for shortcut endpoints
  private cityMapShortcutEndpointCandidateListGet(cityMapGenerated: CityMapGenerated): CoordinateTilePoint[] {
    // Creates candidate list
    const candidateList: CoordinateTilePoint[] = [];

    // Loops through tile rows
    for (const tileRow of cityMapGenerated.tileRows) {
      // Loops through tiles
      for (const cityTile of tileRow) {
        // Stores whether tile is normal road
        const normalRoad = cityTile.pathKind === CityTilePathKind.Road && cityTile.walkable;

        // Adds normal road point
        if (normalRoad) {
          // Pushes candidate point
          candidateList.push({ x: cityTile.x, y: cityTile.y });
        }
      }
    }

    // Returns candidate list
    return candidateList;
  }

  // Adds feature kind when missing
  private cityTileFeatureAdd(cityTile: CityTile, featureKind: CityTileFeatureKind): void {
    // Checks whether feature exists
    const featureExists = cityTile.featureKindList.includes(featureKind);

    // Adds missing feature
    if (!featureExists) {
      // Pushes feature kind
      cityTile.featureKindList.push(featureKind);
    }
  }

  // Adds route id when missing
  private cityTileRouteIdAdd(cityTile: CityTile, routeId: string): void {
    // Checks whether route exists
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

    // Returns tile from rows
    return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }

  // Gets step from current value toward target value
  private cityMapStepGet(currentValue: number, targetValue: number): number {
    // Returns positive step
    if (currentValue < targetValue) {
      // Returns one
      return 1;
    }

    // Returns negative step
    if (currentValue > targetValue) {
      // Returns negative one
      return -1;
    }

    // Returns zero
    return 0;
  }
}