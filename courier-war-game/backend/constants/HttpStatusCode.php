<?php 
declare(strict_types=1);

// HTTP status codes that will be used by API responses
class HttpStatusCode 
{
    public const OK = 200; // successful read/action
    public const CREATED = 201; // new user guest/match was created
    public const BAD_REQUEST = 400; // invalid request body/field shape
    public const UNAUTHORIZED = 401; // auth is missing expired/invalid
    public const FORBIDDEN = 403; // user is authenticated but not allowed
    public const NOT_FOUND = 404; // requested resource was not found
    public const METHOD_NOT_ALLOWED = 405; // route exists but method is not allowed
    public const CONFLICT = 409; // stale version/idempotency conflict
    public const UNSUPPORTED_MEDIA_TYPE = 415; // required JSON content type is missing
    public const UNPROCESSABLE_ENTITY = 422; // game rule rejected valid request
    public const TOO_MANY_REQUESTS = 429; // rate limit was exceeded
    public const INTERNAL_SERVER_ERROR = 500; // unexpected backend failure
}
