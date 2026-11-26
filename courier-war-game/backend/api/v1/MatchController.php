<?php
declare(strict_types=1);

require_once __DIR__ . '/../../auth/AuthContext.php';
require_once __DIR__ . '/../../auth/AuthRequestAuthenticator.php';
require_once __DIR__ . '/../../config/MatchConfig.php';
require_once __DIR__ . '/../../config/PollingConfig.php';
require_once __DIR__ . '/../../http/HttpJsonResponse.php';
require_once __DIR__ . '/../../http/HttpRequest.php';
require_once __DIR__ . '/../../http/HttpRequestBoundary.php';
require_once __DIR__ . '/../../http/HttpResponseFactory.php';
require_once __DIR__ . '/../../service/MatchService.php';
require_once __DIR__ . '/../../service/MatchServiceException.php';

// thin controller for match lifecycle, polling and gameplay actions
class MatchController
{
    private const PLAYER_TOKEN_REGEX = '/^[a-f0-9]{32}$/';

    private AuthRequestAuthenticator $_authRequestAuthenticator;
    private HttpRequestBoundary $_requestBoundary;
    private MatchService $_matchService;
    private HttpResponseFactory $_responseFactory;

    public function __construct(?MatchService $matchService = null, ?HttpResponseFactory $responseFactory = null)
    {
        $this->_responseFactory = $responseFactory ?? new HttpResponseFactory();
        $this->_authRequestAuthenticator = new AuthRequestAuthenticator();
        $this->_requestBoundary = new HttpRequestBoundary($this->_responseFactory);
        $this->_matchService = $matchService ?? new MatchService();
    }

    // POST /matches  {difficulty, rolePreference}
    public function matchCreate(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->postRun($request, function (AuthContext $authContext, array $body): array {
            return $this->_matchService->matchCreate(
                $authContext,
                $this->stringField($body, 'difficulty'),
                $this->stringField($body, 'rolePreference')
            );
        }, true);
    }

