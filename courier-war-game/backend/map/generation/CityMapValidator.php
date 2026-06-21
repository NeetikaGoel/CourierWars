<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';
require_once __DIR__ . '/../../constants/HurdleTypeValue.php';

//this class validates generated maps before backend sends them to frontend
class CityMapValidator
{
  private const ISSUE_DELIVERY_UNREACHABLE = 'deliveryUnreachable';
  private const ISSUE_ZONE_ROAD_COVERAGE_MISSING = 'zoneRoadCoverageMissing';
  private const ISSUE_TRAFFIC_SIGNAL_INVALID_TILE = 'trafficSignalInvalidTile';
  private const ISSUE_TRAFFIC_SIGNAL_TOO_CLOSE = 'trafficSignalTooClose';
  private const ISSUE_BRIDGE_NOT_ON_WATER = 'bridgeNotOnWater';
  private const ISSUE_BRIDGE_DISCONNECTED = 'bridgeDisconnected';
  private const ISSUE_TUNNEL_DISCONNECTED = 'tunnelDisconnected';
  private const ISSUE_SHORTCUT_DISCONNECTED = 'shortcutDisconnected';
  private const ISSUE_LAKE_SHAPE_INVALID = 'lakeShapeInvalid';
  private const ISSUE_HURDLE_CANDIDATE_INVALID = 'hurdleCandidateInvalid';
  private const ISSUE_ROAD_CONNECTIVITY_INVALID = 'roadConnectivityInvalid';

  //this validates full generated city map
  public function cityMapValidate(array $cityMapGenerated): array
  {
    $errorList = [];
    $warningList = [];

    $stats = $this->cityMapGenerationStatsCreate($cityMapGenerated);

    $this->cityMapStartDeliveryValidate($cityMapGenerated, $errorList);
    $this->cityMapStartDeliveryReachabilityValidate($cityMapGenerated, $errorList);
    $this->cityMapZoneRoadCoverageValidate($cityMapGenerated, $warningList);
    $this->cityMapTrafficSignalListValidate($cityMapGenerated, $errorList, $warningList);
    $this->cityMapBridgeListValidate($cityMapGenerated, $errorList, $warningList);
    $this->cityMapTunnelListValidate($cityMapGenerated, $warningList);
    $this->cityMapShortcutListValidate($cityMapGenerated, $warningList);
    $this->cityMapHurdleCandidateListValidate($cityMapGenerated, $errorList);

    return [
      'valid' => count($errorList) === 0,
      'errorList' => $errorList,
      'warningList' => $warningList,
      'stats' => $stats,
    ];
  }

  //this validates start and delivery exist on valid road tiles
  private function cityMapStartDeliveryValidate(array $cityMapGenerated, array &$errorList): void
  {
    $startTile = $this->cityMapTileGet($cityMapGenerated, $cityMapGenerated['startTilePoint'] ?? null);
    $deliveryTile = $this->cityMapTileGet($cityMapGenerated, $cityMapGenerated['deliveryTilePoint'] ?? null);

    if ($startTile === null || !$this->cityMapStartDeliveryTileValidCheck($startTile) || !$startTile['start']) {
      $this->issueAdd($errorList, self::ISSUE_ROAD_CONNECTIVITY_INVALID, 'start tile is missing or invalid', $cityMapGenerated['startTilePoint'] ?? null);
    }

    if ($deliveryTile === null || !$this->cityMapStartDeliveryTileValidCheck($deliveryTile) || !$deliveryTile['delivery']) {
      $this->issueAdd($errorList, self::ISSUE_ROAD_CONNECTIVITY_INVALID, 'delivery tile is missing or invalid', $cityMapGenerated['deliveryTilePoint'] ?? null);
    }
  }

