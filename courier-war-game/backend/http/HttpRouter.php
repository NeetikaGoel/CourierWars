<?php

declare(strict_types=1);

//importing request object
require_once __DIR__ . '/HttpRequest.php';

//importing response object
require_once __DIR__ . '/HttpJsonResponse.php';

//importing response factory
require_once __DIR__ . '/HttpResponseFactory.php';

//this file maps HTTP method and path to controller callback
class HttpRouter
{
    private array $_routes = []; // all registered routes
    private HttpResponseFactory $_responseFactory; // response factory for router errors

    //constructor creates response factory if not provided
    public function __construct(?HttpResponseFactory $responseFactory = null)
    {
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory(); // store response factory
    }

    //this adds a route to router
    public function addRoute(string $method, string $pathPattern, callable $handler): void
    {
        $compiled = $this->compilePathPattern($pathPattern); // convert path pattern into regex

        $this->_routes[] = [
            'method' => strtoupper($method), // store uppercase method
            'pathPattern' => $this->normalizePathPattern($pathPattern), // store normalized path pattern
            'regex' => $compiled['regex'], // store route regex
            'paramNames' => $compiled['paramNames'], // store path param names
            'handler' => $handler, // store controller callback
        ];
    }

    //this dispatches request to matching route
    public function dispatch(HttpRequest $request): HttpJsonResponse
    {
        $methodMismatchFound = false; // this tells if path exists but method is wrong

        try // catch unexpected controller/router errors safely
        {
            foreach ($this->_routes as $route) // loop through registered routes
            {
                $matches = []; // regex matches will be stored here

                if (preg_match($route['regex'], $request->getPath(), $matches) !== 1) // check if path matches
                {
                    continue; // go to next route
                }

                if ($route['method'] !== $request->getMethod()) // if path matches but method is wrong
                {
                    $methodMismatchFound = true; // mark method mismatch
                    continue; // continue in case another route supports this method
                }

                $pathParams = $this->extractPathParams($route['paramNames'], $matches); // extract dynamic params like matchId

                $response = call_user_func($route['handler'], $request, $pathParams); // call controller method

                if ($response instanceof HttpJsonResponse) // controller must return HttpJsonResponse
                {
                    return $response; // return controller response
                }

                return $this->_responseFactory->internalError($request->getRequestId()); // return safe 500 if controller returned wrong type
            }

            if ($methodMismatchFound) // if route path exists but method is invalid
            {
                return $this->_responseFactory->methodNotAllowed('HTTP method is not allowed for this route', $request->getRequestId()); // return 405
            }

            return $this->_responseFactory->notFound('API route was not found', $request->getRequestId()); // return 404
        } catch (Throwable) // catch unexpected errors without exposing stack trace
        {
            return $this->_responseFactory->internalError($request->getRequestId()); // return safe 500
        }
    }

    //this converts /api/v1/matches/{matchId}/state into regex
    private function compilePathPattern(string $pathPattern): array
    {
        $pathPattern = $this->normalizePathPattern($pathPattern); // normalize pattern

        $segments = explode('/', trim($pathPattern, '/')); // split route into path segments

        $regexSegments = []; // regex path segments will be stored here

        $paramNames = []; // path parameter names will be stored here

        foreach ($segments as $segment) // loop through route segments
        {
            if (preg_match('/^\{([A-Za-z_][A-Za-z0-9_]*)\}$/', $segment, $matches) === 1) // check if segment is {param}
            {
                $paramNames[] = $matches[1]; // store param name
                $regexSegments[] = '([^/]+)'; // match one URL segment
                continue; // go to next segment
            }

            $regexSegments[] = preg_quote($segment, '#'); // escape normal route segment
        }

        return [
            'regex' => '#^/' . implode('/', $regexSegments) . '$#', // final regex
            'paramNames' => $paramNames, // parameter names
        ];
    }

    //this extracts path params from regex matches
    private function extractPathParams(array $paramNames, array $matches): array
    {
        $pathParams = []; // path params result

        foreach ($paramNames as $index => $name) // loop param names
        {
            $pathParams[$name] = rawurldecode((string)$matches[$index + 1]); // decode matching value
        }

        return $pathParams; // return path params
    }

    //this normalizes route pattern
    private function normalizePathPattern(string $pathPattern): string
    {
        $pathPattern = '/' . ltrim($pathPattern, '/'); // ensure leading slash

        if ($pathPattern !== '/' && str_ends_with($pathPattern, '/')) // if trailing slash exists
        {
            $pathPattern = rtrim($pathPattern, '/'); // remove trailing slash
        }

        return $pathPattern; // return normalized pattern
    }
}
