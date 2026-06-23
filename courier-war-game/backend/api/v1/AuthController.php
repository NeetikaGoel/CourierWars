<?php
declare(strict_types=1);

//imports always damn
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../config/CsrfConfig.php';
require_once __DIR__ . '/../../config/JwtConfig.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpRequestBoundary.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/AuthService.php';
require_once __DIR__ . '/../../validation/AuthRequestValidator.php';

//for handling of auth api endpoints
class AuthController
{
    private AuthService $_authService;
    private AuthRequestValidator $_authRequestValidator;
    private AuthRequestAuthenticator $_authRequestAuthenticator;
    private HttpRequestBoundary $_requestBoundary;
    private HttpResponseFactory $_responseFactory;

    //hehe constructor for creating auth controller dependencies
    public function __construct(?AuthService $authService = null, ?HttpResponseFactory $responseFactory = null)
    {
        $this->_authService = $authService ?? new AuthService();
        $this->_authRequestValidator = new AuthRequestValidator();
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator();
        $this->_requestBoundary = new HttpRequestBoundary($responseFactory);
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
    }

    //now for handling of register request
    public function register(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->publicJsonAuthActionRun($request, function (array $body): array {
            return $this->_authService->register($this->_authRequestValidator->registerValidate($body));
        }, true);
    }

    //now for handling of login request
    public function login(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->publicJsonAuthActionRun($request, function (array $body): array {
            return $this->_authService->login($this->_authRequestValidator->loginValidate($body));
        });
    }

    //now for handling of guest request
    public function guest(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->publicJsonAuthActionRun($request, function (array $body): array {
            return $this->_authService->guest($this->_authRequestValidator->guestValidate($body));
        }, true);
    }

    //ofc we need 1 for handling refresh request
    public function refresh(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $csrfError = $this->_requestBoundary->requireCsrfHeader($request);

        if ($csrfError !== null) {
            return $csrfError;
        }

        $refreshToken = $request->getCookie(JwtConfig::REFRESH_TOKEN_COOKIE_NAME);
        $csrfToken = (string)$request->getHeader(CsrfConfig::CSRF_HEADER_NAME);

        if ($refreshToken === null || trim($refreshToken) === '') {
            return $this->_responseFactory->unauthorized('refresh token is required', $request->getRequestId());
        }

        try {
            $result = $this->_authService->refresh($refreshToken, $csrfToken);
            return $this->_responseFactory->success($result['data'], $request->getRequestId())->addCookieHeaders($result['cookieHeaders']);
        } catch (Throwable) {
            return $this->_responseFactory->unauthorized('refresh token is invalid', $request->getRequestId());
        }
    }

    //for handling logout request
    public function logout(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->privateAuthActionRun($request, false);
    }

    //also about guest forget request
    public function guestForget(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->privateAuthActionRun($request, true);
    }

    //running public json auth actions
    private function publicJsonAuthActionRun(HttpRequest $request, callable $action, bool $created = false): HttpJsonResponse
    {
        $contentTypeError = $this->_requestBoundary->requireJsonContentType($request);
        if ($contentTypeError !== null) {
            return $contentTypeError;
        }

        $jsonError = $this->_requestBoundary->requireJsonBody($request);
        if ($jsonError !== null) {
            return $jsonError;
        }

        try {
            $result = $action($request->getJsonBody() ?? []);
            $response = $created
                ? $this->_responseFactory->created($result['data'], $request->getRequestId())
                : $this->_responseFactory->success($result['data'], $request->getRequestId());

            return $response->addCookieHeaders($result['cookieHeaders']);
        } catch (InvalidArgumentException $exception) {
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId());
        } catch (Throwable) {
            return $this->_responseFactory->unauthorized('auth request failed', $request->getRequestId());
        }
    }

    //running pvt auth actions
    private function privateAuthActionRun(HttpRequest $request, bool $guestOnly): HttpJsonResponse
    {
        $csrfError = $this->_requestBoundary->requireCsrfHeader($request);

        if ($csrfError !== null) {
            return $csrfError;
        }

        $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

        if ($authContext === null) {
            return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
        }

        if (!$this->_authRequestAuthenticator->csrfTokenValidForContext($authContext, $request)) {
            return $this->_responseFactory->forbidden('csrf token is invalid', $request->getRequestId());
        }

        if ($guestOnly && !$authContext->isGuest()) {
            return $this->_responseFactory->forbidden('guest session is required', $request->getRequestId());
        }

        if (!$guestOnly && !$authContext->isRegistered()) {
            return $this->_responseFactory->forbidden('registered session is required', $request->getRequestId());
        }

        $result = $guestOnly
            ? $this->_authService->guestForget($authContext)
            : $this->_authService->logout($authContext);

        return $this->_responseFactory->success($result['data'], $request->getRequestId())->addCookieHeaders($result['cookieHeaders']);
    }
}
