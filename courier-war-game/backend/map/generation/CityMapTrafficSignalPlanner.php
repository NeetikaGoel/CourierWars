<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/RandomSeededGenerator.php';

//this class places green traffic signal features at sensible intersections
class CityMapTrafficSignalPlanner
{
  //this places traffic signals from detected intersections
  public function cityMapTrafficSignalListPlace(array &$cityMapGenerated, array $intersectionList, RandomSeededGenerator $randomSeededGenerator): array
  {
    $trafficSignalList = [];

    $intersectionListSorted = $this->cityMapTrafficSignalIntersectionListSort($intersectionList, $randomSeededGenerator);

    foreach ($intersectionListSorted as $intersection) {
      if (count($trafficSignalList) >= MapGenerationConfig::TRAFFIC_SIGNAL_COUNT_TARGET) {
        break;
      }

      $tilePoint = $intersection['tilePoint'];

      if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
        continue;
      }

      $tileX = (int)$tilePoint['x'];
      $tileY = (int)$tilePoint['y'];

      if (!$this->cityMapTrafficSignalTileValidCheck($cityMapGenerated['tileRows'][$tileY][$tileX])) {
        continue;
      }

      if (!$this->cityMapTrafficSignalDistanceValidCheck($tilePoint, $trafficSignalList)) {
        continue;
      }

      $signalRequired = $this->cityMapTrafficSignalRequiredCheck($intersection);
      $signalOptionalAccepted = $this->cityMapTrafficSignalOptionalCheck($intersection, $randomSeededGenerator);

      if (!$signalRequired && !$signalOptionalAccepted) {
        continue;
      }

      $trafficSignalId = 'signal-' . count($trafficSignalList);

      $trafficSignalGenerated = [
        'id' => $trafficSignalId,
        'tilePoint' => [
          'x' => $tileX,
          'y' => $tileY,
        ],
        'intersectionId' => $intersection['id'],
      ];

      $this->cityMapTrafficSignalAttachToTile($cityMapGenerated['tileRows'][$tileY][$tileX], $trafficSignalGenerated);

      $trafficSignalList[] = $trafficSignalGenerated;
    }

    $cityMapGenerated['trafficSignalList'] = $trafficSignalList;

