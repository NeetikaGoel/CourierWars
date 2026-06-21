We first used PHP built-in server, but that recreated PHP memory on every request, so in-memory cache was lost

To make cache persist, we changed server.php into a long-running socket server

Now Application and CacheService are created once at startup

server.php keeps listening in a while loop, accepts HTTP requests, converts raw HTTP text into Request objects, routes them through controllers, and writes raw HTTP responses back

Because the same CacheService object stays alive, the cache array stays alive across requests



Application = main app wiring
Request = parsed HTTP request object
ResponseFactory = fallback error response maker
Logger = logs errors/startup



1. start.sh runs php server.php

2. server.php opens 127.0.0.1:8080

3. Application is created once

4. CacheService is created once

5. while true waits for requests

6. curl sends HTTP request

7. server reads raw HTTP text

8. Request object is created

9. Application sends request to router

10. Router checks auth and route

11. Controller validates request

12. CacheService stores or reads data

13. Response object is created

14. server.php converts it to raw HTTP

15. response goes back to curl

16. connection closes

17. server stays alive for next request



This creates the actual server that listens for network requests - stream_socket_server
explode()-Splits a string by exact text


The server is now a custom long-running PHP socket server

It opens 127.0.0.1:8080 using stream_socket_server and keeps running in a while true loop

For every incoming curl request, stream_socket_accept gives us a client connection

We read raw HTTP text from that connection using fread

Then Request parses method path headers query params and body

Application sends it to router, router checks auth and calls the correct controller

Controller validates input and calls CacheService

CacheService stores data in an in-memory array of CacheItem objects

Because Application and CacheService are created only once before the loop, the cache array survives across multiple requests

Finally server.php converts JsonResponse into raw HTTP response and writes it back using fwrite










This function converts a **raw HTTP request string** into your clean `Request` object.

Because now you are not using PHP built-in globals like:

```php
$_SERVER
$_GET
php://input
```

Your custom socket server receives request like plain text, so we manually parse it.

Example raw HTTP request looks like this:

```text
POST /v1/cache/set HTTP/1.1
Host: 127.0.0.1:8080
Content-Type: application/json
X-API-Key: NORMALAPIKEY12345678901234567890
Content-Length: 48

{"key":"test.name","value":"Neetika","ttl":60}
```

This function breaks that into:

```text
method       = POST
path         = /v1/cache/set
query params = []
headers      = Host, Content-Type, X-API-Key
body         = ["key" => "test.name", "value" => "Neetika", "ttl" => 60]
rawBody      = original JSON string
invalidJson  = false
```

---

## Step-by-step

### 1. Split headers and body

```php
$requestParts = explode("\r\n\r\n", $rawHttpRequest, 2);
```

HTTP request has a blank line between headers and body.

```text
HEADERS
blank line
BODY
```

So this splits request into 2 parts only:

```text
part 0 = headers
part 1 = body
```

---

### 2. Get header text

```php
$headerText = $requestParts[0] ?? '';
```

This contains:

```text
POST /v1/cache/set HTTP/1.1
Host: 127.0.0.1:8080
Content-Type: application/json
X-API-Key: ...
```

If missing, use empty string.

---

### 3. Get raw body

```php
$rawBody = $requestParts[1] ?? '';
```

This contains:

```json
{"key":"test.name","value":"Neetika","ttl":60}
```

If no body exists, it becomes empty string.

---

### 4. Split headers into lines

```php
$headerLines = preg_split("/\r\n|\n|\r/", $headerText);
```

This turns header text into array:

```php
[
    "POST /v1/cache/set HTTP/1.1",
    "Host: 127.0.0.1:8080",
    "Content-Type: application/json",
    "X-API-Key: NORMALAPIKEY..."
]
```

We use `preg_split` because different systems may use different newline styles:

```text
\r\n
\n
\r
```

---

### 5. Get request line

```php
$requestLine = $headerLines[0] ?? 'GET / HTTP/1.1';
```

First line is special.

Example:

```text
POST /v1/cache/set HTTP/1.1
```

It tells:

```text
method = POST
uri = /v1/cache/set
protocol = HTTP/1.1
```

Fallback is:

```text
GET / HTTP/1.1
```

---

### 6. Split request line

```php
$requestLineParts = explode(' ', trim($requestLine));
```

This converts:

```text
POST /v1/cache/set HTTP/1.1
```

into:

```php
[
    "POST",
    "/v1/cache/set",
    "HTTP/1.1"
]
```

---

### 7. Extract method

```php
$method = $requestLineParts[0] ?? 'GET';
```

