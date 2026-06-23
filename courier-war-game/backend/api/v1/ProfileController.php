<?php
declare(strict_types=1);

//importing first
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/ProfileService.php';

//controller for handling profile api endpoint
class ProfileController
{
    private AuthRequestAuthenticator $_authRequestAuthenticator;
    private ProfileService $_profileService;
    private HttpResponseFactory $_responseFactory;

    //constructor first to create the profile dependencies
    public function __construct(?ProfileService $profileService = null, ?HttpResponseFactory $responseFactory = null)
    {
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator();
        $this->_profileService = $profileService ?? new ProfileService();
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
    }

    //returnign full profile for current authenticated user
    public function profileGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

        if ($authContext === null) {
            return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
        }

        try {
            return $this->_responseFactory->success($this->_profileService->profileGet($authContext), $request->getRequestId());
        } catch (Throwable) {
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }
}
