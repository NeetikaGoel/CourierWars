<?php

declare(strict_types=1);

//importing first
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../constants/AuditActionValue.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/AuditLogService.php';
require_once __DIR__ . '/../../service/ProfileService.php';

//controller for handling profile api endpoint
class ProfileController
{
    private AuthRequestAuthenticator $_authRequestAuthenticator;
    private ProfileService $_profileService;
    private HttpResponseFactory $_responseFactory;
    private AuditLogService $_auditLogService; // writes profile audit logs

    //constructor first to create the profile dependencies
    public function __construct(?ProfileService $profileService = null, ?HttpResponseFactory $responseFactory = null, ?AuditLogService $auditLogService = null)
    {
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator();
        $this->_profileService = $profileService ?? new ProfileService();
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
        $this->_auditLogService = $auditLogService ?? new AuditLogService();
    }

    //returnign full profile for current authenticated user
    public function profileGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

        if ($authContext === null) {
            $this->_auditLogService->failure(null, AuditActionValue::PROFILE_GET, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
            return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
        }

        try {
            $profile = $this->_profileService->profileGet($authContext);

            $this->_auditLogService->success($authContext, AuditActionValue::PROFILE_GET, $request->getRequestId());

            return $this->_responseFactory->success($profile, $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, AuditActionValue::PROFILE_GET, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }
}
