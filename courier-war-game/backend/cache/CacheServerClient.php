<?php
declare(strict_types=1);

//importing first
require_once __DIR__ . '/../config/CacheServerConfig.php';
require_once __DIR__ . '/../constants/CacheServerEndpointValue.php';
require_once __DIR__ . '/../constants/HttpRequestValue.php';
require_once __DIR__ . '/../utility/JsonSafeEncoder.php';
require_once __DIR__ . '/CacheServerHttpUtility.php';
require_once __DIR__ . '/CacheServerValidationUtility.php';

//this file will be mainly talking to the our cute built php cache server hehe
//finally using it now
class CacheServerClient
{
    //now class will have some variables
    private string $_baseUrl;
    private string $_apiKey;
    private int $_timeoutMs; // request timeout , will be in msec

    //now ofc the constructor 
    //itwil be storing cache server connection config
    public function __construct(?string $baseUrl = null, ?string $apiKey = null, ?int $timeoutMs = null)
    {
        $this->_baseUrl = rtrim($baseUrl ?? CacheServerConfig::baseUrl(), CacheServerConfig::CACHE_URL_PATH_SEPARATOR);
        $this->_apiKey = $apiKey ?? CacheServerConfig::apiKey();
        $this->_timeoutMs = $timeoutMs ?? CacheServerConfig::requestTimeoutMs();
    }

    //now storing 1 cache value
    public function cacheSet(string $key, mixed $value, int $ttlSeconds): bool
    {
        CacheServerValidationUtility::cacheKeyValidate($key);
        CacheServerValidationUtility::cacheValueValidate($value);
        CacheServerValidationUtility::ttlValidate($ttlSeconds);

        $responseEnvelope = $this->requestJson(
            HttpRequestValue::METHOD_POST,
            CacheServerEndpointValue::CACHE_SET,
            [
                CacheServerConfig::CACHE_REQUEST_KEY_FIELD => $key,
                CacheServerConfig::CACHE_REQUEST_VALUE_FIELD => $value,
                CacheServerConfig::CACHE_REQUEST_TTL_FIELD => $ttlSeconds,
            ]
        );
        //was it successful or not
        return (bool)($responseEnvelope[CacheServerConfig::CACHE_RESPONSE_SUCCESS_KEY] ?? false);
    }

    //now getting 1 cache value or null when the little key is missing
    public function cacheGet(string $key): mixed
    {
        CacheServerValidationUtility::cacheKeyValidate($key);

        $rawResponse = $this->requestRaw(
            HttpRequestValue::METHOD_GET,
            CacheServerEndpointValue::CACHE_GET,
            null,
            [
                CacheServerConfig::CACHE_REQUEST_KEY_FIELD => $key,
            ]
        );

        //give error ofc
        if (CacheServerHttpUtility::statusCodeMissing((int)$rawResponse[CacheServerConfig::CACHE_RESPONSE_STATUS_CODE_KEY])) {
            return null;
        }

        $responseEnvelope = $this->responseEnvelopeDecode($rawResponse);

        if (($responseEnvelope[CacheServerConfig::CACHE_RESPONSE_SUCCESS_KEY] ?? false) !== true) {
            return null;
        }

        return $responseEnvelope[CacheServerConfig::CACHE_RESPONSE_DATA_KEY][CacheServerConfig::CACHE_RESPONSE_VALUE_KEY] ?? null;
    }

    //now deleting 1 cache key at a time
    public function cacheDelete(string $key): bool
    {
        CacheServerValidationUtility::cacheKeyValidate($key);

        $responseEnvelope = $this->requestJson(
            HttpRequestValue::METHOD_POST,
            CacheServerEndpointValue::CACHE_DELETE,
            [
                CacheServerConfig::CACHE_REQUEST_KEY_FIELD => $key,
            ]
        );

        return (bool)($responseEnvelope[CacheServerConfig::CACHE_RESPONSE_SUCCESS_KEY] ?? false);
    }

    //also health check to check normal health of auth hehe
    public function healthCheck(): bool
    {
        try {
            $rawResponse = $this->requestRaw(
                HttpRequestValue::METHOD_GET,
                CacheServerEndpointValue::CACHE_GET,
                null,
                [
                    CacheServerConfig::CACHE_REQUEST_KEY_FIELD => CacheServerConfig::CACHE_HEALTH_KEY,
                ]
            );

            $statusCode = (int)$rawResponse[CacheServerConfig::CACHE_RESPONSE_STATUS_CODE_KEY];

            return CacheServerHttpUtility::statusCodeSuccess($statusCode) || CacheServerHttpUtility::statusCodeMissing($statusCode);
        } catch (Throwable) {
            return false;
        }
    }

    //oh no
    //thiss needs another thing
    //whiich idk ofc
    //so we need a function that sends request and expects cache server in envelope form
    private function requestJson(string $method, string $path, ?array $body = null, array $query = []): array
    {
        $rawResponse = $this->requestRaw($method, $path, $body, $query);
        return $this->responseEnvelopeDecode($rawResponse);
    }

    //now to send raw http request to cache server
    private function requestRaw(string $method, string $path, ?array $body = null, array $query = []): array
    {
        $url = $this->urlBuild($path, $query);
        $headers = CacheServerHttpUtility::headersBuild($body !== null, $this->_apiKey);
        $context = CacheServerHttpUtility::streamContextBuild($method, $headers, $body, $this->_timeoutMs);

        $responseBody = @file_get_contents($url, false, $context);
        $responseHeaders = $http_response_header ?? [];
        $statusCode = CacheServerHttpUtility::statusCodeFromHeadersGet($responseHeaders);

        if ($responseBody === false) {
            throw new RuntimeException('cache server request failed');
        }

        return [
            CacheServerConfig::CACHE_RESPONSE_STATUS_CODE_KEY => $statusCode,
            CacheServerConfig::CACHE_RESPONSE_BODY_KEY => $responseBody,
        ];
    }

    //if there is envelope
    //some one need to open it yeah right???
    //so now decoding that cache response envelope safely
    private function responseEnvelopeDecode(array $rawResponse): array
    {
        $statusCode = (int)$rawResponse[CacheServerConfig::CACHE_RESPONSE_STATUS_CODE_KEY];
        $body = (string)$rawResponse[CacheServerConfig::CACHE_RESPONSE_BODY_KEY];
        $decodedBody = JsonSafeEncoder::decodeToArray($body);

        if ($decodedBody === null) {
            throw new RuntimeException('Cache Server returned invalid json');
        }

        if (!CacheServerHttpUtility::statusCodeSuccess($statusCode)) {
            throw new RuntimeException('Cache Server returned http ' . $statusCode);
        }

        return $decodedBody;
    }

    //NOW this fucniton to build full cache server url
    private function urlBuild(string $path, array $query): string
    {
        $url = $this->_baseUrl . CacheServerConfig::CACHE_URL_PATH_SEPARATOR . ltrim($path, CacheServerConfig::CACHE_URL_PATH_SEPARATOR);

        if (!empty($query)) {
            $url .= CacheServerConfig::CACHE_URL_QUERY_SEPARATOR . http_build_query($query);
        }

        return $url;
    }
}
