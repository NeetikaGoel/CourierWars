<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../../config/CourierMovementConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/RandomSeededGenerator.php';
require_once __DIR__ . '/CityMapRoadPriorityRules.php';

//this class draws avenues district roads local roads and one guaranteed corridor
class CityMapRoadNetworkGenerator
{
  private const ROAD_DRAW_HORIZONTAL = 'horizontal';
  private const ROAD_DRAW_VERTICAL = 'vertical';

  //this generates complete road network for the city map
  public function cityMapRoadNetworkGenerate(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): void
  {
    $this->cityMapAvenueRoadsDraw($cityMapGenerated, $randomSeededGenerator);
    $this->cityMapDistrictRoadsDraw($cityMapGenerated, $randomSeededGenerator);
    $this->cityMapLocalRoadsDraw($cityMapGenerated, $randomSeededGenerator);
    $this->cityMapImportantCorridorEnsure($cityMapGenerated);
  }

  //this draws major avenues across the full city
  public function cityMapAvenueRoadsDraw(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): void
  {
    $safeBorderTiles = MapGenerationConfig::SAFE_BORDER_TILES;
    $tileXMax = $cityMapGenerated['widthTiles'] - $safeBorderTiles - 1;
    $tileYMax = $cityMapGenerated['heightTiles'] - $safeBorderTiles - 1;

    for ($avenueIndex = 1; $avenueIndex <= MapGenerationConfig::AVENUE_VERTICAL_COUNT_TARGET; $avenueIndex++) {
      $tileXBase = (int)floor(($cityMapGenerated['widthTiles'] * $avenueIndex) / (MapGenerationConfig::AVENUE_VERTICAL_COUNT_TARGET + 1));
      $tileXOffset = $randomSeededGenerator->numberIntegerGet(-2, 2);
      $tileX = $this->cityMapNumberClamp($tileXBase + $tileXOffset, $safeBorderTiles, $tileXMax);

      $this->cityMapRoadLineDraw(
        $cityMapGenerated,
        ['x' => $tileX, 'y' => $safeBorderTiles],
        ['x' => $tileX, 'y' => $tileYMax],
        CityTileValue::ROAD_CLASS_AVENUE_ROAD,
        MapGenerationConfig::AVENUE_ROAD_WIDTH_TILES,
        'avenue-vertical-' . $avenueIndex
      );
    }

    for ($avenueIndex = 1; $avenueIndex <= MapGenerationConfig::AVENUE_HORIZONTAL_COUNT_TARGET; $avenueIndex++) {
      $tileYBase = (int)floor(($cityMapGenerated['heightTiles'] * $avenueIndex) / (MapGenerationConfig::AVENUE_HORIZONTAL_COUNT_TARGET + 1));
      $tileYOffset = $randomSeededGenerator->numberIntegerGet(-2, 2);
      $tileY = $this->cityMapNumberClamp($tileYBase + $tileYOffset, $safeBorderTiles, $tileYMax);

      $this->cityMapRoadLineDraw(
        $cityMapGenerated,
        ['x' => $safeBorderTiles, 'y' => $tileY],
        ['x' => $tileXMax, 'y' => $tileY],
        CityTileValue::ROAD_CLASS_AVENUE_ROAD,
        MapGenerationConfig::AVENUE_ROAD_WIDTH_TILES,
        'avenue-horizontal-' . $avenueIndex
      );
    }
  }

  //this draws medium district roads inside each zone
  public function cityMapDistrictRoadsDraw(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): void
  {
    foreach ($cityMapGenerated['zoneList'] as $cityZone) {
      for ($districtRoadIndex = 0; $districtRoadIndex < MapGenerationConfig::DISTRICT_ROAD_COUNT_PER_ZONE_TARGET; $districtRoadIndex++) {
        $horizontalYMin = $cityZone['startY'] + 5;
        $horizontalYMax = $cityZone['endY'] - 5;
        $verticalXMin = $cityZone['startX'] + 5;
        $verticalXMax = $cityZone['endX'] - 5;

        if ($horizontalYMin > $horizontalYMax || $verticalXMin > $verticalXMax) {
          continue;
        }

        $horizontalY = $randomSeededGenerator->numberIntegerGet($horizontalYMin, $horizontalYMax);
        $verticalX = $randomSeededGenerator->numberIntegerGet($verticalXMin, $verticalXMax);

        $this->cityMapRoadLineDraw(
          $cityMapGenerated,
          ['x' => $cityZone['startX'] + 2, 'y' => $horizontalY],
          ['x' => $cityZone['endX'] - 2, 'y' => $horizontalY],
          CityTileValue::ROAD_CLASS_DISTRICT_ROAD,
          MapGenerationConfig::DISTRICT_ROAD_WIDTH_TILES,
          'district-zone-' . $cityZone['id'] . '-horizontal-' . $districtRoadIndex
        );

        $this->cityMapRoadLineDraw(
          $cityMapGenerated,
          ['x' => $verticalX, 'y' => $cityZone['startY'] + 2],
          ['x' => $verticalX, 'y' => $cityZone['endY'] - 2],
          CityTileValue::ROAD_CLASS_DISTRICT_ROAD,
          MapGenerationConfig::DISTRICT_ROAD_WIDTH_TILES,
          'district-zone-' . $cityZone['id'] . '-vertical-' . $districtRoadIndex
        );
      }
    }
  }

