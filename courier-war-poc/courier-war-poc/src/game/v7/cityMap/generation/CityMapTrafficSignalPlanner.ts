// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports tile distance helper
import { cityTileDistanceManhattanGet } from "../../utility/CityTileDistanceCalculator";

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

// Imports generated traffic signal type
import type { TrafficSignalGenerated } from "../../types/TrafficSignalType";

// Imports seeded random generator type
import type { RandomSeededGenerator } from "./RandomSeededGenerator";

// Imports road intersection type
import type { CityMapRoadIntersection } from "./CityMapRoadIntersectionDetector";

// Places green traffic signal features at sensible intersections
export class CityMapTrafficSignalPlanner {
  // Places traffic signals from detected intersections
  cityMapTrafficSignalListPlace(
    cityMapGenerated: CityMapGenerated,
    intersectionList: CityMapRoadIntersection[],
    randomSeededGenerator: RandomSeededGenerator
  ): TrafficSignalGenerated[] {
    // Creates generated traffic signal list
    const trafficSignalList: TrafficSignalGenerated[] = [];

    // Sorts intersections by importance before random variation
    const intersectionListSorted = this.cityMapTrafficSignalIntersectionListSort(
      intersectionList,
      randomSeededGenerator
    );

    // Loops through sorted intersections
    for (const intersection of intersectionListSorted) {
      // Stops when target signal count is reached
      if (trafficSignalList.length >= cityMapGenerationConfig.trafficSignal.countTarget) {
        // Stops signal placement
        break;
      }

      // Gets intersection tile
      const cityTile = this.cityMapTileGet(cityMapGenerated, intersection.tilePoint);

      // Skips missing tile
      if (!cityTile) {
        // Continues to next intersection
        continue;
      }

      // Skips invalid traffic signal tile
      if (!this.cityMapTrafficSignalTileValidCheck(cityTile)) {
        // Continues to next intersection
        continue;
      }

      // Skips signal when too close to another signal
      if (!this.cityMapTrafficSignalDistanceValidCheck(intersection.tilePoint, trafficSignalList)) {
        // Continues to next intersection
        continue;
      }

      // Stores whether signal is required
      const signalRequired = this.cityMapTrafficSignalRequiredCheck(intersection);

      // Stores whether optional signal is accepted
      const signalOptionalAccepted = this.cityMapTrafficSignalOptionalCheck(intersection, randomSeededGenerator);

      // Skips when signal is not required or accepted
      if (!signalRequired && !signalOptionalAccepted) {
        // Continues to next intersection
        continue;
      }

      // Stores signal id
      const trafficSignalId = `signal-${trafficSignalList.length}`;

      // Creates generated traffic signal
      const trafficSignalGenerated: TrafficSignalGenerated = {
        // Stores signal id
        id: trafficSignalId,

        // Stores signal tile point
        tilePoint: intersection.tilePoint,

        // Stores owning intersection id
        intersectionId: intersection.id,
      };

      // Attaches signal to tile
      this.cityMapTrafficSignalAttachToTile(cityTile, trafficSignalGenerated);

      // Adds signal to list
      trafficSignalList.push(trafficSignalGenerated);
    }

    // Stores traffic signal list on generated map
    cityMapGenerated.trafficSignalList = trafficSignalList;

    // Returns traffic signal list
    return trafficSignalList;
  }

  // Sorts intersections by road importance while preserving seeded variation
  private cityMapTrafficSignalIntersectionListSort(
    intersectionList: CityMapRoadIntersection[],
    randomSeededGenerator: RandomSeededGenerator
  ): CityMapRoadIntersection[] {
    // Creates shuffled list first for deterministic tie breaking
    const intersectionListShuffled = randomSeededGenerator.arrayShuffle(intersectionList);

    // Returns sorted intersections by importance score
    return intersectionListShuffled.sort((intersectionA, intersectionB) => {
      // Stores score for first intersection
      const scoreA = this.cityMapTrafficSignalIntersectionScoreGet(intersectionA);

      // Stores score for second intersection
      const scoreB = this.cityMapTrafficSignalIntersectionScoreGet(intersectionB);

      // Sorts higher score first
      return scoreB - scoreA;
    });
  }

  // Gets importance score for intersection
  private cityMapTrafficSignalIntersectionScoreGet(intersection: CityMapRoadIntersection): number {
    // Starts with road connection degree
    let score = intersection.roadConnectionDegree;

    // Adds score when avenue is connected
    if (intersection.roadClassList.includes(CityTileRoadClass.AvenueRoad)) {
      // Adds avenue score
      score += 10;
    }

    // Adds score when district road is connected
    if (intersection.roadClassList.includes(CityTileRoadClass.DistrictRoad)) {
      // Adds district score
      score += 4;
    }

    // Adds score when local road is connected
    if (intersection.roadClassList.includes(CityTileRoadClass.LocalRoad)) {
      // Adds local score
      score += 1;
    }

    // Returns final score
    return score;
  }

