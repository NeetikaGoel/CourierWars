<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../../config/CourierMovementConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/RandomSeededGenerator.php';

//this class generates subtle shorter but slower shortcut paths
class CityMapShortcutGenerator
{
  //this generates shortcut paths on the map
  public function cityMapShortcutListGenerate(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): void
  {
    $shortcutCount = $randomSeededGenerator->numberIntegerGet(
      MapGenerationConfig::SHORTCUT_COUNT_MIN,
      MapGenerationConfig::SHORTCUT_COUNT_MAX
    );

    for ($shortcutIndex = 0; $shortcutIndex < $shortcutCount; $shortcutIndex++) {
      $endpointPair = $this->cityMapShortcutEndpointPairFind($cityMapGenerated, $randomSeededGenerator);

      if ($endpointPair === null) {
        continue;
      }

      $shortcutId = 'shortcut-' . $shortcutIndex;

      $this->cityMapShortcutPathDraw($cityMapGenerated, $endpointPair['startPoint'], $endpointPair['endPoint'], $shortcutId);
      $this->cityMapShortcutEntranceMark($cityMapGenerated, $endpointPair['startPoint'], $shortcutId);
      $this->cityMapShortcutEntranceMark($cityMapGenerated, $endpointPair['endPoint'], $shortcutId);
    }
  }

  //this finds valid road endpoints for one shortcut
  public function cityMapShortcutEndpointPairFind(array $cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): ?array
  {
    $roadTilePointList = $this->cityMapShortcutEndpointCandidateListGet($cityMapGenerated);
    $roadTilePointListShuffled = $randomSeededGenerator->arrayShuffle($roadTilePointList);

    foreach ($roadTilePointListShuffled as $startPoint) {
      foreach ($roadTilePointListShuffled as $endPoint) {
        if ($startPoint['x'] === $endPoint['x'] && $startPoint['y'] === $endPoint['y']) {
          continue;
        }

        $distanceTiles = abs($startPoint['x'] - $endPoint['x']) + abs($startPoint['y'] - $endPoint['y']);

        if ($distanceTiles < MapGenerationConfig::SHORTCUT_LENGTH_TILES_MIN) {
          continue;
        }

        if ($distanceTiles > MapGenerationConfig::SHORTCUT_LENGTH_TILES_MAX) {
          continue;
        }

        if ($this->cityMapShortcutValidCheck($cityMapGenerated, $startPoint, $endPoint)) {
          return [
            'startPoint' => $startPoint,
            'endPoint' => $endPoint,
          ];
        }
      }
    }

    return null;
  }

  //this draws shortcut path between endpoints
  public function cityMapShortcutPathDraw(array &$cityMapGenerated, array $startPoint, array $endPoint, string $shortcutId): void
  {
    $currentX = (int)$startPoint['x'];
    $currentY = (int)$startPoint['y'];

    while ($currentX !== (int)$endPoint['x'] || $currentY !== (int)$endPoint['y']) {
      $this->cityMapShortcutTileSet($cityMapGenerated, ['x' => $currentX, 'y' => $currentY], $shortcutId);

      if ($currentX !== (int)$endPoint['x']) {
        $currentX += $this->cityMapStepGet($currentX, (int)$endPoint['x']);
      } elseif ($currentY !== (int)$endPoint['y']) {
        $currentY += $this->cityMapStepGet($currentY, (int)$endPoint['y']);
      }
    }

    $this->cityMapShortcutTileSet($cityMapGenerated, $endPoint, $shortcutId);
  }

  //this marks shortcut entrance feature
  public function cityMapShortcutEntranceMark(array &$cityMapGenerated, array $tilePoint, string $shortcutId): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return;
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    $cityMapGenerated['tileRows'][$tileY][$tileX]['shortcutEntrance'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['shortcutId'] = $shortcutId;

    $this->cityTileFeatureAdd($cityMapGenerated['tileRows'][$tileY][$tileX], CityTileValue::FEATURE_SHORTCUT_ENTRANCE);
  }

  //this checks whether shortcut path is valid
  public function cityMapShortcutValidCheck(array $cityMapGenerated, array $startPoint, array $endPoint): bool
  {
    $currentX = (int)$startPoint['x'];
    $currentY = (int)$startPoint['y'];
    $buildingTileCrossed = false;
    $interiorTileCount = 0;

    while ($currentX !== (int)$endPoint['x'] || $currentY !== (int)$endPoint['y']) {
      if (!$this->cityMapShortcutTileCandidateValidCheck($cityMapGenerated, ['x' => $currentX, 'y' => $currentY], $startPoint, $endPoint, $buildingTileCrossed, $interiorTileCount)) {
        return false;
      }

      if ($currentX !== (int)$endPoint['x']) {
        $currentX += $this->cityMapStepGet($currentX, (int)$endPoint['x']);
      } elseif ($currentY !== (int)$endPoint['y']) {
        $currentY += $this->cityMapStepGet($currentY, (int)$endPoint['y']);
      }
    }

    if (!$this->cityMapShortcutTileCandidateValidCheck($cityMapGenerated, $endPoint, $startPoint, $endPoint, $buildingTileCrossed, $interiorTileCount)) {
      return false;
    }

    return $buildingTileCrossed && $interiorTileCount >= 2;
  }

