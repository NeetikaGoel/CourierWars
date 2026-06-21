<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/HttpHeaders.php';
require_once __DIR__ . '/../constants/HttpRequestValue.php';

//this helper reads php globals and keeps HttpRequest smaller
class HttpRequestGlobalReader
{
    //this creates request data using PHP globals from current HTTP request
    public static function requestDataFromGlobalsGet(): array
    {
        $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? HttpRequestValue::METHOD_DEFAULT)); // get HTTP method and make uppercase
        $uri = (string)($_SERVER['REQUEST_URI'] ?? HttpRequestValue::PATH_DEFAULT); // get full request URI with query string maybe
        $path = parse_url($uri, PHP_URL_PATH); // extract only path part from URI
        $path = self::normalizePath($path === false || $path === null ? HttpRequestValue::PATH_DEFAULT : $path); // normalize path safely
        $headers = self::headersFromGlobals(); // read request headers from PHP globals
        $rawBody = file_get_contents(HttpRequestValue::BODY_STREAM); // read raw request body
        $rawBody = $rawBody === false ? '' : $rawBody; // use empty string if body cannot be read

        return [
            'method' => $method,
            'path' => $path,
            'headers' => $headers,
            'cookies' => $_COOKIE,
            'queryParams' => $_GET,
            'rawBody' => $rawBody,
            'requestId' => self::requestIdResolve($headers),
        ];
    }

    //this normalizes route path for router matching
    private static function normalizePath(string $path): string
    {
        $path = HttpRequestValue::PATH_SEPARATOR . ltrim($path, HttpRequestValue::PATH_SEPARATOR); // always start path with slash

        if ($path !== HttpRequestValue::PATH_DEFAULT && str_ends_with($path, HttpRequestValue::PATH_SEPARATOR)) {
            $path = rtrim($path, HttpRequestValue::PATH_SEPARATOR); // remove trailing slash
        }

        return $path;
    }

    //this reads headers from globals and normalizes names
    private static function headersFromGlobals(): array
    {
        $headers = []; // this will store normalized headers

        if (function_exists('getallheaders')) {
            foreach (getallheaders() as $name => $value) {
                $headers[strtolower((string)$name)] = (string)$value; // store header lowercase
            }
        }

        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, HttpHeaders::SERVER_HTTP_PREFIX)) {
                $name = strtolower(str_replace(
                    HttpHeaders::SERVER_HEADER_UNDERSCORE_CHAR,
                    HttpHeaders::HEADER_DASH_CHAR,
                    substr($key, strlen(HttpHeaders::SERVER_HTTP_PREFIX))
                ));

                $headers[$name] = (string)$value; // store normalized header
            }
        }

        if (isset($_SERVER[HttpHeaders::SERVER_CONTENT_TYPE])) {
            $headers[HttpHeaders::CONTENT_TYPE_NORMALIZED] = (string)$_SERVER[HttpHeaders::SERVER_CONTENT_TYPE];
        }

        if (isset($_SERVER[HttpHeaders::SERVER_CONTENT_LENGTH])) {
            $headers[HttpHeaders::CONTENT_LENGTH_NORMALIZED] = (string)$_SERVER[HttpHeaders::SERVER_CONTENT_LENGTH];
        }

        return $headers;
    }

    //this resolves request id from header or creates one
    private static function requestIdResolve(array $headers): string
    {
        $requestId = $headers[HttpHeaders::X_REQUEST_ID_NORMALIZED] ?? ''; // read optional client request id

        if (is_string($requestId) && preg_match(HttpRequestValue::REQUEST_ID_REGEX, $requestId) === 1) {
            return $requestId;
        }

        try {
            return HttpRequestValue::REQUEST_ID_PREFIX . bin2hex(random_bytes(HttpRequestValue::REQUEST_ID_RANDOM_BYTE_COUNT));
        } catch (Throwable) {
            return HttpRequestValue::REQUEST_ID_PREFIX . uniqid('', true);
        }
    }
}
