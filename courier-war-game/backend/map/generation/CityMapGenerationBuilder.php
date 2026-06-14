<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/RandomSeededGenerator.php';
require_once __DIR__ . '/CityMapEmptyFactory.php';
require_once __DIR__ . '/CityMapZoneBuilder.php';
require_once __DIR__ . '/CityMapRoadNetworkGenerator.php';
require_once __DIR__ . '/CityMapAreaGenerator.php';
require_once __DIR__ . '/CityMapBridgeGenerator.php';
require_once __DIR__ . '/CityMapTunnelGenerator.php';
require_once __DIR__ . '/CityMapShortcutGenerator.php';
require_once __DIR__ . '/CityMapStartDeliveryPlanner.php';
require_once __DIR__ . '/CityMapRoadIntersectionDetector.php';
require_once __DIR__ . '/CityMapTrafficSignalPlanner.php';
require_once __DIR__ . '/CityMapHurdleCandidatePlanner.php';
require_once __DIR__ . '/CityMapValidator.php';

//this class runs the whole backend map generation pipeline
class CityMapGenerationBuilder
{
  private CityMapEmptyFactory $_cityMapEmptyFactory;
  private CityMapZoneBuilder $_cityMapZoneBuilder;
  private CityMapRoadNetworkGenerator $_cityMapRoadNetworkGenerator;
  private CityMapAreaGenerator $_cityMapAreaGenerator;
  private CityMapBridgeGenerator $_cityMapBridgeGenerator;
  private CityMapTunnelGenerator $_cityMapTunnelGenerator;
  private CityMapShortcutGenerator $_cityMapShortcutGenerator;
  private CityMapStartDeliveryPlanner $_cityMapStartDeliveryPlanner;
  private CityMapRoadIntersectionDetector $_cityMapRoadIntersectionDetector;
  private CityMapTrafficSignalPlanner $_cityMapTrafficSignalPlanner;
  private CityMapHurdleCandidatePlanner $_cityMapHurdleCandidatePlanner;
  private CityMapValidator $_cityMapValidator;

  public function __construct()
  {
    $this->_cityMapEmptyFactory = new CityMapEmptyFactory();
    $this->_cityMapZoneBuilder = new CityMapZoneBuilder();
    $this->_cityMapRoadNetworkGenerator = new CityMapRoadNetworkGenerator();
    $this->_cityMapAreaGenerator = new CityMapAreaGenerator();
    $this->_cityMapBridgeGenerator = new CityMapBridgeGenerator();
    $this->_cityMapTunnelGenerator = new CityMapTunnelGenerator();
    $this->_cityMapShortcutGenerator = new CityMapShortcutGenerator();
    $this->_cityMapStartDeliveryPlanner = new CityMapStartDeliveryPlanner();
    $this->_cityMapRoadIntersectionDetector = new CityMapRoadIntersectionDetector();
    $this->_cityMapTrafficSignalPlanner = new CityMapTrafficSignalPlanner();
    $this->_cityMapHurdleCandidatePlanner = new CityMapHurdleCandidatePlanner();
    $this->_cityMapValidator = new CityMapValidator();
  }

  //this generates one valid city map from seed
  public function cityMapGenerate(int $seed = MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT): array
  {
    $cityMapGeneratedLatest = null;

    for ($attemptIndex = 0; $attemptIndex < MapGenerationConfig::GENERATION_RETRY_COUNT_MAX; $attemptIndex++) {
      $seedAttempt = $this->cityMapGenerationRetrySeedCreate($seed, $attemptIndex);

      $cityMapGenerated = $this->cityMapGenerationAttemptCreate($seedAttempt, $attemptIndex + 1);

      $cityMapGeneratedLatest = $cityMapGenerated;

      $validationResult = $this->_cityMapValidator->cityMapValidate($cityMapGenerated);

      $cityMapGenerated['validation'] = $validationResult;
      $cityMapGenerated['metadata']['validationWarningCount'] = count($validationResult['warningList'] ?? []);

      if (($validationResult['valid'] ?? false) === true) {
        return $cityMapGenerated;
      }
    }

    $failedSeed = is_array($cityMapGeneratedLatest)
      ? (int)($cityMapGeneratedLatest['metadata']['seed'] ?? $seed)
      : $seed;

    throw new RuntimeException('city map generation failed after ' . MapGenerationConfig::GENERATION_RETRY_COUNT_MAX . ' attempts with seed ' . $failedSeed);
  }

  //this creates one map generation attempt
  public function cityMapGenerationAttemptCreate(int $seed, int $attemptCount): array
  {
    $randomSeededGenerator = new RandomSeededGenerator($seed);

    $cityMapGenerated = $this->_cityMapEmptyFactory->cityMapEmptyCreate($seed);

    $cityMapGenerated['metadata']['attemptCount'] = $attemptCount;

    $cityZoneList = $this->_cityMapZoneBuilder->cityZoneListBuild();

    $this->_cityMapZoneBuilder->cityTileZoneIdAssign($cityMapGenerated, $cityZoneList);

    $this->_cityMapRoadNetworkGenerator->cityMapRoadNetworkGenerate($cityMapGenerated, $randomSeededGenerator);

    $this->_cityMapAreaGenerator->cityMapParkAreaListGenerate($cityMapGenerated, $randomSeededGenerator);

    $lakeAreaList = $this->_cityMapAreaGenerator->cityMapLakeAreaListGenerate($cityMapGenerated, $randomSeededGenerator);

    $this->_cityMapBridgeGenerator->cityMapBridgeListGenerate($cityMapGenerated, $lakeAreaList, $randomSeededGenerator);

    $this->_cityMapTunnelGenerator->cityMapTunnelListGenerate($cityMapGenerated, $randomSeededGenerator);

    $this->_cityMapShortcutGenerator->cityMapShortcutListGenerate($cityMapGenerated, $randomSeededGenerator);

    $this->_cityMapStartDeliveryPlanner->cityMapStartDeliveryPlace($cityMapGenerated);

    $intersectionList = $this->_cityMapRoadIntersectionDetector->cityMapRoadIntersectionListDetect($cityMapGenerated);

    $this->_cityMapTrafficSignalPlanner->cityMapTrafficSignalListPlace($cityMapGenerated, $intersectionList, $randomSeededGenerator);

    $this->_cityMapHurdleCandidatePlanner->cityMapHurdleCandidateListGenerate($cityMapGenerated);

    return $cityMapGenerated;
  }

  //this creates deterministic retry seed from base seed and attempt index
  public function cityMapGenerationRetrySeedCreate(int $seedBase, int $attemptIndex): int
  {
    return $seedBase + $attemptIndex * MapGenerationConfig::GENERATION_RETRY_SEED_OFFSET;
  }
}
