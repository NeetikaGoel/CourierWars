<?php
declare(strict_types=1);

//this file stores fixed values used while reading/parsing HTTP requests
class HttpRequestValue
{
    public const METHOD_DEFAULT = 'GET'; // fallback method if PHP does not provide request method
    public const METHOD_GET = 'GET'; // fixed get method value
    public const METHOD_POST = 'POST'; // fixed post method value

    public const PATH_DEFAULT = '/'; // fallback path if PHP does not provide request URI
    public const BODY_STREAM = 'php://input'; // PHP stream used to read raw request body

    public const REQUEST_ID_PREFIX = 'req_'; // prefix used for generated request ids
    public const REQUEST_ID_RANDOM_BYTE_COUNT = 8; // random byte count used for generated request ids
    public const REQUEST_ID_REGEX = '/^[A-Za-z0-9_-]{8,64}$/'; // safe request id pattern allowed from client

    public const CONTENT_TYPE_SEPARATOR = ';'; // separator used in content-type like application/json; charset=utf-8
    public const PATH_SEPARATOR = '/'; // URL path separator

    public const JSON_CONTENT_TYPE = 'application/json'; // expected JSON content type
    public const JSON_BODY_SHAPE_ERROR_MESSAGE = 'JSON body must be an object or array'; // safe json body shape message
    public const REQUEST_BODY_SIZE_BYTES_MAX = 65536; // 64 KB max standard API body as per server boundary rule

    public const IDEMPOTENCY_HEADER_NAME = 'Idempotency-Key'; // fixed idempotency header name
    public const IDEMPOTENCY_KEY_LENGTH_MIN = 8; // minimum client idempotency key length
    public const IDEMPOTENCY_KEY_LENGTH_MAX = 64; // maximum client idempotency key length
    public const IDEMPOTENCY_KEY_REGEX = '/^[A-Za-z0-9_-]+$/'; // safe idempotency key format
}
