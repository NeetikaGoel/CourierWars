<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../../config/CourierMovementConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/RandomSeededGenerator.php';

//this class creates bridges only across lake water
class CityMapBridgeGenerator
{
  private const BRIDGE_HORIZONTAL = 'horizontal';
  private const BRIDGE_VERTICAL = 'vertical';

  //this generates bridges for lake areas
  public function cityMapBridgeListGenerate(array &$cityMapGenerated, array $lakeAreaList, RandomSeededGenerator $randomSeededGenerator): void
  {
    if (count($lakeAreaList) === 0) {
      return;
    }

    $bridgeCount = $randomSeededGenerator->numberIntegerGet(MapGenerationConfig::BRIDGE_COUNT_MIN, MapGenerationConfig::BRIDGE_COUNT_MAX);

    for ($bridgeIndex = 0; $bridgeIndex < $bridgeCount; $bridgeIndex++) {
      $lakeArea = $lakeAreaList[$bridgeIndex % count($lakeAreaList)];

      $bridgeOrientation = $randomSeededGenerator->booleanChanceCheck(0.5)
        ? self::BRIDGE_HORIZONTAL
        : self::BRIDGE_VERTICAL;

      $placed = $this->cityMapBridgeAcrossLakePlace($cityMapGenerated, $lakeArea, $bridgeOrientation, 'bridge-' . $bridgeIndex);

      if (!$placed) {
        $alternateOrientation = $bridgeOrientation === self::BRIDGE_HORIZONTAL
          ? self::BRIDGE_VERTICAL
          : self::BRIDGE_HORIZONTAL;

        $this->cityMapBridgeAcrossLakePlace($cityMapGenerated, $lakeArea, $alternateOrientation, 'bridge-' . $bridgeIndex);
      }
    }
  }

  //this places one bridge across a lake if it can connect both ends
  public function cityMapBridgeAcrossLakePlace(array &$cityMapGenerated, array $lakeArea, string $bridgeOrientation, string $bridgeId): bool
  {
    $tileArea = $lakeArea['tileArea'];

    if ($bridgeOrientation === self::BRIDGE_HORIZONTAL) {
      $bridgeY = (int)floor($tileArea['startY'] + $tileArea['heightTiles'] / 2);
      $bridgeStartX = $tileArea['startX'];
      $bridgeEndX = $tileArea['startX'] + $tileArea['widthTiles'] - 1;

      $leftConnector = ['x' => $bridgeStartX - 1, 'y' => $bridgeY];
      $rightConnector = ['x' => $bridgeEndX + 1, 'y' => $bridgeY];

      if (!$this->cityMapBridgeConnectorValidCheck($cityMapGenerated, $leftConnector) || !$this->cityMapBridgeConnectorValidCheck($cityMapGenerated, $rightConnector)) {
        return false;
      }

      for ($tileX = $bridgeStartX; $tileX <= $bridgeEndX; $tileX++) {
        $this->cityMapBridgeTileSet($cityMapGenerated, ['x' => $tileX, 'y' => $bridgeY], $bridgeId);
      }

      $this->cityMapBridgeEntranceMark($cityMapGenerated, ['x' => $bridgeStartX, 'y' => $bridgeY], $bridgeId);
      $this->cityMapBridgeEntranceMark($cityMapGenerated, ['x' => $bridgeEndX, 'y' => $bridgeY], $bridgeId);
      $this->cityMapBridgeEndRoadsConnect($cityMapGenerated, $leftConnector, $bridgeId);
      $this->cityMapBridgeEndRoadsConnect($cityMapGenerated, $rightConnector, $bridgeId);

      return true;
    }

    $bridgeX = (int)floor($tileArea['startX'] + $tileArea['widthTiles'] / 2);
    $bridgeStartY = $tileArea['startY'];
    $bridgeEndY = $tileArea['startY'] + $tileArea['heightTiles'] - 1;

    $topConnector = ['x' => $bridgeX, 'y' => $bridgeStartY - 1];
    $bottomConnector = ['x' => $bridgeX, 'y' => $bridgeEndY + 1];

    if (!$this->cityMapBridgeConnectorValidCheck($cityMapGenerated, $topConnector) || !$this->cityMapBridgeConnectorValidCheck($cityMapGenerated, $bottomConnector)) {
      return false;
    }

    for ($tileY = $bridgeStartY; $tileY <= $bridgeEndY; $tileY++) {
      $this->cityMapBridgeTileSet($cityMapGenerated, ['x' => $bridgeX, 'y' => $tileY], $bridgeId);
    }

    $this->cityMapBridgeEntranceMark($cityMapGenerated, ['x' => $bridgeX, 'y' => $bridgeStartY], $bridgeId);
    $this->cityMapBridgeEntranceMark($cityMapGenerated, ['x' => $bridgeX, 'y' => $bridgeEndY], $bridgeId);
    $this->cityMapBridgeEndRoadsConnect($cityMapGenerated, $topConnector, $bridgeId);
    $this->cityMapBridgeEndRoadsConnect($cityMapGenerated, $bottomConnector, $bridgeId);

    return true;
  }

