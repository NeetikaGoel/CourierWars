<?php
declare(strict_types=1);

require_once __DIR__ . '/../constants/HttpStatusCode.php';
require_once __DIR__ . '/../constants/HttpHeaders.php';

//SO WHAT THIS FILE WILL DO LETS SEE

// 1. Stores HTTP status code
//    Example: 200, 201, 400, 500

// 2. Stores response body array
//    Example: success/data/error/meta envelope

// 3. Stores normal headers
//    Example: Content-Type

// 4. Stores cookie headers separately
//    Example: Set-Cookie for access token, refresh token, CSRF token

// 5. Sends HTTP status code using http_response_code()

// 6. Adds default JSON Content-Type if controller did not already add one

// 7. Sends all headers

// 8. Sends all Set-Cookie headers

// 9. Encodes response body to JSON

// 10. Echoes JSON to browser/client


//this file represents 1 JSON response that can be sent to browser/client
class HttpJsonResponse
{
    //some variables first!!
    private int $_statusCode; // HTTP status code like 200 400 500
    private array $_body; // response body array which will become JSON
    private array $_headers; // normal response headers
    private array $_cookieHeaders; // Set-Cookie headers need separate handling

    //now we need a constructor to create response object now ofc
    public function __construct(int $statusCode, array $body, array $headers = [], array $cookieHeaders = [])
    {
        $this->_statusCode = $statusCode;
        $this->_body = $body;
        $this->_headers = $headers;
        $this->_cookieHeaders = $cookieHeaders;
    }

    //so now getters time!!!!

    public function getStatusCode(): int
    {
        return $this->_statusCode;
    }

    public function getBody(): array
    {
        return $this->_body;
    }

    //now this function will add/replace 1 normal header
    public function addHeader(string $name, string $value): self
    {
        $this->_headers[$name] = $value;

        //this for chaining purpose
        return $this;
    }

    //this adds 1 set-cookie header now
    public function addCookieHeader(string $cookieHeader): self
    {
        //adding new cookie header here
        $this->_cookieHeaders[] = $cookieHeader;

        return $this;
    }

    //now adding many such set-cookie headers!!
    public function addCookieHeaders(array $cookieHeaders): self
    {
        //since many, so looping through all cookie headers
        foreach ($cookieHeaders as $cookieHeader) {
            $this->addCookieHeader((string)$cookieHeader);
        }

        return $this;
    }

    //now this function will send HTTP status headers cookies and JSON body finally hehe
    public function send(): void
    {
        //setting status code first
        http_response_code($this->_statusCode);

        if (!isset($this->_headers[HttpHeaders::CONTENT_TYPE])) // if content type not already set
        {
            $this->_headers[HttpHeaders::CONTENT_TYPE] = HttpHeaders::CONTENT_TYPE_JSON_UTF8; // default JSON content type
        }

        //looping through all normal headers and return them
        foreach ($this->_headers as $name => $value) {
            header($name . ': ' . $value);
        }

        //now looping through cookie headers this time
        foreach ($this->_cookieHeaders as $cookieHeader) {
            header(HttpHeaders::SET_COOKIE . ': ' . $cookieHeader, false); // false will allow multiple Set-Cookie headers
        }

        //now we need encoding of response body
        $json = json_encode($this->_body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($json === false) // this is for case if encoding fails for unexpected reason
        {
            http_response_code(HttpStatusCode::INTERNAL_SERVER_ERROR); // force internal server error

            echo '{"success":false,"data":null,"error":{"code":"INTERNAL_ERROR","message":"Response encoding failed"},"meta":{}}'; // will act like a safe fallback

            return; // stop the final response
        }

        //finally send json response
        echo $json;
    }
}
