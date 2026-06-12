// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports tile distance helper
import { cityTileDistanceManhattanGet } from "../../utility/CityTileDistanceCalculator";

// Imports tile key helper
import { cityTileKeyFromPointGet } from "../../utility/CityTileKeyConverter";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports validation types
import {
  CityMapValidationIssueCode,
  type CityMapGenerationStats,
  type CityMapValidationError,
  type CityMapValidationResult,
  type CityMapValidationWarning,
} from "../../types/CityMapValidationType";

// Imports tile layer values
import { CityTilePathKind, CityTileTerrainType } from "../../types/CityTileType";

// Validates generated city maps before gameplay starts
export class CityMapValidator {
  // Validates complete generated city map
  cityMapValidate(cityMapGenerated: CityMapGenerated): CityMapValidationResult {
    // Creates validation error list
    const errorList: CityMapValidationError[] = [];

    // Creates validation warning list
    const warningList: CityMapValidationWarning[] = [];

    // Validates start to delivery reachability
    this.cityMapStartDeliveryReachableValidate(cityMapGenerated, errorList);

    // Validates road coverage in each zone
    this.cityMapZoneRoadCoverageValidate(cityMapGenerated, errorList, warningList);

    // Validates traffic signal placement
    this.cityMapTrafficSignalValidate(cityMapGenerated, errorList);

    // Validates traffic signal spacing
    this.cityMapTrafficSignalSpacingValidate(cityMapGenerated, errorList);

    // Validates bridge placement
    this.cityMapBridgeValidate(cityMapGenerated, errorList);

    // Validates tunnel placement
    this.cityMapTunnelValidate(cityMapGenerated, errorList);

    // Validates shortcut placement
    this.cityMapShortcutValidate(cityMapGenerated, warningList);

    // Validates lake coverage
    this.cityMapLakeSizeValidate(cityMapGenerated, warningList);

    // Validates hurdle candidates
    this.cityMapHurdleCandidateValidate(cityMapGenerated, errorList);

    // Validates general road connectivity
    this.cityMapRoadConnectivityValidate(cityMapGenerated, warningList);

    // Stores generation stats
    const stats = this.cityMapGenerationStatsGet(cityMapGenerated);

    // Returns complete validation result
    return {
      // Stores whether map is valid
      valid: errorList.length === 0,

      // Stores validation errors
      errorList,

      // Stores validation warnings
      warningList,

      // Stores generation stats
      stats,
    };
  }

  // Validates that delivery is reachable from start
  cityMapStartDeliveryReachableValidate(
    cityMapGenerated: CityMapGenerated,
    errorList: CityMapValidationError[]
  ): void {
    // Stores reachable tile keys from start
    const reachableTileKeySet = this.cityMapReachableTileKeySetGet(cityMapGenerated, cityMapGenerated.startTilePoint);

    // Stores delivery tile key
    const deliveryTileKey = cityTileKeyFromPointGet(cityMapGenerated.deliveryTilePoint);

    // Adds error when delivery is unreachable
    if (!reachableTileKeySet.has(deliveryTileKey)) {
      // Adds unreachable delivery error
      errorList.push({
        // Stores issue code
        code: CityMapValidationIssueCode.DeliveryUnreachable,

        // Stores readable validation message
        message: "Delivery is not reachable from start",

        // Stores delivery tile point
        tilePoint: cityMapGenerated.deliveryTilePoint,
      });
    }
  }

  // Validates that every zone has enough walkable road coverage
  cityMapZoneRoadCoverageValidate(
    cityMapGenerated: CityMapGenerated,
    errorList: CityMapValidationError[],
    warningList: CityMapValidationWarning[]
  ): void {
    // Loops through every city zone
    for (const cityZone of cityMapGenerated.zoneList) {
      // Stores walkable tile count inside zone
      let walkableTileCount = 0;

      // Loops through zone y coordinates
      for (let tileY = cityZone.startY; tileY <= cityZone.endY; tileY++) {
        // Loops through zone x coordinates
        for (let tileX = cityZone.startX; tileX <= cityZone.endX; tileX++) {
          // Gets city tile
          const cityTile = this.cityMapTileGet(cityMapGenerated, { x: tileX, y: tileY });

          // Counts walkable tile
          if (cityTile?.walkable) {
            // Increments walkable tile count
            walkableTileCount++;
          }
        }
      }

      // Adds error when zone has almost no walkable roads
      if (walkableTileCount < 8) {
        // Adds zone coverage error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.ZoneRoadCoverageMissing,

          // Stores readable validation message
          message: `Zone ${cityZone.id} has too few walkable tiles`,

          // Stores zone center tile point
          tilePoint: {
            // Stores center x coordinate
            x: cityZone.centerX,

            // Stores center y coordinate
            y: cityZone.centerY,
          },
        });

        // Continues after hard error
        continue;
      }

