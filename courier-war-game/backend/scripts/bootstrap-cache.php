<?php
declare(strict_types=1);

//this script generates bootstrap maps and stores them in cache before backend gameplay starts
require_once __DIR__ . '/../service/MapBootstrapService.php';
require_once __DIR__ . '/../config/MapGenerationConfig.php';

try {
    $mapCountRaw = $argv[1] ?? null;
    $mapCount = $mapCountRaw !== null && ctype_digit((string)$mapCountRaw)
        ? (int)$mapCountRaw
        : MapGenerationConfig::GENERATED_MAP_COUNT_INITIAL;

    $mapBootstrapService = new MapBootstrapService();
    $result = $mapBootstrapService->bootstrapMapsStore($mapCount);

    echo json_encode(
        [
            'success' => true,
            'message' => 'cache bootstrap completed',
            'data' => $result,
        ],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
    ) . PHP_EOL;

    exit(0);
} catch (Throwable $throwable) {
    echo json_encode(
        [
            'success' => false,
            'message' => 'cache bootstrap failed',
            'error' => $throwable->getMessage(),
        ],
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
    ) . PHP_EOL;

    exit(1);
}
