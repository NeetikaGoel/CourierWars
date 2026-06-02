// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports generated city map type
import type { CityMapGenerated } from "../../types/CityMapType";

// Imports seeded random generator
import { RandomSeededGenerator } from "./RandomSeededGenerator";

// Imports empty map factory
import { CityMapEmptyFactory } from "./CityMapEmptyFactory";

// Imports zone builder
import { CityMapZoneBuilder } from "./CityMapZoneBuilder";

// Imports road network generator
import { CityMapRoadNetworkGenerator } from "./CityMapRoadNetworkGenerator";

// Imports area generator
import { CityMapAreaGenerator } from "./CityMapAreaGenerator";

// Imports bridge generator
import { CityMapBridgeGenerator } from "./CityMapBridgeGenerator";

// Imports tunnel generator
import { CityMapTunnelGenerator } from "./CityMapTunnelGenerator";

// Imports shortcut generator
import { CityMapShortcutGenerator } from "./CityMapShortcutGenerator";

// Imports start delivery planner
import { CityMapStartDeliveryPlanner } from "./CityMapStartDeliveryPlanner";

// Imports road intersection detector
import { CityMapRoadIntersectionDetector } from "./CityMapRoadIntersectionDetector";

// Imports traffic signal planner
import { CityMapTrafficSignalPlanner } from "./CityMapTrafficSignalPlanner";

// Imports hurdle candidate planner
import { CityMapHurdleCandidatePlanner } from "./CityMapHurdleCandidatePlanner";

// Imports city map validator
import { CityMapValidator } from "./CityMapValidator";

// Orchestrates complete city map generation
export class CityMapGenerationBuilder {
  // Stores empty map factory
  private readonly cityMapEmptyFactory = new CityMapEmptyFactory();

  // Stores zone builder
  private readonly cityMapZoneBuilder = new CityMapZoneBuilder();

  // Stores road network generator
  private readonly cityMapRoadNetworkGenerator = new CityMapRoadNetworkGenerator();

  // Stores area generator
  private readonly cityMapAreaGenerator = new CityMapAreaGenerator();

  // Stores bridge generator
  private readonly cityMapBridgeGenerator = new CityMapBridgeGenerator();

  // Stores tunnel generator
  private readonly cityMapTunnelGenerator = new CityMapTunnelGenerator();

  // Stores shortcut generator
  private readonly cityMapShortcutGenerator = new CityMapShortcutGenerator();

  // Stores start delivery planner
  private readonly cityMapStartDeliveryPlanner = new CityMapStartDeliveryPlanner();

  // Stores road intersection detector
  private readonly cityMapRoadIntersectionDetector = new CityMapRoadIntersectionDetector();

  // Stores traffic signal planner
  private readonly cityMapTrafficSignalPlanner = new CityMapTrafficSignalPlanner();

  // Stores hurdle candidate planner
  private readonly cityMapHurdleCandidatePlanner = new CityMapHurdleCandidatePlanner();

  // Stores city map validator
  private readonly cityMapValidator = new CityMapValidator();

  // Generates a valid city map from a seed
  cityMapGenerate(seed: number = cityMapGenerationConfig.seed.valueDefault): CityMapGenerated {
    // Stores latest generated map for failure reporting
    let cityMapGeneratedLatest: CityMapGenerated | null = null;

    // Attempts map generation until retry limit
    for (let attemptIndex = 0; attemptIndex < cityMapGenerationConfig.seed.retryCountMax; attemptIndex++) {
      // Stores deterministic seed for this attempt
      const seedAttempt = this.cityMapGenerationRetrySeedCreate(seed, attemptIndex);

      // Creates one map generation attempt
      const cityMapGenerated = this.cityMapGenerationAttemptCreate(seedAttempt, attemptIndex + 1);

      // Stores latest generated map
      cityMapGeneratedLatest = cityMapGenerated;

      // Validates generated map
      const validationResult = this.cityMapValidator.cityMapValidate(cityMapGenerated);

      // Stores validation warning count
      cityMapGenerated.metadata.validationWarningCount = validationResult.warningList.length;

      // Returns map when validation passes
      if (validationResult.valid) {
        // Returns valid generated city map
        return cityMapGenerated;
      }
    }

    // Throws when all attempts fail
    throw new Error(
      `City map generation failed after ${cityMapGenerationConfig.seed.retryCountMax} attempts with seed ${
        cityMapGeneratedLatest?.metadata.seed ?? seed
      }`
    );
  }

  // Creates one generation attempt
  cityMapGenerationAttemptCreate(seed: number, attemptCount: number): CityMapGenerated {
    // Creates seeded random generator
    const randomSeededGenerator = new RandomSeededGenerator(seed);

    // Creates empty city map
    const cityMapGenerated = this.cityMapEmptyFactory.cityMapEmptyCreate(seed);

    // Stores attempt count
    cityMapGenerated.metadata.attemptCount = attemptCount;

    // Builds zones
    const cityZoneList = this.cityMapZoneBuilder.cityZoneListBuild();

    // Assigns zone ids to tiles
    this.cityMapZoneBuilder.cityTileZoneIdAssign(cityMapGenerated, cityZoneList);

    // Generates road network
    this.cityMapRoadNetworkGenerator.cityMapRoadNetworkGenerate(cityMapGenerated, randomSeededGenerator);

    // Generates parks
    this.cityMapAreaGenerator.cityMapParkAreaListGenerate(cityMapGenerated, randomSeededGenerator);

    // Generates lakes
    const lakeAreaList = this.cityMapAreaGenerator.cityMapLakeAreaListGenerate(
      cityMapGenerated,
      randomSeededGenerator
    );

    // Generates bridges on lakes
    this.cityMapBridgeGenerator.cityMapBridgeListGenerate(cityMapGenerated, lakeAreaList, randomSeededGenerator);

    // Generates tunnels
    this.cityMapTunnelGenerator.cityMapTunnelListGenerate(cityMapGenerated, randomSeededGenerator);

    // Generates shortcuts
    this.cityMapShortcutGenerator.cityMapShortcutListGenerate(cityMapGenerated, randomSeededGenerator);

    // Places start and delivery
    this.cityMapStartDeliveryPlanner.cityMapStartDeliveryPlace(cityMapGenerated);

    // Detects intersections
    const intersectionList = this.cityMapRoadIntersectionDetector.cityMapRoadIntersectionListDetect(cityMapGenerated);

    // Places green traffic signals
    this.cityMapTrafficSignalPlanner.cityMapTrafficSignalListPlace(
      cityMapGenerated,
      intersectionList,
      randomSeededGenerator
    );

    // Generates hurdle candidate tiles
    this.cityMapHurdleCandidatePlanner.cityMapHurdleCandidateListGenerate(cityMapGenerated);

    // Returns generated map attempt
    return cityMapGenerated;
  }

  // Creates deterministic retry seed from base seed and attempt index
  cityMapGenerationRetrySeedCreate(seedBase: number, attemptIndex: number): number {
    // Stores retry seed offset
    const retryOffset = 9973;

    // Returns deterministic attempt seed
    return seedBase + attemptIndex * retryOffset;
  }
}