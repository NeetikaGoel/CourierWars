<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/MapGenerationConfig.php';
require_once __DIR__ . '/CityMapSnapshotHasher.php';

//this file converts generated map arrays into readable backend API payloads
class CityMapSnapshotSerializer
{
    private CityMapSnapshotHasher $_snapshotHasher;

    public function __construct(?CityMapSnapshotHasher $snapshotHasher = null)
    {
        $this->_snapshotHasher = $snapshotHasher ?? new CityMapSnapshotHasher();
    }

    //this creates the payload shape expected by frontend BackendCityMapPayloadType
    public function snapshotCreate(array $cityMapGenerated): array
    {
        $metadata = $cityMapGenerated['metadata'] ?? [];

        $snapshot = [
            'mapVersion' => MapGenerationConfig::MAP_VERSION,
            'mapGenerationVersion' => MapGenerationConfig::MAP_GENERATION_VERSION,
            'mapSeed' => (int)($metadata['seed'] ?? $cityMapGenerated['mapSeed'] ?? MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT),
            'widthTiles' => (int)($cityMapGenerated['widthTiles'] ?? MapGenerationConfig::MAP_WIDTH_TILES),
            'heightTiles' => (int)($cityMapGenerated['heightTiles'] ?? MapGenerationConfig::MAP_HEIGHT_TILES),
            'tileRows' => $this->tileRowsNormalize($cityMapGenerated['tileRows'] ?? []),
            'zoneList' => $this->zoneListNormalize($cityMapGenerated['zoneList'] ?? []),
            'trafficSignalList' => $this->trafficSignalListNormalize($cityMapGenerated['trafficSignalList'] ?? []),
            'startTilePoint' => $this->tilePointNormalize($cityMapGenerated['startTilePoint'] ?? ['x' => 0, 'y' => 0]),
            'deliveryTilePoint' => $this->tilePointNormalize($cityMapGenerated['deliveryTilePoint'] ?? ['x' => 0, 'y' => 0]),
            'generatedAtMs' => (int)($metadata['generatedAtMs'] ?? $this->currentTimeMs()),
            'attemptCount' => (int)($metadata['attemptCount'] ?? 1),
            'validation' => $this->validationNormalize($cityMapGenerated),
        ];

        $snapshot['snapshotHash'] = $this->_snapshotHasher->snapshotHashCreate($snapshot);

        return $snapshot;
    }

    //this normalizes all tile rows
    private function tileRowsNormalize(array $tileRows): array
    {
        $normalizedRows = [];

        foreach ($tileRows as $row) {
            $normalizedRow = [];

            if (!is_array($row)) {
                continue;
            }

            foreach ($row as $tile) {
                if (!is_array($tile)) {
                    continue;
                }

                $normalizedRow[] = $this->tileNormalize($tile);
            }
            $normalizedRows[] = $normalizedRow;
        }
        return $normalizedRows;
    }

    //this normalizes one tile
    private function tileNormalize(array $tile): array
    {
        return [
            'x' => (int)($tile['x'] ?? 0),
            'y' => (int)($tile['y'] ?? 0),
            'terrainType' => (string)($tile['terrainType'] ?? 'building'),
            'roadClass' => (string)($tile['roadClass'] ?? 'none'),
            'pathKind' => (string)($tile['pathKind'] ?? 'none'),
            'featureKindList' => $this->stringListNormalize($tile['featureKindList'] ?? []),
            'zoneId' => (string)($tile['zoneId'] ?? 'zone-0'),
            'walkable' => (bool)($tile['walkable'] ?? false),
            'baseMovementCost' => (float)($tile['baseMovementCost'] ?? 1),
            'intersectionId' => $this->nullableStringNormalize($tile['intersectionId'] ?? null),
            'trafficSignalId' => $this->nullableStringNormalize($tile['trafficSignalId'] ?? null),
            'bridgeId' => $this->nullableStringNormalize($tile['bridgeId'] ?? null),
            'tunnelId' => $this->nullableStringNormalize($tile['tunnelId'] ?? null),
            'shortcutId' => $this->nullableStringNormalize($tile['shortcutId'] ?? null),
            'tunnelEntrance' => (bool)($tile['tunnelEntrance'] ?? false),
            'shortcutEntrance' => (bool)($tile['shortcutEntrance'] ?? false),
            'bridgeEntrance' => (bool)($tile['bridgeEntrance'] ?? false),
            'start' => (bool)($tile['start'] ?? false),
            'delivery' => (bool)($tile['delivery'] ?? false),
            'visualVariant' => (string)($tile['visualVariant'] ?? 'default'),
            'routeIdList' => $this->stringListNormalize($tile['routeIdList'] ?? []),
            'hurdleCandidateList' => $this->stringListNormalize($tile['hurdleCandidateList'] ?? []),
        ];
    }