      // Adds warning when zone coverage is low
      if (walkableTileCount < 24) {
        // Adds zone coverage warning
        warningList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.ZoneRoadCoverageMissing,

          // Stores readable validation message
          message: `Zone ${cityZone.id} has low walkable tile coverage`,

          // Stores zone center tile point
          tilePoint: {
            // Stores center x coordinate
            x: cityZone.centerX,

            // Stores center y coordinate
            y: cityZone.centerY,
          },
        });
      }
    }
  }

  // Validates generated traffic signals
  cityMapTrafficSignalValidate(
    cityMapGenerated: CityMapGenerated,
    errorList: CityMapValidationError[]
  ): void {
    // Loops through traffic signals
    for (const trafficSignal of cityMapGenerated.trafficSignalList) {
      // Gets signal tile
      const cityTile = this.cityMapTileGet(cityMapGenerated, trafficSignal.tilePoint);

      // Adds error when signal tile is missing
      if (!cityTile) {
        // Adds invalid signal error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.TrafficSignalInvalidTile,

          // Stores readable validation message
          message: `Traffic signal ${trafficSignal.id} is outside map`,

          // Stores related signal id
          relatedId: trafficSignal.id,
        });

        // Continues to next signal
        continue;
      }

      // Adds error when tile does not reference signal
      if (cityTile.trafficSignalId !== trafficSignal.id) {
        // Adds invalid signal attachment error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.TrafficSignalInvalidTile,

          // Stores readable validation message
          message: `Traffic signal ${trafficSignal.id} is not attached to its tile`,

          // Stores signal tile point
          tilePoint: trafficSignal.tilePoint,

          // Stores related signal id
          relatedId: trafficSignal.id,
        });
      }

      // Adds error when signal is not on normal road
      if (cityTile.pathKind !== CityTilePathKind.Road) {
        // Adds invalid signal tile error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.TrafficSignalInvalidTile,

          // Stores readable validation message
          message: `Traffic signal ${trafficSignal.id} is not on normal road`,

          // Stores signal tile point
          tilePoint: trafficSignal.tilePoint,

          // Stores related signal id
          relatedId: trafficSignal.id,
        });
      }

      // Adds error when signal is on start or delivery
      if (cityTile.start || cityTile.delivery) {
        // Adds invalid signal tile error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.TrafficSignalInvalidTile,

          // Stores readable validation message
          message: `Traffic signal ${trafficSignal.id} is on start or delivery tile`,

          // Stores signal tile point
          tilePoint: trafficSignal.tilePoint,

          // Stores related signal id
          relatedId: trafficSignal.id,
        });
      }
    }
  }

  // Validates traffic signal spacing
  cityMapTrafficSignalSpacingValidate(
    cityMapGenerated: CityMapGenerated,
    errorList: CityMapValidationError[]
  ): void {
    // Loops through first signal index
    for (let signalIndexA = 0; signalIndexA < cityMapGenerated.trafficSignalList.length; signalIndexA++) {
      // Loops through second signal index
      for (
        let signalIndexB = signalIndexA + 1;
        signalIndexB < cityMapGenerated.trafficSignalList.length;
        signalIndexB++
      ) {
        // Stores first signal
        const signalA = cityMapGenerated.trafficSignalList[signalIndexA];

        // Stores second signal
        const signalB = cityMapGenerated.trafficSignalList[signalIndexB];

        // Stores distance between signals
        const distanceTiles = cityTileDistanceManhattanGet(signalA.tilePoint, signalB.tilePoint);

        // Adds error when signals are too close
        if (distanceTiles < cityMapGenerationConfig.trafficSignal.distanceTilesMin) {
          // Adds signal spacing error
          errorList.push({
            // Stores issue code
            code: CityMapValidationIssueCode.TrafficSignalTooClose,

            // Stores readable validation message
            message: `Traffic signals ${signalA.id} and ${signalB.id} are too close`,

            // Stores first signal tile point
            tilePoint: signalA.tilePoint,

            // Stores related signal id
            relatedId: signalA.id,
          });
        }
      }
    }
  }

  // Validates bridge tiles
  cityMapBridgeValidate(
    cityMapGenerated: CityMapGenerated,
    errorList: CityMapValidationError[]
  ): void {
    // Loops through all tiles
    for (const cityTile of this.cityMapTileListGet(cityMapGenerated)) {
      // Skips non bridge tile
      if (cityTile.pathKind !== CityTilePathKind.Bridge) {
        // Continues to next tile
        continue;
      }

      // Adds error when bridge is not on water
      if (cityTile.terrainType !== CityTileTerrainType.Water) {
        // Adds bridge terrain error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.BridgeNotOnWater,

          // Stores readable validation message
          message: "Bridge tile is not placed over water",

          // Stores bridge tile point
          tilePoint: { x: cityTile.x, y: cityTile.y },

          // Stores related bridge id
          relatedId: cityTile.bridgeId,
        });
      }

      // Adds error when bridge is not walkable
      if (!cityTile.walkable) {
        // Adds bridge walkability error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.BridgeDisconnected,

          // Stores readable validation message
          message: "Bridge tile is not walkable",

          // Stores bridge tile point
          tilePoint: { x: cityTile.x, y: cityTile.y },

          // Stores related bridge id
          relatedId: cityTile.bridgeId,
        });
      }
    }
  }

  // Validates tunnel tiles
  cityMapTunnelValidate(
    cityMapGenerated: CityMapGenerated,
    errorList: CityMapValidationError[]
  ): void {
    // Stores tunnel tile count by id
    const tunnelTileCountById = new Map<string, number>();

    // Stores tunnel entrance count by id
    const tunnelEntranceCountById = new Map<string, number>();

    // Loops through all tiles
    for (const cityTile of this.cityMapTileListGet(cityMapGenerated)) {
      // Skips tile without tunnel id
      if (!cityTile.tunnelId) {
        // Continues to next tile
        continue;
      }

      // Stores previous tile count
      const tileCountPrevious = tunnelTileCountById.get(cityTile.tunnelId) ?? 0;

      // Updates tile count
      tunnelTileCountById.set(cityTile.tunnelId, tileCountPrevious + 1);

      // Adds error when tunnel tile is not walkable
      if (!cityTile.walkable) {
        // Adds tunnel walkability error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.TunnelDisconnected,

          // Stores readable validation message
          message: "Tunnel tile is not walkable",

          // Stores tunnel tile point
          tilePoint: { x: cityTile.x, y: cityTile.y },

          // Stores related tunnel id
          relatedId: cityTile.tunnelId,
        });
      }

      // Counts tunnel entrances
      if (cityTile.tunnelEntrance) {
        // Stores previous entrance count
        const entranceCountPrevious = tunnelEntranceCountById.get(cityTile.tunnelId) ?? 0;

        // Updates entrance count
        tunnelEntranceCountById.set(cityTile.tunnelId, entranceCountPrevious + 1);
      }
    }

    // Validates tunnel entrance counts
    for (const tunnelId of tunnelTileCountById.keys()) {
      // Stores entrance count
      const entranceCount = tunnelEntranceCountById.get(tunnelId) ?? 0;

      // Adds error when tunnel has fewer than two entrances
      if (entranceCount < 2) {
        // Adds tunnel disconnected error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.TunnelDisconnected,

          // Stores readable validation message
          message: `Tunnel ${tunnelId} has fewer than two entrances`,

          // Stores related tunnel id
          relatedId: tunnelId,
        });
      }
    }
  }

  // Validates shortcut tiles
  cityMapShortcutValidate(
    cityMapGenerated: CityMapGenerated,
    warningList: CityMapValidationWarning[]
  ): void {
    // Stores shortcut tile count by id
    const shortcutTileCountById = new Map<string, number>();

    // Stores shortcut entrance count by id
    const shortcutEntranceCountById = new Map<string, number>();

    // Loops through all tiles
    for (const cityTile of this.cityMapTileListGet(cityMapGenerated)) {
      // Skips tile without shortcut id
      if (!cityTile.shortcutId) {
        // Continues to next tile
        continue;
      }

      // Stores previous shortcut tile count
      const tileCountPrevious = shortcutTileCountById.get(cityTile.shortcutId) ?? 0;

      // Updates shortcut tile count
      shortcutTileCountById.set(cityTile.shortcutId, tileCountPrevious + 1);

      // Counts shortcut entrances
      if (cityTile.shortcutEntrance) {
        // Stores previous entrance count
        const entranceCountPrevious = shortcutEntranceCountById.get(cityTile.shortcutId) ?? 0;

        // Updates entrance count
        shortcutEntranceCountById.set(cityTile.shortcutId, entranceCountPrevious + 1);
      }
    }

    // Validates shortcut entrance counts
    for (const shortcutId of shortcutTileCountById.keys()) {
      // Stores entrance count
      const entranceCount = shortcutEntranceCountById.get(shortcutId) ?? 0;

      // Adds warning when shortcut has fewer than two entrances
      if (entranceCount < 2) {
        // Adds shortcut warning
        warningList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.ShortcutDisconnected,

          // Stores readable validation message
          message: `Shortcut ${shortcutId} has fewer than two entrances`,

          // Stores related shortcut id
          relatedId: shortcutId,
        });
      }
    }
  }

  // Validates lake coverage
  cityMapLakeSizeValidate(
    cityMapGenerated: CityMapGenerated,
    warningList: CityMapValidationWarning[]
  ): void {
    // Counts water tiles
    const waterTileCount = this.cityMapTileListGet(cityMapGenerated).filter(
      (cityTile) => cityTile.terrainType === CityTileTerrainType.Water
    ).length;

    // Adds warning when lake coverage is too low
    if (waterTileCount > 0 && waterTileCount < 24) {
      // Adds lake shape warning
      warningList.push({
        // Stores issue code
        code: CityMapValidationIssueCode.LakeShapeInvalid,

        // Stores readable validation message
        message: "Lake coverage is very low and may look unnatural",
      });
    }
  }

  // Validates hurdle candidates
  cityMapHurdleCandidateValidate(
    cityMapGenerated: CityMapGenerated,
    errorList: CityMapValidationError[]
  ): void {
    // Loops through all tiles
    for (const cityTile of this.cityMapTileListGet(cityMapGenerated)) {
      // Skips tiles without candidates
      if (cityTile.hurdleCandidateList.length === 0) {
        // Continues to next tile
        continue;
      }

      // Adds error when non walkable tile has candidates
      if (!cityTile.walkable) {
        // Adds invalid candidate error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.HurdleCandidateInvalid,

          // Stores readable validation message
          message: "Non walkable tile has hurdle candidates",

          // Stores tile point
          tilePoint: { x: cityTile.x, y: cityTile.y },
        });
      }

      // Adds error when start or delivery has candidates
      if (cityTile.start || cityTile.delivery) {
        // Adds invalid candidate error
        errorList.push({
          // Stores issue code
          code: CityMapValidationIssueCode.HurdleCandidateInvalid,

          // Stores readable validation message
          message: "Start or delivery tile has hurdle candidates",

          // Stores tile point
          tilePoint: { x: cityTile.x, y: cityTile.y },
        });
      }
    }
  }

  // Validates general road connectivity
  cityMapRoadConnectivityValidate(
    cityMapGenerated: CityMapGenerated,
    warningList: CityMapValidationWarning[]
  ): void {
    // Stores reachable tiles from start
    const reachableTileKeySet = this.cityMapReachableTileKeySetGet(cityMapGenerated, cityMapGenerated.startTilePoint);

    // Counts walkable tiles
    const walkableTileCount = this.cityMapTileListGet(cityMapGenerated).filter((cityTile) => cityTile.walkable).length;

    // Adds warning when many walkable tiles are disconnected
    if (walkableTileCount > 0 && reachableTileKeySet.size < walkableTileCount * 0.7) {
      // Adds road connectivity warning
      warningList.push({
        // Stores issue code
        code: CityMapValidationIssueCode.RoadConnectivityInvalid,

        // Stores readable validation message
        message: "Large portion of walkable map is disconnected from start",
      });
    }
  }

  // Gets generation statistics
  private cityMapGenerationStatsGet(cityMapGenerated: CityMapGenerated): CityMapGenerationStats {
    // Stores all generated tiles
    const cityTileList = this.cityMapTileListGet(cityMapGenerated);

    // Returns generation stats
    return {
      // Stores walkable tile count
      walkableTileCount: cityTileList.filter((cityTile) => cityTile.walkable).length,

      // Stores road tile count
      roadTileCount: cityTileList.filter((cityTile) => cityTile.pathKind === CityTilePathKind.Road).length,

      // Stores bridge tile count
      bridgeTileCount: cityTileList.filter((cityTile) => cityTile.pathKind === CityTilePathKind.Bridge).length,

      // Stores tunnel tile count
      tunnelTileCount: cityTileList.filter((cityTile) => cityTile.pathKind === CityTilePathKind.Tunnel).length,

      // Stores shortcut tile count
      shortcutTileCount: cityTileList.filter((cityTile) => cityTile.pathKind === CityTilePathKind.Shortcut).length,

      // Stores traffic signal count
      trafficSignalCount: cityMapGenerated.trafficSignalList.length,

      // Stores hurdle candidate tile count
      hurdleCandidateTileCount: cityTileList.filter((cityTile) => cityTile.hurdleCandidateList.length > 0).length,
    };
  }

  // Gets reachable tile keys from a start point
  private cityMapReachableTileKeySetGet(
    cityMapGenerated: CityMapGenerated,
    startTilePoint: CoordinateTilePoint
  ): Set<string> {
    // Creates visited tile key set
    const visitedTileKeySet = new Set<string>();

    // Creates tile point queue
    const tilePointQueue: CoordinateTilePoint[] = [startTilePoint];

    // Processes queue until empty
    while (tilePointQueue.length > 0) {
      // Gets next tile point
      const tilePoint = tilePointQueue.shift();

      // Skips missing queue item
      if (!tilePoint) {
        // Continues to next queue item
        continue;
      }

      // Stores tile key
      const tileKey = cityTileKeyFromPointGet(tilePoint);

      // Skips already visited tile
      if (visitedTileKeySet.has(tileKey)) {
        // Continues to next queue item
        continue;
      }

      // Gets city tile
      const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

      // Skips missing or blocked tile
      if (!cityTile || !cityTile.walkable) {
        // Continues to next queue item
        continue;
      }

      // Marks tile as visited
      visitedTileKeySet.add(tileKey);

      // Adds walkable neighbors
      for (const neighborPoint of this.cityMapNeighborPointListGet(tilePoint)) {
        // Stores neighbor tile key
        const neighborKey = cityTileKeyFromPointGet(neighborPoint);

        // Skips already visited neighbor
        if (visitedTileKeySet.has(neighborKey)) {
          // Continues to next neighbor
          continue;
        }

        // Gets neighbor tile
        const neighborTile = this.cityMapTileGet(cityMapGenerated, neighborPoint);

        // Adds walkable neighbor to queue
        if (neighborTile?.walkable) {
          // Pushes neighbor point into queue
          tilePointQueue.push(neighborPoint);
        }
      }
    }

    // Returns reachable tile key set
    return visitedTileKeySet;
  }

  // Gets four directional neighbor points
  private cityMapNeighborPointListGet(tilePoint: CoordinateTilePoint): CoordinateTilePoint[] {
    // Returns neighbor point list
    return [
      // Stores left neighbor
      { x: tilePoint.x - 1, y: tilePoint.y },

      // Stores right neighbor
      { x: tilePoint.x + 1, y: tilePoint.y },

      // Stores upper neighbor
      { x: tilePoint.x, y: tilePoint.y - 1 },

      // Stores lower neighbor
      { x: tilePoint.x, y: tilePoint.y + 1 },
    ];
  }

  // Gets flat tile list
  private cityMapTileListGet(cityMapGenerated: CityMapGenerated): CityTile[] {
    // Returns flattened tile rows
    return cityMapGenerated.tileRows.flat();
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

    // Returns tile from generated rows
    return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }
}