<?php
declare(strict_types=1);

//all imports first
require_once __DIR__ . '/HttpRequest.php';
require_once __DIR__ . '/HttpJsonResponse.php';
require_once __DIR__ . '/HttpResponseFactory.php';
require_once __DIR__ . '/../constants/HttpRequestValue.php';
require_once __DIR__ . '/../config/CsrfConfig.php';

//this file contains common boundary checks that can be used before controller business logic
class HttpRequestBoundary
{
    private HttpResponseFactory $_responseFactory; // response factory used for boundary errors

    //constructor creates response factory if not provided
    public function __construct(?HttpResponseFactory $responseFactory = null)
    {
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory(); // store response factory
    }

    //this checks expected HTTP method
    public function requireMethod(HttpRequest $request, string $expectedMethod): ?HttpJsonResponse
    {
        if ($request->getMethod() !== strtoupper($expectedMethod)) // compare method
        {
            return $this->_responseFactory->methodNotAllowed('HTTP method is not allowed for this endpoint', $request->getRequestId()); // return 405
        }
        return null; // no error
    }

    //a function that will check request body is not too large
    public function requireBodySizeWithinLimit(HttpRequest $request): ?HttpJsonResponse
    {
        if ($request->getBodySizeBytes() > HttpRequestValue::REQUEST_BODY_SIZE_BYTES_MAX) // check body size
        {
            return $this->_responseFactory->badRequest('Request body is too large', $request->getRequestId()); // return 400
        }

        return null; // no error
    }

    //a function that will check content type is application/json
    public function requireJsonContentType(HttpRequest $request): ?HttpJsonResponse
    {
        if ($request->getContentType() !== HttpRequestValue::JSON_CONTENT_TYPE) // check content type without charset
        {
            return $this->_responseFactory->unsupportedMediaType('Content-Type must be application/json', $request->getRequestId()); // return 415
        }

        return null; // no error
    }

    //a function that will check JSON body exists and is valid
    public function requireJsonBody(HttpRequest $request): ?HttpJsonResponse
    {
        $sizeError = $this->requireBodySizeWithinLimit($request); // check body size first
        if ($sizeError !== null) // if size error exists
        {
            return $sizeError; // return size error
        }
        if (!$request->hasRawBody()) // if body is empty
        {
            return $this->_responseFactory->badRequest('JSON body is required', $request->getRequestId()); // return 400
        }
        if ($request->getJsonBody() === null) // if JSON cannot be decoded
        {
            return $this->_responseFactory->badRequest('Invalid JSON body', $request->getRequestId(), ['jsonError' => $request->getJsonDecodeError()]); // return 400 with safe error
        }
        return null; // no error
    }

    //a function that will check JSON only when body exists
    public function requireValidJsonIfBodyExists(HttpRequest $request): ?HttpJsonResponse
    {
        $sizeError = $this->requireBodySizeWithinLimit($request); // check body size first
        if ($sizeError !== null) // if size error exists
        {
            return $sizeError; // return size error
        }
        if (!$request->hasRawBody()) // if no body exists
        {
            return null; // no error because body is optional
        }
        if ($request->getJsonBody() === null) // if body exists but JSON is invalid
        {
            return $this->_responseFactory->badRequest('Invalid JSON body', $request->getRequestId(), ['jsonError' => $request->getJsonDecodeError()]); // return 400
        }
        return null; // no error
    }

    //a function that will check required header exists
    public function requireHeader(HttpRequest $request, string $headerName): ?HttpJsonResponse
    {
        if (!$request->hasHeader($headerName)) // check header presence
        {
            return $this->_responseFactory->badRequest($headerName . ' header is required', $request->getRequestId()); // return 400
        }
        return null; // no error
    }

    //a function that will check required cookie exists
    public function requireCookie(HttpRequest $request, string $cookieName): ?HttpJsonResponse
    {
        if (!$request->hasCookie($cookieName)) // checking cookie presence
        {
            return $this->_responseFactory->unauthorized($cookieName . ' cookie is required', $request->getRequestId()); // return 401
        }
        return null; // no error
    }

    //a function that will check csrf header exists and has safe length
    public function requireCsrfHeader(HttpRequest $request): ?HttpJsonResponse
    {
        $headerName = CsrfConfig::CSRF_HEADER_NAME; // get CSRF header name
        if (!$request->hasHeader($headerName)) // check csrf header presence
        {
            return $this->_responseFactory->forbidden('CSRF token is required', $request->getRequestId()); // return 403
        }
        $token = (string)$request->getHeader($headerName); // get csrf token
        $length = strlen($token); // get token length
        if ($length < CsrfConfig::CSRF_TOKEN_MIN_LENGTH || $length > CsrfConfig::CSRF_TOKEN_MAX_LENGTH) // validate token length
        {
            return $this->_responseFactory->forbidden('CSRF token is invalid', $request->getRequestId()); // return 403
        }
        return null; // no error
    }

    //this checks idempotency key exists and has safe format
    public function requireIdempotencyKey(HttpRequest $request): ?HttpJsonResponse
    {
        $headerName = HttpRequestValue::IDEMPOTENCY_HEADER_NAME; // fixed idempotency header name
        if (!$request->hasHeader($headerName)) // check header presence
        {
            return $this->_responseFactory->badRequest('Idempotency-Key header is required', $request->getRequestId()); // return 400
        }

        $key = (string)$request->getHeader($headerName); // get idempotency key
        $length = strlen($key); // get key length
        if ($length < HttpRequestValue::IDEMPOTENCY_KEY_LENGTH_MIN || $length > HttpRequestValue::IDEMPOTENCY_KEY_LENGTH_MAX) // checking length
        {
            return $this->_responseFactory->badRequest('Idempotency-Key length is invalid', $request->getRequestId()); // return 400
        }

        if (preg_match(HttpRequestValue::IDEMPOTENCY_KEY_REGEX, $key) !== 1) // check safe characters
        {
            return $this->_responseFactory->badRequest('Idempotency-Key format is invalid', $request->getRequestId()); // return 400
        }

        return null; // no error
    }

    //this checks required query parameter exists
    public function requireQueryParam(HttpRequest $request, string $paramName): ?HttpJsonResponse
    {
        $value = $request->getQueryParam($paramName); // get query param

        if ($value === null || trim($value) === '') // check missing or empty
        {
            return $this->_responseFactory->badRequest($paramName . ' query parameter is required', $request->getRequestId()); // return 400
        }

        return null; // no error
    }
}
