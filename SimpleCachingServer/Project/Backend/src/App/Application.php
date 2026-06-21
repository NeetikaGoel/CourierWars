<?php

declare(strict_types=1);

require_once __DIR__ . '/../Bootstrap/BootstrapLoader.php'; //for config loading
require_once __DIR__ . '/../Cache/CacheService.php'; //for all cache ops
require_once __DIR__ . '/../../Auth/AuthService.php'; //for authenticate and authorize
require_once __DIR__ . '/../../Http/Request.php'; //so app can handle request obj
require_once __DIR__ . '/../../Http/JsonResponse.php'; //returning such response
require_once __DIR__ . '/../../Http/ResponseFactory.php'; //for success and error msg

require_once __DIR__ . '/../../Controller/CacheController.php'; //normal controller
require_once __DIR__ . '/../../Controller/AdminCacheController.php'; //admin controller

require_once __DIR__ . '/../../Logging/Logger.php'; //for logging ofc
require_once __DIR__ . '/../../public/router.php'; //app will delegate routing to that file

class Application
{
    //first defining root path of backend project
    private string $_basePath;

    //now having cache service that will be shared by all controllers
    private CacheService $_cacheService;

    //now defining auth service that will be used by router
    private AuthService $_authService;

    //response factory that will be used by controllers and also router
    private ResponseFactory $_responseFactory;

    //now both controllers
    private CacheController $_cacheController;
    private AdminCacheController $_adminCacheController;
    private AdminCacheMetricsController $_adminCacheMetricsController;

    //bootstrap load result lets say
    private array $_bootstrapResult;

    //lets define constructor now!!!!
    public function __construct(string $_basePath)
    {
        $this->_basePath = $_basePath;
        $this->_responseFactory = new ResponseFactory();
        $this->_bootstrapResult = $this->bootstrapLoad();
        $this->_cacheService = new CacheService();

        //load preload items from bootstrap into cache
        $this->preloadItemsLoad($this->_bootstrapResult['items']);

        //load auth config from config/auth php
        $authConfig = $this->authConfigLoad();

        //creating new auth service
        $this->_authService = new AuthService($authConfig);

        //now creating both controllers
        $this->_cacheController = new CacheController($this->_cacheService, $this->_responseFactory);
        $this->_adminCacheController = new AdminCacheController($this->_cacheService, $this->_responseFactory);
        $this->_adminCacheMetricsController = new AdminCacheMetricsController($this->_cacheService, $this->_responseFactory);

        // log application startup
        Logger::logInfo('Application', 'Application initialized', []);
    }

    public function handle(Request $request): JsonResponse
    {
        // sending request to router and returning router response
        return cacheRouterDispatch(
            $request,
            $this->_authService,
            $this->_cacheController,
            $this->_adminCacheController,
            $this->_adminCacheMetricsController,
            $this->_responseFactory
        );
    }

    private function bootstrapLoad(): array
    {
        //building bootstrap file path
        $bootstrapFilePath = $this->_basePath . '/config/bootstrap.json';

        //creating bootstrap loader
        $bootstrapLoader = new BootstrapLoader($bootstrapFilePath);

        //load bootstrap result
        $bootstrapResult = $bootstrapLoader->load();

        // log bootstrap loaded status
        Logger::logInfo('Application', 'Bootstrap load completed', [
            'loaded' => $bootstrapResult['loaded'],
            'warnings' => $bootstrapResult['warnings'],
            'errors' => $bootstrapResult['errors']
        ]);

        //returning it now
        return $bootstrapResult;
    }

    private function preloadItemsLoad(array $items): void
    {
        // loopong through preload items from bootstrap
        foreach ($items as $item) 
            {
                try 
                {
                    //storing preload item in cache
                    $this->_cacheService->set($item['key'], $item['value'], $item['ttl']);
                } 
                
                catch (Exception $exception) 
                {
                    // log preload failure but do not stop startup
                    Logger::logWarn('Application', 'Preload item skipped', 'PRELOAD_ITEM_FAILED', [
                        'key' => $item['key'] ?? null,
                        'errorMessage' => $exception->getMessage()
                    ]);
                }
            }
    }

    private function authConfigLoad(): array
    {
        //building auth config path
        $authConfigPath = $this->_basePath . '/config/auth.php';

        //check first whether auth config exists or not even
        if (!file_exists($authConfigPath)) 
            {
                // log missing auth config
                Logger::logError('Application', 'Auth config file missing', 'AUTH_CONFIG_MISSING');

                // return empty config so auth fails closed
                return [];
            }

        // load auth config array
        $authConfig = require $authConfigPath;

        // check loaded config is array
        if (!is_array($authConfig)) 
        {
            //logging invalid auth config
            Logger::logError('Application', 'Auth config is invalid', 'AUTH_CONFIG_INVALID');

            //returning empty config so auth fails closed
            return [];
        }

        //returning now ofc
        return $authConfig;
    }
}
