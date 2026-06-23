<?php
declare(strict_types=1);

//so first importing everything hehe
require_once __DIR__ . '/../config/AppConfig.php';
require_once __DIR__ . '/../http/HttpRequest.php';
require_once __DIR__ . '/../http/HttpRouter.php';
require_once __DIR__ . '/../http/HttpResponseFactory.php';
require_once __DIR__ . '/../api/v1/AuthController.php';
require_once __DIR__ . '/../api/v1/ProfileController.php';
require_once __DIR__ . '/../api/v1/MapController.php';

//this file is backend public entry point for all API routes

error_reporting(E_ALL);
ini_set('display_errors', '0');

$request = HttpRequest::fromGlobals();
$responseFactory = new HttpResponseFactory();
$router = new HttpRouter($responseFactory);
$authController = new AuthController(null, $responseFactory);
$profileController = new ProfileController(null, $responseFactory);
$mapController = new MapController(null, $responseFactory);

//this route is useful for checking backend is alive
$router->addRoute('GET', AppConfig::API_BASE_PATH . '/health', function (HttpRequest $request, array $pathParams) use ($responseFactory): HttpJsonResponse {
    return $responseFactory->success(
        [
            'status' => 'ok',
            'appName' => AppConfig::APP_NAME,
            'apiVersion' => AppConfig::API_VERSION,
        ],
        $request->getRequestId()
    );
});

//auth routes
$router->addRoute('POST', AppConfig::API_BASE_PATH . '/auth/register', [$authController, 'register']);
$router->addRoute('POST', AppConfig::API_BASE_PATH . '/auth/login', [$authController, 'login']);
$router->addRoute('POST', AppConfig::API_BASE_PATH . '/auth/guest', [$authController, 'guest']);
$router->addRoute('POST', AppConfig::API_BASE_PATH . '/auth/refresh', [$authController, 'refresh']);
$router->addRoute('POST', AppConfig::API_BASE_PATH . '/auth/logout', [$authController, 'logout']);
$router->addRoute('POST', AppConfig::API_BASE_PATH . '/auth/guest/forget', [$authController, 'guestForget']);

//profile routes
$router->addRoute('GET', AppConfig::API_BASE_PATH . '/profile', [$profileController, 'profileGet']);

//this route returns metadata and config for current map version
$router->addRoute('GET', AppConfig::API_BASE_PATH . '/maps/current', [$mapController, 'currentMapMetadataGet']);

//this route returns one generated readable map snapshot
$router->addRoute('GET', AppConfig::API_BASE_PATH . '/maps/preview', [$mapController, 'previewMapGet']);

$response = $router->dispatch($request);
$response->send();
