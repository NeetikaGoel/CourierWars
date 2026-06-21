<?php
declare(strict_types=1);

//this file stores fixed values used while reading/parsing HTTP requests
class HttpRequestValue
{
    public const METHOD_DEFAULT = 'GET'; // fallback method if PHP does not provide request method
    public const PATH_DEFAULT = '/'; // fallback path if PHP does not provide request URI
    public const BODY_STREAM = 'php://input'; // PHP stream used to read raw request body

    public const REQUEST_ID_PREFIX = 'req_'; // prefix used for generated request ids
    public const REQUEST_ID_RANDOM_BYTE_COUNT = 8; // random byte count used for generated request ids
    public const REQUEST_ID_REGEX = '/^[A-Za-z0-9_-]{8,64}$/'; // safe request id pattern allowed from client

    public const CONTENT_TYPE_SEPARATOR = ';'; // separator used in content-type like application/json; charset=utf-8
    public const PATH_SEPARATOR = '/'; // URL path separator
}