  //this validates delivery is reachable from start
  private function cityMapStartDeliveryReachabilityValidate(array $cityMapGenerated, array &$errorList): void
  {
    $startPoint = $cityMapGenerated['startTilePoint'] ?? null;
    $deliveryPoint = $cityMapGenerated['deliveryTilePoint'] ?? null;

    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $startPoint) || !$this->cityMapTileExistsCheck($cityMapGenerated, $deliveryPoint)) {
      $this->issueAdd($errorList, self::ISSUE_DELIVERY_UNREACHABLE, 'start or delivery point is outside map');
      return;
    }

    if (!$this->cityMapReachableCheck($cityMapGenerated, $startPoint, $deliveryPoint)) {
      $this->issueAdd($errorList, self::ISSUE_DELIVERY_UNREACHABLE, 'delivery is not reachable from start', $deliveryPoint);
    }
  }

  //this checks if every zone has useful walkable roads
  private function cityMapZoneRoadCoverageValidate(array $cityMapGenerated, array &$warningList): void
  {
    foreach (($cityMapGenerated['zoneList'] ?? []) as $cityZone) {
      $roadTileCount = 0;

      for ($tileY = $cityZone['startY']; $tileY <= $cityZone['endY']; $tileY++) {
        for ($tileX = $cityZone['startX']; $tileX <= $cityZone['endX']; $tileX++) {
          if (!$this->cityMapTileExistsCheck($cityMapGenerated, ['x' => $tileX, 'y' => $tileY])) {
            continue;
          }

          $cityTile = $cityMapGenerated['tileRows'][$tileY][$tileX];

          if ($cityTile['walkable'] && $cityTile['pathKind'] === CityTileValue::PATH_KIND_ROAD) {
            $roadTileCount++;
          }
        }
      }

      if ($roadTileCount < 20) {
        $this->issueAdd(
          $warningList,
          self::ISSUE_ZONE_ROAD_COVERAGE_MISSING,
          'zone has low road coverage',
          ['x' => $cityZone['centerX'], 'y' => $cityZone['centerY']],
          $cityZone['id']
        );
      }
    }
  }

  //this validates all traffic signal tiles
  private function cityMapTrafficSignalListValidate(array $cityMapGenerated, array &$errorList, array &$warningList): void
  {
    $trafficSignalList = $cityMapGenerated['trafficSignalList'] ?? [];

    foreach ($trafficSignalList as $trafficSignalIndex => $trafficSignal) {
      $tilePoint = $trafficSignal['tilePoint'] ?? null;
      $cityTile = $this->cityMapTileGet($cityMapGenerated, $tilePoint);

      if ($cityTile === null || !$this->cityMapTrafficSignalTileValidCheck($cityTile)) {
        $this->issueAdd($errorList, self::ISSUE_TRAFFIC_SIGNAL_INVALID_TILE, 'traffic signal is placed on invalid tile', $tilePoint, $trafficSignal['id'] ?? null);
        continue;
      }

      if (($cityTile['trafficSignalId'] ?? null) !== ($trafficSignal['id'] ?? null)) {
        $this->issueAdd($errorList, self::ISSUE_TRAFFIC_SIGNAL_INVALID_TILE, 'traffic signal id does not match tile state', $tilePoint, $trafficSignal['id'] ?? null);
      }

      for ($otherIndex = $trafficSignalIndex + 1; $otherIndex < count($trafficSignalList); $otherIndex++) {
        $otherSignal = $trafficSignalList[$otherIndex];
        $distanceTiles = $this->cityTileDistanceManhattanGet($tilePoint, $otherSignal['tilePoint'] ?? null);

        if ($distanceTiles < MapGenerationConfig::TRAFFIC_SIGNAL_DISTANCE_MIN_TILES) {
          $this->issueAdd($warningList, self::ISSUE_TRAFFIC_SIGNAL_TOO_CLOSE, 'traffic signals are too close together', $tilePoint, $trafficSignal['id'] ?? null);
        }
      }
    }
  }

  //this validates bridge body and bridge entrances
  private function cityMapBridgeListValidate(array $cityMapGenerated, array &$errorList, array &$warningList): void
  {
    $bridgeTileListById = [];

    foreach ($cityMapGenerated['tileRows'] as $tileRow) {
      foreach ($tileRow as $cityTile) {
        if (($cityTile['pathKind'] ?? '') !== CityTileValue::PATH_KIND_BRIDGE) {
          continue;
        }

        $bridgeId = (string)($cityTile['bridgeId'] ?? '');

        if ($bridgeId === '') {
          $this->issueAdd($errorList, self::ISSUE_BRIDGE_DISCONNECTED, 'bridge tile has no bridge id', ['x' => $cityTile['x'], 'y' => $cityTile['y']]);
          continue;
        }

        $bridgeTileListById[$bridgeId][] = $cityTile;

        if (($cityTile['terrainType'] ?? '') !== CityTileValue::TERRAIN_WATER) {
          $this->issueAdd($errorList, self::ISSUE_BRIDGE_NOT_ON_WATER, 'bridge body is not on water', ['x' => $cityTile['x'], 'y' => $cityTile['y']], $bridgeId);
        }
      }
    }

    foreach ($bridgeTileListById as $bridgeId => $bridgeTileList) {
      $entranceCount = 0;

      foreach ($bridgeTileList as $bridgeTile) {
        if ($bridgeTile['bridgeEntrance']) {
          $entranceCount++;
        }
      }

      if ($entranceCount < 2) {
        $this->issueAdd($warningList, self::ISSUE_BRIDGE_DISCONNECTED, 'bridge has fewer than two marked entrances', null, $bridgeId);
      }
    }
  }

  //this validates tunnel entrances and path shape
  private function cityMapTunnelListValidate(array $cityMapGenerated, array &$warningList): void
  {
    $tunnelInfoById = [];

    foreach ($cityMapGenerated['tileRows'] as $tileRow) {
      foreach ($tileRow as $cityTile) {
        $tunnelId = $cityTile['tunnelId'] ?? null;

        if ($tunnelId === null) {
          continue;
        }

        if (!isset($tunnelInfoById[$tunnelId])) {
          $tunnelInfoById[$tunnelId] = [
            'tileCount' => 0,
            'entranceCount' => 0,
            'buildingLikeCount' => 0,
          ];
        }

        if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_TUNNEL) {
          $tunnelInfoById[$tunnelId]['tileCount']++;
        }

        if ($cityTile['tunnelEntrance']) {
          $tunnelInfoById[$tunnelId]['entranceCount']++;
        }

        if ($cityTile['terrainType'] === CityTileValue::TERRAIN_BUILDING || $cityTile['pathKind'] === CityTileValue::PATH_KIND_TUNNEL) {
          $tunnelInfoById[$tunnelId]['buildingLikeCount']++;
        }
      }
    }

    foreach ($tunnelInfoById as $tunnelId => $tunnelInfo) {
      if ($tunnelInfo['tileCount'] < 2 || $tunnelInfo['entranceCount'] < 2) {
        $this->issueAdd($warningList, self::ISSUE_TUNNEL_DISCONNECTED, 'tunnel has weak path or missing entrances', null, $tunnelId);
      }
    }
  }

  //this validates shortcut entrances and path shape
  private function cityMapShortcutListValidate(array $cityMapGenerated, array &$warningList): void
  {
    $shortcutInfoById = [];

    foreach ($cityMapGenerated['tileRows'] as $tileRow) {
      foreach ($tileRow as $cityTile) {
        $shortcutId = $cityTile['shortcutId'] ?? null;

        if ($shortcutId === null) {
          continue;
        }

        if (!isset($shortcutInfoById[$shortcutId])) {
          $shortcutInfoById[$shortcutId] = [
            'tileCount' => 0,
            'entranceCount' => 0,
          ];
        }

        if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_SHORTCUT) {
          $shortcutInfoById[$shortcutId]['tileCount']++;
        }

        if ($cityTile['shortcutEntrance']) {
          $shortcutInfoById[$shortcutId]['entranceCount']++;
        }
      }
    }

    foreach ($shortcutInfoById as $shortcutId => $shortcutInfo) {
      if ($shortcutInfo['tileCount'] < 2 || $shortcutInfo['entranceCount'] < 2) {
        $this->issueAdd($warningList, self::ISSUE_SHORTCUT_DISCONNECTED, 'shortcut has weak path or missing entrances', null, $shortcutId);
      }
    }
  }

  //this validates hurdle candidates generated on tiles
  private function cityMapHurdleCandidateListValidate(array $cityMapGenerated, array &$errorList): void
  {
    foreach ($cityMapGenerated['tileRows'] as $tileRow) {
      foreach ($tileRow as $cityTile) {
        foreach (($cityTile['hurdleCandidateList'] ?? []) as $hurdleType) {
          if (!$this->cityMapHurdleCandidateValidCheck($cityTile, $hurdleType)) {
            $this->issueAdd(
              $errorList,
              self::ISSUE_HURDLE_CANDIDATE_INVALID,
              'tile has invalid hurdle candidate',
              ['x' => $cityTile['x'], 'y' => $cityTile['y']],
              $hurdleType
            );
          }
        }
      }
    }
  }

  //this checks one hurdle candidate against tile shape
  private function cityMapHurdleCandidateValidCheck(array $cityTile, string $hurdleType): bool
  {
    if ($hurdleType === HurdleTypeValue::RED_TRAFFIC_LIGHT) {
      return $cityTile['trafficSignalId'] !== null;
    }

    if ($hurdleType === HurdleTypeValue::CLOSED_GATE) {
      return !$cityTile['start'] && !$cityTile['delivery'] && ($cityTile['tunnelEntrance'] || $cityTile['shortcutEntrance'] || $cityTile['bridgeEntrance']);
    }

    if ($hurdleType === HurdleTypeValue::WRONG_DIRECTION_SIGN) {
      return !$cityTile['start'] && !$cityTile['delivery'] && ($cityTile['intersectionId'] !== null || $cityTile['tunnelEntrance'] || $cityTile['shortcutEntrance']);
    }

    if (!$this->cityMapGeneralRoadHurdleTileCheck($cityTile)) {
      return false;
    }

    return in_array(
      $hurdleType,
      [
        HurdleTypeValue::ROAD_BLOCK,
        HurdleTypeValue::CONSTRUCTION_WORK,
        HurdleTypeValue::TRAFFIC_JAM,
        HurdleTypeValue::BROKEN_ROAD,
        HurdleTypeValue::MOVING_BARRIER,
        HurdleTypeValue::SECURITY_CHECKPOINT,
      ],
      true
    );
  }

  //this creates useful generation stats
  private function cityMapGenerationStatsCreate(array $cityMapGenerated): array
  {
    $stats = [
      'walkableTileCount' => 0,
      'roadTileCount' => 0,
      'bridgeTileCount' => 0,
      'tunnelTileCount' => 0,
      'shortcutTileCount' => 0,
      'trafficSignalCount' => count($cityMapGenerated['trafficSignalList'] ?? []),
      'hurdleCandidateTileCount' => 0,
    ];

    foreach ($cityMapGenerated['tileRows'] as $tileRow) {
      foreach ($tileRow as $cityTile) {
        if ($cityTile['walkable']) {
          $stats['walkableTileCount']++;
        }

        if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_ROAD) {
          $stats['roadTileCount']++;
        }

        if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_BRIDGE) {
          $stats['bridgeTileCount']++;
        }

        if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_TUNNEL) {
          $stats['tunnelTileCount']++;
        }

        if ($cityTile['pathKind'] === CityTileValue::PATH_KIND_SHORTCUT) {
          $stats['shortcutTileCount']++;
        }

        if (count($cityTile['hurdleCandidateList'] ?? []) > 0) {
          $stats['hurdleCandidateTileCount']++;
        }
      }
    }

    return $stats;
  }

  //this checks start or delivery tile shape
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

    if ($cityTile['tunnelEntrance'] || $cityTile['shortcutEntrance'] || $cityTile['bridgeEntrance']) {
      return false;
    }

    return true;
  }

  //this checks signal tile shape
  private function cityMapTrafficSignalTileValidCheck(array $cityTile): bool
  {
    if ($cityTile['start'] || $cityTile['delivery']) {
      return false;
    }

    if ($cityTile['trafficSignalId'] === null) {
      return false;
    }

    if ($cityTile['pathKind'] !== CityTileValue::PATH_KIND_ROAD) {
      return false;
    }

    if ($cityTile['roadClass'] === CityTileValue::ROAD_CLASS_NONE) {
      return false;
    }

    if ($cityTile['terrainType'] !== CityTileValue::TERRAIN_LAND) {
      return false;
    }

    return true;
  }

  //this checks common road hurdle tile shape
  private function cityMapGeneralRoadHurdleTileCheck(array $cityTile): bool
  {
    if ($cityTile['start'] || $cityTile['delivery']) {
      return false;
    }

    if (!$cityTile['walkable']) {
      return false;
    }

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_WATER && $cityTile['pathKind'] !== CityTileValue::PATH_KIND_BRIDGE) {
      return false;
    }

    if ($cityTile['terrainType'] === CityTileValue::TERRAIN_PARK || $cityTile['terrainType'] === CityTileValue::TERRAIN_BUILDING) {
      return false;
    }

    if ($cityTile['pathKind'] !== CityTileValue::PATH_KIND_ROAD) {
      return false;
    }

    if ($cityTile['roadClass'] === CityTileValue::ROAD_CLASS_NONE) {
      return false;
    }

    return true;
  }

  //this checks reachability using walkable generated paths
  private function cityMapReachableCheck(array $cityMapGenerated, array $startPoint, array $deliveryPoint): bool
  {
    $startKey = $this->tileKeyCreate($startPoint);
    $deliveryKey = $this->tileKeyCreate($deliveryPoint);

    $queue = [$startPoint];
    $visitedByKey = [
      $startKey => true,
    ];

    while (count($queue) > 0) {
      $currentPoint = array_shift($queue);
      $currentKey = $this->tileKeyCreate($currentPoint);

      if ($currentKey === $deliveryKey) {
        return true;
      }

      foreach ($this->neighborPointListGet($currentPoint) as $neighborPoint) {
        if (!$this->cityMapTileExistsCheck($cityMapGenerated, $neighborPoint)) {
          continue;
        }

        $neighborKey = $this->tileKeyCreate($neighborPoint);

        if (isset($visitedByKey[$neighborKey])) {
          continue;
        }

        $neighborTile = $cityMapGenerated['tileRows'][$neighborPoint['y']][$neighborPoint['x']];

        if (!$neighborTile['walkable']) {
          continue;
        }

        $visitedByKey[$neighborKey] = true;
        $queue[] = $neighborPoint;
      }
    }

    return false;
  }

  //this gets tile from generated map
  private function cityMapTileGet(array $cityMapGenerated, ?array $tilePoint): ?array
  {
    if (!$this->cityMapTileExistsCheck($cityMapGenerated, $tilePoint)) {
      return null;
    }

    return $cityMapGenerated['tileRows'][$tilePoint['y']][$tilePoint['x']];
  }

  //this checks tile bounds
  private function cityMapTileExistsCheck(array $cityMapGenerated, ?array $tilePoint): bool
  {
    if ($tilePoint === null) {
      return false;
    }

    return $tilePoint['x'] >= 0
      && $tilePoint['y'] >= 0
      && $tilePoint['x'] < $cityMapGenerated['widthTiles']
      && $tilePoint['y'] < $cityMapGenerated['heightTiles'];
  }

  //this returns four neighbor points
  private function neighborPointListGet(array $tilePoint): array
  {
    return [
      ['x' => $tilePoint['x'] - 1, 'y' => $tilePoint['y']],
      ['x' => $tilePoint['x'] + 1, 'y' => $tilePoint['y']],
      ['x' => $tilePoint['x'], 'y' => $tilePoint['y'] - 1],
      ['x' => $tilePoint['x'], 'y' => $tilePoint['y'] + 1],
    ];
  }

  //this creates stable tile key
  private function tileKeyCreate(array $tilePoint): string
  {
    return $tilePoint['x'] . ',' . $tilePoint['y'];
  }

  //this gets manhattan distance between two points
  private function cityTileDistanceManhattanGet(?array $pointA, ?array $pointB): int
  {
    if ($pointA === null || $pointB === null) {
      return 999999;
    }

    return abs((int)$pointA['x'] - (int)$pointB['x']) + abs((int)$pointA['y'] - (int)$pointB['y']);
  }

  //this adds validation issue
  private function issueAdd(array &$issueList, string $code, string $message, ?array $tilePoint = null, ?string $relatedId = null): void
  {
    $issue = [
      'code' => $code,
      'message' => $message,
    ];

    if ($tilePoint !== null) {
      $issue['tilePoint'] = [
        'x' => (int)$tilePoint['x'],
        'y' => (int)$tilePoint['y'],
      ];
    }

    if ($relatedId !== null) {
      $issue['relatedId'] = $relatedId;
    }

    $issueList[] = $issue;
  }
}
