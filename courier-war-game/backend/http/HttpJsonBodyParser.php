<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/HttpRequestValue.php';

//this helper will have to parse json body and keeping httpreq smaller
class HttpJsonBodyParser
{
    //decoding raw json body into parser result
    public static function jsonBodyParse(string $rawBody): array
    {
        if (trim($rawBody) === '') {
            return [
                'jsonBody' => [],
                'jsonDecodeError' => null,
            ];
        }

        $decodedBody = json_decode($rawBody, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'jsonBody' => null,
                'jsonDecodeError' => json_last_error_msg(),
            ];
        }

        if (!is_array($decodedBody)) {
            return [
                'jsonBody' => null,
                'jsonDecodeError' => HttpRequestValue::JSON_BODY_SHAPE_ERROR_MESSAGE,
            ];
        }

        return [
            'jsonBody' => $decodedBody,
            'jsonDecodeError' => null,
        ];
    }
}
