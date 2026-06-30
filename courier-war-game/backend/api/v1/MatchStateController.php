<?php

declare(strict_types=1);

require_once __DIR__ . '/../../auth/AuthContext.php';
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../constants/AuditActionValue.php';
require_once __DIR__ . '/../../constants/ApiErrorCode.php';
require_once __DIR__ . '/../../constants/RateLimitBucketValue.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/AuditLogService.php';
require_once __DIR__ . '/../../service/MatchStateService.php';
require_once __DIR__ . '/../../service/PollingStateService.php';
require_once __DIR__ . '/../../service/RateLimitService.php';
require_once __DIR__ . '/../../validation/MatchPathValidator.php';
require_once __DIR__ . '/../../validation/MatchRequestValidator.php';

class MatchStateController
{
    private AuthRequestAuthenticator $_authRequestAuthenticator; // validates caller auth

    private HttpResponseFactory $_responseFactory; // creates response envelopes

    private MatchPathValidator $_matchPathValidator; // validates match id from path

    private MatchRequestValidator $_matchRequestValidator; // validates polling query params

    private PollingStateService $_pollingStateService; // owns stateVersion polling behavior

    private MatchStateService $_matchStateService; // authorizes participant at controller boundary

    private RateLimitService $_rateLimitService; // enforces polling rate limit

    private AuditLogService $_auditLogService; // writes polling failure audit logs

    public function __construct(?PollingStateService $pollingStateService = null, ?HttpResponseFactory $responseFactory = null, ?MatchStateService $matchStateService = null, ?RateLimitService $rateLimitService = null, ?AuditLogService $auditLogService = null)
    {
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator(); // creates auth helper

        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory(); // stores response factory

        $this->_matchPathValidator = new MatchPathValidator(); // creates path validator

        $this->_matchRequestValidator = new MatchRequestValidator(); // creates query validator

        $this->_pollingStateService = $pollingStateService ?? new PollingStateService(); // creates polling service

        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state service

        $this->_rateLimitService = $rateLimitService ?? new RateLimitService(); // creates rate limit service

        $this->_auditLogService = $auditLogService ?? new AuditLogService(); // creates audit log service
    }

    public function stateGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = null; // keeps auth available for catch audit logs
        $matchId = null; // keeps match id available for catch audit logs

        try {
            $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request); // 1 authenticate caller

            if ($authContext === null) {
                $this->_auditLogService->failure(null, AuditActionValue::MATCH_STATE_GET, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId()); // rejects invalid auth
            }

            $matchId = $this->_matchPathValidator->matchIdFromPathParamsGet($pathParams); // validates route id needed for authz

            $this->matchParticipantAuthorize($authContext, $matchId); // 2 authorize participant access

            $validatedQuery = $this->_matchRequestValidator->statePollValidate($request->getQueryParams()); // 3 validate and 4 sanitize query

            $this->_rateLimitService->rateLimitRequire($authContext, RateLimitBucketValue::POLL); // 5 rate-limit polling

            $statePayload = $this->_pollingStateService->matchStateGet($authContext, $matchId, $validatedQuery['knownVersion']); // 7 delegate polling logic

            return $this->_responseFactory->success($statePayload, $request->getRequestId()); // 8 return state payload
        } catch (RateLimitExceededException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_STATE_GET, $request->getRequestId(), ApiErrorCode::RATE_LIMITED, ['matchId' => $matchId]);
            return $this->_responseFactory->rateLimited($exception->getMessage(), $request->getRequestId(), $exception->getRetryAfterSeconds()); // returns 429
        } catch (RateLimitUnavailableException) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_STATE_GET, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR, ['matchId' => $matchId]);
            return $this->_responseFactory->internalError($request->getRequestId()); // returns safe limiter failure
        } catch (InvalidArgumentException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_STATE_GET, $request->getRequestId(), ApiErrorCode::BAD_REQUEST, ['matchId' => $matchId]);
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId()); // returns invalid query or path
        } catch (DomainException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_STATE_GET, $request->getRequestId(), ApiErrorCode::FORBIDDEN, ['matchId' => $matchId]);
            return $this->_responseFactory->forbidden($exception->getMessage(), $request->getRequestId()); // returns participant authorization error
        } catch (RuntimeException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_STATE_GET, $request->getRequestId(), ApiErrorCode::NOT_FOUND, ['matchId' => $matchId]);
            return $this->_responseFactory->notFound($exception->getMessage(), $request->getRequestId()); // returns missing match state
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_STATE_GET, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR, ['matchId' => $matchId]);
            return $this->_responseFactory->internalError($request->getRequestId()); // 10 catch-all with safe response
        }
    }

    private function matchParticipantAuthorize(AuthContext $authContext, int $matchId): void
    {
        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads match state for ownership check

        $this->_matchStateService->participantRoleRequire($authContext, $matchState); // blocks non-participants at controller boundary
    }
}
