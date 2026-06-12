<?php
declare(strict_types=1);

require_once __DIR__ . '/../OrmManager.php';
require_once __DIR__ . '/../query/CwMatchHistoryQuery.php'; 
require_once __DIR__ . '/../mapper/CwMatchHistoryMapper.php'; 
require_once __DIR__ . '/../../entity/CwMatchHistory.php'; 

//this repository handles database actions for cw_match_history table
class CwMatchHistoryRepository
{
    private OrmManager $ormManager; // orm manager object for db operations
    private CwMatchHistoryMapper $cwMatchHistoryMapper; // mapper object for match history rows

    //constructor creates required helper objects
    public function __construct()
    {
        $this->ormManager = new OrmManager(); 
        $this->cwMatchHistoryMapper = new CwMatchHistoryMapper(); 
    }

    //inserts completed match history and returns new match history id
    public function insertMatchHistory(CwMatchHistory $matchHistory): int
    {
        return $this->ormManager->insertQuery(
            CwMatchHistoryQuery::insertMatchHistory(), // sql for match history insert
            'sssiissssiiiiiiiiiiiiiiiiii', // bind types for 27 values
            [
                $matchHistory->getDifficulty(), 
                $matchHistory->getMapVersion(), 
                $matchHistory->getMapGenerationVersion(),
                $matchHistory->getCourierUserId(), 
                $matchHistory->getSaboteurUserId(), 
                $matchHistory->getStartedAt(), 
                $matchHistory->getEndedAt(),
                $matchHistory->getWinnerRole(), 
                $matchHistory->getEndReason(), 
                $matchHistory->getTimerTotalMs(), 
                $matchHistory->getTimeRemainingMs(), 
                $matchHistory->getCourierLivesRemaining(), 
                $matchHistory->getDeliveryProgressPct(), 
                $matchHistory->getObstacleEnergySpent(), 
                $matchHistory->getObstacleEnergyRemaining(), 
                $matchHistory->getHurdleRedTrafficLightCount(), 
                $matchHistory->getHurdleRoadBlockCount(), 
                $matchHistory->getHurdleConstructionWorkCount(), 
                $matchHistory->getHurdleTrafficJamCount(), 
                $matchHistory->getHurdleClosedGateCount(), 
                $matchHistory->getHurdleWrongDirectionSignCount(), 
                $matchHistory->getHurdleBrokenRoadCount(), 
                $matchHistory->getHurdleMovingBarrierCount(),
                $matchHistory->getHurdleSecurityCheckpointCount(),
                $matchHistory->getAbilitySpeedBoostCount(), 
                $matchHistory->getAbilityShieldCount(), 
                $matchHistory->getAbilityRevealRouteCount() 
            ]
        );
    }

    //finds match history by match id
    public function findByMatchId(int $matchId): ?CwMatchHistory
    {
        return $this->ormManager->ormManageForOneRow(
            CwMatchHistoryQuery::selectByMatchId(), // sql for selecting by match id
            'i', // match id type
            [$matchId], // match id value
            $this->cwMatchHistoryMapper // mapper for match history row
        );
    }

    //finds recent matches for user where user was courier or saboteur
    public function findRecentByUserId(int $userId, int $limit = 20): array
    {
        return $this->ormManager->ormManageWithParams(
            CwMatchHistoryQuery::selectRecentByUserId(), // sql for recent match history
            'iii', // courierUserId saboteurUserId limit
            [$userId, $userId, $limit], // values to bind
            $this->cwMatchHistoryMapper // mapper for match history rows
        );
    }

    //checks if user has any completed match history
    public function hasCompletedMatchForUser(int $userId): bool
    {
        $matches = $this->findRecentByUserId($userId, 1); // fetch only 1 match for checking
        return count($matches) > 0; // true if user has at least 1 completed match
    }
}
