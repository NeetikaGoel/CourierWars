<?php
declare(strict_types=1);

require_once __DIR__ . '/../OrmManager.php'; 
require_once __DIR__ . '/../query/CwUserStatsQuery.php'; 
require_once __DIR__ . '/../mapper/CwUserStatsMapper.php'; 
require_once __DIR__ . '/../../constants/DifficultyValue.php';
require_once __DIR__ . '/../../constants/RoleValue.php';
require_once __DIR__ . '/../../constants/HurdleTypeValue.php'; 

//this repository handles database actions for cw_user_stats table
class CwUserStatsRepository
{
    private OrmManager $ormManager; // orm manager object for db operations
    private CwUserStatsMapper $cwUserStatsMapper; // mapper object for stats rows

    //constructor creates required helper objects
    public function __construct()
    {
        $this->ormManager = new OrmManager(); 
        $this->cwUserStatsMapper = new CwUserStatsMapper(); 
    }

    //creates default stats row for user
    public function createDefaultStats(int $userId, string $preferredRole = RoleValue::ANY): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::insertDefaultStats(), // sql for stats insert
            'is', // userId preferredRole
            [$userId, $preferredRole] // values to insert
        );
    }

    //finds stats by user id
    public function findByUserId(int $userId): ?CwUserStats
    {
        return $this->ormManager->ormManageForOneRow(
            CwUserStatsQuery::selectByUserId(), // sql for selecting stats
            'i', // user id type
            [$userId], // user id value
            $this->cwUserStatsMapper // mapper for stats row
        );
    }

    //updates preferred role
    public function updatePreferredRole(int $userId, string $preferredRole): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::updatePreferredRole(), // sql for preferred role update
            'si', // preferredRole userId
            [$preferredRole, $userId] // values to bind
        );
    }

    //updates last played role
    public function updateLastPlayedRole(int $userId, string $lastPlayedRole): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::updateLastPlayedRole(), // sql for last played role update
            'si', // lastPlayedRole userId
            [$lastPlayedRole, $userId] // values to bind
        );
    }

    //adds one Courier match
    public function addCourierMatch(int $userId): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::addCourierMatch(), // sql for courier match increment
            'i', // user id type
            [$userId] // user id value
        );
    }

    //adds one Courier win
    public function addCourierWin(int $userId): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::addCourierWin(), // sql for courier win increment
            'i', // user id type
            [$userId] // user id value
        );
    }

    //adds one Courier difficulty win if difficulty is easy or medium
    public function addCourierDifficultyWin(int $userId, string $difficulty): void
    {
        if ($difficulty === DifficultyValue::EASY) // easy win is stored
        {
            $this->ormManager->runQuery(CwUserStatsQuery::addCourierEasyWin(), 'i', [$userId]); // add courier easy win
        }

        if ($difficulty === DifficultyValue::MEDIUM) // medium win is stored
        {
            $this->ormManager->runQuery(CwUserStatsQuery::addCourierMediumWin(), 'i', [$userId]); // add courier medium win
        }

        //hard win is not stored because courier_hard_wins is derived
    }

    //updates fastest delivery if new value is lower
    public function updateFastestDeliveryIfBetter(int $userId, int $deliveryMs): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::updateFastestDeliveryIfBetter(), // sql for fastest delivery update
            'iii', // deliveryMs deliveryMs userId
            [$deliveryMs, $deliveryMs, $userId] // values to bind
        );
    }

    //adds Courier ability counts
    public function addAbilityCounts(int $userId, int $speedBoostCount, int $shieldCount, int $revealRouteCount): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::addAbilityCounts(), // sql for ability count update
            'iiii', // speed shield reveal userId
            [$speedBoostCount, $shieldCount, $revealRouteCount, $userId] // values to bind
        );
    }

    //adds one Saboteur match
    public function addSaboteurMatch(int $userId): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::addSaboteurMatch(), // sql for saboteur match increment
            'i', // user id type
            [$userId] // user id value
        );
    }

    //adds one Saboteur win
    public function addSaboteurWin(int $userId): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::addSaboteurWin(), // sql for saboteur win increment
            'i', // user id type
            [$userId] // user id value
        );
    }

    //adds one Saboteur difficulty win if difficulty is easy or medium
    public function addSaboteurDifficultyWin(int $userId, string $difficulty): void
    {
        if ($difficulty === DifficultyValue::EASY) // easy win is stored
        {
            $this->ormManager->runQuery(CwUserStatsQuery::addSaboteurEasyWin(), 'i', [$userId]); // add saboteur easy win
        }

        if ($difficulty === DifficultyValue::MEDIUM) // medium win is stored
        {
            $this->ormManager->runQuery(CwUserStatsQuery::addSaboteurMediumWin(), 'i', [$userId]); // add saboteur medium win
        }

        //hard win is not stored because saboteur_hard_wins is derived
    }

    //updates best Saboteur delay if new value is higher
    public function updateBestSaboteurDelayIfBetter(int $userId, int $delayMs): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::updateBestSaboteurDelayIfBetter(), // sql for best delay update
            'iii', // delayMs delayMs userId
            [$delayMs, $delayMs, $userId] // values to bind
        );
    }

    //adds obstacle energy spent
    public function addObstacleEnergySpent(int $userId, int $energySpent): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::addObstacleEnergySpent(), // sql for energy update
            'ii', // energy userId
            [$energySpent, $userId] // values to bind
        );
    }

    //adds Saboteur hurdle counts from associative array
    public function addHurdleCounts(int $userId, array $hurdleCounts): void
    {
        $this->ormManager->runQuery(
            CwUserStatsQuery::addHurdleCounts(), // sql for hurdle count update
            'iiiiiiiiii', // 9 hurdle counts and userId
            [
                (int)($hurdleCounts[HurdleTypeValue::RED_TRAFFIC_LIGHT] ?? 0), 
                (int)($hurdleCounts[HurdleTypeValue::ROAD_BLOCK] ?? 0), 
                (int)($hurdleCounts[HurdleTypeValue::CONSTRUCTION_WORK] ?? 0), 
                (int)($hurdleCounts[HurdleTypeValue::TRAFFIC_JAM] ?? 0),
                (int)($hurdleCounts[HurdleTypeValue::CLOSED_GATE] ?? 0), 
                (int)($hurdleCounts[HurdleTypeValue::WRONG_DIRECTION_SIGN] ?? 0), 
                (int)($hurdleCounts[HurdleTypeValue::BROKEN_ROAD] ?? 0), 
                (int)($hurdleCounts[HurdleTypeValue::MOVING_BARRIER] ?? 0), 
                (int)($hurdleCounts[HurdleTypeValue::SECURITY_CHECKPOINT] ?? 0), 
                $userId // user id
            ]
        );
    }
}