  //this draws smaller local roads inside each zone
  public function cityMapLocalRoadsDraw(array &$cityMapGenerated, RandomSeededGenerator $randomSeededGenerator): void
  {
    foreach ($cityMapGenerated['zoneList'] as $cityZone) {
      for ($localRoadIndex = 0; $localRoadIndex < MapGenerationConfig::LOCAL_ROAD_BRANCH_COUNT_PER_ZONE_TARGET; $localRoadIndex++) {
        $startXMin = $cityZone['startX'] + 4;
        $startXMax = $cityZone['endX'] - 4;
        $startYMin = $cityZone['startY'] + 4;
        $startYMax = $cityZone['endY'] - 4;

        if ($startXMin > $startXMax || $startYMin > $startYMax) {
          continue;
        }

        $startPoint = [
          'x' => $randomSeededGenerator->numberIntegerGet($startXMin, $startXMax),
          'y' => $randomSeededGenerator->numberIntegerGet($startYMin, $startYMax),
        ];

        $horizontalBranch = $randomSeededGenerator->booleanChanceCheck(0.5);
        $directionSign = $randomSeededGenerator->booleanChanceCheck(0.5) ? 1 : -1;
        $branchLengthTiles = $randomSeededGenerator->numberIntegerGet(7, 16);

        $endPoint = $horizontalBranch
          ? [
            'x' => $this->cityMapNumberClamp($startPoint['x'] + $branchLengthTiles * $directionSign, $cityZone['startX'] + 2, $cityZone['endX'] - 2),
            'y' => $startPoint['y'],
          ]
          : [
            'x' => $startPoint['x'],
            'y' => $this->cityMapNumberClamp($startPoint['y'] + $branchLengthTiles * $directionSign, $cityZone['startY'] + 2, $cityZone['endY'] - 2),
          ];

        $this->cityMapRoadLineDraw(
          $cityMapGenerated,
          $startPoint,
          $endPoint,
          CityTileValue::ROAD_CLASS_LOCAL_ROAD,
          MapGenerationConfig::LOCAL_ROAD_WIDTH_TILES,
          'local-zone-' . $cityZone['id'] . '-' . $localRoadIndex
        );
      }
    }
  }

  //this draws a manhattan road line
  public function cityMapRoadLineDraw(array &$cityMapGenerated, array $startPoint, array $endPoint, string $roadClass, int $roadWidthTiles, string $routeId): void
  {
    $currentX = (int)$startPoint['x'];
    $currentY = (int)$startPoint['y'];

    while ($currentX !== (int)$endPoint['x']) {
      $this->cityMapRoadTileAreaSet($cityMapGenerated, ['x' => $currentX, 'y' => $currentY], $roadClass, $roadWidthTiles, self::ROAD_DRAW_HORIZONTAL, $routeId);
      $currentX += $this->cityMapStepGet($currentX, (int)$endPoint['x']);
    }

    while ($currentY !== (int)$endPoint['y']) {
      $this->cityMapRoadTileAreaSet($cityMapGenerated, ['x' => $currentX, 'y' => $currentY], $roadClass, $roadWidthTiles, self::ROAD_DRAW_VERTICAL, $routeId);
      $currentY += $this->cityMapStepGet($currentY, (int)$endPoint['y']);
    }

    $this->cityMapRoadCornerTileAreaSet($cityMapGenerated, ['x' => $currentX, 'y' => $currentY], $roadClass, $roadWidthTiles, $routeId);
  }

