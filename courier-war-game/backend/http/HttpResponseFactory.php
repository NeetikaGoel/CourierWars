<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/AppConfig.php';
require_once __DIR__ . '/../constants/HttpStatusCode.php';
require_once __DIR__ . '/../constants/ApiErrorCode.php';
require_once __DIR__ . '/HttpJsonResponse.php';

//this file creates standard API response envelopes
class HttpResponseFactory
{
    //this creates successful response
    public function success(?array $data, string $requestId, int $statusCode = HttpStatusCode::OK): HttpJsonResponse
    {
        return new HttpJsonResponse(
            $statusCode, // HTTP status code
            [
                'success' => true, // success flag
                'data' => $data ?? [], // endpoint data
                'error' => null, // no error on success
                'meta' => $this->meta($requestId), // common metadata
            ]
        );
    }

    //this creates created response for successful POST create
    public function created(?array $data, string $requestId): HttpJsonResponse
    {
        return $this->success($data, $requestId, HttpStatusCode::CREATED); // return 201 response
    }

    //this creates standard error response
    public function error(string $errorCode, string $message, int $statusCode, string $requestId, array $details = []): HttpJsonResponse
    {
        $error = [
            'code' => $errorCode, // stable machine readable error code
            'message' => $message, // safe human readable message
        ];

        if (!empty($details)) // only add details if provided
        {
            $error['details'] = $details; // add field-level details
        }

        return new HttpJsonResponse(
            $statusCode, // HTTP status code must match failure
            [
                'success' => false, // failure flag
                'data' => null, // no data on error
                'error' => $error, // error object
                'meta' => $this->meta($requestId), // common metadata
            ]
        );
    }

    //this creates bad request response
    public function badRequest(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::BAD_REQUEST, $message, HttpStatusCode::BAD_REQUEST, $requestId, $details); // return 400
    }

    //this creates unauthorized response
    public function unauthorized(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::UNAUTHORIZED, $message, HttpStatusCode::UNAUTHORIZED, $requestId, $details); // return 401
    }

    //this creates forbidden response
    public function forbidden(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::FORBIDDEN, $message, HttpStatusCode::FORBIDDEN, $requestId, $details); // return 403
    }

    //this creates not found response
    public function notFound(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::NOT_FOUND, $message, HttpStatusCode::NOT_FOUND, $requestId, $details); // return 404
    }

    //this creates method not allowed response
    public function methodNotAllowed(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::BAD_REQUEST, $message, HttpStatusCode::METHOD_NOT_ALLOWED, $requestId, $details); // return 405
    }

    //this creates conflict response
    public function conflict(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::STATE_CONFLICT, $message, HttpStatusCode::CONFLICT, $requestId, $details); // return 409
    }

    //this creates unsupported media type response
    public function unsupportedMediaType(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::UNSUPPORTED_MEDIA_TYPE, $message, HttpStatusCode::UNSUPPORTED_MEDIA_TYPE, $requestId, $details); // return 415
    }

    //this creates game rule rejected response
    public function gameRuleRejected(string $message, string $requestId, array $details = []): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::GAME_RULE_REJECTED, $message, HttpStatusCode::UNPROCESSABLE_ENTITY, $requestId, $details); // return 422
    }

    //this creates rate limited response
    public function rateLimited(string $message, string $requestId, int $retryAfterSeconds = 1): HttpJsonResponse
    {
        return $this
            ->error(ApiErrorCode::RATE_LIMITED, $message, HttpStatusCode::TOO_MANY_REQUESTS, $requestId) // create 429 response
            ->addHeader('Retry-After', (string)$retryAfterSeconds); // tell frontend when it can retry
    }

    //this creates internal error response
    public function internalError(string $requestId): HttpJsonResponse
    {
        return $this->error(ApiErrorCode::INTERNAL_ERROR, 'Something went wrong', HttpStatusCode::INTERNAL_SERVER_ERROR, $requestId); // return safe 500
    }

    //this creates common meta block
    private function meta(string $requestId): array
    {
        return [
            'requestId' => $requestId, // request id for tracing
            'serverTime' => $this->serverTimeUtc(), // current server time
            'apiVersion' => AppConfig::API_VERSION, // API version
        ];
    }

    //this returns current UTC time in ISO-like format with milliseconds
    private function serverTimeUtc(): string
    {
        $now = new DateTimeImmutable('now', new DateTimeZone(AppConfig::DEFAULT_TIMEZONE)); // create UTC datetime

        return $now->format('Y-m-d\TH:i:s.v\Z'); // format like 2026-06-04T10:15:30.000Z
    }
}
