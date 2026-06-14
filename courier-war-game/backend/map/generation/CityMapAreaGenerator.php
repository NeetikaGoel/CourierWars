<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../../config/CourierMovementConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/RandomSeededGenerator.php';

//this class places parks lakes and optional ring roads inside sensible city blocks
class CityMapAreaGenerator
{
  public const AREA_KIND_PARK = 'park';
  public const AREA_KIND_LAKE = 'lake';

  private const BLOCKED_MOVEMENT_COST = 999999;

  //this generates park areas
  public function cityMapParkAreaListGenerate(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): array
  {
    $parkCountTarget = $randomSeededGenerator->numberIntegerGet(MapGenerationConfig::PARK_COUNT_MIN, MapGenerationConfig::PARK_COUNT_MAX);
    $parkAreaList = [];
    $placementAttemptCountMax = $parkCountTarget * 90;

    for ($placementAttemptIndex = 0; count($parkAreaList) < $parkCountTarget && $placementAttemptIndex < $placementAttemptCountMax; $placementAttemptIndex++) {
      $tileArea = $this->cityMapAreaCandidateFind(
        $cityMapGenerated,
        $randomSeededGenerator,
        MapGenerationConfig::PARK_WIDTH_TILES_MIN,
        MapGenerationConfig::PARK_WIDTH_TILES_MAX,
        MapGenerationConfig::PARK_HEIGHT_TILES_MIN,
        MapGenerationConfig::PARK_HEIGHT_TILES_MAX,
        MapGenerationConfig::PARK_ROAD_OVERLAP_RATIO_MAX
      );

      if ($tileArea === null) {
        continue;
      }

      $parkArea = [
        'id' => 'park-' . count($parkAreaList),
        'kind' => self::AREA_KIND_PARK,
        'tileArea' => $tileArea,
      ];

      $this->cityMapParkAreaPlace($cityMapGenerated, $parkArea);

      if (MapGenerationConfig::PARK_RING_ROAD_ALLOWED) {
        $this->cityMapAreaRingRoadAdd($cityMapGenerated, $parkArea);
      }

      $parkAreaList[] = $parkArea;
    }

    return $parkAreaList;
  }

  //this generates lake areas
  public function cityMapLakeAreaListGenerate(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): array
  {
    $lakeCountTarget = $randomSeededGenerator->numberIntegerGet(MapGenerationConfig::LAKE_COUNT_MIN, MapGenerationConfig::LAKE_COUNT_MAX);
    $lakeAreaList = [];
    $placementAttemptCountMax = $lakeCountTarget * 110;

    for ($placementAttemptIndex = 0; count($lakeAreaList) < $lakeCountTarget && $placementAttemptIndex < $placementAttemptCountMax; $placementAttemptIndex++) {
      $tileArea = $this->cityMapAreaCandidateFind(
        $cityMapGenerated,
        $randomSeededGenerator,
        MapGenerationConfig::LAKE_WIDTH_TILES_MIN,
        MapGenerationConfig::LAKE_WIDTH_TILES_MAX,
        MapGenerationConfig::LAKE_HEIGHT_TILES_MIN,
        MapGenerationConfig::LAKE_HEIGHT_TILES_MAX,
        MapGenerationConfig::LAKE_ROAD_OVERLAP_RATIO_MAX
      );

      if ($tileArea === null) {
        continue;
      }

      $lakeArea = [
        'id' => 'lake-' . count($lakeAreaList),
        'kind' => self::AREA_KIND_LAKE,
        'tileArea' => $tileArea,
      ];

      $this->cityMapLakeAreaPlace($cityMapGenerated, $lakeArea);

      if (MapGenerationConfig::LAKE_RING_ROAD_ALLOWED) {
        $this->cityMapAreaRingRoadAdd($cityMapGenerated, $lakeArea);
      }

      $lakeAreaList[] = $lakeArea;
    }

    return $lakeAreaList;
  }

