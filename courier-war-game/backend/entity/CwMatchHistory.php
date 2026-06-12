<?php
declare(strict_types=1);

//this entity represents 1 row from cw_match_history table
class CwMatchHistory
{
    private int $_matchId; // completed match id
    private string $_difficulty; // easy medium hard
    private string $_mapVersion; // map version like v1
    private string $_mapGenerationVersion; // map generation version like city_map_generation_v7
    private int $_courierUserId; // courier player user id
    private int $_saboteurUserId; // saboteur player user id
    private string $_startedAt; // match start timestamp
    private string $_endedAt; // match end timestamp
    private string $_winnerRole; // courier or saboteur
    private string $_endReason; // delivered timerExpired courierLivesZero forfeit draw
    private int $_timerTotalMs; // total timer for match
    private int $_timeRemainingMs; // time remaining when match ended
    private int $_courierLivesRemaining; // lives remaining at match end
    private int $_deliveryProgressPct; // delivery progress percentage
    private int $_obstacleEnergySpent; // obstacle energy spent by saboteur
    private int $_obstacleEnergyRemaining; // obstacle energy remaining at end
    private int $_hurdleRedTrafficLightCount; // red traffic light count in match
    private int $_hurdleRoadBlockCount; // road block count in match
    private int $_hurdleConstructionWorkCount; // construction work count in match
    private int $_hurdleTrafficJamCount; // traffic jam count in match
    private int $_hurdleClosedGateCount; // closed gate count in match
    private int $_hurdleWrongDirectionSignCount; // wrong direction sign count in match
    private int $_hurdleBrokenRoadCount; // broken road count in match
    private int $_hurdleMovingBarrierCount; // moving barrier count in match
    private int $_hurdleSecurityCheckpointCount; // security checkpoint count in match
    private int $_abilitySpeedBoostCount; // speed boost count in match
    private int $_abilityShieldCount; // shield count in match
    private int $_abilityRevealRouteCount; // reveal route count in match
    private string $_createdAt; // history row creation timestamp

    //constructor to create match history entity from database row values
    public function __construct(
        int $matchId,
        string $difficulty,
        string $mapVersion,
        string $mapGenerationVersion,
        int $courierUserId,
        int $saboteurUserId,
        string $startedAt,
        string $endedAt,
        string $winnerRole,
        string $endReason,
        int $timerTotalMs,
        int $timeRemainingMs,
        int $courierLivesRemaining,
        int $deliveryProgressPct,
        int $obstacleEnergySpent,
        int $obstacleEnergyRemaining,
        int $hurdleRedTrafficLightCount,
        int $hurdleRoadBlockCount,
        int $hurdleConstructionWorkCount,
        int $hurdleTrafficJamCount,
        int $hurdleClosedGateCount,
        int $hurdleWrongDirectionSignCount,
        int $hurdleBrokenRoadCount,
        int $hurdleMovingBarrierCount,
        int $hurdleSecurityCheckpointCount,
        int $abilitySpeedBoostCount,
        int $abilityShieldCount,
        int $abilityRevealRouteCount,
        string $createdAt
    ) {
        $this->_matchId = $matchId;
        $this->_difficulty = $difficulty;
        $this->_mapVersion = $mapVersion;
        $this->_mapGenerationVersion = $mapGenerationVersion;
        $this->_courierUserId = $courierUserId;
        $this->_saboteurUserId = $saboteurUserId;
        $this->_startedAt = $startedAt;
        $this->_endedAt = $endedAt;
        $this->_winnerRole = $winnerRole;
        $this->_endReason = $endReason;
        $this->_timerTotalMs = $timerTotalMs;
        $this->_timeRemainingMs = $timeRemainingMs;
        $this->_courierLivesRemaining = $courierLivesRemaining;
        $this->_deliveryProgressPct = $deliveryProgressPct;
        $this->_obstacleEnergySpent = $obstacleEnergySpent;
        $this->_obstacleEnergyRemaining = $obstacleEnergyRemaining;
        $this->_hurdleRedTrafficLightCount = $hurdleRedTrafficLightCount;
        $this->_hurdleRoadBlockCount = $hurdleRoadBlockCount;
        $this->_hurdleConstructionWorkCount = $hurdleConstructionWorkCount;
        $this->_hurdleTrafficJamCount = $hurdleTrafficJamCount;
        $this->_hurdleClosedGateCount = $hurdleClosedGateCount;
        $this->_hurdleWrongDirectionSignCount = $hurdleWrongDirectionSignCount;
        $this->_hurdleBrokenRoadCount = $hurdleBrokenRoadCount;
        $this->_hurdleMovingBarrierCount = $hurdleMovingBarrierCount;
        $this->_hurdleSecurityCheckpointCount = $hurdleSecurityCheckpointCount;
        $this->_abilitySpeedBoostCount = $abilitySpeedBoostCount;
        $this->_abilityShieldCount = $abilityShieldCount;
        $this->_abilityRevealRouteCount = $abilityRevealRouteCount;
        $this->_createdAt = $createdAt;
    }

