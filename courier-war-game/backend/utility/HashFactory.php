<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/HashAlgorithmValue.php';

//so what is this going to do now
//this is for safe hashing and random id creation!
class HashFactory
{
    //this function will be returning sha256 hash for tokens stored in cache
    public static function sha256(string $value): string
    {
        return hash(HashAlgorithmValue::SHA256, $value);
    }

    //this will compare 2 hashes hehe
    public static function hashEquals(string $expectedHash, string $actualHash): bool
    {
        return hash_equals($expectedHash, $actualHash);
    }

    //this will create random hex string with secure bytes
    public static function randomHex(int $byteCount): string
    {
        return bin2hex(random_bytes($byteCount));
    }
}
