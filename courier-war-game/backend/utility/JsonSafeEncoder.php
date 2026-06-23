<?php
declare(strict_types=1);

//for keeping json encoding and decoding consistent across all files
class JsonSafeEncoder
{
    public const JSON_ENCODE_FLAGS = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;

    //encoding array data into json string
    public static function encode(array $data): string
    {
        return self::encodeMixed($data);
    }

    //encoding any json-safe data into json string
    public static function encodeMixed(mixed $data): string
    {
        $json = json_encode($data, self::JSON_ENCODE_FLAGS);
        if ($json === false) {
            throw new RuntimeException('JSON Encoding failed!!');
        }
        return $json;
    }

    //decoding json obj into associative array
    public static function decodeToArray(string $json): ?array
    {
        $decoded = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return null;
        }
        return $decoded;
    }
}
