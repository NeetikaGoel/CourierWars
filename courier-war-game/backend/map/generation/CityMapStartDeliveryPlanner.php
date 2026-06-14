<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';

//this class places courier start and delivery on valid road tiles
class CityMapStartDeliveryPlanner
{
  //this places both start and delivery
  public function cityMapStartDeliveryPlace(array &$cityMapGenerated): void
  {
    $startTilePoint = $this->cityMapStartTileFind($cityMapGenerated);
    $deliveryTilePoint = $this->cityMapDeliveryTileFind($cityMapGenerated, $startTilePoint);

    $this->cityMapStartTileSet($cityMapGenerated, $startTilePoint);
    $this->cityMapDeliveryTileSet($cityMapGenerated, $deliveryTilePoint);

    $cityMapGenerated['startTilePoint'] = $startTilePoint;
    $cityMapGenerated['deliveryTilePoint'] = $deliveryTilePoint;
  }

  //this finds start tile near preferred start zone
  public function cityMapStartTileFind(array $cityMapGenerated): array
  {
    $startZone = $this->cityZoneFromIdGet($cityMapGenerated['zoneList'], MapGenerationConfig::START_ZONE_ID_PREFERRED);

    $preferredTilePoint = $startZone !== null
      ? ['x' => $startZone['centerX'], 'y' => $startZone['centerY']]
      : ['x' => MapGenerationConfig::SAFE_BORDER_TILES, 'y' => MapGenerationConfig::SAFE_BORDER_TILES];

    return $this->cityMapNearestValidRoadTileFind($cityMapGenerated, $preferredTilePoint);
  }

  //this finds delivery tile near preferred delivery zone
  public function cityMapDeliveryTileFind(array $cityMapGenerated, array $startTilePoint): array
  {
    $deliveryZone = $this->cityZoneFromIdGet($cityMapGenerated['zoneList'], MapGenerationConfig::DELIVERY_ZONE_ID_PREFERRED);

    $preferredTilePoint = $deliveryZone !== null
      ? ['x' => $deliveryZone['centerX'], 'y' => $deliveryZone['centerY']]
      : [
        'x' => $cityMapGenerated['widthTiles'] - MapGenerationConfig::SAFE_BORDER_TILES - 1,
        'y' => $cityMapGenerated['heightTiles'] - MapGenerationConfig::SAFE_BORDER_TILES - 1,
      ];

    return $this->cityMapNearestValidRoadTileFind($cityMapGenerated, $preferredTilePoint, $startTilePoint);
  }

  //this finds nearest valid road tile around preferred point
  public function cityMapNearestValidRoadTileFind(array $cityMapGenerated, array $preferredTilePoint, ?array $tilePointAvoid = null): array
  {
    $radiusMax = MapGenerationConfig::START_DELIVERY_VALID_ROAD_SEARCH_RADIUS_TILES_MAX;
    $bestCandidate = null;
    $bestDistanceFromAvoid = -1;

    for ($radius = 0; $radius <= $radiusMax; $radius++) {
      for ($offsetX = -$radius; $offsetX <= $radius; $offsetX++) {
        for ($offsetY = -$radius; $offsetY <= $radius; $offsetY++) {
          $candidatePoint = [
            'x' => $preferredTilePoint['x'] + $offsetX,
            'y' => $preferredTilePoint['y'] + $offsetY,
          ];

          if ($tilePointAvoid !== null && $candidatePoint['x'] === $tilePointAvoid['x'] && $candidatePoint['y'] === $tilePointAvoid['y']) {
            continue;
          }

          if (!$this->cityMapTileExistsCheck($cityMapGenerated, $candidatePoint)) {
            continue;
          }

          $cityTile = $cityMapGenerated['tileRows'][$candidatePoint['y']][$candidatePoint['x']];

          if (!$this->cityMapStartDeliveryTileValidCheck($cityTile)) {
            continue;
          }

          if ($tilePointAvoid === null) {
            return $candidatePoint;
          }

          $distanceFromAvoid = abs($candidatePoint['x'] - $tilePointAvoid['x']) + abs($candidatePoint['y'] - $tilePointAvoid['y']);

          if ($distanceFromAvoid > $bestDistanceFromAvoid) {
            $bestCandidate = $candidatePoint;
            $bestDistanceFromAvoid = $distanceFromAvoid;
          }
        }
      }

      if ($bestCandidate !== null && $bestDistanceFromAvoid >= 12) {
        return $bestCandidate;
      }
    }

    if ($bestCandidate !== null) {
      return $bestCandidate;
    }

    throw new RuntimeException('unable to find valid start or delivery tile');
  }

  //this sets start flag
  public function cityMapStartTileSet(array &$cityMapGenerated, array $tilePoint): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      throw new RuntimeException('start tile point is outside city map');
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    $cityMapGenerated['tileRows'][$tileY][$tileX]['start'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['delivery'] = false;
  }

  //this sets delivery flag
  public function cityMapDeliveryTileSet(array &$cityMapGenerated, array $tilePoint): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      throw new RuntimeException('delivery tile point is outside city map');
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    $cityMapGenerated['tileRows'][$tileY][$tileX]['delivery'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['start'] = false;
  }

  //this checks whether tile is valid for start or delivery
  private function cityMapStartDeliveryTileValidCheck(array $cityTile): bool
  {
    if (!$cityTile['walkable']) {
      return false;
    }

    if ($cityTile['pathKind'] !== CityTileValue::PATH_KIND_ROAD) {
      return false;
    }

    if ($cityTile['trafficSignalId'] !== null) {
      return false;
    }

    if ($cityTile['tunnelEntrance']) {
      return false;
    }

    if ($cityTile['shortcutEntrance']) {
      return false;
    }

    if ($cityTile['bridgeEntrance']) {
      return false;
    }

    return true;
  }

  //this returns zone by id
  private function cityZoneFromIdGet(array $cityZoneList, string $cityZoneId): ?array
  {
    foreach ($cityZoneList as $cityZone) {
      if (($cityZone['id'] ?? '') === $cityZoneId) {
        return $cityZone;
      }
    }

    return null;
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