For example:

```text
POST
GET
DELETE
```

Default is `GET`.

---

### 8. Extract URI

```php
$requestUri = $requestLineParts[1] ?? '/';
```

URI means path plus query string.

Example:

```text
/v1/cache/get?key=test.name
```

---

### 9. Extract only path

```php
$path = parse_url($requestUri, PHP_URL_PATH);
```

From:

```text
/v1/cache/get?key=test.name
```

it extracts:

```text
/v1/cache/get
```

This is what router uses for route matching.

---

### 10. Fallback if path failed

```php
if ($path === false || $path === null) {
    $path = '/';
}
```

If URI is weird or empty, we safely use `/`.

---

### 11. Extract query string

```php
$queryString = parse_url($requestUri, PHP_URL_QUERY);
```

From:

```text
/v1/cache/get?key=test.name
```

it extracts:

```text
key=test.name
```

---

### 12. Prepare query params

```php
$queryParams = [];
```

Start empty.

---

### 13. Convert query string to array

```php
if (is_string($queryString)) {
    parse_str($queryString, $queryParams);
}
```

This converts:

```text
key=test.name&limit=10
```

into:

```php
[
    "key" => "test.name",
    "limit" => "10"
]
```

Important: query params from URLs are usually strings.

---

### 14. Prepare headers array

```php
$headers = [];
```

Start empty.

---

### 15. Loop header lines except first line

```php
for ($index = 1; $index < count($headerLines); $index++) {
```

We start from `1` because index `0` is request line:

```text
POST /v1/cache/set HTTP/1.1
```

Actual headers start from index `1`.

---

### 16. Get current header line

```php
$headerLine = $headerLines[$index];
```

Example:

```text
X-API-Key: NORMALAPIKEY12345678901234567890
```

---

### 17. Skip invalid header lines

```php
if (strpos($headerLine, ':') === false) {
    continue;
}
```

Valid HTTP header has colon:

```text
Name: Value
```

If no colon, skip it.

---

### 18. Split header name and value

```php
[$headerName, $headerValue] = explode(':', $headerLine, 2);
```

From:

```text
X-API-Key: NORMALAPIKEY12345678901234567890
```

we get:

```php
$headerName = "X-API-Key"
$headerValue = " NORMALAPIKEY12345678901234567890"
```

`2` means split into only 2 pieces, so values can still contain `:` safely.

---

### 19. Store cleaned header

```php
$headers[trim($headerName)] = trim($headerValue);
```

This removes extra spaces.

Stores:

```php
[
    "X-API-Key" => "NORMALAPIKEY12345678901234567890"
]
```

---

### 20. Default body array

```php
$body = [];
```

If there is no JSON body, body stays empty.

---

### 21. Default JSON validity

```php
$hasInvalidJson = false;
```

We assume JSON is fine unless proven wrong.

---

### 22. Decode only if body exists

```php
if ($rawBody !== '') {
```

GET requests usually have no body, so we skip JSON parsing for them.

---

### 23. Decode JSON

```php
$decodedBody = json_decode($rawBody, true);
```

This converts JSON string to PHP array.

Example:

```json
{"key":"test.name","value":"Neetika","ttl":60}
```

becomes:

```php
[
    "key" => "test.name",
    "value" => "Neetika",
    "ttl" => 60
]
```

`true` means decode as associative array, not object.

---

### 24. Check invalid JSON

```php
if (json_last_error() !== JSON_ERROR_NONE || !is_array($decodedBody)) {
    $hasInvalidJson = true;
}
```

Invalid if:

```text
JSON syntax is broken
OR decoded result is not array
```

Example bad JSON:

```json
{"key":"abc",
```

Example not array:

```json
"hello"
```

Your API expects JSON object body, so plain string JSON is invalid.

---

### 25. Save decoded body

```php
else {
    $body = $decodedBody;
}
```

If JSON is valid, store it in `$body`.

Controllers then use:

```php
$request->getBodyField('key')
```

---

### 26. Return final Request object

```php
return new Request($method, $path, $headers, $queryParams, $body, $rawBody, $hasInvalidJson);
```

This packs everything into your `Request` object.

After this, the rest of your code does not care whether request came from:

```text
PHP globals
```

or:

```text
custom raw HTTP socket
```

It just uses:

```php
$request->getMethod()
$request->getPath()
$request->getHeader()
$request->getQueryParam()
$request->getBodyField()
```

---

## In one line

This function takes messy raw HTTP text from the socket and turns it into a clean object your router and controllers can understand.
