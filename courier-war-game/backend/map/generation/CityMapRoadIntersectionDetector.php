<?php

declare(strict_types=1);

require_once __DIR__ . '/../type/CityTileValue.php';

//this class detects sensible road intersections for traffic signals and route decisions
class CityMapRoadIntersectionDetector
{
  //this detects all valid road intersections
  public function cityMapRoadIntersectionListDetect(array &$cityMapGenerated): array
  {
    $intersectionList = [];

    for ($tileY = 0; $tileY < $cityMapGenerated['heightTiles']; $tileY++) {
      for ($tileX = 0; $tileX < $cityMapGenerated['widthTiles']; $tileX++) {
        $tilePoint = ['x' => $tileX, 'y' => $tileY];

        if (!$this->cityMapTrafficSignalIntersectionCandidateCheck($cityMapGenerated, $tilePoint)) {
          continue;
        }

        $intersectionId = 'intersection-' . count($intersectionList);

        $intersection = [
          'id' => $intersectionId,
          'tilePoint' => $tilePoint,
          'roadClassList' => $this->cityMapRoadConnectedClassListGet($cityMapGenerated, $tilePoint),
          'roadConnectionDegree' => $this->cityMapRoadConnectionDegreeGet($cityMapGenerated, $tilePoint),
          'horizontalConnection' => $this->cityMapRoadHorizontalConnectionCheck($cityMapGenerated, $tilePoint),
          'verticalConnection' => $this->cityMapRoadVerticalConnectionCheck($cityMapGenerated, $tilePoint),
        ];

        $cityMapGenerated['tileRows'][$tileY][$tileX]['intersectionId'] = $intersectionId;
        $intersectionList[] = $intersection;
      }
    }

    return $intersectionList;
  }

  //this counts road connections around a tile
  public function cityMapRoadConnectionDegreeGet(array $cityMapGenerated, array $tilePoint): int
  {
    $roadConnectionDegree = 0;

    foreach ($this->cityMapRoadNeighborPointListGet($tilePoint) as $neighborPoint) {
      if ($this->cityMapRoadAtPointCheck($cityMapGenerated, $neighborPoint)) {
        $roadConnectionDegree++;
      }
    }

    return $roadConnectionDegree;
  }

  //this requires a real left to right road connection
  public function cityMapRoadHorizontalConnectionCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    return $this->cityMapRoadAtPointCheck($cityMapGenerated, ['x' => $tilePoint['x'] - 1, 'y' => $tilePoint['y']])
      && $this->cityMapRoadAtPointCheck($cityMapGenerated, ['x' => $tilePoint['x'] + 1, 'y' => $tilePoint['y']]);
  }

  //this requires a real top to bottom road connection
  public function cityMapRoadVerticalConnectionCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    return $this->cityMapRoadAtPointCheck($cityMapGenerated, ['x' => $tilePoint['x'], 'y' => $tilePoint['y'] - 1])
      && $this->cityMapRoadAtPointCheck($cityMapGenerated, ['x' => $tilePoint['x'], 'y' => $tilePoint['y'] + 1]);
  }

  //this gets unique connected road classes around the tile
  public function cityMapRoadConnectedClassListGet(array $cityMapGenerated, array $tilePoint): array
  {
    $roadClassList = [];

    foreach ($this->cityMapRoadNeighborPointListGet($tilePoint) as $neighborPoint) {
      if (!$this->cityMapRoadAtPointCheck($cityMapGenerated, $neighborPoint)) {
        continue;
      }

      $neighborTile = $cityMapGenerated['tileRows'][$neighborPoint['y']][$neighborPoint['x']];
      $this->stringListValueAdd($roadClassList, $neighborTile['roadClass']);
    }

    if ($this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      $centerTile = $cityMapGenerated['tileRows'][$tilePoint['y']][$tilePoint['x']];

      if ($this->cityMapTrafficRoadCheck($centerTile)) {
        $this->stringListValueAdd($roadClassList, $centerTile['roadClass']);
      }
    }

    return $roadClassList;
  }

  //this checks whether a road tile is a dead end
  public function cityMapRoadDeadEndCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    return $this->cityMapRoadConnectionDegreeGet($cityMapGenerated, $tilePoint) <= 1;
  }

  //this checks whether tile is a valid traffic signal intersection candidate
  public function cityMapTrafficSignalIntersectionCandidateCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return false;
    }

    $cityTile = $cityMapGenerated['tileRows'][$tilePoint['y']][$tilePoint['x']];

    if (!$this->cityMapTrafficRoadCheck($cityTile)) {
      return false;
    }

    if ($cityTile['start'] || $cityTile['delivery']) {
      return false;
    }

    if ($cityTile['tunnelEntrance'] || $cityTile['shortcutEntrance'] || $cityTile['bridgeEntrance']) {
      return false;
    }

    if (!$this->cityMapRoadHorizontalConnectionCheck($cityMapGenerated, $tilePoint)) {
      return false;
    }

    if (!$this->cityMapRoadVerticalConnectionCheck($cityMapGenerated, $tilePoint)) {
      return false;
    }

    if ($this->cityMapRoadDeadEndCheck($cityMapGenerated, $tilePoint)) {
      return false;
    }

    return true;
  }

  //this checks whether a point has traffic road
  private function cityMapRoadAtPointCheck(array $cityMapGenerated, array $tilePoint): bool
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return false;
    }

    return $this->cityMapTrafficRoadCheck($cityMapGenerated['tileRows'][$tilePoint['y']][$tilePoint['x']]);
  }

  //this checks whether a tile is normal traffic road
  private function cityMapTrafficRoadCheck(array $cityTile): bool
  {
    if ($cityTile['pathKind'] !== CityTileValue::PATH_KIND_ROAD) {
      return false;
    }

    if ($cityTile['roadClass'] === CityTileValue::ROAD_CLASS_NONE) {
      return false;
    }

    if (!$cityTile['walkable']) {
      return false;
    }

    return true;
  }

  //this returns four road neighbor points
  private function cityMapRoadNeighborPointListGet(array $tilePoint): array
  {
    return [
      ['x' => $tilePoint['x'] - 1, 'y' => $tilePoint['y']],
      ['x' => $tilePoint['x'] + 1, 'y' => $tilePoint['y']],
      ['x' => $tilePoint['x'], 'y' => $tilePoint['y'] - 1],
      ['x' => $tilePoint['x'], 'y' => $tilePoint['y'] + 1],
    ];
  }

  //this adds a string to a list only once
  private function stringListValueAdd(array &$valueList, string $value): void
  {
    if (!in_array($value, $valueList, true)) {
      $valueList[] = $value;
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
