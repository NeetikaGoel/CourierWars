We need these `http/` files because controllers should not directly handle `$_SERVER`, cookies, JSON parsing, response formatting, routing, and repeated boundary checks. 

BSTD4 also says server handlers should validate input at the boundary, return consistent response shapes, use correct HTTP status codes, and keep business logic out of request-handling glue code. 


1.  `HttpRequest.php` ------ Converts PHP globals like `$_SERVER`, `$_COOKIE`, `$_GET`, headers, and raw body into one clean request object. Controllers can then read `$request->getJsonBody()` instead of touching PHP globals everywhere.

2.   `HttpJsonResponse.php`  ------ Represents one JSON response with status code, headers, cookies, and body. This prevents every controller from manually doing `http_response_code()` and `echo json_encode()`.             

3.   `HttpResponseFactory.php` ------ Creates the standard API response envelope: `success`, `data`, `error`, and `meta`. This keeps all API success/error responses consistent with the TAD contract.                            

4.   `HttpCookieFactory.php` ------ Creates and clears JWT, refresh-token, CSRF, user-id, and login-email cookies with the correct flags. This avoids repeating risky cookie logic inside every auth endpoint.  

5.   `HttpRequestBoundary.php`  ------  Holds common request checks like method, JSON content type, body size, JSON validity, CSRF header, required cookie, and idempotency key. This keeps controllers short and makes boundary validation consistent.

6.   `HttpRouter.php` ------   Maps method + path to the correct controller method, like `POST /api/v1/auth/login` → `AuthController.login`. Without this, `public/index.php` would become a messy chain of `if/else` route checks.      

In simple words:

HttpRequest = understand incoming request
HttpJsonResponse = send outgoing response
HttpResponseFactory = make response format same everywhere
HttpCookieFactory = handle cookies safely
HttpRequestBoundary = reject bad requests before service logic
HttpRouter = send request to correct controller


Browser sends request
  ↓
PHP fills temporary request values:
  $_SERVER
  $_GET
  $_COOKIE
  php://input
  ↓
We read them
  ↓
We validate them
  ↓
We throw them away after response