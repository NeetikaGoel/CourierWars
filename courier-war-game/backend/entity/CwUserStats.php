<?php
declare(strict_types=1);

//this entity represents 1 row from cw_user_stats table
class CwUserStats
{
    private int $_userId; // user id from table
    private string $_preferredRole; // preferred role selected by user
    private ?string $_lastPlayedRole; // last played role or null
    private int $_totalMatches; // total completed matches
    private int $_totalWins; // total completed wins
    private int $_courierMatches; // total completed Courier matches
    private int $_courierWins; // total completed Courier wins
    private int $_courierEasyWins; // Courier wins in easy diff
    private int $_courierMediumWins; // Courier wins in medium diff
    private int $_saboteurEasyWins; // Saboteur wins in easy diff
    private int $_saboteurMediumWins; // Saboteur wins in medium diff
    private ?int $_fastestDeliveryMs; // fastest Courier delivery in ms or null
    private ?int $_bestSaboteurDelayMs; // best Saboteur delay in ms or null
    private int $_totalObstacleEnergySpent; // total obstacle energy spent as Saboteur
    private int $_hurdleRedTrafficLightCount; // full game red traffic light count
    private int $_hurdleRoadBlockCount; // full game road block count
    private int $_hurdleConstructionWorkCount; // full game construction work count
    private int $_hurdleTrafficJamCount; // full game traffic jam count
    private int $_hurdleClosedGateCount; // full game closed gate count
    private int $_hurdleWrongDirectionSignCount; // full game wrong direction sign count
    private int $_hurdleBrokenRoadCount; // full game broken road count
    private int $_hurdleMovingBarrierCount; // full game moving barrier count
    private int $_hurdleSecurityCheckpointCount; // full game security checkpoint count
    private int $_abilitySpeedBoostCount; // full game speed boost count
    private int $_abilityShieldCount; // full game shield count
    private int $_abilityRevealRouteCount; // full game reveal route count
    private string $_createdAt; // row creation timestamp
    private string $_updatedAt; // row last update timestamp

    //constructor to create stats entity from database row values
    public function __construct(
        int $userId,
        string $preferredRole,
        ?string $lastPlayedRole,
        int $totalMatches,
        int $totalWins,
        int $courierMatches,
        int $courierWins,
        int $courierEasyWins,
        int $courierMediumWins,
        int $saboteurEasyWins,
        int $saboteurMediumWins,
        ?int $fastestDeliveryMs,
        ?int $bestSaboteurDelayMs,
        int $totalObstacleEnergySpent,
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
        string $createdAt,
        string $updatedAt
    ) 
    {
        $this->_userId = $userId;
        $this->_preferredRole = $preferredRole;
        $this->_lastPlayedRole = $lastPlayedRole;
        $this->_totalMatches = $totalMatches;
        $this->_totalWins = $totalWins;
        $this->_courierMatches = $courierMatches;
        $this->_courierWins = $courierWins;
        $this->_courierEasyWins = $courierEasyWins;
        $this->_courierMediumWins = $courierMediumWins;
        $this->_saboteurEasyWins = $saboteurEasyWins;
        $this->_saboteurMediumWins = $saboteurMediumWins;
        $this->_fastestDeliveryMs = $fastestDeliveryMs;
        $this->_bestSaboteurDelayMs = $bestSaboteurDelayMs;
        $this->_totalObstacleEnergySpent = $totalObstacleEnergySpent;
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
        $this->_updatedAt = $updatedAt;
    }

    //now its time for getters and setters for each coz variabels are pvt ofc!!!

    //user id
    public function getUserId(): int
    {
        return $this->_userId;
    }

    public function setUserId(int $userId): void
    {
        $this->_userId = $userId;
    }

    //preferred role
    public function getPreferredRole(): string
    {
        return $this->_preferredRole;
    }

    public function setPreferredRole(string $preferredRole): void
    {
        $this->_preferredRole = $preferredRole;
    }

    //last played role
    public function getLastPlayedRole(): ?string
    {
        return $this->_lastPlayedRole;
    }

    public function setLastPlayedRole(?string $lastPlayedRole): void
    {
        $this->_lastPlayedRole = $lastPlayedRole;
    }

    //total matches
    public function getTotalMatches(): int
    {
        return $this->_totalMatches;
    }

    public function setTotalMatches(int $totalMatches): void
    {
        $this->_totalMatches = $totalMatches;
    }