  //this checks one proposed shortcut tile
  private function cityMapShortcutTileCandidateValidCheck(array $cityMapGenerated, array $tilePoint, array $startPoint, array $endPoint, bool &$buildingTileCrossed, int &$interiorTileCount): bool
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return false;
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];
    $cityTile = $cityMapGenerated['tileRows'][$tileY][$tileX];

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_WATER || $cityTile['terrainType'] === CityTileValue::TERRAIN_PARK) {
      return false;
    }

    if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_BRIDGE || $cityTile['pathKind'] === CityTileValue::PATH_KIND_TUNNEL) {
      return false;
    }

    if ($cityTile['trafficSignalId'] !== null) {
      return false;
    }

    if ($cityTile['start'] || $cityTile['delivery']) {
      return false;
    }

    $isEndpoint = ($tilePoint['x'] === $startPoint['x'] && $tilePoint['y'] === $startPoint['y'])
      || ($tilePoint['x'] === $endPoint['x'] && $tilePoint['y'] === $endPoint['y']);

    if (!$isEndpoint) {
      $interiorTileCount++;
    }

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_BUILDING) {
      $buildingTileCrossed = true;
    }

    return true;
  }

  //this sets one shortcut tile
  private function cityMapShortcutTileSet(array &$cityMapGenerated, array $tilePoint, string $shortcutId): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return;
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    $terrainType = $cityMapGenerated['tileRows'][$tileY][$tileX]['terrainType'];

    if ($terrainType === CityTileValue::TERRAIN_WATER || $terrainType === CityTileValue::TERRAIN_PARK) {
      return;
    }

    if ($terrainType === CityTileValue::TERRAIN_BUILDING) {
      $cityMapGenerated['tileRows'][$tileY][$tileX]['terrainType'] = CityTileValue::TERRAIN_LAND;
    }

    $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] = CityTileValue::PATH_KIND_SHORTCUT;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] = CityTileValue::ROAD_CLASS_LOCAL_ROAD;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['walkable'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['baseMovementCost'] = CourierMovementConfig::SHORTCUT_MOVEMENT_COST;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['shortcutId'] = $shortcutId;

    $this->cityTileRouteIdAdd($cityMapGenerated['tileRows'][$tileY][$tileX], $shortcutId);
  }

  //this gets normal road points usable as shortcut endpoints
  private function cityMapShortcutEndpointCandidateListGet(array $cityMapGenerated): array
  {
    $candidateList = [];

    foreach ($cityMapGenerated['tileRows'] as $tileRow) {
      foreach ($tileRow as $cityTile) {
        $normalRoad = $cityTile['pathKind'] === CityTileValue::PATH_KIND_ROAD && $cityTile['walkable'];

        if ($normalRoad && $cityTile['trafficSignalId'] === null && !$cityTile['tunnelEntrance'] && !$cityTile['bridgeEntrance']) {
          $candidateList[] = [
            'x' => (int)$cityTile['x'],
            'y' => (int)$cityTile['y'],
          ];
        }
      }
    }

    return $candidateList;
  }

  //this adds feature once
  private function cityTileFeatureAdd(array &$cityTile, string $featureKind): void
  {
    if (!in_array($featureKind, $cityTile['featureKindList'], true)) {
      $cityTile['featureKindList'][] = $featureKind;
    }
  }

  //this adds route id once
  private function cityTileRouteIdAdd(array &$cityTile, string $routeId): void
  {
    if (!in_array($routeId, $cityTile['routeIdList'], true)) {
      $cityTile['routeIdList'][] = $routeId;
    }
  }

  //this checks tile bounds
  private function cityMapTileExistsCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    return $tilePoint['x'] >= 0
      && $tilePoint['y'] >= 0
      && $tilePoint['x'] < $cityMapGenerated['widthTiles']
      && $tilePoint['y'] < $cityMapGenerated['heightTiles'];
  }

  //this returns step toward target
  private function cityMapStepGet(int $currentValue, int $targetValue): int
  {
    if ($currentValue < $targetValue) {
      return 1;
    }

    if ($currentValue > $targetValue) {
      return -1;
    }

    return 0;
  }
}