    //now its time for getters and setters for each coz variabels are pvt ofc!!!

    //match id
    public function getMatchId(): int
    {
        return $this->_matchId;
    }

    public function setMatchId(int $matchId): void
    {
        $this->_matchId = $matchId;
    }

    //difficulty
    public function getDifficulty(): string
    {
        return $this->_difficulty;
    }

    public function setDifficulty(string $difficulty): void
    {
        $this->_difficulty = $difficulty;
    }

    //map version
    public function getMapVersion(): string
    {
        return $this->_mapVersion;
    }

    public function setMapVersion(string $mapVersion): void
    {
        $this->_mapVersion = $mapVersion;
    }

    //map generation version
    public function getMapGenerationVersion(): string
    {
        return $this->_mapGenerationVersion;
    }

    public function setMapGenerationVersion(string $mapGenerationVersion): void
    {
        $this->_mapGenerationVersion = $mapGenerationVersion;
    }

    //courier user id
    public function getCourierUserId(): int
    {
        return $this->_courierUserId;
    }

    public function setCourierUserId(int $courierUserId): void
    {
        $this->_courierUserId = $courierUserId;
    }

    //saboteur user id
    public function getSaboteurUserId(): int
    {
        return $this->_saboteurUserId;
    }

    public function setSaboteurUserId(int $saboteurUserId): void
    {
        $this->_saboteurUserId = $saboteurUserId;
    }

    //started at
    public function getStartedAt(): string
    {
        return $this->_startedAt;
    }

    public function setStartedAt(string $startedAt): void
    {
        $this->_startedAt = $startedAt;
    }

    //ended at
    public function getEndedAt(): string
    {
        return $this->_endedAt;
    }

    public function setEndedAt(string $endedAt): void
    {
        $this->_endedAt = $endedAt;
    }

    //winner role
    public function getWinnerRole(): string
    {
        return $this->_winnerRole;
    }

    public function setWinnerRole(string $winnerRole): void
    {
        $this->_winnerRole = $winnerRole;
    }

    //end reason
    public function getEndReason(): string
    {
        return $this->_endReason;
    }

    public function setEndReason(string $endReason): void
    {
        $this->_endReason = $endReason;
    }

    //timer total ms
    public function getTimerTotalMs(): int
    {
        return $this->_timerTotalMs;
    }

    public function setTimerTotalMs(int $timerTotalMs): void
    {
        $this->_timerTotalMs = $timerTotalMs;
    }

    //time remaining ms
    public function getTimeRemainingMs(): int
    {
        return $this->_timeRemainingMs;
    }

    public function setTimeRemainingMs(int $timeRemainingMs): void
    {
        $this->_timeRemainingMs = $timeRemainingMs;
    }

    //courier lives remaining
    public function getCourierLivesRemaining(): int
    {
        return $this->_courierLivesRemaining;
    }

    public function setCourierLivesRemaining(int $courierLivesRemaining): void
    {
        $this->_courierLivesRemaining = $courierLivesRemaining;
    }

    //delivery progress pct
    public function getDeliveryProgressPct(): int
    {
        return $this->_deliveryProgressPct;
    }

    public function setDeliveryProgressPct(int $deliveryProgressPct): void
    {
        $this->_deliveryProgressPct = $deliveryProgressPct;
    }

    //obstacle energy spent
    public function getObstacleEnergySpent(): int
    {
        return $this->_obstacleEnergySpent;
    }

    public function setObstacleEnergySpent(int $obstacleEnergySpent): void
    {
        $this->_obstacleEnergySpent = $obstacleEnergySpent;
    }

    //obstacle energy remaining
    public function getObstacleEnergyRemaining(): int
    {
        return $this->_obstacleEnergyRemaining;
    }

    public function setObstacleEnergyRemaining(int $obstacleEnergyRemaining): void
    {
        $this->_obstacleEnergyRemaining = $obstacleEnergyRemaining;
    }

    //red traffic light count
    public function getHurdleRedTrafficLightCount(): int
    {
        return $this->_hurdleRedTrafficLightCount;
    }

    public function setHurdleRedTrafficLightCount(int $hurdleRedTrafficLightCount): void
    {
        $this->_hurdleRedTrafficLightCount = $hurdleRedTrafficLightCount;
    }