    //total wins
    public function getTotalWins(): int
    {
        return $this->_totalWins;
    }

    public function setTotalWins(int $totalWins): void
    {
        $this->_totalWins = $totalWins;
    }

    //courier matches
    public function getCourierMatches(): int
    {
        return $this->_courierMatches;
    }

    public function setCourierMatches(int $courierMatches): void
    {
        $this->_courierMatches = $courierMatches;
    }

    //courier wins
    public function getCourierWins(): int
    {
        return $this->_courierWins;
    }

    public function setCourierWins(int $courierWins): void
    {
        $this->_courierWins = $courierWins;
    }

    //courier easy wins
    public function getCourierEasyWins(): int
    {
        return $this->_courierEasyWins;
    }

    public function setCourierEasyWins(int $courierEasyWins): void
    {
        $this->_courierEasyWins = $courierEasyWins;
    }

    //courier medium wins
    public function getCourierMediumWins(): int
    {
        return $this->_courierMediumWins;
    }

    public function setCourierMediumWins(int $courierMediumWins): void
    {
        $this->_courierMediumWins = $courierMediumWins;
    }

    //saboteur easy wins
    public function getSaboteurEasyWins(): int
    {
        return $this->_saboteurEasyWins;
    }

    public function setSaboteurEasyWins(int $saboteurEasyWins): void
    {
        $this->_saboteurEasyWins = $saboteurEasyWins;
    }

    //saboteur medium wins
    public function getSaboteurMediumWins(): int
    {
        return $this->_saboteurMediumWins;
    }

    public function setSaboteurMediumWins(int $saboteurMediumWins): void
    {
        $this->_saboteurMediumWins = $saboteurMediumWins;
    }

    //fastest delivery
    public function getFastestDeliveryMs(): ?int
    {
        return $this->_fastestDeliveryMs;
    }

    public function setFastestDeliveryMs(?int $fastestDeliveryMs): void
    {
        $this->_fastestDeliveryMs = $fastestDeliveryMs;
    }

    //best saboteur delay
    public function getBestSaboteurDelayMs(): ?int
    {
        return $this->_bestSaboteurDelayMs;
    }

    public function setBestSaboteurDelayMs(?int $bestSaboteurDelayMs): void
    {
        $this->_bestSaboteurDelayMs = $bestSaboteurDelayMs;
    }

    //total obstacle energy spent
    public function getTotalObstacleEnergySpent(): int
    {
        return $this->_totalObstacleEnergySpent;
    }

    public function setTotalObstacleEnergySpent(int $totalObstacleEnergySpent): void
    {
        $this->_totalObstacleEnergySpent = $totalObstacleEnergySpent;
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

    //updated at
    public function getUpdatedAt(): string
    {
        return $this->_updatedAt;
    }

    public function setUpdatedAt(string $updatedAt): void
    {
        $this->_updatedAt = $updatedAt;
    }

    //so now calculating the derivativessss from all thiss

    //total losses 
    public function totalLosses(): int
    {
        return max(0, $this->_totalMatches - $this->_totalWins);
    }

    //saboteur matches 
    public function saboteurMatches(): int
    {
        return max(0, $this->_totalMatches - $this->_courierMatches);
    }

    //courier losses 
    public function courierLosses(): int
    {
        return max(0, $this->_courierMatches - $this->_courierWins);
    }

    //saboteur wins 
    public function saboteurWins(): int
    {
        return max(0, $this->_totalWins - $this->_courierWins);
    }

    //saboteur losses 
    public function saboteurLosses(): int
    {
        return max(0, $this->saboteurMatches() - $this->saboteurWins());
    }

    //courier hard wins 
    public function courierHardWins(): int
    {
        return max(0, $this->_courierWins - $this->_courierEasyWins - $this->_courierMediumWins);
    }

    //saboteur hard wins 
    public function saboteurHardWins(): int
    {
        return max(0, $this->saboteurWins() - $this->_saboteurEasyWins - $this->_saboteurMediumWins);
    }

    //total hurdle activations 
    //will be sum of all hurdles
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

    //total ability uses 
    //will be derived from all courier ability col counts
    public function totalAbilityUses(): int
    {
        return
            $this->_abilitySpeedBoostCount +
            $this->_abilityShieldCount +
            $this->_abilityRevealRouteCount;
    }
}
