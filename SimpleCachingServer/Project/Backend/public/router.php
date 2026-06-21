<?php

declare(strict_types=1);

require_once __DIR__ . '/../Auth/Role.php';
require_once __DIR__ . '/../Http/Request.php';
require_once __DIR__ . '/../Http/JsonResponse.php';
require_once __DIR__ . '/../Http/ResponseFactory.php';
require_once __DIR__ . '/../Auth/AuthService.php';
require_once __DIR__ . '/../config/constants.php';

require_once __DIR__ . '/../Controller/CacheController.php';
require_once __DIR__ . '/../Controller/AdminCacheController.php';
require_once __DIR__ . '/../Controller/AdminCacheMetricsController.php';
require_once __DIR__ . '/../Logging/Logger.php';

function cacheRouterDispatch(Request $request, AuthService $authService, CacheController $cacheController, AdminCacheController $adminCacheController, AdminCacheMetricsController $adminCacheMetricsController, ResponseFactory $responseFactory): JsonResponse
{
    //authenticate caller first
    $userRole = $authService->authenticate($request);

    //if auth failed return 401
    if ($userRole === null) {
        // log auth failed
        Logger::logWarn('Router', 'Request authentication failed', 'ROUTER_AUTH_FAILED', [
            'path' => $request->getPath(),
            'method' => $request->getMethod()
        ]);

        //return unauthorized response
        return $responseFactory->error('Authentication failed', 'AUTH-4011', 'Missing or invalid API key', [], 401);
    }

    //get request path
    $path = $request->getPath();

    //get request method
    $method = $request->getMethod();

    //route normal set endpoint
    if ($path === ENDPOINT_NORMAL_SET) 
    {
        // normal role required
        if ($authService->authorize($userRole, Role::NORMAL) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4031', 'Insufficient role', [], 403);
        }

        // call normal cache controller set
        return $cacheController->set($request);
    }

    // route normal get endpoint
    if ($path === ENDPOINT_NORMAL_GET) 
    {
        // normal role required
        if ($authService->authorize($userRole, Role::NORMAL) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4032', 'Insufficient role', [], 403);
        }

        // call normal cache controller get
        return $cacheController->get($request);
    }

    // route normal delete endpoint
    if ($path === ENDPOINT_NORMAL_DELETE)
    {
        // normal role required
        if ($authService->authorize($userRole, Role::NORMAL) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4033', 'Insufficient role', [], 403);
        }

        // call normal cache controller delete
        return $cacheController->delete($request);
    }

    // now about admin operations hehe
    // lets see 
    // route admin bulk set endpoint
    if ($path === ENDPOINT_ADMIN_BULKSET) 
    {
        // admin role required
        if ($authService->authorize($userRole, Role::ADMIN) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4034', 'Admin role required', [], 403);
        }

        // call admin bulk set controller
        return $adminCacheController->bulkSet($request);
    }

    // route admin purge selected endpoint
    if ($path === ENDPOINT_ADMIN_PURGESELECTED) 
    {
        // admin role required
        if ($authService->authorize($userRole, Role::ADMIN) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4035', 'Admin role required', [], 403);
        }

        // call admin purge selected controller
        return $adminCacheController->purgeSelected($request);
    }

    // route admin purge all endpoint
    if ($path === ENDPOINT_ADMIN_PURGEALL) 
    {
        // admin role required
        if ($authService->authorize($userRole, Role::ADMIN) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4036', 'Admin role required', [], 403);
        }

        // call admin purge all controller
        return $adminCacheController->purgeAll($request);
    }

    // route admin list endpoint
    if ($path === ENDPOINT_ADMIN_LIST) 
    {
        // admin role required
        if ($authService->authorize($userRole, Role::ADMIN) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4037', 'Admin role required', [], 403);
        }

        // call admin list controller
        return $adminCacheController->list($request);
    }

    // route admin uptime endpoint
    if ($path === ENDPOINT_ADMIN_UPTIME) 
    {
        // admin role required
        if ($authService->authorize($userRole, Role::ADMIN) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4038', 'Admin role required', [], 403);
        }

        // call admin uptime controller
        return $adminCacheMetricsController->uptime($request);
    }

    // route admin size endpoint
    if ($path === ENDPOINT_ADMIN_SIZE) 
    {
        // admin role required
        if ($authService->authorize($userRole, Role::ADMIN) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4039', 'Admin role required', [], 403);
        }

        // call admin size controller
        return $adminCacheMetricsController->size($request);
    }

    // route admin health endpoint
    if ($path === ENDPOINT_ADMIN_HEALTH) 
    {
        // admin role required
        if ($authService->authorize($userRole, Role::ADMIN) !== true) {
            // return forbidden response
            return $responseFactory->error('Authorization failed', 'AUTH-4040', 'Admin role required', [], 403);
        }

        // call admin health controller
        return $adminCacheMetricsController->health($request);
    }

    // now what if unknown route???
    // so log it simple
    Logger::logWarn('Router', 'Route not found', 'ROUTER_ROUTE_NOT_FOUND', [
        'path' => $path,
        'method' => $method
    ]);

    // return 404 for it
    return $responseFactory->error('Route not found', 'CACHE-4040', 'Route not found', [], 404);
}
