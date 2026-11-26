# HTTP layer
Paths relative to `Project/Backend/`.

- `Http/Request.php` — immutable request. Production path: `createRequestFromRawHttp(string)` (parses raw socket text: request line, headers, query string, JSON body; sets `hasInvalidJson`). `createRequestFromGlobals()` + `readHeaders()` = legacy built-in-server path (unused). Getters: `getMethod/Path/Headers/Header/QueryParams/QueryParam/Body/BodyField/RawBody/getHasInvalidJson`.
- `Http/JsonResponse.php` — body array + status + headers; `send()` (legacy `php -S` output), `getStatusCode`, `getBody`. The socket server serialises it via `serverHttpResponseBuild` in `server.php`.
- `Http/ResponseFactory.php` — `success(message, data, status=200)` → `{success:true,message,data}`; `error(message, errorId, errorMessage, errors, status=400)` → `{success:false,message,error:{id,message,errors}}`. All controllers/router build responses only through this.

Tests: `tests/Unit/RequestTest.php`, `ResponseFactoryTest.php` (no JsonResponse test).
