<?php

declare(strict_types=1);

class Request
{
    //so firstly declaring all the variables , all will be pvt so with underscore!!
    private string $_method; //request method like get, post, delete
    private string $_path; //request path like /v1/cache/get , no query params here
    private array $_headers; //request headers like api keys etc
    private array $_queryParams; //url query params here
    private array $_body; //json body that will be decoded
    private string $_rawBody; //before decoding body
    private bool $_hasInvalidJson; //was the value of json body valid or not

    public function __construct(string $_method, string $_path, array $_headers, array $_queryParams, array $_body, string $_rawBody, bool $_hasInvalidJson)
    {
        $this->_method = $_method;
        $this->_path = $_path;
        $this->_headers = $_headers;
        $this->_queryParams = $_queryParams;
        $this->_body = $_body;
        $this->_rawBody = $_rawBody;
        $this->_hasInvalidJson = $_hasInvalidJson;
    }

    //so this function will create the request from php built in vals
    public static function createRequestFromGlobals(): Request
    {
        //so first lets see which method we have, if not found then default to get
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        //now what is full request uri??
        //Uniform resource identifier- the part of the request URL that identifies what resource/API is being called!!!
        // Example full URL: http://127.0.0.1:8080/v1/cache/get?key=name
        // URI part: /v1/cache/get?key=name
        //Path part: /v1/cache/get
        // Query params: key=name

        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';

        //now just getting the path from the uri
        $path = parse_url($requestUri, PHP_URL_PATH);

        //if we dont get any path then then????
        if ($path === false || $path === null) {
            $path = '/';
        }

        //so now reading header using a new function we will add later here
        $headers = self::readHeaders();

        //for the query params default from get
        $queryParams = $_GET;

        //now getting raw request body
        $rawBody = file_get_contents('php://input');

        //check if its there or not
        if ($rawBody === false) {
            $rawBody = '';
        }

        //now default body will be empty array
        $body = [];

        $hasInvalidJson = false;

        if ($rawBody !== '') {
            //if we have something in rawbody already then decode it to php array
            $decodedBody = json_decode($rawBody, true);

            //how to do json parsing???? and to check if its not array
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decodedBody)) {
                $hasInvalidJson = true;
            } else {
                $body = $decodedBody;
            }
        }

        //just return the new request object formed 
        return new Request($method, $path, $headers, $queryParams, $body, $rawBody, $hasInvalidJson);
    }

    //this function creates request object from raw http text because our server is now custom long running
    //WE HAVE A CUSTOM SOCKET SERVER NOW
    //SO WE WILL GET REQUEST IN PLAIN TEXT NOW WHICH WE WILL NEED TO MANUALLY PARSE IT
    public static function createRequestFromRawHttp(string $rawHttpRequest): Request
    {
        //split raw http into header and body sections coz there is a blank line between them hehe
        //In PHP, \r represents a Carriage Return (ASCII 13). It is an escape sequence used within double-quoted strings to move the cursor back to the beginning of the current line without advancing to the next line
        $requestParts = explode("\r\n\r\n", $rawHttpRequest, 2);

        //get raw header section
        $headerText = $requestParts[0] ?? '';

        //get raw body section
        $rawBody = $requestParts[1] ?? '';

        //split header section into lines
        $headerLines = preg_split("/\r\n|\n|\r/", $headerText);

        //get first request line like GET /path HTTP/1.1
        $requestLine = $headerLines[0] ?? 'GET / HTTP/1.1';

        //split request line into method uri and protocol
        $requestLineParts = explode(' ', trim($requestLine));

        //get method from request line
        $method = $requestLineParts[0] ?? 'GET';

        //get uri from request line
        $requestUri = $requestLineParts[1] ?? '/';

        //get only path from uri
        $path = parse_url($requestUri, PHP_URL_PATH);

        //if path parsing fails then use root path
        if ($path === false || $path === null) {
            $path = '/';
        }

        //get query string from uri
        $queryString = parse_url($requestUri, PHP_URL_QUERY);

        //start query params with empty array
        $queryParams = [];

        //if query string exists then parse it
        if (is_string($queryString)) {
            parse_str($queryString, $queryParams);
        }

        //start headers with empty array
        $headers = [];

        //loop through all header lines except request line
        for ($index = 1; $index < count($headerLines); $index++) {
            //get current header line
            $headerLine = $headerLines[$index];

            //skip lines without colon
            if (strpos($headerLine, ':') === false) {
                continue;
            }

            //split header name and value
            [$headerName, $headerValue] = explode(':', $headerLine, 2);

            //store clean header name and value
            $headers[trim($headerName)] = trim($headerValue);
        }

        //now default body will be empty array
        $body = [];

        //default invalid json false
        $hasInvalidJson = false;

        //decode body only if body exists
        if ($rawBody !== '') {
            //decode json body to php array
            $decodedBody = json_decode($rawBody, true);

            //mark invalid if json is bad or not array
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decodedBody)) {
                $hasInvalidJson = true;
            } else {
                $body = $decodedBody;
            }
        }
        //return final request object
        return new Request($method, $path, $headers, $queryParams, $body, $rawBody, $hasInvalidJson);
    }

    //all the getters now
    public function getMethod(): string
    {
        //we need it in capital letters ofc
        return strtoupper($this->_method);
    }

    public function getPath(): string
    {
        return $this->_path;
    }

    public function getHeaders(): array
    {
        return $this->_headers;
    }

    //new function we need to return 1 header by name 
    //header names are case insensitive
    public function getHeader(string $name): ?string
    {
        //first of all make everything lowercase
        $requiredHeaderName = strtolower($name);

        //now we will loop through all headers
        foreach ($this->_headers as $headerName => $headerValue) {
            if (strtolower($headerName) === $requiredHeaderName) {
                return $headerValue;
            }
        }

        return null;
    }

    //return all query params
    public function getQueryParams(): array
    {
        return $this->_queryParams;
    }

    //just 1 query param now
    public function getQueryParam(string $name): mixed
    {
        return $this->_queryParams[$name] ?? null;
    }

    //same for body
    public function getBody(): array
    {
        return $this->_body;
    }

    //for each body field
    public function getBodyField(string $name): mixed
    {
        return $this->_body[$name] ?? null;
    }

    //same for rawbody
    public function getRawBody(): string
    {
        return $this->_rawBody;
    }

    public function getHasInvalidJson(): bool
    {
        return $this->_hasInvalidJson;
    }

    //NOW WE NEEDED AN EXTRA FUNCTION TO READ REQUEST HEADERS

    private static function readHeaders(): array
    {
        //NEED TO CHECK IF THIS PHP FUNCTION EXIST???
        if (function_exists('getallheaders')) {
            //YES SO USE IT
            $headers = getallheaders();

            if (is_array($headers)) {
                return $headers;
            }
        }

        $headers = [];

        //IF FUNCTION NOT EXIST, JUST LOOPING THROUGH THE PHP SERVER VARIABLES TO FORM THE HEADERS ARRAY
        foreach ($_SERVER as $serverKey => $serverValue) {
            if (str_starts_with($serverKey, 'HTTP_')) {
                //WE WOULD NEED TO REMOVE THE HTTP_ WHICH IS 5
                //UNDERSCORE TO HYPHEN
                //THEN LOWERCASE TOO
                $headerName = str_replace('_', '-', strtolower(substr($serverKey, 5)));
                $headers[$headerName] = $serverValue;
            }
        }

        return $headers;
    }
}