  //this finds a valid area inside a random zone
  public function cityMapAreaCandidateFind(array $cityMapGenerated, RandomSeededGenerator $randomSeededGenerator, int $widthTilesMin, int $widthTilesMax, int $heightTilesMin, int $heightTilesMax, float $roadOverlapRatioMax): ?array
  {
    $attemptCountMax = 120;

    for ($attemptIndex = 0; $attemptIndex < $attemptCountMax; $attemptIndex++) {
      $cityZone = $randomSeededGenerator->arrayItemPick($cityMapGenerated['zoneList']);

      $widthTiles = $randomSeededGenerator->numberIntegerGet($widthTilesMin, $widthTilesMax);
      $heightTiles = $randomSeededGenerator->numberIntegerGet($heightTilesMin, $heightTilesMax);

      $startXMin = max($cityZone['startX'] + 4, MapGenerationConfig::SAFE_BORDER_TILES);
      $startYMin = max($cityZone['startY'] + 4, MapGenerationConfig::SAFE_BORDER_TILES);
      $startXMax = min($cityZone['endX'] - $widthTiles - 4, $cityMapGenerated['widthTiles'] - $widthTiles - 1);
      $startYMax = min($cityZone['endY'] - $heightTiles - 4, $cityMapGenerated['heightTiles'] - $heightTiles - 1);

      if ($startXMax <= $startXMin || $startYMax <= $startYMin) {
        continue;
      }

      $tileArea = [
        'startX' => $randomSeededGenerator->numberIntegerGet($startXMin, $startXMax),
        'startY' => $randomSeededGenerator->numberIntegerGet($startYMin, $startYMax),
        'widthTiles' => $widthTiles,
        'heightTiles' => $heightTiles,
      ];

      if (!$this->cityMapAreaProtectedOverlapCheck($cityMapGenerated, $tileArea, $roadOverlapRatioMax)) {
        return $tileArea;
      }
    }

    return null;
  }

  //this places park terrain
  public function cityMapParkAreaPlace(array &$cityMapGenerated, array $cityMapAreaPlaced): void
  {
    $this->cityMapAreaTerrainFill($cityMapGenerated, $cityMapAreaPlaced['tileArea'], CityTileValue::TERRAIN_PARK);
  }

  //this places lake terrain
  public function cityMapLakeAreaPlace(array &$cityMapGenerated, array $cityMapAreaPlaced): void
  {
    $this->cityMapAreaTerrainFill($cityMapGenerated, $cityMapAreaPlaced['tileArea'], CityTileValue::TERRAIN_WATER);
  }

  //this adds a local ring road around an area
  public function cityMapAreaRingRoadAdd(array &$cityMapGenerated, array $cityMapAreaPlaced): void
  {
    $tileArea = $cityMapAreaPlaced['tileArea'];

    $leftX = $tileArea['startX'] - 1;
    $rightX = $tileArea['startX'] + $tileArea['widthTiles'];
    $topY = $tileArea['startY'] - 1;
    $bottomY = $tileArea['startY'] + $tileArea['heightTiles'];
    $routeId = 'ring-' . $cityMapAreaPlaced['id'];

    for ($tileX = $leftX; $tileX <= $rightX; $tileX++) {
      $this->cityMapAreaRingRoadTileSet($cityMapGenerated, ['x' => $tileX, 'y' => $topY], $routeId);
      $this->cityMapAreaRingRoadTileSet($cityMapGenerated, ['x' => $tileX, 'y' => $bottomY], $routeId);
    }

    for ($tileY = $topY; $tileY <= $bottomY; $tileY++) {
      $this->cityMapAreaRingRoadTileSet($cityMapGenerated, ['x' => $leftX, 'y' => $tileY], $routeId);
      $this->cityMapAreaRingRoadTileSet($cityMapGenerated, ['x' => $rightX, 'y' => $tileY], $routeId);
    }
  }