    //road block count
    public function getHurdleRoadBlockCount(): int
    {
        return $this->_hurdleRoadBlockCount;
    }

    public function setHurdleRoadBlockCount(int $hurdleRoadBlockCount): void
    {
        $this->_hurdleRoadBlockCount = $hurdleRoadBlockCount;
    }

    //construction work count
    public function getHurdleConstructionWorkCount(): int
    {
        return $this->_hurdleConstructionWorkCount;
    }

    public function setHurdleConstructionWorkCount(int $hurdleConstructionWorkCount): void
    {
        $this->_hurdleConstructionWorkCount = $hurdleConstructionWorkCount;
    }

    //traffic jam count
    public function getHurdleTrafficJamCount(): int
    {
        return $this->_hurdleTrafficJamCount;
    }

    public function setHurdleTrafficJamCount(int $hurdleTrafficJamCount): void
    {
        $this->_hurdleTrafficJamCount = $hurdleTrafficJamCount;
    }

    //closed gate count
    public function getHurdleClosedGateCount(): int
    {
        return $this->_hurdleClosedGateCount;
    }

    public function setHurdleClosedGateCount(int $hurdleClosedGateCount): void
    {
        $this->_hurdleClosedGateCount = $hurdleClosedGateCount;
    }

    //wrong direction sign count
    public function getHurdleWrongDirectionSignCount(): int
    {
        return $this->_hurdleWrongDirectionSignCount;
    }

    public function setHurdleWrongDirectionSignCount(int $hurdleWrongDirectionSignCount): void
    {
        $this->_hurdleWrongDirectionSignCount = $hurdleWrongDirectionSignCount;
    }

    //broken road count
    public function getHurdleBrokenRoadCount(): int
    {
        return $this->_hurdleBrokenRoadCount;
    }

    public function setHurdleBrokenRoadCount(int $hurdleBrokenRoadCount): void
    {
        $this->_hurdleBrokenRoadCount = $hurdleBrokenRoadCount;
    }

    //moving barrier count
    public function getHurdleMovingBarrierCount(): int
    {
        return $this->_hurdleMovingBarrierCount;
    }

    public function setHurdleMovingBarrierCount(int $hurdleMovingBarrierCount): void
    {
        $this->_hurdleMovingBarrierCount = $hurdleMovingBarrierCount;
    }

    //security checkpoint count
    public function getHurdleSecurityCheckpointCount(): int
    {
        return $this->_hurdleSecurityCheckpointCount;
    }

    public function setHurdleSecurityCheckpointCount(int $hurdleSecurityCheckpointCount): void
    {
        $this->_hurdleSecurityCheckpointCount = $hurdleSecurityCheckpointCount;
    }

    //speed boost count
    public function getAbilitySpeedBoostCount(): int
    {
        return $this->_abilitySpeedBoostCount;
    }

    public function setAbilitySpeedBoostCount(int $abilitySpeedBoostCount): void
    {
        $this->_abilitySpeedBoostCount = $abilitySpeedBoostCount;
    }

    //shield count
    public function getAbilityShieldCount(): int
    {
        return $this->_abilityShieldCount;
    }

    public function setAbilityShieldCount(int $abilityShieldCount): void
    {
        $this->_abilityShieldCount = $abilityShieldCount;
    }

    //reveal route count
    public function getAbilityRevealRouteCount(): int
    {
        return $this->_abilityRevealRouteCount;
    }

    public function setAbilityRevealRouteCount(int $abilityRevealRouteCount): void
    {
        $this->_abilityRevealRouteCount = $abilityRevealRouteCount;
    }

    //created at
    public function getCreatedAt(): string
    {
        return $this->_createdAt;
    }

    public function setCreatedAt(string $createdAt): void
    {
        $this->_createdAt = $createdAt;
    }

    //total hurdle activations in this match are derived from all hurdle count columns
    public function totalHurdlesActivated(): int
    {
        return
            $this->_hurdleRedTrafficLightCount +
            $this->_hurdleRoadBlockCount +
            $this->_hurdleConstructionWorkCount +
            $this->_hurdleTrafficJamCount +
            $this->_hurdleClosedGateCount +
            $this->_hurdleWrongDirectionSignCount +
            $this->_hurdleBrokenRoadCount +
            $this->_hurdleMovingBarrierCount +
            $this->_hurdleSecurityCheckpointCount;
    }

    //total ability uses in this match are derived from all ability count columns
    public function totalAbilityUses(): int
    {
        return
            $this->_abilitySpeedBoostCount +
            $this->_abilityShieldCount +
            $this->_abilityRevealRouteCount;
    }
}
