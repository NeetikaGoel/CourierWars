// this file stores frontend profile api response types

export interface ProfileUserResponse {
  userId: number;
  username: string;
  name: string | null;
  email: string | null;
  isGuest: boolean;
  isRegistered?: boolean;
  createdAt?: string;
}

export interface ProfileStatsResponse {
  preferredRole?: string;
  lastPlayedRole?: string | null;
  totalMatches?: number;
  totalWins?: number;
  totalLosses?: number;
  winRatePct?: number;
  courierMatches?: number;
  courierWins?: number;
  fastestDeliveryMs?: number | null;
  bestSaboteurDelayMs?: number | null;
  totalObstacleEnergySpent?: number;
  abilityCounts?: {
    speedBoost?: number;
    shield?: number;
    revealRoute?: number;
  };
  hurdleCounts?: {
    redTrafficLight?: number;
    roadBlock?: number;
    constructionWork?: number;
    trafficJam?: number;
    closedGate?: number;
  };
}

export interface ProfileResponse {
  user: ProfileUserResponse;
  stats: ProfileStatsResponse | null;
}