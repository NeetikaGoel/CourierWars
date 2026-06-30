<?php

declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../constants/MatchStateFieldName.php';
require_once __DIR__ . '/MapBootstrapService.php';
require_once __DIR__ . '/MatchStateService.php';

class MatchMapService
{
    private MatchStateService $_matchStateService; // verifies match exists and caller participates

    private MapBootstrapService $_mapBootstrapService; // loads active match map from cache

    public function __construct(?MatchStateService $matchStateService = null, ?MapBootstrapService $mapBootstrapService = null)
    {
        $this->_matchStateService = $matchStateService ?? new MatchStateService(); // creates state service
        $this->_mapBootstrapService = $mapBootstrapService ?? new MapBootstrapService(); // creates map service
    }

    public function matchMapGet(AuthContext $authContext, int $matchId): array
    {
        $matchState = $this->_matchStateService->matchStateRequire($matchId); // loads match state

        $this->_matchStateService->participantRoleRequire($authContext, $matchState); // blocks non-participants

        $mapSnapshot = $this->_mapBootstrapService->activeMatchMapGet($matchId); // loads readable map json

        if ($mapSnapshot === null) {
            throw new RuntimeException('match map was not found'); // cache loss means map cannot load
        }

        $mapSnapshot['matchId'] = $matchId; // adds match id for frontend convenience
        $mapSnapshot['stateVersion'] = (int)($matchState[MatchStateFieldName::STATE_VERSION] ?? 0); // adds current state version

        return $mapSnapshot; // returns readable map payload
    }
}
