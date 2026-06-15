// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports Courier movement configuration for tunnel movement cost
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

// Defines tunnel endpoint pair
interface CityMapTunnelEndpointPair {
  // Stores tunnel start point
  startPoint: CoordinateTilePoint;

  // Stores tunnel end point
  endPoint: CoordinateTilePoint;
}

// Generates walkable tunnels through buildings
export class CityMapTunnelGenerator {
  // Generates tunnel list on map
  cityMapTunnelListGenerate(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): void {
    // Stores tunnel count
    const tunnelCount = randomSeededGenerator.numberIntegerGet(
      cityMapGenerationConfig.tunnel.countMin,
      cityMapGenerationConfig.tunnel.countMax
    );

    // Generates each tunnel
    for (let tunnelIndex = 0; tunnelIndex < tunnelCount; tunnelIndex++) {
      // Finds tunnel endpoints
      const endpointPair = this.cityMapTunnelEndpointPairFind(cityMapGenerated, randomSeededGenerator);

      // Skips tunnel when endpoints are missing
      if (!endpointPair) {
        // Continues to next tunnel
        continue;
      }

      // Stores tunnel id
      const tunnelId = `tunnel-${tunnelIndex}`;

      // Draws tunnel path
      this.cityMapTunnelPathDraw(cityMapGenerated, endpointPair.startPoint, endpointPair.endPoint, tunnelId);

      // Marks first tunnel entrance
      this.cityMapTunnelEntranceMark(cityMapGenerated, endpointPair.startPoint, tunnelId);

      // Marks second tunnel entrance
      this.cityMapTunnelEntranceMark(cityMapGenerated, endpointPair.endPoint, tunnelId);
    }
  }

