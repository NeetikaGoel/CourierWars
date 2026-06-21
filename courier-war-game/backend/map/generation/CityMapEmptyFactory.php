<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/../type/CityTileValue.php';

//this class creates the blank city map before roads and features are added
class CityMapEmptyFactory
{
  //this creates a complete empty generated map shell
  public function cityMapEmptyCreate(int $seed = MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT): array
  {
    return [
      'widthTiles' => MapGenerationConfig::MAP_WIDTH_TILES,
      'heightTiles' => MapGenerationConfig::MAP_HEIGHT_TILES,
      'tileRows' => $this->cityTileRowsEmptyCreate(),
      'zoneList' => [],
      'trafficSignalList' => [],
      'startTilePoint' => ['x' => 0, 'y' => 0],
      'deliveryTilePoint' => ['x' => 0, 'y' => 0],
      'metadata' => [
        'seed' => $seed,
        'attemptCount' => 1,
        'generatedAtMs' => $this->currentTimeMs(),
        'validationWarningCount' => 0,
      ],
    ];
  }

  //this creates all tile rows
  private function cityTileRowsEmptyCreate(): array
  {
    $tileRows = [];

    for ($tileY = 0; $tileY < MapGenerationConfig::MAP_HEIGHT_TILES; $tileY++) {
      $tileRow = [];

      for ($tileX = 0; $tileX < MapGenerationConfig::MAP_WIDTH_TILES; $tileX++) {
        $tileRow[] = $this->cityTileEmptyCreate(['x' => $tileX, 'y' => $tileY]);
      }

      $tileRows[] = $tileRow;
    }

    return $tileRows;
  }

  //this creates one default city tile
  public function cityTileEmptyCreate(array $tilePoint): array
  {
    return [
      'x' => (int)$tilePoint['x'],
      'y' => (int)$tilePoint['y'],
      'terrainType' => CityTileValue::TERRAIN_BUILDING,
      'roadClass' => CityTileValue::ROAD_CLASS_NONE,
      'pathKind' => CityTileValue::PATH_KIND_NONE,
      'featureKindList' => [],
      'zoneId' => '',
      'walkable' => false,
      'baseMovementCost' => 999999,
      'intersectionId' => null,
      'trafficSignalId' => null,
      'bridgeId' => null,
      'tunnelId' => null,
      'shortcutId' => null,
      'tunnelEntrance' => false,
      'shortcutEntrance' => false,
      'bridgeEntrance' => false,
      'start' => false,
      'delivery' => false,
      'visualVariant' => 'default',
      'routeIdList' => [],
      'hurdleCandidateList' => [],
    ];
  }

  //this returns current time in milliseconds
  private function currentTimeMs(): int
  {
    return (int)floor(microtime(true) * 1000);
  }
}