    // GET /matches/{matchId}/state?playerToken=&knownVersion=
    public function matchStateGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->getRun($request, $pathParams, function (AuthContext $authContext, int $matchId, string $playerToken) use ($request): array {
            $knownVersionRaw = (string)($request->getQueryParam('knownVersion') ?? '');
            $knownVersion = ctype_digit($knownVersionRaw) ? (int)$knownVersionRaw : PollingConfig::defaultKnownVersion();

            return $this->_matchService->matchStateGet($authContext, $matchId, $playerToken, $knownVersion);
        });
    }

    // GET /matches/{matchId}/result?playerToken=
    public function matchResultGet(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->getRun($request, $pathParams, function (AuthContext $authContext, int $matchId, string $playerToken): array {
            return $this->_matchService->resultGet($authContext, $matchId, $playerToken);
        });
    }

    // POST /matches/{matchId}/ready
    public function matchReady(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->matchPostRun($request, $pathParams, function (AuthContext $authContext, int $matchId, string $playerToken): array {
            return $this->_matchService->matchReady($authContext, $matchId, $playerToken);
        });
    }

    // POST /matches/{matchId}/moves  {steps: [{seq, x, y}], lives}
    public function courierMove(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->matchPostRun($request, $pathParams, function (AuthContext $authContext, int $matchId, string $playerToken, array $body): array {
            $stepList = [];

            foreach ($this->listField($body, 'steps') as $step) {
                if (!is_array($step)) {
                    throw new MatchServiceException(ApiErrorCode::BAD_REQUEST, 'steps must be objects', HttpStatusCode::BAD_REQUEST);
                }

                $stepList[] = [
                    'seq' => $this->intField($step, 'seq'),
                    'x' => $this->intField($step, 'x'),
                    'y' => $this->intField($step, 'y'),
                ];
            }

            $lives = isset($body['lives']) ? $this->intField($body, 'lives') : null;

            return $this->_matchService->courierMove($authContext, $matchId, $playerToken, $stepList, $lives);
        });
    }

    // POST /matches/{matchId}/hurdles  {hurdleType, tiles: [{x, y}], durationMs?}  durationMs is clamped to the type's range
    public function hurdlePlace(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->matchPostRun($request, $pathParams, function (AuthContext $authContext, int $matchId, string $playerToken, array $body): array {
            $tileList = [];

            foreach ($this->listField($body, 'tiles') as $tile) {
                if (!is_array($tile)) {
                    throw new MatchServiceException(ApiErrorCode::BAD_REQUEST, 'tiles must be objects', HttpStatusCode::BAD_REQUEST);
                }

                $tileList[] = ['x' => $this->intField($tile, 'x'), 'y' => $this->intField($tile, 'y')];
            }

            $durationMs = isset($body['durationMs']) ? $this->intField($body, 'durationMs') : null;

            return $this->_matchService->hurdlePlace($authContext, $matchId, $playerToken, $this->stringField($body, 'hurdleType'), $tileList, $durationMs);
        });
    }

    // POST /matches/{matchId}/cancel  leaves a waiting match, or forfeits a started one
    public function matchCancel(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->matchPostRun($request, $pathParams, function (AuthContext $authContext, int $matchId, string $playerToken): array {
            return $this->_matchService->matchCancel($authContext, $matchId, $playerToken);
        });
    }

    // POST /matches/{matchId}/draw
    public function drawOffer(HttpRequest $request, array $pathParams): HttpJsonResponse
    {
        return $this->matchPostRun($request, $pathParams, function (AuthContext $authContext, int $matchId, string $playerToken): array {
            return $this->_matchService->drawOffer($authContext, $matchId, $playerToken);
        });
    }

    // ---------------------------------------------------------------- request plumbing

    private function getRun(HttpRequest $request, array $pathParams, callable $work): HttpJsonResponse
    {
        $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

        if ($authContext === null) {
            return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
        }

        return $this->serviceRun($request, function () use ($authContext, $pathParams, $request, $work): array {
            return $work(
                $authContext,
                $this->matchIdGet($pathParams),
                $this->playerTokenGet((string)($request->getQueryParam(MatchConfig::PLAYER_TOKEN_FIELD) ?? ''))
            );
        }, false);
    }

    private function matchPostRun(HttpRequest $request, array $pathParams, callable $work): HttpJsonResponse
    {
        return $this->postRun($request, function (AuthContext $authContext, array $body) use ($pathParams, $work): array {
            return $work(
                $authContext,
                $this->matchIdGet($pathParams),
                $this->playerTokenGet($this->stringField($body, MatchConfig::PLAYER_TOKEN_FIELD)),
                $body
            );
        }, false);
    }

    private function postRun(HttpRequest $request, callable $work, bool $created): HttpJsonResponse
    {
        $boundaryError = $this->_requestBoundary->requireBodySizeWithinLimit($request)
            ?? $this->_requestBoundary->requireJsonContentType($request)
            ?? $this->_requestBoundary->requireJsonBody($request)
            ?? $this->_requestBoundary->requireCsrfHeader($request);

        if ($boundaryError !== null) {
            return $boundaryError;
        }

        $authContext = $this->_authRequestAuthenticator->authContextFromRequest($request);

        if ($authContext === null) {
            return $this->_responseFactory->unauthorized('auth token is invalid', $request->getRequestId());
        }

        if (!$this->_authRequestAuthenticator->csrfTokenValidForContext($authContext, $request)) {
            return $this->_responseFactory->forbidden('csrf token is invalid', $request->getRequestId());
        }

        $body = $request->getJsonBody() ?? [];

        return $this->serviceRun($request, fn(): array => $work($authContext, $body), $created);
    }

    private function serviceRun(HttpRequest $request, callable $work, bool $created): HttpJsonResponse
    {
        try {
            $data = $work();

            return $created
                ? $this->_responseFactory->created($data, $request->getRequestId())
                : $this->_responseFactory->success($data, $request->getRequestId());
        } catch (MatchServiceException $exception) {
            return $this->_responseFactory->error(
                $exception->getErrorCode(),
                $exception->getMessage(),
                $exception->getHttpStatus(),
                $request->getRequestId(),
                $exception->getDetails()
            );
        } catch (Throwable) {
            return $this->_responseFactory->internalError($request->getRequestId());
        }
    }

    private function matchIdGet(array $pathParams): int
    {
        $matchIdRaw = (string)($pathParams['matchId'] ?? '');

        if (!ctype_digit($matchIdRaw) || strlen($matchIdRaw) > 10) {
            throw new MatchServiceException(ApiErrorCode::NOT_FOUND, 'match was not found', HttpStatusCode::NOT_FOUND);
        }

        return (int)$matchIdRaw;
    }

    private function playerTokenGet(string $playerToken): string
    {
        if (preg_match(self::PLAYER_TOKEN_REGEX, $playerToken) !== 1) {
            throw new MatchServiceException(ApiErrorCode::BAD_REQUEST, 'playerToken is invalid', HttpStatusCode::BAD_REQUEST);
        }

        return $playerToken;
    }

    private function stringField(array $body, string $field): string
    {
        if (!isset($body[$field]) || !is_string($body[$field])) {
            throw new MatchServiceException(ApiErrorCode::BAD_REQUEST, $field . ' is required', HttpStatusCode::BAD_REQUEST);
        }

        return $body[$field];
    }

    private function intField(array $body, string $field): int
    {
        if (!isset($body[$field]) || !is_int($body[$field])) {
            throw new MatchServiceException(ApiErrorCode::BAD_REQUEST, $field . ' must be an integer', HttpStatusCode::BAD_REQUEST);
        }

        return $body[$field];
    }

    private function listField(array $body, string $field): array
    {
        if (!isset($body[$field]) || !is_array($body[$field]) || !array_is_list($body[$field])) {
            throw new MatchServiceException(ApiErrorCode::BAD_REQUEST, $field . ' must be a list', HttpStatusCode::BAD_REQUEST);
        }

        return $body[$field];
    }
}
