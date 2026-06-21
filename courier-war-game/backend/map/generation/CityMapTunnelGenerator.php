<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../../config/CourierMovementConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/RandomSeededGenerator.php';

//this class generates walkable tunnels through building blocks
class CityMapTunnelGenerator
{
  //this generates tunnel paths on the map
  public function cityMapTunnelListGenerate(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): void
  {
    $tunnelCount = $randomSeededGenerator->numberIntegerGet(
      MapGenerationConfig::TUNNEL_COUNT_MIN,
      MapGenerationConfig::TUNNEL_COUNT_MAX
    );

    for ($tunnelIndex = 0; $tunnelIndex < $tunnelCount; $tunnelIndex++) {
      $endpointPair = $this->cityMapTunnelEndpointPairFind($cityMapGenerated, $randomSeededGenerator);

      if ($endpointPair === null) {
        continue;
      }

      $tunnelId = 'tunnel-' . $tunnelIndex;

      $this->cityMapTunnelPathDraw($cityMapGenerated, $endpointPair['startPoint'], $endpointPair['endPoint'], $tunnelId);
      $this->cityMapTunnelEntranceMark($cityMapGenerated, $endpointPair['startPoint'], $tunnelId);
      $this->cityMapTunnelEntranceMark($cityMapGenerated, $endpointPair['endPoint'], $tunnelId);
    }
  }

  //this finds aligned road endpoints for one tunnel
  public function cityMapTunnelEndpointPairFind(array $cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): ?array
  {
    $roadTilePointList = $this->cityMapNormalRoadTilePointListGet($cityMapGenerated);
    $roadTilePointListShuffled = $randomSeededGenerator->arrayShuffle($roadTilePointList);

    foreach ($roadTilePointListShuffled as $startPoint) {
      foreach ($roadTilePointListShuffled as $endPoint) {
        if ($startPoint['x'] === $endPoint['x'] && $startPoint['y'] === $endPoint['y']) {
          continue;
        }

        $aligned = $startPoint['x'] === $endPoint['x'] || $startPoint['y'] === $endPoint['y'];

        if (!$aligned) {
          continue;
        }

        $distanceTiles = abs($startPoint['x'] - $endPoint['x']) + abs($startPoint['y'] - $endPoint['y']);

        if ($distanceTiles < MapGenerationConfig::TUNNEL_ENDPOINT_DISTANCE_TILES_MIN) {
          continue;
        }

        if ($distanceTiles > MapGenerationConfig::TUNNEL_LENGTH_TILES_MAX) {
          continue;
        }

        if ($this->cityMapTunnelValidCheck($cityMapGenerated, $startPoint, $endPoint)) {
          return [
            'startPoint' => $startPoint,
            'endPoint' => $endPoint,
          ];
        }
      }
    }

    return null;
  }

  //this draws tunnel path between endpoints
  public function cityMapTunnelPathDraw(array &$cityMapGenerated, array $startPoint, array $endPoint, string $tunnelId): void
  {
    $currentX = (int)$startPoint['x'];
    $currentY = (int)$startPoint['y'];

    while ($currentX !== (int)$endPoint['x'] || $currentY !== (int)$endPoint['y']) {
      $this->cityMapTunnelTileSet($cityMapGenerated, ['x' => $currentX, 'y' => $currentY], $tunnelId);

      if ($currentX !== (int)$endPoint['x']) {
        $currentX += $this->cityMapStepGet($currentX, (int)$endPoint['x']);
      } elseif ($currentY !== (int)$endPoint['y']) {
        $currentY += $this->cityMapStepGet($currentY, (int)$endPoint['y']);
      }
    }

    $this->cityMapTunnelTileSet($cityMapGenerated, $endPoint, $tunnelId);
  }

  //this marks tunnel entrance feature
  public function cityMapTunnelEntranceMark(array &$cityMapGenerated, array $tilePoint, string $tunnelId): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return;
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    $cityMapGenerated['tileRows'][$tileY][$tileX]['tunnelEntrance'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['tunnelId'] = $tunnelId;

    $this->cityTileFeatureAdd($cityMapGenerated['tileRows'][$tileY][$tileX], CityTileValue::FEATURE_TUNNEL_ENTRANCE);
  }

  //this checks whether tunnel path is valid
  public function cityMapTunnelValidCheck(array $cityMapGenerated, array $startPoint, array $endPoint): bool
  {
    $currentX = (int)$startPoint['x'];
    $currentY = (int)$startPoint['y'];
    $buildingTileCrossed = false;

    while ($currentX !== (int)$endPoint['x'] || $currentY !== (int)$endPoint['y']) {
      if (!$this->cityMapTunnelTileCandidateValidCheck($cityMapGenerated, ['x' => $currentX, 'y' => $currentY], $startPoint, $endPoint, $buildingTileCrossed)) {
        return false;
      }

      if ($currentX !== (int)$endPoint['x']) {
        $currentX += $this->cityMapStepGet($currentX, (int)$endPoint['x']);
      } elseif ($currentY !== (int)$endPoint['y']) {
        $currentY += $this->cityMapStepGet($currentY, (int)$endPoint['y']);
      }
    }

    if (!$this->cityMapTunnelTileCandidateValidCheck($cityMapGenerated, $endPoint, $startPoint, $endPoint, $buildingTileCrossed)) {
      return false;
    }

    return $buildingTileCrossed;
  }

  //this checks one tile in proposed tunnel path
  private function cityMapTunnelTileCandidateValidCheck(array $cityMapGenerated, array $tilePoint, array $startPoint, array $endPoint, bool &$buildingTileCrossed): bool
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

    if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_BRIDGE || $cityTile['pathKind'] === CityTileValue::PATH_KIND_SHORTCUT) {
      return false;
    }

    if ($cityTile['trafficSignalId'] !== null) {
      return false;
    }

    if ($cityTile['start'] || $cityTile['delivery']) {
      return false;
    }

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_BUILDING) {
      $buildingTileCrossed = true;
    }

    return true;
  }

  //this sets one tunnel tile
  private function cityMapTunnelTileSet(array &$cityMapGenerated, array $tilePoint, string $tunnelId): void
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

    $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] = CityTileValue::PATH_KIND_TUNNEL;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] = CityTileValue::ROAD_CLASS_LOCAL_ROAD;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['walkable'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['baseMovementCost'] = CourierMovementConfig::TUNNEL_MOVEMENT_COST;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['tunnelId'] = $tunnelId;

    $this->cityTileRouteIdAdd($cityMapGenerated['tileRows'][$tileY][$tileX], $tunnelId);
  }

  //this gets road points usable as tunnel endpoints
  private function cityMapNormalRoadTilePointListGet(array $cityMapGenerated): array
  {
    $roadTilePointList = [];

    foreach ($cityMapGenerated['tileRows'] as $tileRow) {
      foreach ($tileRow as $cityTile) {
        $normalRoad = $cityTile['pathKind'] === CityTileValue::PATH_KIND_ROAD && $cityTile['walkable'];

        if ($normalRoad && $cityTile['trafficSignalId'] === null && !$cityTile['bridgeEntrance']) {
          $roadTilePointList[] = [
            'x' => (int)$cityTile['x'],
            'y' => (int)$cityTile['y'],
          ];
        }
      }
    }

    return $roadTilePointList;
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
