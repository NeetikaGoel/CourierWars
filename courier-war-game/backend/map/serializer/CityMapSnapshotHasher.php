<?php
declare(strict_types=1);

//this file creates stable hashes for generated map snapshots!!
class CityMapSnapshotHasher
{
    //this creates sha256 hash for a snapshot
    public function snapshotHashCreate(array $snapshot): string
    {
        $stableSnapshot = $snapshot;

        unset($stableSnapshot['generatedAtMs']);
        unset($stableSnapshot['snapshotHash']);

        $json = json_encode($stableSnapshot, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($json === false) 
        {
            return hash('sha256', serialize($stableSnapshot));
        }

        return hash('sha256', $json);
    }
}
