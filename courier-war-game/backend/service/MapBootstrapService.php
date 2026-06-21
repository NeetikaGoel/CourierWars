<?php
declare(strict_types=1);

require_once __DIR__ . '/../cache/CacheServerClient.php';
require_once __DIR__ . '/../cache/CacheServerKeyFactory.php';
require_once __DIR__ . '/../cache/CacheServerTtlConfig.php';
require_once __DIR__ . '/../config/MapGenerationConfig.php';
require_once __DIR__ . '/../utility/Clock.php';
require_once __DIR__ . '/MapGenerationService.php';

//this service pre-generates maps and stores them in cache
class MapBootstrapService
{
    private CacheServerClient $_cacheServerClient; // cache client
    private MapGenerationService $_mapGenerationService; // map generator service

    //constructor creates dependencies
    public function __construct(?CacheServerClient $cacheServerClient = null, ?MapGenerationService $mapGenerationService = null)
    {
        $this->_cacheServerClient = $cacheServerClient ?? new CacheServerClient();
        $this->_mapGenerationService = $mapGenerationService ?? new MapGenerationService();
    }

    //this generates bootstrap maps and stores them in cache
    public function bootstrapMapsStore(?int $mapCount = null): array
    {
        $count = $mapCount ?? MapGenerationConfig::GENERATED_MAP_COUNT_INITIAL;
        $storedItems = [];

        for ($index = 0; $index < $count; $index++) {
            $seed = $this->seedForIndexGet($index);
            $mapSnapshot = $this->_mapGenerationService->previewMapGenerate((string)$seed);
            $mapKey = CacheServerKeyFactory::mapBootstrapItemKey(MapGenerationConfig::MAP_VERSION, $index);

            $this->_cacheServerClient->cacheSet(
                $mapKey,
                $mapSnapshot,
                CacheServerTtlConfig::bootstrapMapTtlSeconds()
            );

            $storedItems[] = [
                'index' => $index,
                'cacheKey' => $mapKey,
                'mapSeed' => $mapSnapshot['mapSeed'] ?? $seed,
                'snapshotHash' => $mapSnapshot['snapshotHash'] ?? null,
            ];
        }

        $listPayload = [
            'mapVersion' => MapGenerationConfig::MAP_VERSION,
            'mapGenerationVersion' => MapGenerationConfig::MAP_GENERATION_VERSION,
            'mapCount' => count($storedItems),
            'generatedAtMs' => Clock::unixMilliseconds(),
            'items' => $storedItems,
        ];

        $this->_cacheServerClient->cacheSet(
            CacheServerKeyFactory::mapBootstrapListKey(MapGenerationConfig::MAP_VERSION),
            $listPayload,
            CacheServerTtlConfig::bootstrapMapTtlSeconds()
        );

        return $listPayload;
    }

    //this gets bootstrap map list from cache
    public function bootstrapMapListGet(): ?array
    {
        $value = $this->_cacheServerClient->cacheGet(
            CacheServerKeyFactory::mapBootstrapListKey(MapGenerationConfig::MAP_VERSION)
        );

        return is_array($value) ? $value : null;
    }

    //this gets one bootstrap map by index
    public function bootstrapMapGet(int $mapIndex): ?array
    {
        $value = $this->_cacheServerClient->cacheGet(
            CacheServerKeyFactory::mapBootstrapItemKey(MapGenerationConfig::MAP_VERSION, $mapIndex)
        );

        return is_array($value) ? $value : null;
    }

    //this stores active match map in cache
    public function activeMatchMapStore(int $matchId, array $mapSnapshot, int $timerTotalMs): void
    {
        $this->_cacheServerClient->cacheSet(
            CacheServerKeyFactory::matchMapKey($matchId),
            $mapSnapshot,
            CacheServerTtlConfig::activeMatchMapTtlSeconds($timerTotalMs)
        );
    }

    //this gets active match map from cache
    public function activeMatchMapGet(int $matchId): ?array
    {
        $value = $this->_cacheServerClient->cacheGet(
            CacheServerKeyFactory::matchMapKey($matchId)
        );

        return is_array($value) ? $value : null;
    }

    //this returns deterministic seed for bootstrap index
    private function seedForIndexGet(int $index): int
    {
        $seed = MapGenerationConfig::PREVIEW_MAP_SEED_DEFAULT + ($index * MapGenerationConfig::GENERATION_RETRY_SEED_OFFSET);

        if ($seed > MapGenerationConfig::MAP_SEED_MAX) {
            $seed = MapGenerationConfig::MAP_SEED_MIN + ($seed % MapGenerationConfig::MAP_SEED_MAX);
        }

        return $seed;
    }
}
