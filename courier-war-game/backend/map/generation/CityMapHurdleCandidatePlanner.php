<?php

declare(strict_types=1);

require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/../../constants/HurdleTypeValue.php';

//this class marks valid Saboteur hurdle candidates on generated tiles
class CityMapHurdleCandidatePlanner
{
  //this generates all hurdle candidates
  public function cityMapHurdleCandidateListGenerate(array &$cityMapGenerated): void
  {
    for ($tileY = 0; $tileY < $cityMapGenerated['heightTiles']; $tileY++) {
      for ($tileX = 0; $tileX < $cityMapGenerated['widthTiles']; $tileX++) {
        $cityMapGenerated['tileRows'][$tileY][$tileX]['hurdleCandidateList'] = [];

        $this->cityMapRedTrafficLightCandidateAdd($cityMapGenerated['tileRows'][$tileY][$tileX]);
        $this->cityMapRoadPressureCandidateListAdd($cityMapGenerated['tileRows'][$tileY][$tileX]);
        $this->cityMapClosedGateCandidateAdd($cityMapGenerated['tileRows'][$tileY][$tileX]);
        $this->cityMapWrongDirectionSignCandidateAdd($cityMapGenerated['tileRows'][$tileY][$tileX]);
      }
    }
  }

  //this adds red traffic light candidate when tile has signal
  public function cityMapRedTrafficLightCandidateAdd(array &$cityTile): void
  {
    if ($cityTile['trafficSignalId'] === null) {
      return;
    }

    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::RED_TRAFFIC_LIGHT);
  }

  //this adds all common road pressure hurdles to normal road tiles
  public function cityMapRoadPressureCandidateListAdd(array &$cityTile): void
  {
    if (!$this->cityMapGeneralRoadHurdleTileCheck($cityTile)) {
      return;
    }

    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::ROAD_BLOCK);
    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::CONSTRUCTION_WORK);
    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::TRAFFIC_JAM);
    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::BROKEN_ROAD);
    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::MOVING_BARRIER);
    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::SECURITY_CHECKPOINT);
  }

  //this adds closed gate candidate
  public function cityMapClosedGateCandidateAdd(array &$cityTile): void
  {
    $gateEntrance = $cityTile['tunnelEntrance'] || $cityTile['shortcutEntrance'] || $cityTile['bridgeEntrance'];

    if (!$gateEntrance) {
      return;
    }

    if ($cityTile['start'] || $cityTile['delivery']) {
      return;
    }

    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::CLOSED_GATE);
  }

  //this adds wrong direction sign candidate
  public function cityMapWrongDirectionSignCandidateAdd(array &$cityTile): void
  {
    $intersectionTile = $cityTile['intersectionId'] !== null;
    $hiddenRouteEntrance = $cityTile['tunnelEntrance'] || $cityTile['shortcutEntrance'];

    if (!$intersectionTile && !$hiddenRouteEntrance) {
      return;
    }

    if ($cityTile['start'] || $cityTile['delivery']) {
      return;
    }

    $this->cityTileHurdleCandidateAdd($cityTile, HurdleTypeValue::WRONG_DIRECTION_SIGN);
  }

  //this checks whether tile supports normal road hurdles
  private function cityMapGeneralRoadHurdleTileCheck(array $cityTile): bool
  {
    if ($cityTile['start'] || $cityTile['delivery']) {
      return false;
    }

    if (!$cityTile['walkable']) {
      return false;
    }

    if ($cityTile['pathKind'] !== CityTileValue::PATH_KIND_ROAD) {
      return false;
    }

    if ($cityTile['roadClass'] === CityTileValue::ROAD_CLASS_NONE) {
      return false;
    }

    if (
      $cityTile['terrainType'] === CityTileValue::TERRAIN_WATER ||
      $cityTile['terrainType'] === CityTileValue::TERRAIN_PARK ||
      $cityTile['terrainType'] === CityTileValue::TERRAIN_BUILDING
    ) {
      return false;
    }

    return true;
  }

  //this adds hurdle candidate once
  private function cityTileHurdleCandidateAdd(array &$cityTile, string $hurdleType): void
  {
    if (!in_array($hurdleType, $cityTile['hurdleCandidateList'], true)) {
      $cityTile['hurdleCandidateList'][] = $hurdleType;
    }
  }
}
