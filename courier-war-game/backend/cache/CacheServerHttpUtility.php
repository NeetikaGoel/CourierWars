<?php
declare(strict_types=1);

//imp imports first
require_once __DIR__ . '/../config/CacheServerConfig.php';
require_once __DIR__ . '/../constants/HttpStatusCode.php';
require_once __DIR__ . '/../constants/TimeValue.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';

//so what this file needs to do
//it has job to keep cache server http formatting in 1 place
class CacheServerHttpUtility
{
    //this builds request headers for cache server
    public static function headersBuild(bool $hasBody, string $apiKey): array
    {
        $headers = [
            CacheServerConfig::CACHE_REQUEST_ACCEPT_HEADER,
        ];

        if ($hasBody) {
            $headers[] = CacheServerConfig::CACHE_REQUEST_CONTENT_TYPE_HEADER;
        }

        if ($apiKey !== '') {
            $headers[] = CacheServerConfig::authHeaderName() . ': ' . $apiKey;
        }

        return $headers;
    }

    //the function will be building php stream context for http request
    public static function streamContextBuild(string $method, array $headers, ?array $body, int $timeoutMs): mixed
    {
        $options = [
            'http' => [
                'method' => strtoupper($method),
                'header' => implode(CacheServerConfig::CACHE_HTTP_HEADER_SEPARATOR, $headers),
                'timeout' => max(
                    CacheServerConfig::CACHE_REQUEST_TIMEOUT_SECONDS_MIN,
                    (int)ceil($timeoutMs / TimeValue::MILLISECONDS_PER_SECOND)
                ),
                'ignore_errors' => true,
            ],
        ];

        if ($body !== null) {
            $options['http']['content'] = JsonSafeEncoder::encode($body);
        }

        return stream_context_create($options);
    }

    //so a func to send http status code from response headers
    public static function statusCodeFromHeadersGet(array $responseHeaders): int
    {
        $statusLine = (string)($responseHeaders[0] ?? '');

        if (preg_match(CacheServerConfig::CACHE_HTTP_STATUS_LINE_REGEX, $statusLine, $matches) !== 1) {
            return CacheServerConfig::CACHE_HTTP_STATUS_CODE_DEFAULT;
        }

        return (int)$matches[1];
    }

    //now to check ofc if cache response status is success or not
    public static function statusCodeSuccess(int $statusCode): bool
    {
        return $statusCode >= HttpStatusCode::OK && $statusCode < HttpStatusCode::MULTIPLE_CHOICES;
    }

    //to check if key is already missing 
    public static function statusCodeMissing(int $statusCode): bool
    {
        return $statusCode === HttpStatusCode::NOT_FOUND;
    }
}
