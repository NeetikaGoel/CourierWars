<?php

declare(strict_types=1);

//first imports ofc
require_once __DIR__ . '/../../constants/AuditActionValue.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../constants/HttpStatusCode.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/AuditLogService.php';
require_once __DIR__ . '/../../service/MapGenerationService.php';

//this controller handles map metadata and preview map APIs
//so starting with the class lets see
class MapController
{
    //first we need variables which ones????
    //one for map generation and a response one
    private MapGenerationService $_mapGenerationService;
    private HttpResponseFactory $_responseFactory;
    private AuditLogService $_auditLogService; // writes public map audit logs

    //constructor now 
    public function __construct(?MapGenerationService $mapGenerationService = null, ?HttpResponseFactory $responseFactory = null, ?AuditLogService $auditLogService = null)
    {
        $this->_mapGenerationService = $mapGenerationService ?? new MapGenerationService();
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
        $this->_auditLogService = $auditLogService ?? new AuditLogService();
    }

    //now if we need to return map meta data first
    public function currentMapMetadataGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        try {
            $metadata = $this->_mapGenerationService->currentMapMetadataGet();

            $this->_auditLogService->success(null, AuditActionValue::MAP_METADATA_GET, $request->getRequestId());

            return $this->_responseFactory->success(
                $metadata,
                $request->getRequestId()
            );
        } catch (Throwable) {
            $this->_auditLogService->failure(null, AuditActionValue::MAP_METADATA_GET, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    //for returning full generated map snapshot
    public function previewMapGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        //in try coz issue might come
        try {
            $seedRaw = $request->getQueryParam('seed');
            $mapSnapshot = $this->_mapGenerationService->previewMapGenerate($seedRaw);

            $this->_auditLogService->success(null, AuditActionValue::MAP_PREVIEW_GET, $request->getRequestId(), [
                'seedProvided' => $seedRaw !== null,
            ]);

            return $this->_responseFactory->success(
                $mapSnapshot,
                $request->getRequestId()
            );
        }

        //for catching any errors
        catch (Throwable) {
            $this->_auditLogService->failure(null, AuditActionValue::MAP_PREVIEW_GET, $request->getRequestId(), ApiErrorCode::MAP_STATE_MISSING);

            return $this->_responseFactory->error(
                ApiErrorCode::MAP_STATE_MISSING,
                'map preview could not be generated',
                HttpStatusCode::INTERNAL_SERVER_ERROR,
                $request->getRequestId()
            );
        }
    }
}