    //this normalizes all zones
    private function zoneListNormalize(array $zoneList): array
    {
        $normalizedZoneList = [];

        foreach ($zoneList as $zone) {
            if (!is_array($zone)) {
                continue;
            }

            $startX = (int)($zone['startX'] ?? 0);
            $startY = (int)($zone['startY'] ?? 0);
            $endX = (int)($zone['endX'] ?? $startX);
            $endY = (int)($zone['endY'] ?? $startY);

            $normalizedZoneList[] = [
                'id' => (string)($zone['id'] ?? $zone['zoneId'] ?? 'zone-0'),
                'rowIndex' => (int)($zone['rowIndex'] ?? 0),
                'columnIndex' => (int)($zone['columnIndex'] ?? 0),
                'startX' => $startX,
                'startY' => $startY,
                'endX' => $endX,
                'endY' => $endY,
                'centerX' => (int)($zone['centerX'] ?? floor(($startX + $endX) / 2)),
                'centerY' => (int)($zone['centerY'] ?? floor(($startY + $endY) / 2)),
                'bounds' => [
                    'startX' => $startX,
                    'startY' => $startY,
                    'endX' => $endX,
                    'endY' => $endY,
                ],
            ];
        }

        return $normalizedZoneList;
    }

    //this normalizes traffic signals
    private function trafficSignalListNormalize(array $trafficSignalList): array
    {
        $normalizedSignalList = [];

        foreach ($trafficSignalList as $signal) {
            if (!is_array($signal)) {
                continue;
            }

            $normalizedSignalList[] = [
                'id' => (string)($signal['id'] ?? ''),
                'tilePoint' => $this->tilePointNormalize($signal['tilePoint'] ?? ['x' => 0, 'y' => 0]),
                'intersectionId' => (string)($signal['intersectionId'] ?? ''),
            ];
        }

        return $normalizedSignalList;
    }

    //this normalizes one tile point
    private function tilePointNormalize(array $tilePoint): array
    {
        return [
            'x' => (int)($tilePoint['x'] ?? 0),
            'y' => (int)($tilePoint['y'] ?? 0),
        ];
    }

    //this creates validation payload
    private function validationNormalize(array $cityMapGenerated): array
    {
        $validation = $cityMapGenerated['validation'] ?? null;

        if (is_array($validation)) {
            return [
                'valid' => (bool)($validation['valid'] ?? true),
                'errorList' => $validation['errorList'] ?? [],
                'warningList' => $validation['warningList'] ?? [],
                'stats' => $validation['stats'] ?? $this->statsCreate($cityMapGenerated),
            ];
        }

        return [
            'valid' => true,
            'errorList' => [],
            'warningList' => [],
            'stats' => $this->statsCreate($cityMapGenerated),
        ];
    }

    //this creates useful map counts for debug
    private function statsCreate(array $cityMapGenerated): array
    {
        $stats = [
            'walkableTileCount' => 0,
            'trafficSignalCount' => count($cityMapGenerated['trafficSignalList'] ?? []),
            'terrainCountByType' => [],
            'roadCountByClass' => [],
            'pathCountByKind' => [],
        ];

        foreach (($cityMapGenerated['tileRows'] ?? []) as $row) {
            if (!is_array($row)) {
                continue;
            }

            foreach ($row as $tile) {
                if (!is_array($tile)) {
                    continue;
                }

                if ((bool)($tile['walkable'] ?? false)) {
                    $stats['walkableTileCount']++;
                }

                $terrainType = (string)($tile['terrainType'] ?? 'building');
                $roadClass = (string)($tile['roadClass'] ?? 'none');
                $pathKind = (string)($tile['pathKind'] ?? 'none');

                $stats['terrainCountByType'][$terrainType] = ($stats['terrainCountByType'][$terrainType] ?? 0) + 1;
                $stats['roadCountByClass'][$roadClass] = ($stats['roadCountByClass'][$roadClass] ?? 0) + 1;
                $stats['pathCountByKind'][$pathKind] = ($stats['pathCountByKind'][$pathKind] ?? 0) + 1;
            }
        }

        return $stats;
    }

    //this normalizes any list into a string list
    private function stringListNormalize($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return array_values(array_map('strval', $value));
    }

    //this keeps null values as null and strings as strings
    private function nullableStringNormalize($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string)$value;
    }

    //this returns current time in milliseconds
    private function currentTimeMs(): int
    {
        return (int)floor(microtime(true) * 1000);
    }
}
