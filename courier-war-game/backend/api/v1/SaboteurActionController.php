<?php

declare(strict_types=1);

require_once __DIR__ . '/../../auth/AuthContext.php';
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../constants/AuditActionValue.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../constants/HttpRequestValue.php';
require_once __DIR__ . '/../../constants/RateLimitBucketValue.php';
require_once __DIR__ . '/../../constants/RoleValue.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpRequestBoundary.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/AuditLogService.php';
require_once __DIR__ . '/../../service/HurdleService.php';
require_once __DIR__ . '/../../service/MatchStateService.php';
require_once __DIR__ . '/../../service/RateLimitService.php';
require_once __DIR__ . '/../../validation/MatchPathValidator.php';
require_once __DIR__ . '/../../validation/SaboteurActionRequestValidator.php';

class SaboteurActionController
{
    private AuthRequestAuthenticator $_authRequestAuthenticator; // validates auth and csrf

    private HttpRequestBoundary $_requestBoundary; // validates http boundary rules

    private HttpResponseFactory $_responseFactory; // creates response envelopes

    private MatchPathValidator $_matchPathValidator; // validates match id

    private SaboteurActionRequestValidator $_saboteurActionRequestValidator; // validates hurdle request body

    private HurdleService $_hurdleService; // owns saboteur hurdle rules

    private MatchStateService $_matchStateService; // authorizes saboteur role at controller boundary

    private RateLimitService $_rateLimitService; // enforces saboteur action rate limit

    private AuditLogService $_auditLogService; // writes saboteur action audit logs

    public function __construct(?HurdleService $hurdleService = null, ?HttpResponseFactory $responseFactory = null, ?MatchStateService $matchStateService = null, ?RateLimitService $rateLimitService = null, ?AuditLogService $auditLogService = null)
    {
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator(); // creates auth helper

        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory(); // stores response factory

        $this->_requestBoundary = new HttpRequestBoundary($this->_responseFactory); // creates request boundary helper

        $this->_matchPathValidator = new MatchPathValidator(); // creates path validator

        $this->_saboteurActionRequestValidator = new SaboteurActionRequestValidator(); // creates action validator

        $this->_hurdleService = $hurdleService ?? new HurdleService(); // creates hurdle service

        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state service

        $this->_rateLimitService = $rateLimitService ?? new RateLimitService(); // creates rate limit service

        $this->_auditLogService = $auditLogService ?? new AuditLogService(); // creates audit log service
    }

    public function hurdle(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = null; // keeps auth available for catch audit logs
        $matchId = null; // keeps match id available for catch audit logs

        try {
            $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request); // 1 authenticate caller

            if ($authContext === null) {
                $this->_auditLogService->failure(null, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId()); // rejects invalid auth
            }

            $boundaryError = $this->privateJsonMutationBoundaryCheck($request); // checks json csrf and idempotency boundary

            if ($boundaryError !== null) {
                $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::BAD_REQUEST);
                return $boundaryError; // returns boundary error
            }

            if (!$this->_authRequestAuthenticator->csrfTokenValidForContext($authContext, $request)) {
                $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::INVALID_CSRF_TOKEN);
                return $this->_responseFactory->forbidden('csrf token is invalid', $request->getRequestId()); // rejects csrf mismatch
            }

            $matchId = $this->_matchPathValidator->matchIdFromPathParamsGet($pathParams); // validates route id needed for authz

            $this->saboteurRoleAuthorize($authContext, $matchId); // 2 authorize saboteur role

            $body = $request->getJsonBody() ?? []; // reads json body

            $validatedBody = $this->_saboteurActionRequestValidator->hurdleValidate($body); // 3 validate and 4 sanitize hurdle body

            $this->_rateLimitService->rateLimitRequire($authContext, RateLimitBucketValue::SABOTEUR_HURDLE); // 5 rate-limit hurdle activation

            $idempotencyKey = (string)$request->getHeader(HttpRequestValue::IDEMPOTENCY_HEADER_NAME); // 6 read validated idempotency key

            $result = $this->_hurdleService->saboteurHurdleActivate($authContext, $matchId, $validatedBody, $idempotencyKey); // 7 delegate hurdle action

            $this->_auditLogService->success($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), [
                'matchId' => $matchId,
            ]);

            return $this->_responseFactory->success($result, $request->getRequestId()); // 8 return action result
        } catch (RateLimitExceededException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::RATE_LIMITED, ['matchId' => $matchId]);
            return $this->_responseFactory->rateLimited($exception->getMessage(), $request->getRequestId(), $exception->getRetryAfterSeconds()); // returns 429
        } catch (RateLimitUnavailableException) {
            $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR, ['matchId' => $matchId]);
            return $this->_responseFactory->internalError($request->getRequestId()); // returns safe limiter failure
        } catch (InvalidArgumentException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::BAD_REQUEST, ['matchId' => $matchId]);
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId()); // returns validation error
        } catch (DomainException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::FORBIDDEN, ['matchId' => $matchId]);
            return $this->_responseFactory->forbidden($exception->getMessage(), $request->getRequestId()); // returns role or ownership error
        } catch (LogicException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::GAME_RULE_REJECTED, ['matchId' => $matchId]);
            return $this->_responseFactory->gameRuleRejected($exception->getMessage(), $request->getRequestId()); // returns game rule rejection
        } catch (RuntimeException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::STATE_CONFLICT, ['matchId' => $matchId]);
            return $this->_responseFactory->conflict($exception->getMessage(), $request->getRequestId()); // returns state conflict
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, AuditActionValue::SABOTEUR_HURDLE, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR, ['matchId' => $matchId]);
            return $this->_responseFactory->internalError($request->getRequestId()); // 10 catch-all with safe response
        }
    }

    private function saboteurRoleAuthorize(AuthContext $authContext, int $matchId): void
    {
        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads state for participant check
        $role = $this->_matchStateService->participantRoleRequire($authContext, $matchState); // reads caller role

        if ($role !== RoleValue::SABOTEUR) {
            throw new DomainException('only saboteur can use this endpoint'); // blocks courier and non-saboteur callers
        }
    }

    private function privateJsonMutationBoundaryCheck(HttpRequest $request): ?HttpJsonResponse
    {
        $contentTypeError = $this->_requestBoundary->requireJsonContentType($request); // checks content type

        if ($contentTypeError !== null) {
            return $contentTypeError; // returns content type error
        }

        $jsonError = $this->_requestBoundary->requireJsonBody($request); // checks json body

        if ($jsonError !== null) {
            return $jsonError; // returns json error
        }

        $csrfError = $this->_requestBoundary->requireCsrfHeader($request); // checks csrf header

        if ($csrfError !== null) {
            return $csrfError; // returns csrf error
        }

        $idempotencyError = $this->_requestBoundary->requireIdempotencyKey($request); // checks idempotency key

        if ($idempotencyError !== null) {
            return $idempotencyError; // returns idempotency error
        }

        return null; // no boundary error
    }
}