  //this checks whether bridge connector can be placed on dry usable terrain
  private function cityMapBridgeConnectorValidCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return false;
    }

    $cityTile = $cityMapGenerated['tileRows'][$tilePoint['y']][$tilePoint['x']];

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_WATER || $cityTile['terrainType'] === CityTileValue::TERRAIN_PARK) {
      return false;
    }

    return true;
  }

  //this connects dry land to bridge entrance
  public function cityMapBridgeEndRoadsConnect(array &$cityMapGenerated, array $tilePoint, string $bridgeId): void
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

    $roadClass = $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'];

    if ($roadClass === CityTileValue::ROAD_CLASS_NONE || $roadClass === CityTileValue::ROAD_CLASS_LOCAL_ROAD) {
      $roadClass = CityTileValue::ROAD_CLASS_DISTRICT_ROAD;
    }

    $cityMapGenerated['tileRows'][$tileY][$tileX]['terrainType'] = CityTileValue::TERRAIN_LAND;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] = $roadClass;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] = CityTileValue::PATH_KIND_ROAD;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['walkable'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['baseMovementCost'] = CourierMovementConfig::baseMovementCostFor($roadClass, CityTileValue::PATH_KIND_ROAD);

    $this->cityTileRouteIdAdd($cityMapGenerated['tileRows'][$tileY][$tileX], $bridgeId . '-connector');
  }

  //this checks if tile can become bridge body
  public function cityMapBridgeTileValidCheck(array $cityTile): bool
  {
    return $cityTile['terrainType'] === CityTileValue::TERRAIN_WATER;
  }

  //this sets one bridge tile
  private function cityMapBridgeTileSet(array &$cityMapGenerated, array $tilePoint, string $bridgeId): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return;
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    if (!$this->cityMapBridgeTileValidCheck($cityMapGenerated['tileRows'][$tileY][$tileX])) {
      return;
    }

    $cityMapGenerated['tileRows'][$tileY][$tileX]['pathKind'] = CityTileValue::PATH_KIND_BRIDGE;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['roadClass'] = CityTileValue::ROAD_CLASS_DISTRICT_ROAD;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['walkable'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['baseMovementCost'] = CourierMovementConfig::BRIDGE_MOVEMENT_COST;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['bridgeId'] = $bridgeId;

    $this->cityTileRouteIdAdd($cityMapGenerated['tileRows'][$tileY][$tileX], $bridgeId);
  }

  //this marks bridge entrance feature
  private function cityMapBridgeEntranceMark(array &$cityMapGenerated, array $tilePoint, string $bridgeId): void
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return;
    }

    $tileX = (int)$tilePoint['x'];
    $tileY = (int)$tilePoint['y'];

    $cityMapGenerated['tileRows'][$tileY][$tileX]['bridgeEntrance'] = true;
    $cityMapGenerated['tileRows'][$tileY][$tileX]['bridgeId'] = $bridgeId;

    $this->cityTileFeatureAdd($cityMapGenerated['tileRows'][$tileY][$tileX], CityTileValue::FEATURE_BRIDGE_ENTRANCE);
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
}
