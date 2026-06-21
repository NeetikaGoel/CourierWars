<?php

declare(strict_types=1);

require_once __DIR__ . '/../constants/HttpHeaders.php';
require_once __DIR__ . '/../constants/HttpRequestValue.php';

//SO WHAT THIS FILE WILL DO LETS SEE

// 1. Reads current request method
//    Example: GET, POST

// 2. Reads request path
//    Example: /api/v1/auth/login

// 3. Reads request headers
//    Example: Content-Type, X-CSRF-Token

// 4. Reads browser cookies
//    Example: cw_access_token, cw_refresh_token

// 5. Reads query params
//    Example: ?knownVersion=42

// 6. Reads raw JSON body from php://input

// 7. Decodes JSON body safely only when needed

// 8. Stores JSON decode error if body is invalid

// 9. Creates or accepts request id for logs and response meta

// 10. Gives controllers clean functions instead of using PHP globals everywhere


//this file represents 1 incoming HTTP request in a clean object
class HttpRequest
{
    //some variables first!!
    private string $_method; // request method like GET POST PUT DELETE
    private string $_path; // request path without query string
    private array $_headers; // normalized request headers with lowercase keys
    private array $_cookies; // cookies from browser
    private array $_queryParams; // query string values like ?knownVersion=1
    private string $_rawBody; // raw body from php://input
    private string $_requestId; // request id for tracing response and logs
    private bool $_jsonBodyDecoded = false; // tells if JSON body was already decoded
    private ?array $_jsonBody = null; // decoded JSON body as array or null if invalid
    private ?string $_jsonDecodeError = null; // JSON decode error message if body is invalid

    //private constructor so request is created through fromGlobals only
    private function __construct(string $method, string $path, array $headers, array $cookies, array $queryParams, string $rawBody, string $requestId)
    {
        $this->_method = $method;
        $this->_path = $path;
        $this->_headers = $headers;
        $this->_cookies = $cookies;
        $this->_queryParams = $queryParams;
        $this->_rawBody = $rawBody;
        $this->_requestId = $requestId;
    }

