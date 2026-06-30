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
require_once __DIR__ . '/../../service/MatchMapService.php';
require_once __DIR__ . '/../../service/MatchStateService.php';
require_once __DIR__ . '/../../service/RateLimitService.php';
require_once __DIR__ . '/../../validation/MatchPathValidator.php';

class MatchMapController
{
    private AuthRequestAuthenticator $_authRequestAuthenticator; // validates current user auth

    private HttpResponseFactory $_responseFactory; // creates api response envelopes

    private MatchPathValidator $_matchPathValidator; // validates match id route param

    private MatchMapService $_matchMapService; // loads authorized match map

    private MatchStateService $_matchStateService; // authorizes participant at controller boundary

    private RateLimitService $_rateLimitService; // enforces read endpoint rate limit

    private AuditLogService $_auditLogService; // writes map read audit logs

    public function __construct(?MatchMapService $matchMapService = null, ?HttpResponseFactory $responseFactory = null, ?MatchStateService $matchStateService = null, ?RateLimitService $rateLimitService = null, ?AuditLogService $auditLogService = null)
    {
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator(); // creates auth helper

        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory(); // stores response factory

        $this->_matchPathValidator = new MatchPathValidator(); // creates path validator

        $this->_matchMapService = $matchMapService ?? new MatchMapService(); // creates map service when not injected

        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state service

        $this->_rateLimitService = $rateLimitService ?? new RateLimitService(); // creates rate limit service

        $this->_auditLogService = $auditLogService ?? new AuditLogService(); // creates audit log service
    }

    public function mapGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        $authContext = null; // keeps auth available for catch audit logs
        $matchId = null; // keeps match id available for catch audit logs

        try {
            $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request); // 1 authenticate caller

            if ($authContext === null) {
                $this->_auditLogService->failure(null, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), ApiErrorCode::UNAUTHORIZED);
                return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId()); // rejects unauthenticated request
            }

            $matchId = $this->_matchPathValidator->matchIdFromPathParamsGet($pathParams); // validates route id needed for authorization

            $this->matchParticipantAuthorize($authContext, $matchId); // 2 authorize participant access

            $this->_rateLimitService->rateLimitRequire($authContext, RateLimitBucketValue::POLL); // 5 rate-limit map reads with poll bucket

            $mapPayload = $this->_matchMapService->matchMapGet($authContext, $matchId); // 7 delegate map loading

            $this->_auditLogService->success($authContext, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), [
                'matchId' => $matchId,
            ]);

            return $this->_responseFactory->success($mapPayload, $request->getRequestId()); // 8 return map payload
        } catch (RateLimitExceededException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), ApiErrorCode::RATE_LIMITED, ['matchId' => $matchId]);
            return $this->_responseFactory->rateLimited($exception->getMessage(), $request->getRequestId(), $exception->getRetryAfterSeconds()); // returns 429
        } catch (RateLimitUnavailableException) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR, ['matchId' => $matchId]);
            return $this->_responseFactory->internalError($request->getRequestId()); // returns safe limiter failure
        } catch (InvalidArgumentException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), ApiErrorCode::BAD_REQUEST, ['matchId' => $matchId]);
            return $this->_responseFactory->badRequest($exception->getMessage(), $request->getRequestId()); // returns bad path param
        } catch (DomainException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), ApiErrorCode::FORBIDDEN, ['matchId' => $matchId]);
            return $this->_responseFactory->forbidden($exception->getMessage(), $request->getRequestId()); // returns participant authorization error
        } catch (RuntimeException $exception) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), ApiErrorCode::NOT_FOUND, ['matchId' => $matchId]);
            return $this->_responseFactory->notFound($exception->getMessage(), $request->getRequestId()); // returns missing map or match
        } catch (Throwable) {
            $this->_auditLogService->failure($authContext, AuditActionValue::MATCH_MAP_GET, $request->getRequestId(), ApiErrorCode::INTERNAL_ERROR, ['matchId' => $matchId]);
            return $this->_responseFactory->internalError($request->getRequestId()); // 10 catch-all with safe response
        }
    }

    private function matchParticipantAuthorize(AuthContext $authContext, int $matchId): void
    {
        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads match state for ownership check

        $this->_matchStateService->participantRoleRequire($authContext, $matchState); // blocks non-participants at controller boundary
    }
}
