<?php

declare(strict_types=1);

//importing first
require_once __DIR__ . '/../../auth/AuthContext.php';
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../config/JwtConfig.php';
require_once __DIR__ . '/../../constants/AuditActionValue.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpRequestBoundary.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/AuditLogService.php';
require_once __DIR__ . '/../../service/AuthService.php';
require_once __DIR__ . '/../../validation/AuthRequestValidator.php';

//controller for handling auth api endpoints
class AuthController
{
    private AuthService $_authService;
    private AuthRequestValidator $_authRequestValidator;
    private AuthRequestAuthenticator $_authRequestAuthenticator;
    private HttpRequestBoundary $_requestBoundary;
    private HttpResponseFactory $_responseFactory;
    private AuditLogService $_auditLogService;

    //constructor first to create auth dependencies
    public function __construct(?AuthService $authService = null, ?HttpResponseFactory $responseFactory = null, ?AuditLogService $auditLogService = null)
    {
        $this->_authService = $authService ?? new AuthService();
        $this->_authRequestValidator = new AuthRequestValidator();
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator();
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
        $this->_requestBoundary = new HttpRequestBoundary($this->_responseFactory);
        $this->_auditLogService = $auditLogService ?? new AuditLogService();
    }

    //register a new user and create auth cookies
    public function register(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        try {
            $boundaryError = $this->publicJsonBoundaryCheck($request);

            if ($boundaryError !== null) {
                $this->_auditLogService->failure(null, AuditActionValue::AUTH_REGISTER, $request->getRequestId(), $this->errorCodeFromResponseGet($boundaryError));
                return $boundaryError;
            }

            $input = $this->_authRequestValidator->registerValidate($request->getJsonBody() ?? []);
            $session = $this->_authService->register($input);

            $this->_auditLogService->success(null, AuditActionValue::AUTH_REGISTER, $request->getRequestId(), $this->sessionAuditContextGet($session));

            return $this->authSessionResponseCreate($session, $request->getRequestId());
        } catch (InvalidArgumentException $exception) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_REGISTER, $request->getRequestId(), ApiErrorCode::BAD_REQUEST);
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_REGISTER, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    //login registered user and create auth cookies
    public function login(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        try {
            $boundaryError = $this->publicJsonBoundaryCheck($request);

            if ($boundaryError !== null) {
                $this->_auditLogService->failure(null, AuditActionValue::AUTH_LOGIN, $request->getRequestId(), $this->errorCodeFromResponseGet($boundaryError));
                return $boundaryError;
            }

            $input = $this->_authRequestValidator->loginValidate($request->getJsonBody() ?? []);
            $session = $this->_authService->login($input);

            $this->_auditLogService->success(null, AuditActionValue::AUTH_LOGIN, $request->getRequestId(), $this->sessionAuditContextGet($session));

            return $this->authSessionResponseCreate($session, $request->getRequestId());
        } catch (InvalidArgumentException $exception) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_LOGIN, $request->getRequestId(), ApiErrorCode::BAD_REQUEST);
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId());
        } catch (RuntimeException) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_LOGIN, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
            return $this->_responseFactory->unauthorized('invalid login credentials', $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_LOGIN, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    //create guest user and create auth cookies
    public function guest(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        try {
            $boundaryError = $this->publicJsonBoundaryCheck($request);

            if ($boundaryError !== null) {
                $this->_auditLogService->failure(null, AuditActionValue::AUTH_GUEST, $request->getRequestId(), $this->errorCodeFromResponseGet($boundaryError));
                return $boundaryError;
            }

            $input = $this->_authRequestValidator->guestValidate($request->getJsonBody() ?? []);
            $session = $this->_authService->guest($input);

            $this->_auditLogService->success(null, AuditActionValue::AUTH_GUEST, $request->getRequestId(), $this->sessionAuditContextGet($session));

            return $this->authSessionResponseCreate($session, $request->getRequestId());
        } catch (InvalidArgumentException $exception) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_GUEST, $request->getRequestId(), ApiErrorCode::BAD_REQUEST);
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_GUEST, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    //refresh auth cookies using refresh token and csrf token
    public function refresh(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        try {
            $boundaryError = $this->privateJsonBoundaryCheck($request);

            if ($boundaryError !== null) {
                $this->_auditLogService->failure(null, AuditActionValue::AUTH_REFRESH, $request->getRequestId(), $this->errorCodeFromResponseGet($boundaryError));
                return $boundaryError;
            }

            $refreshToken = $request->getCookie(JwtConfig::REFRESH_TOKEN_COOKIE_NAME);

            if ($refreshToken === null || trim($refreshToken) === '') {
                $this->_auditLogService->failure(null, AuditActionValue::AUTH_REFRESH, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('refresh token is required', $request->getRequestId());
            }

            $session = $this->_authService->refresh($refreshToken, (string)$request->getHeader(CsrfConfig::CSRF_HEADER_NAME));

            $this->_auditLogService->success(null, AuditActionValue::AUTH_REFRESH, $request->getRequestId(), $this->sessionAuditContextGet($session));

            return $this->authSessionResponseCreate($session, $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure(null, AuditActionValue::AUTH_REFRESH, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
            return $this->_responseFactory->unauthorized('refresh session is invalid', $request->getRequestId());
        }
    }

    //logout current authenticated session
    public function logout(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = null;

        try {
            $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

            if ($authContext === null) {
                $this->_auditLogService->failure(null, AuditActionValue::AUTH_LOGOUT, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
            }

            $boundaryError = $this->privateJsonBoundaryCheck($request);

            if ($boundaryError !== null) {
                $this->_auditLogService->failure($authContext, AuditActionValue::AUTH_LOGOUT, $request->getRequestId(), $this->errorCodeFromResponseGet($boundaryError));
                return $boundaryError;
            }

            if (!$this->_authRequestAuthenticator->csrfTokenValidForContext($authContext, $request)) {
                $this->_auditLogService->failure($authContext, AuditActionValue::AUTH_LOGOUT, $request->getRequestId(), ApiErrorCode::INVALID_CSRF_TOKEN);
                return $this->_responseFactory->forbidden('csrf token is invalid', $request->getRequestId());
            }

            $result = $this->_authService->logout($authContext);

            $this->_auditLogService->success($authContext, AuditActionValue::AUTH_LOGOUT, $request->getRequestId());

            return $this->cookieResponseCreate($result, $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, AuditActionValue::AUTH_LOGOUT, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    //forget current guest session
    public function guestForget(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = null;

        try {
            $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

            if ($authContext === null) {
                $this->_auditLogService->failure(null, AuditActionValue::AUTH_GUEST_FORGET, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
            }

            $boundaryError = $this->privateJsonBoundaryCheck($request);

            if ($boundaryError !== null) {
                $this->_auditLogService->failure($authContext, AuditActionValue::AUTH_GUEST_FORGET, $request->getRequestId(), $this->errorCodeFromResponseGet($boundaryError));
                return $boundaryError;
            }

            if (!$authContext->isGuest()) {
                $this->_auditLogService->failure($authContext, AuditActionValue::AUTH_GUEST_FORGET, $request->getRequestId(), ApiErrorCode::FORBIDDEN);
                return $this->_responseFactory->forbidden('only guest users can be forgotten', $request->getRequestId());
            }

            if (!$this->_authRequestAuthenticator->csrfTokenValidForContext($authContext, $request)) {
                $this->_auditLogService->failure($authContext, AuditActionValue::AUTH_GUEST_FORGET, $request->getRequestId(), ApiErrorCode::INVALID_CSRF_TOKEN);
                return $this->_responseFactory->forbidden('csrf token is invalid', $request->getRequestId());
            }

            $result = $this->_authService->guestForget($authContext);

            $this->_auditLogService->success($authContext, AuditActionValue::AUTH_GUEST_FORGET, $request->getRequestId());

            return $this->cookieResponseCreate($result, $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, AuditActionValue::AUTH_GUEST_FORGET, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    private function publicJsonBoundaryCheck(HttpRequest $request): ?HttpJsonResponse
    {
        $contentTypeError = $this->_requestBoundary->requireJsonContentType($request);

        if ($contentTypeError !== null) {
            return $contentTypeError;
        }

        return $this->_requestBoundary->requireJsonBody($request);
    }

    private function privateJsonBoundaryCheck(HttpRequest $request): ?HttpJsonResponse
    {
        $contentTypeError = $this->_requestBoundary->requireJsonContentType($request);

        if ($contentTypeError !== null) {
            return $contentTypeError;
        }

        $jsonError = $this->_requestBoundary->requireJsonBody($request);

        if ($jsonError !== null) {
            return $jsonError;
        }

        return $this->_requestBoundary->requireCsrfHeader($request);
    }

    private function authSessionResponseCreate(array $session, string $requestId): HttpJsonResponse
    {
        return $this->_responseFactory
            ->success($session['data'] ?? [], $requestId)
            ->addCookieHeaders($session['cookieHeaders'] ?? []);
    }

    private function cookieResponseCreate(array $result, string $requestId): HttpJsonResponse
    {
        return $this->_responseFactory
            ->success($result['data'] ?? [], $requestId)
            ->addCookieHeaders($result['cookieHeaders'] ?? []);
    }

    private function sessionAuditContextGet(array $session): array
    {
        $user = $session['data']['user'] ?? [];

        return [
            'userId' => $user['userId'] ?? null,
            'username' => $user['username'] ?? null,
            'userType' => $user['userType'] ?? null,
        ];
    }

    private function errorCodeFromResponseGet(HttpJsonResponse $response): string
    {
        $body = $response->getBody();

        return (string)($body['error']['code'] ?? ApiErrorCode::BAD_REQUEST);
    }
}
