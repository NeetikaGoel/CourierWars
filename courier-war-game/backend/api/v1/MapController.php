<?php
declare(strict_types=1);

require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../constants/HttpStatusCode.php';
require_once __DIR__ . '/../../service/MapGenerationService.php';

//this controller handles map metadata and preview map APIs
class MapController
{
    private MapGenerationService $_mapGenerationService;
    private HttpResponseFactory $_responseFactory;

    public function __construct(?MapGenerationService $mapGenerationService = null, ?HttpResponseFactory $responseFactory = null)
    {
        $this->_mapGenerationService = $mapGenerationService ?? new MapGenerationService();
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
    }

    //this returns map metadata only
    public function currentMapMetadataGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->_responseFactory->success(
            $this->_mapGenerationService->currentMapMetadataGet(),
            $request->getRequestId()
        );
    }

    //this returns a full generated map snapshot
    public function previewMapGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        try {
            $seedRaw = $request->getQueryParam('seed');

            $mapSnapshot = $this->_mapGenerationService->previewMapGenerate($seedRaw);

            return $this->_responseFactory->success(
                $mapSnapshot,
                $request->getRequestId()
            );
        } 
        
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
