<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/HttpHeaders.php';
require_once __DIR__ . '/../constants/HttpRequestValue.php';
require_once __DIR__ . '/HttpJsonBodyParser.php';
require_once __DIR__ . '/HttpRequestGlobalReader.php';

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

    //pvt constructor so request is created through fromGlobals only
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

    //this will be creating HttpRequest using PHP globals from current HTTP request
    public static function fromGlobals(): HttpRequest
    {
        $requestData = HttpRequestGlobalReader::requestDataFromGlobalsGet();

        return new HttpRequest(
            $requestData['method'],
            $requestData['path'],
            $requestData['headers'],
            $requestData['cookies'],
            $requestData['queryParams'],
            $requestData['rawBody'],
            $requestData['requestId']
        );
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

        if ($contentType === null) {
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
        if ($this->_jsonBodyDecoded) {
            return;
        }

        $this->_jsonBodyDecoded = true; // mark as decoded attempt done
        $parseResult = HttpJsonBodyParser::jsonBodyParse($this->_rawBody);

        $this->_jsonBody = $parseResult['jsonBody'];
        $this->_jsonDecodeError = $parseResult['jsonDecodeError'];
    }
}
