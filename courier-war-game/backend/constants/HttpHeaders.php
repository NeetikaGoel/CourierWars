<?php
declare(strict_types=1);

//this file stores fixed HTTP header names and header values used in backend
class HttpHeaders
{
    public const CONTENT_TYPE = 'Content-Type'; // response/request header name for body type
    public const CONTENT_TYPE_NORMALIZED = 'content-type'; // lowercase version used internally after header normalization
    public const CONTENT_LENGTH_NORMALIZED = 'content-length'; // lowercase version used internally after header normalization

    public const SET_COOKIE = 'Set-Cookie'; // response header name used to set/clear browser cookies

    public const X_REQUEST_ID = 'X-Request-Id'; // optional request tracing header sent by client
    public const X_REQUEST_ID_NORMALIZED = 'x-request-id'; // lowercase version used internally after header normalization

    public const CONTENT_TYPE_JSON = 'application/json'; // JSON content type without charset
    public const CONTENT_TYPE_JSON_UTF8 = 'application/json; charset=utf-8'; // JSON response content type with charset

    public const SERVER_HTTP_PREFIX = 'HTTP_'; // prefix PHP uses for normal request headers inside $_SERVER
    public const SERVER_CONTENT_TYPE = 'CONTENT_TYPE'; // special PHP server key for content type
    public const SERVER_CONTENT_LENGTH = 'CONTENT_LENGTH'; // special PHP server key for content length

    public const SERVER_HEADER_UNDERSCORE_CHAR = '_'; // server header separator char
    public const HEADER_DASH_CHAR = '-'; // normalized HTTP header separator char
}
