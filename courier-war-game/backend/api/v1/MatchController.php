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
require_once __DIR__ . '/../../service/MatchService.php';
require_once __DIR__ . '/../../service/RateLimitService.php';
require_once __DIR__ . '/../../validation/MatchRequestValidator.php';

class MatchController
{
    private AuthRequestAuthenticator $_authRequestAuthenticator; // validates jwt cookie and creates auth context

    private HttpRequestBoundary $_requestBoundary; // runs repeated boundary checks like json csrf and idempotency

    private HttpResponseFactory $_responseFactory; // creates standard response envelopes

    private MatchRequestValidator $_matchRequestValidator; // validates match request body

    private MatchService $_matchService; // owns match create and matchmaking business logic

    private RateLimitService $_rateLimitService; // enforces controller-level abuse protection

    private AuditLogService $_auditLogService; // writes match create audit logs

    public function __construct(?MatchService $matchService = null, ?HttpResponseFactory $responseFactory = null, ?RateLimitService $rateLimitService = null, ?AuditLogService $auditLogService = null)
    {
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator(); // creates auth helper

        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory(); // stores response factory

        $this->_requestBoundary = new HttpRequestBoundary($this->_responseFactory); // shares response factory with boundary helper

        $this->_matchRequestValidator = new MatchRequestValidator(); // creates request validator

        $this->_matchService = $matchService ?? new MatchService(); // creates match service when not injected

        $this->_rateLimitService = $rateLimitService ?? new RateLimitService(); // creates rate limit service

        $this->_auditLogService = $auditLogService ?? new AuditLogService(); // creates audit log service
    }

    public function create(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = null; // keeps auth available for catch audit logs

        try {
            $authContext = $this->authContextRequire($request); // 1 authenticate using cookie token

            if ($authContext === null) {
                $this->_auditLogService->failure(null, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId()); // rejects missing or invalid auth
            }

            $this->matchCreateAuthorize($authContext); // 2 authorize match creation for authenticated caller

            $boundaryError = $this->privateJsonMutationBoundaryCheck($request); // checks json csrf header and idempotency header

            if ($boundaryError !== null) {
                $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::BAD_REQUEST);
                return $boundaryError; // returns validation or sanitization boundary error
            }

            if (!$this->_authRequestAuthenticator->csrfTokenValidForContext($authContext, $request)) {
                $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::INVALID_CSRF_TOKEN);
                return $this->_responseFactory->forbidden('csrf token is invalid', $request->getRequestId()); // rejects csrf mismatch
            }

            $body = $request->getJsonBody() ?? []; // reads decoded json body

            $validatedBody = $this->_matchRequestValidator->matchCreateValidate($body); // 3 validate and 4 sanitize body through validator

            $this->_rateLimitService->rateLimitRequire($authContext, RateLimitBucketValue::MATCHMAKING); // 5 rate-limit match create

            $idempotencyKey = (string)$request->getHeader(HttpRequestValue::IDEMPOTENCY_HEADER_NAME); // 6 read validated idempotency key

            $result = $this->_matchService->matchCreate($authContext, $validatedBody, $idempotencyKey); // 7 delegate business logic

            $this->_auditLogService->success($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), [
                'matchId' => $result['matchId'] ?? null,
                'status' => $result['status'] ?? null,
            ]);

            return $this->_responseFactory->created($result, $request->getRequestId()); // 8 respond with created envelope
        } catch (RateLimitExceededException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::RATE_LIMITED);
            return $this->_responseFactory->rateLimited($exception->getMessage(), $request->getRequestId(), $exception->getRetryAfterSeconds()); // returns 429
        } catch (RateLimitUnavailableException) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId()); // returns safe limiter failure
        } catch (InvalidArgumentException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::BAD_REQUEST);
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId()); // returns validation error
        } catch (DomainException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::FORBIDDEN);
            return $this->_responseFactory->forbidden($exception->getMessage(), $request->getRequestId()); // returns authorization style error
        } catch (LogicException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::GAME_RULE_REJECTED);
            return $this->_responseFactory->gameRuleRejected($exception->getMessage(), $request->getRequestId()); // returns game rule rejection
        } catch (RuntimeException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::STATE_CONFLICT);
            return $this->_responseFactory->conflict($exception->getMessage(), $request->getRequestId()); // returns state conflict style error
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_CREATE, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR);
            return $this->_responseFactory->internalError($request->getRequestId()); // 10 catch-all with safe response
        }
    }

    private function matchCreateAuthorize(AuthContext $authContext): void
    {
        if ($authContext->getUserId() <= 0) {
            throw new DomainException('authenticated user is required'); // protects endpoint from invalid auth context
        }
    }

    private function privateJsonMutationBoundaryCheck(HttpRequest $request): ?HttpJsonResponse
    {
        $contentTypeError = $this->_requestBoundary->requireJsonContentType($request); // checks application json

        if ($contentTypeError !== null) {
            return $contentTypeError; // returns content type error
        }

        $jsonError = $this->_requestBoundary->requireJsonBody($request); // checks body exists and json is valid

        if ($jsonError !== null) {
            return $jsonError; // returns json error
        }

        $csrfError = $this->_requestBoundary->requireCsrfHeader($request); // checks csrf header exists and length is safe

        if ($csrfError !== null) {
            return $csrfError; // returns csrf boundary error
        }

        $idempotencyError = $this->_requestBoundary->requireIdempotencyKey($request); // checks idempotency key header

        if ($idempotencyError !== null) {
            return $idempotencyError; // returns idempotency key error
        }

        return null; // no boundary error
    }

    private function authContextRequire(HttpRequest $request): ?AuthContext
    {
        return $this->_authRequestAuthenticator->authContextFromRequest($request); // converts access token cookie into auth context
    }
}
