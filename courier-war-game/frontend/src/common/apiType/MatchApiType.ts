// this file stores the match sync contract shared by the backend MatchService and the frontend

export type MatchPlayableRole = "courier" | "saboteur";

export interface MatchSyncHurdle {
  id: string;
  type: string;
  // anchor tile first, then the road width tiles the saboteur client expanded
  tiles: [number, number][];
  signalId: string | null;
  startedAtMs: number;
  expiresAtMs: number;
}

// backend HurdleConfig values for one hurdle type
export interface MatchSyncHurdleRule {
  energyCost: number;
  cooldownMs: number;
  durationMs: number;
  durationMsMin: number;
  durationMsMax: number;
}

export interface MatchSyncCourier {
  x: number;
  y: number;
  lives: number;
  moveSeq: number;
  // recent [x, y, seq] tiles so the saboteur can animate the path between polls
  trail: [number, number, number][];
}

export interface MatchSyncResultSummary {
  winnerRole: MatchPlayableRole | "draw";
  endReason: string;
}

// a poll with an unchanged stateVersion only carries the fields up to obstacleEnergyRemaining
export interface MatchSyncState {
  changed: boolean;
  matchId: number;
  status: number;
  stateVersion: number;
  serverNowMs: number;
  pollIntervalMs: number;
  timerRemainingMs: number;
  obstacleEnergyRemaining: number;

  assignedRole?: MatchPlayableRole;
  opponentRole?: MatchPlayableRole;
  opponentJoined?: boolean;
  difficulty?: string;
  mapSeed?: number;
  mapVersion?: string;
  mapGenerationVersion?: string;
  timerTotalMs?: number;
  startsAtMs?: number | null;
  courierName?: string | null;
  saboteurName?: string | null;
  courier?: MatchSyncCourier;
  courierLivesRemaining?: number;
  deliveryProgressPct?: number;
  energyMax?: number;
  energyRecoveryPerSecond?: number;
  obstacleEnergySpent?: number;
  // php sends [] instead of {} when no cooldown was used yet
  cooldownUntilMsByType?: Record<string, number> | [];
  activeHurdleCount?: number;
  activeHurdleCountMax?: number;
  hurdlesActivated?: number;
  hurdles?: MatchSyncHurdle[];
  // only on the create reply and on a knownVersion=0 read
  hurdleRules?: Record<string, MatchSyncHurdleRule>;
  moveRejected?: { seq: number; reason: string } | null;
  drawOfferedBy?: MatchPlayableRole | null;
  result?: MatchSyncResultSummary | null;

  // only sent once, in the create response
  playerToken?: string;
}

export interface MatchSyncCourierStep {
  seq: number;
  x: number;
  y: number;
}
