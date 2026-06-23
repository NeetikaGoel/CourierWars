<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/MapGenerationConfig.php';
require_once __DIR__ . '/../map/serializer/CityMapSnapshotSerializer.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';

//this service owns backend map generation entry points
class MapGenerationService
{
    private CityMapSnapshotSerializer $_snapshotSerializer;

    public function __construct(?CityMapSnapshotSerializer $snapshotSerializer = null)
    {
        $this->_snapshotSerializer = $snapshotSerializer ?? new CityMapSnapshotSerializer();
    }

    //this returns map metadata without generating a full map
    public function currentMapMetadataGet(): array
    {
        return [
            'map' => MapGenerationConfig::mapMetadata(),
            'featureCountRanges' => MapGenerationConfig::featureCountRanges(),
            'preview' => [
                'seedDefault' => MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT,
                'endpoint' => '/api/v1/maps/preview?seed=' . MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT,
            ],
        ];
    }

    //this generates one preview map for frontend rendering
    public function previewMapGenerate(?string $seedRaw): array
    {
        $seed = $this->seedResolve($seedRaw);

        $cityMapGenerated = $this->cityMapGeneratedCreate($seed);

        return $this->_snapshotSerializer->snapshotCreate($cityMapGenerated);
    }

    //this calls the PHP map generator builder
    private function cityMapGeneratedCreate(int $seed): array
    {
        $builderPath = __DIR__ . '/../map/generation/CityMapGenerationBuilder.php';

        if (!is_file($builderPath)) {
            throw new RuntimeException('backend PHP map generator files are missing, add Batch 4 map generation files first');
        }

        require_once $builderPath;

        if (!class_exists('CityMapGenerationBuilder')) {
            throw new RuntimeException('CityMapGenerationBuilder class was not found after loading generator file');
        }

        $builder = new CityMapGenerationBuilder();

        if (method_exists($builder, 'cityMapGenerate')) {
            return $this->generatedMapToArray($builder->cityMapGenerate($seed));
        }

        if (method_exists($builder, 'generate')) {
            return $this->generatedMapToArray($builder->generate($seed));
        }

        throw new RuntimeException('CityMapGenerationBuilder must expose cityMapGenerate or generate method');
    }

    //this converts generator output to array safely
    private function generatedMapToArray($cityMapGenerated): array
    {
        if (is_array($cityMapGenerated)) {
            return $cityMapGenerated;
        }

        $json = JsonSafeEncoder::encodeMixed($cityMapGenerated);
        $decoded = json_decode($json, true);

        if (!is_array($decoded)) {
            throw new RuntimeException('generated map could not be converted to array');
        }

        return $decoded;
    }

    //this validates and clamps seed from query string
    private function seedResolve(?string $seedRaw): int
    {
        if ($seedRaw === null || trim($seedRaw) === '') {
            return MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT;
        }

        if (!ctype_digit($seedRaw)) {
            return MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT;
        }

        $seed = (int)$seedRaw;

        if ($seed < MapGenerationConfig::MAP_SEED_MIN) {
            return MapGenerationConfig::MAP_SEED_MIN;
        }

        if ($seed > MapGenerationConfig::MAP_SEED_MAX) {
            return MapGenerationConfig::MAP_SEED_MAX;
        }

        return $seed;
    }
}
