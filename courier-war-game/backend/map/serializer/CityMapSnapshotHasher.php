<?php
declare(strict_types=1);

require_once __DIR__ . '/../../utility/HashFactory.php';
require_once __DIR__ . '/../../utility/Clock.php';
require_once __DIR__ . '/../../utility/JsonSafeEncoder.php';

//this file creates stable hashes for generated map snapshots!!
class CityMapSnapshotHasher
{
    private const GENERATED_AT_FIELD = 'generatedAtMs';
    private const SNAPSHOT_HASH_FIELD = 'snapshotHash';

    //this creates sha256 hash for a snapshot
    public function snapshotHashCreate(array $snapshot): string
    {
        $stableSnapshot = $snapshot;

        unset($stableSnapshot[self::GENERATED_AT_FIELD]);
        unset($stableSnapshot[self::SNAPSHOT_HASH_FIELD]);

        try {
            return HashFactory::sha256(JsonSafeEncoder::encode($stableSnapshot));
        } catch (Throwable) {
            return HashFactory::sha256(serialize($stableSnapshot));
        }
    }
}
