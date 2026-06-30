<?php

declare(strict_types=1);

require_once __DIR__ . '/../../auth/AuthContext.php';
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../constants/AuditActionValue.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../constants/HttpRequestValue.php';
require_once __DIR__ . '/../../constants/RateLimitBucketValue.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpRequestBoundary.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/AuditLogService.php';
require_once __DIR__ . '/../../service/DrawService.php';
require_once __DIR__ . '/../../service/MatchStateService.php';
require_once __DIR__ . '/../../service/RateLimitService.php';
require_once __DIR__ . '/../../validation/DrawActionRequestValidator.php';
require_once __DIR__ . '/../../validation/MatchPathValidator.php';

class DrawActionController
{
    private AuthRequestAuthenticator $_authRequestAuthenticator;
    private HttpRequestBoundary $_requestBoundary;
    private HttpResponseFactory $_responseFactory;
    private MatchPathValidator $_matchPathValidator;
    private DrawActionRequestValidator $_drawActionRequestValidator;
    private DrawService $_drawService;
    private MatchStateService $_matchStateService;
    private RateLimitService $_rateLimitService;
    private AuditLogService $_auditLogService;

    public function __construct(?DrawService $drawService = null, ?HttpResponseFactory $responseFactory = null)
    {
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator();
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
        $this->_requestBoundary = new HttpRequestBoundary($this->_responseFactory);
        $this->_matchPathValidator = new MatchPathValidator();
        $this->_drawActionRequestValidator = new DrawActionRequestValidator();
        $this->_drawService = $drawService ?? new DrawService();
        $this->_matchStateService = new MatchStateService();
        $this->_rateLimitService = new RateLimitService();
        $this->_auditLogService = new AuditLogService();
    }

    public function offer(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->drawActionRun($request, $pathParams, AuditActionValue::DRAW_OFFER, [$this->_drawActionRequestValidator, 'offerValidate'], [$this->_drawService, 'drawOffer']);
    }

    public function respond(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->drawActionRun($request, $pathParams, AuditActionValue::DRAW_RESPOND, [$this->_drawActionRequestValidator, 'respondValidate'], [$this->_drawService, 'drawRespond']);
    }

    private function drawActionRun(HttpRequest $request, array $pathParams, string $auditAction, callable $validator, callable $action): HttpJsonResponse
    {
        $authContext = null;
        $matchId = null;

        try {
            $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

            if ($authContext === null) {
                $this->_auditLogService->failure(null, $auditAction, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
            }

            $boundaryError = $this->privateJsonMutationBoundaryCheck($request);

            if ($boundaryError !== null) {
                $this->_auditLogService->failure($authContext, $auditAction, $request->getRequestId(), ApiErrorCode::BAD_REQUEST);
                return $boundaryError;
            }

            if (!$this->_authRequestAuthenticator->csrfTokenValidForContext($authContext, $request)) {
                $this->_auditLogService->failure($authContext, $auditAction, $request->getRequestId(), ApiErrorCode::INVALID_CSRF_TOKEN);
                return $this->_responseFactory->forbidden('csrf token is invalid', $request->getRequestId());
            }

            $matchId = $this->_matchPathValidator->matchIdFromPathParamsGet($pathParams);
            $this->matchParticipantAuthorize($authContext, $matchId);

            $validatedBody = $validator($request->getJsonBody() ?? []);
            $this->_rateLimitService->rateLimitRequire($authContext, RateLimitBucketValue::DRAW);

            $result = $action($authContext, $matchId, $validatedBody, (string)$request->getHeader(HttpRequestValue::IDEMPOTENCY_HEADER_NAME));

            $this->_auditLogService->success($authContext, $auditAction, $request->getRequestId(), ['matchId' => $matchId]);

            return $this->_responseFactory->success($result, $request->getRequestId());
        } catch (RateLimitExceededException $exception) {
            return $this->_responseFactory->rateLimited($exception->getMessage(), $request->getRequestId(), $exception->getRetryAfterSeconds());
        } catch (RateLimitUnavailableException) {
            return $this->_responseFactory->internalError($request->getRequestId());
        } catch (InvalidArgumentException $exception) {
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId());
        } catch (DomainException $exception) {
            return $this->_responseFactory->forbidden($exception->getMessage(), $request->getRequestId());
        } catch (LogicException $exception) {
            return $this->_responseFactory->gameRuleRejected($exception->getMessage(), $request->getRequestId());
        } catch (RuntimeException $exception) {
            return $this->_responseFactory->conflict($exception->getMessage(), $request->getRequestId());
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, $auditAction, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR, ['matchId' => $matchId]);
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    private function matchParticipantAuthorize(AuthContext $authContext, int $matchId): void
    {
        $matchState = $this->_matchStateService->matchStateRequire($matchId);
        $this->_matchStateService->participantRoleRequire($authContext, $matchState);
    }

    private function privateJsonMutationBoundaryCheck(HttpRequest $request): ?HttpJsonResponse
    {
        return $this->_requestBoundary->requireJsonContentType($request)
            ?? $this->_requestBoundary->requireJsonBody($request)
            ?? $this->_requestBoundary->requireCsrfHeader($request)
            ?? $this->_requestBoundary->requireIdempotencyKey($request);
    }
}