    return $trafficSignalList;
  }

  //this sorts intersections by importance with seeded tie variation
  private function cityMapTrafficSignalIntersectionListSort(array $intersectionList, RandomSeededGenerator $randomSeededGenerator): array
  {
    $intersectionListShuffled = $randomSeededGenerator->arrayShuffle($intersectionList);

    usort($intersectionListShuffled, function (array $intersectionA, array $intersectionB): int {
      $scoreA = $this->cityMapTrafficSignalIntersectionScoreGet($intersectionA);
      $scoreB = $this->cityMapTrafficSignalIntersectionScoreGet($intersectionB);

      return $scoreB <=> $scoreA;
    });

    return $intersectionListShuffled;
  }

  //this scores intersections so major roads get signals first
  private function cityMapTrafficSignalIntersectionScoreGet(array $intersection): int
  {
    $score = (int)($intersection['roadConnectionDegree'] ?? 0);
    $roadClassList = $intersection['roadClassList'] ?? [];

    if (in_array(CityTileValue::ROAD_CLASS_AVENUE_ROAD, $roadClassList, true)) {
      $score += 10;
    }

    if (in_array(CityTileValue::ROAD_CLASS_DISTRICT_ROAD, $roadClassList, true)) {
      $score += 4;
    }

    if (in_array(CityTileValue::ROAD_CLASS_LOCAL_ROAD, $roadClassList, true)) {
      $score += 1;
    }

    return $score;
  }

  //this checks whether intersection must have a signal
  public function cityMapTrafficSignalRequiredCheck(array $intersection): bool
  {
    if (!MapGenerationConfig::TRAFFIC_SIGNAL_AVENUE_AVENUE_REQUIRED) {
      return false;
    }

    $roadClassList = $intersection['roadClassList'] ?? [];
    $avenueConnected = in_array(CityTileValue::ROAD_CLASS_AVENUE_ROAD, $roadClassList, true);
    $majorIntersection = $avenueConnected && (int)($intersection['roadConnectionDegree'] ?? 0) >= 3;

    return $majorIntersection;
  }

  //this checks whether optional signal should be placed
  public function cityMapTrafficSignalOptionalCheck(array $intersection, RandomSeededGenerator $randomSeededGenerator): bool
  {
    $roadClassList = $intersection['roadClassList'] ?? [];

    $avenueConnected = in_array(CityTileValue::ROAD_CLASS_AVENUE_ROAD, $roadClassList, true);
    $districtConnected = in_array(CityTileValue::ROAD_CLASS_DISTRICT_ROAD, $roadClassList, true);

    $localOnly = count($roadClassList) === 1 && $roadClassList[0] === CityTileValue::ROAD_CLASS_LOCAL_ROAD;

    if ($avenueConnected && $districtConnected) {
      return $randomSeededGenerator->booleanChanceCheck(MapGenerationConfig::TRAFFIC_SIGNAL_AVENUE_DISTRICT_CHANCE);
    }

    if ($districtConnected && !$avenueConnected) {
      return $randomSeededGenerator->booleanChanceCheck(MapGenerationConfig::TRAFFIC_SIGNAL_DISTRICT_DISTRICT_CHANCE);
    }

    if ($localOnly) {
      return $randomSeededGenerator->booleanChanceCheck(MapGenerationConfig::TRAFFIC_SIGNAL_LOCAL_ONLY_CHANCE);
    }

    return false;
  }

  //this checks whether signal is far enough from other signals
  public function cityMapTrafficSignalDistanceValidCheck(array $tilePoint, array $trafficSignalList): bool
  {
    foreach ($trafficSignalList as $trafficSignal) {
      $distanceTiles = $this->cityTileDistanceManhattanGet($tilePoint, $trafficSignal['tilePoint']);

      if ($distanceTiles < MapGenerationConfig::TRAFFIC_SIGNAL_DISTANCE_MIN_TILES) {
        return false;
      }
    }

    return true;
  }

  //this attaches generated traffic signal to tile
  public function cityMapTrafficSignalAttachToTile(array &$cityTile, array $trafficSignalGenerated): void
  {
    $cityTile['trafficSignalId'] = $trafficSignalGenerated['id'];

    $this->cityTileFeatureAdd($cityTile, CityTileValue::FEATURE_TRAFFIC_SIGNAL);
  }

  //this checks whether tile can contain a traffic signal
  private function cityMapTrafficSignalTileValidCheck(array $cityTile): bool
  {
    if ($cityTile['start'] || $cityTile['delivery']) {
      return false;
    }

    if ($cityTile['trafficSignalId'] !== null) {
      return false;
    }

    if ($cityTile['pathKind'] !== CityTileValue::PATH_KIND_ROAD) {
      return false;
    }

    if ($cityTile['roadClass'] === CityTileValue::ROAD_CLASS_NONE) {
      return false;
    }

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_WATER) {
      return false;
    }

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_PARK) {
      return false;
    }

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_BUILDING) {
      return false;
    }

    return true;
  }

  //this adds feature once
  private function cityTileFeatureAdd(array &$cityTile, string $featureKind): void
  {
    if (!in_array($featureKind, $cityTile['featureKindList'], true)) {
      $cityTile['featureKindList'][] = $featureKind;
    }
  }

  //this gets manhattan distance between two tile points
  private function cityTileDistanceManhattanGet(array $pointA, array $pointB): int
  {
    return abs((int)$pointA['x'] - (int)$pointB['x']) + abs((int)$pointA['y'] - (int)$pointB['y']);
  }

  //this checks tile bounds
  private function cityMapTileExistsCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    return $tilePoint['x'] >= 0
      && $tilePoint['y'] >= 0
      && $tilePoint['x'] < $cityMapGenerated['widthTiles']
      && $tilePoint['y'] < $cityMapGenerated['heightTiles'];
  }
}