  //this checks whether an area overlaps protected map structure
  public function cityMapAreaProtectedOverlapCheck(array $cityMapGenerated, array $tileArea, float $roadOverlapRatioMax): bool
  {
    $roadTileCount = 0;
    $areaTileCount = max(1, $tileArea['widthTiles'] * $tileArea['heightTiles']);

    for ($tileY = $tileArea['startY']; $tileY < $tileArea['startY'] + $tileArea['heightTiles']; $tileY++) {
      for ($tileX = $tileArea['startX']; $tileX < $tileArea['startX'] + $tileArea['widthTiles']; $tileX++) {
        if (!$this->cityMapTileExistsCheck($cityMapGenerated, ['x' => $tileX, 'y' => $tileY])) {
          return true;
        }

        $cityTile = $cityMapGenerated['tileRows'][$tileY][$tileX];

        if ($cityTile['start'] || $cityTile['delivery']) {
          return true;
        }

        if ($cityTile['terrainType'] === CityTileValue::TERRAIN_WATER || $cityTile['terrainType'] === CityTileValue::TERRAIN_PARK) {
          return true;
        }

        if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_BRIDGE || $cityTile['pathKind'] === CityTileValue::PATH_KIND_TUNNEL || $cityTile['pathKind'] === CityTileValue::PATH_KIND_SHORTCUT) {
          return true;
        }

        if ($cityTile['roadClass'] === CityTileValue::ROAD_CLASS_AVENUE_ROAD) {
          return true;
        }

        foreach ($cityTile['routeIdList'] as $routeId) {
          if (strpos($routeId, 'important-corridor') === 0) {
            return true;
          }
        }

        if ($cityTile['pathKind'] !== CityTileValue::PATH_KIND_NONE || $cityTile['roadClass'] !== CityTileValue::ROAD_CLASS_NONE) {
          $roadTileCount++;
        }
      }
    }

    return ($roadTileCount / $areaTileCount) > $roadOverlapRatioMax;
  }

  //this fills an area with terrain and clears gameplay layers
  private function cityMapAreaTerrainFill(array &$cityMapGenerated, array $tileArea, string $terrainType): void
  {
    for ($tileY = $tileArea['startY']; $tileY < $tileArea['startY'] + $tileArea['heightTiles']; $tileY++) {
      for ($tileX = $tileArea['startX']; $tileX < $tileArea['startX'] + $tileArea['widthTiles']; $tileX++) {
        if (!$this->cityMapTileExistsCheck($cityMapGenerated, ['x' => $tileX, 'y' => $tileY])) {
          continue;
        }

        $cityMapGenerated['tileRows'][$tileY][$tileX]['terrainType'] = $terrainType;
        $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] = CityTileValue::ROAD_CLASS_NONE;
        $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] = CityTileValue::PATH_KIND_NONE;
        $cityMapGenerated['tileRows'][$tileY][$tileX]['walkable'] = false;
        $cityMapGenerated['tileRows'][$tileY][$tileX]['baseMovementCost'] = self::BLOCKED_MOVEMENT_COST;
        $cityMapGenerated['tileRows'][$tileY][$tileX]['featureKindList'] = [];
        $cityMapGenerated['tileRows'][$tileY][$tileX]['routeIdList'] = [];
        $cityMapGenerated['tileRows'][$tileY][$tileX]['hurdleCandidateList'] = [];
      }
    }
  }

  //this sets one ring road tile
  private function cityMapAreaRingRoadTileSet(array &$cityMapGenerated, array $tilePoint, string $routeId): void
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

    if ($cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] !== CityTileValue::ROAD_CLASS_NONE || $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] !== CityTileValue::PATH_KIND_NONE) {
      $this->cityTileRouteIdAdd($cityMapGenerated['tileRows'][$tileY][$tileX], $routeId);
      return;
    }

    $cityMapGenerated['tileRows'][$tileY][$tileX]['terrainType'] = CityTileValue::TERRAIN_LAND;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] = CityTileValue::ROAD_CLASS_LOCAL_ROAD;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] = CityTileValue::PATH_KIND_ROAD;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['walkable'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['baseMovementCost'] = CourierMovementConfig::LOCAL_ROAD_MOVEMENT_COST;

    $this->cityTileRouteIdAdd($cityMapGenerated['tileRows'][$tileY][$tileX], $routeId);
  }

  //this adds route id to tile once
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
}