    //this creates HttpRequest using PHP globals from current HTTP request
    public static function fromGlobals(): HttpRequest
    {
        $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? HttpRequestValue::METHOD_DEFAULT)); // get HTTP method and make uppercase
        $uri = (string)($_SERVER['REQUEST_URI'] ?? HttpRequestValue::PATH_DEFAULT); // get full request URI with query string maybe
        $path = parse_url($uri, PHP_URL_PATH); // extract only path part from URI
        $path = self::normalizePath($path === false || $path === null ? HttpRequestValue::PATH_DEFAULT : $path); // normalize path safely
        $headers = self::headersFromGlobals(); // read request headers from PHP globals
        $cookies = $_COOKIE; // read cookies sent by browser
        $queryParams = $_GET; // read query params parsed by PHP
        $rawBody = file_get_contents(HttpRequestValue::BODY_STREAM); // read raw request body
        $rawBody = $rawBody === false ? '' : $rawBody; // use empty string if body cannot be read
        $requestId = self::requestIdResolve($headers); // use client request id if safe or generate one

        return new HttpRequest($method, $path, $headers, $cookies, $queryParams, $rawBody, $requestId); // return request object
    }

    //so now getters time!!!!

    //request method
    public function getMethod(): string
    {
        return $this->_method;
    }

    //request path
    public function getPath(): string
    {
        return $this->_path;
    }

    //request id
    public function getRequestId(): string
    {
        return $this->_requestId;
    }

    //raw body
    public function getRawBody(): string
    {
        return $this->_rawBody;
    }

    //this checks if request has any body
    public function hasRawBody(): bool
    {
        return trim($this->_rawBody) !== '';
    }

    //this returns body size in bytes
    public function getBodySizeBytes(): int
    {
        return strlen($this->_rawBody);
    }

    //headers
    public function getHeaders(): array
    {
        return $this->_headers;
    }

    //this returns 1 header by name
    public function getHeader(string $name): ?string
    {
        $key = strtolower($name); // normalize requested header name

        return $this->_headers[$key] ?? null; // return header or null
    }

    //this checks if a header exists and is not empty
    public function hasHeader(string $name): bool
    {
        $value = $this->getHeader($name); // get header value

        return $value !== null && trim($value) !== ''; // true if header has value
    }

    //this returns content type without charset
    public function getContentType(): ?string
    {
        $contentType = $this->getHeader(HttpHeaders::CONTENT_TYPE); // get content type header

        if ($contentType === null) // if no content type was sent
        {
            return null;
        }

        $parts = explode(HttpRequestValue::CONTENT_TYPE_SEPARATOR, $contentType); // split application/json; charset=utf-8

        return strtolower(trim($parts[0])); // return only main content type
    }

    //cookies
    public function getCookies(): array
    {
        return $this->_cookies;
    }

    //this returns 1 cookie by name
    public function getCookie(string $name): ?string
    {
        return isset($this->_cookies[$name]) ? (string)$this->_cookies[$name] : null;
    }

    //this checks if a cookie exists and is not empty
    public function hasCookie(string $name): bool
    {
        $value = $this->getCookie($name); // get cookie value

        return $value !== null && trim($value) !== ''; // true if cookie exists with value
    }

    //query params
    public function getQueryParams(): array
    {
        return $this->_queryParams;
    }

    //this returns 1 query param by name
    public function getQueryParam(string $name): ?string
    {
        return isset($this->_queryParams[$name]) ? (string)$this->_queryParams[$name] : null;
    }

    //JSON body
    public function getJsonBody(): ?array
    {
        $this->decodeJsonBodyIfNeeded(); // decode only once

        return $this->_jsonBody;
    }

    //JSON error
    public function getJsonDecodeError(): ?string
    {
        $this->decodeJsonBodyIfNeeded(); // decode only once

        return $this->_jsonDecodeError;
    }

    //this decodes JSON body only 1 time
    private function decodeJsonBodyIfNeeded(): void
    {
        if ($this->_jsonBodyDecoded) // if already decoded before
        {
            return;
        }

        $this->_jsonBodyDecoded = true; // mark as decoded attempt done

        if (!$this->hasRawBody()) // if there is no body
        {
            $this->_jsonBody = []; // empty body is treated as empty array
            return;
        }

        $decodedBody = json_decode($this->_rawBody, true); // decode JSON body as associative array

        if (json_last_error() !== JSON_ERROR_NONE) // check JSON parse error
        {
            $this->_jsonBody = null; // invalid JSON means no usable body
            $this->_jsonDecodeError = json_last_error_msg(); // store JSON error message
            return;
        }

        if (!is_array($decodedBody)) // JSON body must be object/array for our APIs
        {
            $this->_jsonBody = null; // scalar JSON values are not valid API body
            $this->_jsonDecodeError = 'JSON body must be an object or array'; // store friendly error
            return;
        }

        $this->_jsonBody = $decodedBody; // store decoded body
    }

    //this normalizes route path for router matching
    private static function normalizePath(string $path): string
    {
        $path = HttpRequestValue::PATH_SEPARATOR . ltrim($path, HttpRequestValue::PATH_SEPARATOR); // always start path with slash

        if ($path !== HttpRequestValue::PATH_DEFAULT && str_ends_with($path, HttpRequestValue::PATH_SEPARATOR)) // if path has trailing slash and is not root
        {
            $path = rtrim($path, HttpRequestValue::PATH_SEPARATOR); // remove trailing slash
        }

        return $path;
    }

    //this reads headers from globals and normalizes names
    private static function headersFromGlobals(): array
    {
        $headers = []; // this will store normalized headers

        if (function_exists('getallheaders')) // apache/nginx may provide this helper
        {
            foreach (getallheaders() as $name => $value) // loop through all headers
            {
                $headers[strtolower((string)$name)] = (string)$value; // store header lowercase
            }
        }

        foreach ($_SERVER as $key => $value) // fallback because getallheaders may not work everywhere
        {
            if (str_starts_with($key, HttpHeaders::SERVER_HTTP_PREFIX)) // normal request headers appear as HTTP_HEADER_NAME
            {
                $name = strtolower(str_replace('_', '-', substr($key, strlen(HttpHeaders::SERVER_HTTP_PREFIX)))); // convert HTTP_CONTENT_TYPE style to content-type

                $headers[$name] = (string)$value; // store normalized header
            }
        }

        if (isset($_SERVER[HttpHeaders::SERVER_CONTENT_TYPE])) // content-type may not start with HTTP_
        {
            $headers[HttpHeaders::CONTENT_TYPE_NORMALIZED] = (string)$_SERVER[HttpHeaders::SERVER_CONTENT_TYPE]; // store content type
        }

        if (isset($_SERVER[HttpHeaders::SERVER_CONTENT_LENGTH])) // content-length may not start with HTTP_
        {
            $headers['content-length'] = (string)$_SERVER[HttpHeaders::SERVER_CONTENT_LENGTH]; // store content length
        }

        return $headers;
    }

    //this resolves request id from header or creates one
    private static function requestIdResolve(array $headers): string
    {
        $requestId = $headers[HttpHeaders::X_REQUEST_ID_NORMALIZED] ?? ''; // read optional client request id

        if (is_string($requestId) && preg_match(HttpRequestValue::REQUEST_ID_REGEX, $requestId) === 1) // accept only safe request id
        {
            return $requestId;
        }

        try // random_bytes can throw exception
        {
            return HttpRequestValue::REQUEST_ID_PREFIX . bin2hex(random_bytes(HttpRequestValue::REQUEST_ID_RANDOM_BYTE_COUNT)); // generate safe request id
        } catch (Throwable) // if random generation fails
        {
            return HttpRequestValue::REQUEST_ID_PREFIX . uniqid('', true); // fallback request id
        }
    }
}
