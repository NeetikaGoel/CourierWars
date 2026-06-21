<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';

//this class builds 3 x 3 city zones and assigns zone ids to tiles
class CityMapZoneBuilder
{
  //this builds all city zones
  public function cityZoneListBuild(): array
  {
    $cityZoneList = [];

    $zoneColumnCount = MapGenerationConfig::ZONE_COLUMN_COUNT;
    $zoneRowCount = MapGenerationConfig::ZONE_ROW_COUNT;

    $zoneWidthTiles = (int)floor(MapGenerationConfig::MAP_WIDTH_TILES / $zoneColumnCount);
    $zoneHeightTiles = (int)floor(MapGenerationConfig::MAP_HEIGHT_TILES / $zoneRowCount);

    for ($zoneRowIndex = 0; $zoneRowIndex < $zoneRowCount; $zoneRowIndex++) {
      for ($zoneColumnIndex = 0; $zoneColumnIndex < $zoneColumnCount; $zoneColumnIndex++) {
        $zoneId = $this->cityZoneIdFromRowColumnGet($zoneRowIndex, $zoneColumnIndex);

        $startX = $zoneColumnIndex * $zoneWidthTiles;
        $startY = $zoneRowIndex * $zoneHeightTiles;

        $endX = $zoneColumnIndex === $zoneColumnCount - 1
          ? MapGenerationConfig::MAP_WIDTH_TILES - 1
          : $startX + $zoneWidthTiles - 1;

        $endY = $zoneRowIndex === $zoneRowCount - 1
          ? MapGenerationConfig::MAP_HEIGHT_TILES - 1
          : $startY + $zoneHeightTiles - 1;

        $cityZoneList[] = [
          'id' => $zoneId,
          'rowIndex' => $zoneRowIndex,
          'columnIndex' => $zoneColumnIndex,
          'startX' => $startX,
          'startY' => $startY,
          'endX' => $endX,
          'endY' => $endY,
          'centerX' => (int)floor(($startX + $endX) / 2),
          'centerY' => (int)floor(($startY + $endY) / 2),
          'bounds' => [
            'startX' => $startX,
            'startY' => $startY,
            'endX' => $endX,
            'endY' => $endY,
          ],
        ];
      }
    }

    return $cityZoneList;
  }

  //this assigns zone ids to every tile in the map
  public function cityTileZoneIdAssign(array &$cityMapGenerated, array $cityZoneList): void
  {
    foreach ($cityMapGenerated['tileRows'] as $tileY => $tileRow) {
      foreach ($tileRow as $tileX => $cityTile) {
        $cityMapGenerated['tileRows'][$tileY][$tileX]['zoneId'] = $this->cityZoneIdFromTilePointGet([
          'x' => $tileX,
          'y' => $tileY,
        ]);
      }
    }

    $cityMapGenerated['zoneList'] = $cityZoneList;
  }

  //this finds zone id for a tile point
  public function cityZoneIdFromTilePointGet(array $tilePoint): string
  {
    $zoneColumnCount = MapGenerationConfig::ZONE_COLUMN_COUNT;
    $zoneRowCount = MapGenerationConfig::ZONE_ROW_COUNT;

    $zoneWidthTiles = (int)floor(MapGenerationConfig::MAP_WIDTH_TILES / $zoneColumnCount);
    $zoneHeightTiles = (int)floor(MapGenerationConfig::MAP_HEIGHT_TILES / $zoneRowCount);

    $zoneColumnIndex = max(0, min($zoneColumnCount - 1, (int)floor($tilePoint['x'] / $zoneWidthTiles)));
    $zoneRowIndex = max(0, min($zoneRowCount - 1, (int)floor($tilePoint['y'] / $zoneHeightTiles)));

    return $this->cityZoneIdFromRowColumnGet($zoneRowIndex, $zoneColumnIndex);
  }

  //this returns one zone by id
  public function cityZoneFromIdGet(array $cityZoneList, string $cityZoneId): ?array
  {
    foreach ($cityZoneList as $cityZone) {
      if (($cityZone['id'] ?? '') === $cityZoneId) {
        return $cityZone;
      }
    }

    return null;
  }

  //this returns all adjacent zones around a source zone
  public function cityZoneAdjacentIdListGet(array $cityZoneList, string $cityZoneId): array
  {
    $cityZoneSource = $this->cityZoneFromIdGet($cityZoneList, $cityZoneId);

    if ($cityZoneSource === null) {
      return [];
    }

    $cityZoneIdList = [];

    foreach ($cityZoneList as $cityZoneCandidate) {
      $rowDistance = abs((int)$cityZoneCandidate['rowIndex'] - (int)$cityZoneSource['rowIndex']);
      $columnDistance = abs((int)$cityZoneCandidate['columnIndex'] - (int)$cityZoneSource['columnIndex']);
      $sourceSame = $cityZoneCandidate['id'] === $cityZoneSource['id'];

      if (!$sourceSame && $rowDistance <= 1 && $columnDistance <= 1) {
        $cityZoneIdList[] = $cityZoneCandidate['id'];
      }
    }

    return $cityZoneIdList;
  }

  //this checks whether tile point is inside a zone
  public function cityZoneTilePointInsideCheck(array $cityZone, array $tilePoint): bool
  {
    $tileXInside = $tilePoint['x'] >= $cityZone['startX'] && $tilePoint['x'] <= $cityZone['endX'];
    $tileYInside = $tilePoint['y'] >= $cityZone['startY'] && $tilePoint['y'] <= $cityZone['endY'];

    return $tileXInside && $tileYInside;
  }

  //this creates stable zone id from row and column
  private function cityZoneIdFromRowColumnGet(int $rowIndex, int $columnIndex): string
  {
    $zoneIndex = $rowIndex * MapGenerationConfig::ZONE_COLUMN_COUNT + $columnIndex;

    return 'zone-' . $zoneIndex;
  }
}