  //this guarantees one connected road corridor across the city
  public function cityMapImportantCorridorEnsure(array &$cityMapGenerated): void
  {
    $safeBorderTiles = MapGenerationConfig::SAFE_BORDER_TILES;
    $midpointX = (int)floor($cityMapGenerated['widthTiles'] / 2);
    $midpointY = (int)floor($cityMapGenerated['heightTiles'] / 2);
    $endX = $cityMapGenerated['widthTiles'] - $safeBorderTiles - 1;
    $endY = $cityMapGenerated['heightTiles'] - $safeBorderTiles - 1;

    $this->cityMapRoadLineDraw($cityMapGenerated, ['x' => $safeBorderTiles, 'y' => $safeBorderTiles], ['x' => $midpointX, 'y' => $safeBorderTiles], CityTileValue::ROAD_CLASS_DISTRICT_ROAD, MapGenerationConfig::DISTRICT_ROAD_WIDTH_TILES, 'important-corridor-a');
    $this->cityMapRoadLineDraw($cityMapGenerated, ['x' => $midpointX, 'y' => $safeBorderTiles], ['x' => $midpointX, 'y' => $midpointY], CityTileValue::ROAD_CLASS_DISTRICT_ROAD, MapGenerationConfig::DISTRICT_ROAD_WIDTH_TILES, 'important-corridor-b');
    $this->cityMapRoadLineDraw($cityMapGenerated, ['x' => $midpointX, 'y' => $midpointY], ['x' => $endX, 'y' => $midpointY], CityTileValue::ROAD_CLASS_DISTRICT_ROAD, MapGenerationConfig::DISTRICT_ROAD_WIDTH_TILES, 'important-corridor-c');
    $this->cityMapRoadLineDraw($cityMapGenerated, ['x' => $endX, 'y' => $midpointY], ['x' => $endX, 'y' => $endY], CityTileValue::ROAD_CLASS_DISTRICT_ROAD, MapGenerationConfig::DISTRICT_ROAD_WIDTH_TILES, 'important-corridor-d');
  }

  //this sets road width area around a center point
  private function cityMapRoadTileAreaSet(array &$cityMapGenerated, array $centerPoint, string $roadClass, int $roadWidthTiles, string $roadOrientation, string $routeId): void
  {
    foreach ($this->cityMapRoadWidthOffsetListGet($roadWidthTiles) as $roadOffset) {
      $tilePoint = $roadOrientation === self::ROAD_DRAW_HORIZONTAL
        ? ['x' => $centerPoint['x'], 'y' => $centerPoint['y'] + $roadOffset]
        : ['x' => $centerPoint['x'] + $roadOffset, 'y' => $centerPoint['y']];

      $this->cityMapRoadTileSet($cityMapGenerated, $tilePoint, $roadClass, $routeId);
    }
  }

  //this fills corner coverage where road direction changes
  private function cityMapRoadCornerTileAreaSet(array &$cityMapGenerated, array $centerPoint, string $roadClass, int $roadWidthTiles, string $routeId): void
  {
    foreach ($this->cityMapRoadWidthOffsetListGet($roadWidthTiles) as $offsetX) {
      foreach ($this->cityMapRoadWidthOffsetListGet($roadWidthTiles) as $offsetY) {
        $this->cityMapRoadTileSet($cityMapGenerated, ['x' => $centerPoint['x'] + $offsetX, 'y' => $centerPoint['y'] + $offsetY], $roadClass, $routeId);
      }
    }
  }

  //this returns road width offsets
  private function cityMapRoadWidthOffsetListGet(int $roadWidthTiles): array
  {
    $roadWidthTilesSafe = max(1, $roadWidthTiles);
    $offsetStart = $roadWidthTilesSafe % 2 === 0 ? 0 : -1 * (int)floor($roadWidthTilesSafe / 2);
    $offsetList = [];

    for ($offsetIndex = 0; $offsetIndex < $roadWidthTilesSafe; $offsetIndex++) {
      $offsetList[] = $offsetStart + $offsetIndex;
    }

    return $offsetList;
  }

  //this sets one tile as road
  public function cityMapRoadTileSet(array &$cityMapGenerated, array $tilePoint, string $roadClass, string $routeId): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return;
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    $this->cityTileRouteIdAdd($cityMapGenerated['tileRows'][$tileY][$tileX], $routeId);

    $existingRoadClass = $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'];

    if (!CityMapRoadPriorityRules::cityMapRoadClassReplaceCheck($existingRoadClass, $roadClass)) {
      return;
    }

    $terrainType = $cityMapGenerated['tileRows'][$tileY][$tileX]['terrainType'];

    if ($terrainType === CityTileValue::TERRAIN_WATER || $terrainType === CityTileValue::TERRAIN_PARK) {
      return;
    }

    $cityMapGenerated['tileRows'][$tileY][$tileX]['terrainType'] = CityTileValue::TERRAIN_LAND;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] = $roadClass;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] = CityTileValue::PATH_KIND_ROAD;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['walkable'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['baseMovementCost'] = CourierMovementConfig::baseMovementCostFor($roadClass, CityTileValue::PATH_KIND_ROAD);
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

  //this clamps number into min max
  private function cityMapNumberClamp(int $value, int $valueMin, int $valueMax): int
  {
    return max($valueMin, min($valueMax, $value));
  }
}
