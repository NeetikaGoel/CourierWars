<?php
declare(strict_types=1);

//first imports ofc
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../constants/HttpStatusCode.php';
require_once __DIR__ . '/../../service/MapGenerationService.php';

//this controller handles map metadata and preview map APIs
//so starting with the class lets see
class MapController
{
    //first we need variables which ones????
    //one for map generation and a response one
    private MapGenerationService $_mapGenerationService;
    private HttpResponseFactory $_responseFactory;

    //constructor now 
    public function __construct(?MapGenerationService $mapGenerationService = null, ?HttpResponseFactory $responseFactory = null)
    {
        $this->_mapGenerationService = $mapGenerationService ?? new MapGenerationService();
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
    }

    //now if we need to return map meta data first
    public function currentMapMetadataGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->_responseFactory->success(
            $this->_mapGenerationService->currentMapMetadataGet(),
            $request->getRequestId()
        );
    }

    //for returning full generated map snapshot
    public function previewMapGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        //in try coz issue might come
        try {
            $seedRaw = $request->getQueryParam('seed');
            $mapSnapshot = $this->_mapGenerationService->previewMapGenerate($seedRaw);
            return $this->_responseFactory->success(
                $mapSnapshot,
                $request->getRequestId()
            );
        } 
        
        //for catching any errors
        catch (Throwable $throwable) {
            return $this->_responseFactory->error(
                ApiErrorCode::MAP_STATE_MISSING,
                $throwable->getMessage(),
                HttpStatusCode::INTERNAL_SERVER_ERROR,
                $request->getRequestId()
            );
        }
    }
}