  // Finds aligned road endpoints for a tunnel
  cityMapTunnelEndpointPairFind(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): CityMapTunnelEndpointPair | undefined {
    // Stores normal road point candidates
    const roadTilePointList = this.cityMapNormalRoadTilePointListGet(cityMapGenerated);

    // Stores shuffled candidate list
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

        // Stores whether points share row or column
        const aligned = startPoint.x === endPoint.x || startPoint.y === endPoint.y;

        // Skips non aligned tunnel candidates
        if (!aligned) {
          // Continues to next endpoint
          continue;
        }

        // Stores endpoint distance
        const distanceTiles = Math.abs(startPoint.x - endPoint.x) + Math.abs(startPoint.y - endPoint.y);

        // Skips short tunnel
        if (distanceTiles < cityMapGenerationConfig.tunnel.endpointDistanceTilesMin) {
          // Continues to next endpoint
          continue;
        }

        // Skips overly long tunnel
        if (distanceTiles > cityMapGenerationConfig.tunnel.lengthTilesMax) {
          // Continues to next endpoint
          continue;
        }

        // Checks tunnel path validity
        const tunnelValid = this.cityMapTunnelValidCheck(cityMapGenerated, startPoint, endPoint);

        // Returns valid endpoint pair
        if (tunnelValid) {
          // Returns tunnel endpoint pair
          return {
            // Stores start point
            startPoint,

            // Stores end point
            endPoint,
          };
        }
      }
    }

    // Returns undefined when no tunnel endpoints were found
    return undefined;
  }

  // Draws tunnel path between endpoints
  cityMapTunnelPathDraw(
    cityMapGenerated: CityMapGenerated,
    startPoint: CoordinateTilePoint,
    endPoint: CoordinateTilePoint,
    tunnelId: string
  ): void {
    // Stores current x coordinate
    let currentX = startPoint.x;

    // Stores current y coordinate
    let currentY = startPoint.y;

    // Draws tunnel until end point is reached
    while (currentX !== endPoint.x || currentY !== endPoint.y) {
      // Sets tunnel tile
      this.cityMapTunnelTileSet(cityMapGenerated, { x: currentX, y: currentY }, tunnelId);

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

    // Sets final tunnel tile
    this.cityMapTunnelTileSet(cityMapGenerated, endPoint, tunnelId);
  }

  // Marks tunnel entrance feature
  cityMapTunnelEntranceMark(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    tunnelId: string
  ): void {
    // Gets target tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends entrance mark
      return;
    }

    // Marks tunnel entrance
    cityTile.tunnelEntrance = true;

    // Stores tunnel id
    cityTile.tunnelId = tunnelId;

    // Adds tunnel entrance feature
    this.cityTileFeatureAdd(cityTile, CityTileFeatureKind.TunnelEntrance);
  }

  // Checks whether tunnel path is valid
  cityMapTunnelValidCheck(
    cityMapGenerated: CityMapGenerated,
    startPoint: CoordinateTilePoint,
    endPoint: CoordinateTilePoint
  ): boolean {
    // Stores current x coordinate
    let currentX = startPoint.x;

    // Stores current y coordinate
    let currentY = startPoint.y;

    // Stores whether tunnel crosses at least one building tile
    let buildingTileCrossed = false;

    // Walks through proposed tunnel path
    while (currentX !== endPoint.x || currentY !== endPoint.y) {
      // Gets current tile
      const cityTile = this.cityMapTileGet(cityMapGenerated, { x: currentX, y: currentY });

      // Rejects missing tile
      if (!cityTile) {
        // Returns invalid tunnel
        return false;
      }

      // Rejects water or park
      if (cityTile.terrainType === CityTileTerrainType.Water || cityTile.terrainType === CityTileTerrainType.Park) {
        // Returns invalid tunnel
        return false;
      }

      // Tracks whether tunnel crosses building terrain
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

    // Returns false when tunnel does not pass through any building tile
    if (!buildingTileCrossed) {
      // Returns invalid tunnel because it would not feel like a tunnel
      return false;
    }

    // Returns valid tunnel path
    return true;
  }

  // Sets one tunnel tile
  private cityMapTunnelTileSet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    tunnelId: string
  ): void {
    // Gets target tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Skips missing tile
    if (!cityTile) {
      // Ends tunnel tile set
      return;
    }

    // Skips water or park
    if (cityTile.terrainType === CityTileTerrainType.Water || cityTile.terrainType === CityTileTerrainType.Park) {
      // Ends because tunnel cannot pass through this terrain
      return;
    }

    // Sets tunnel path kind
    cityTile.pathKind = CityTilePathKind.Tunnel;

    // Sets local road class
    cityTile.roadClass = CityTileRoadClass.LocalRoad;

    // Marks tunnel walkable
    cityTile.walkable = true;

    // Sets tunnel movement cost
    cityTile.baseMovementCost = courierMovementConfig.cost.tunnel;

    // Stores tunnel id
    cityTile.tunnelId = tunnelId;

    // Adds tunnel route id
    this.cityTileRouteIdAdd(cityTile, tunnelId);
  }

  // Gets road points usable as tunnel endpoints
  private cityMapNormalRoadTilePointListGet(cityMapGenerated: CityMapGenerated): CoordinateTilePoint[] {
    // Creates road tile point list
    const roadTilePointList: CoordinateTilePoint[] = [];

    // Loops through map rows
    for (const tileRow of cityMapGenerated.tileRows) {
      // Loops through row tiles
      for (const cityTile of tileRow) {
        // Stores whether tile is normal road
        const normalRoad = cityTile.pathKind === CityTilePathKind.Road && cityTile.walkable;

        // Adds normal road point
        if (normalRoad) {
          // Pushes tile point
          roadTilePointList.push({ x: cityTile.x, y: cityTile.y });
        }
      }
    }

    // Returns road tile points
    return roadTilePointList;
  }

  // Adds feature kind when missing
  private cityTileFeatureAdd(cityTile: CityTile, featureKind: CityTileFeatureKind): void {
    // Checks whether feature exists
    const featureExists = cityTile.featureKindList.includes(featureKind);

    // Adds feature when missing
    if (!featureExists) {
      // Pushes feature kind
      cityTile.featureKindList.push(featureKind);
    }
  }

  // Adds route id when missing
  private cityTileRouteIdAdd(cityTile: CityTile, routeId: string): void {
    // Checks whether route exists
    const routeExists = cityTile.routeIdList.includes(routeId);

    // Adds route when missing
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