  // Checks whether intersection requires signal
  cityMapTrafficSignalRequiredCheck(intersection: CityMapRoadIntersection): boolean {
    // Returns false when required avenue signal setting is disabled
    if (!cityMapGenerationConfig.trafficSignal.avenueAvenueSignalRequired) {
      // Returns false for no required signal
      return false;
    }

    // Stores whether avenue road is connected
    const avenueConnected = intersection.roadClassList.includes(CityTileRoadClass.AvenueRoad);

    // Stores whether this is a major intersection
    const majorIntersection = avenueConnected && intersection.roadConnectionDegree >= 3;

    // Returns whether signal is required
    return majorIntersection;
  }

  // Checks whether optional signal should be placed
  cityMapTrafficSignalOptionalCheck(
    intersection: CityMapRoadIntersection,
    randomSeededGenerator: RandomSeededGenerator
  ): boolean {
    // Stores whether avenue road is connected
    const avenueConnected = intersection.roadClassList.includes(CityTileRoadClass.AvenueRoad);

    // Stores whether district road is connected
    const districtConnected = intersection.roadClassList.includes(CityTileRoadClass.DistrictRoad);

    // Stores whether only local road is connected
    const localOnly =
      intersection.roadClassList.length === 1 &&
      intersection.roadClassList[0] === CityTileRoadClass.LocalRoad;

    // Uses avenue district chance
    if (avenueConnected && districtConnected) {
      // Returns seeded chance result
      return randomSeededGenerator.booleanChanceCheck(
        cityMapGenerationConfig.trafficSignal.avenueDistrictSignalChance
      );
    }

    // Uses district district chance
    if (districtConnected && !avenueConnected) {
      // Returns seeded chance result
      return randomSeededGenerator.booleanChanceCheck(
        cityMapGenerationConfig.trafficSignal.districtDistrictSignalChance
      );
    }

    // Uses local only chance
    if (localOnly) {
      // Returns seeded chance result
      return randomSeededGenerator.booleanChanceCheck(
        cityMapGenerationConfig.trafficSignal.localOnlySignalChance
      );
    }

    // Returns false by default
    return false;
  }

  // Checks whether signal is far enough from existing signals
  cityMapTrafficSignalDistanceValidCheck(
    tilePoint: CoordinateTilePoint,
    trafficSignalList: TrafficSignalGenerated[]
  ): boolean {
    // Loops through existing traffic signals
    for (const trafficSignal of trafficSignalList) {
      // Stores distance to existing signal
      const distanceTiles = cityTileDistanceManhattanGet(tilePoint, trafficSignal.tilePoint);

      // Rejects signal when too close
      if (distanceTiles < cityMapGenerationConfig.trafficSignal.distanceTilesMin) {
        // Returns false for clustered signal
        return false;
      }
    }

    // Returns true when no nearby signal exists
    return true;
  }

  // Attaches generated traffic signal to tile
  cityMapTrafficSignalAttachToTile(
    cityTile: CityTile,
    trafficSignalGenerated: TrafficSignalGenerated
  ): void {
    // Stores traffic signal id on tile
    cityTile.trafficSignalId = trafficSignalGenerated.id;

    // Adds traffic signal feature
    this.cityTileFeatureAdd(cityTile, CityTileFeatureKind.TrafficSignal);
  }

  // Checks whether tile can contain a traffic signal
  private cityMapTrafficSignalTileValidCheck(cityTile: CityTile): boolean {
    // Rejects start or delivery
    if (cityTile.start || cityTile.delivery) {
      // Returns false for important gameplay tile
      return false;
    }

    // Rejects duplicate signal
    if (cityTile.trafficSignalId) {
      // Returns false for existing signal
      return false;
    }

    // Rejects non road path
    if (cityTile.pathKind !== CityTilePathKind.Road) {
      // Returns false for bridge tunnel shortcut or empty tile
      return false;
    }

    // Rejects no road class
    if (cityTile.roadClass === CityTileRoadClass.None) {
      // Returns false for no road class
      return false;
    }

    // Rejects water terrain
    if (cityTile.terrainType === CityTileTerrainType.Water) {
      // Returns false for water tile
      return false;
    }

    // Rejects park terrain
    if (cityTile.terrainType === CityTileTerrainType.Park) {
      // Returns false for park tile
      return false;
    }

    // Rejects building terrain
    if (cityTile.terrainType === CityTileTerrainType.Building) {
      // Returns false for building tile
      return false;
    }

    // Returns true for valid traffic signal tile
    return true;
  }

  // Adds feature kind when missing
  private cityTileFeatureAdd(cityTile: CityTile, featureKind: CityTileFeatureKind): void {
    // Checks whether feature already exists
    const featureExists = cityTile.featureKindList.includes(featureKind);

    // Adds feature when missing
    if (!featureExists) {
      // Pushes feature into tile feature list
      cityTile.featureKindList.push(featureKind);
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

    // Returns tile from generated rows
    return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }
}