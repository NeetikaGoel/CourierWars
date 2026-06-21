<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/AuthContext.php';
require_once __DIR__ . '/../database/repository/CwUserRepository.php';
require_once __DIR__ . '/../database/repository/CwUserStatsRepository.php';
require_once __DIR__ . '/../entity/CwUser.php';
require_once __DIR__ . '/../entity/CwUserStats.php';

//now this service is for loading profile and stats for current user
class ProfileService
{
    private CwUserRepository $_cwUserRepository;
    private CwUserStatsRepository $_cwUserStatsRepository;

    //constructor for the purpose of creating repositories
    public function __construct(?CwUserRepository $cwUserRepository = null, ?CwUserStatsRepository $cwUserStatsRepository = null)
    {
        $this->_cwUserRepository = $cwUserRepository ?? new CwUserRepository();
        $this->_cwUserStatsRepository = $cwUserStatsRepository ?? new CwUserStatsRepository();
    }

    //now returning current profile payload
    public function profileGet(AuthContext $authContext): array
    {
        $user = $this->_cwUserRepository->findByUserId($authContext->getUserId());
        $stats = $this->_cwUserStatsRepository->findByUserId($authContext->getUserId());

        if ($user === null) {
            throw new RuntimeException('User was not found!!');
        }

        return [
            'user' => [
                'userId' => $user->getUserId(),
                'username' => $user->getUsername(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'isGuest' => $user->isGuest(),
                'isRegistered' => $user->isRegistered(),
                'createdAt' => $user->getCreatedAt(),
                'updatedAt' => $user->getUpdatedAt(),
            ],
            'stats' => $stats === null ? null : $this->statsPayloadCreate($stats),
        ];
    }

    //for creating stats response payload
    private function statsPayloadCreate(CwUserStats $stats): array
    {
        $totalMatches = $stats->getTotalMatches();
        $totalWins = $stats->getTotalWins();

        return [
            'preferredRole' => $stats->getPreferredRole(),
            'lastPlayedRole' => $stats->getLastPlayedRole(),
            'totalMatches' => $totalMatches,
            'totalWins' => $totalWins,
            'totalLosses' => max(0, $totalMatches - $totalWins),
            'winRatePct' => $totalMatches === 0 ? 0 : (int)round(($totalWins / $totalMatches) * 100),
            'courierMatches' => $stats->getCourierMatches(),
            'courierWins' => $stats->getCourierWins(),
            'fastestDeliveryMs' => $stats->getFastestDeliveryMs(),
            'bestSaboteurDelayMs' => $stats->getBestSaboteurDelayMs(),
            'totalObstacleEnergySpent' => $stats->getTotalObstacleEnergySpent(),
            'abilityCounts' => [
                'speedBoost' => $stats->getAbilitySpeedBoostCount(),
                'shield' => $stats->getAbilityShieldCount(),
                'revealRoute' => $stats->getAbilityRevealRouteCount(),
            ],
            'hurdleCounts' => [
                'redTrafficLight' => $stats->getHurdleRedTrafficLightCount(),
                'roadBlock' => $stats->getHurdleRoadBlockCount(),
                'constructionWork' => $stats->getHurdleConstructionWorkCount(),
                'trafficJam' => $stats->getHurdleTrafficJamCount(),
                'closedGate' => $stats->getHurdleClosedGateCount(),
            ],
        ];
    }
}
