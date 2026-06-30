// this file stores frontend types for backend match gameplay apis

import type { BackendCityMapPayload } from "../../game/v7/types/BackendCityMapPayloadType";
import type { CoordinateTilePoint } from "../../game/v7/types/CoordinateType";
import type { DirectionName } from "../../game/v7/types/DirectionType";
import type { SaboteurHurdleType } from "../../game/v7/types/SaboteurHurdleType";

export type MatchRole = "courier" | "saboteur" | "any";
export type PlayableMatchRole = "courier" | "saboteur";

export interface MatchCreateRequest {
  difficulty: string;
  rolePreference: string;
  mapVersion: string;
  mapGenerationVersion: string;
}

export interface MatchCreateResponse {
  matchId: string | number;
  status: number;
  assignedRole: PlayableMatchRole;
  opponentRole?: PlayableMatchRole;
  difficulty?: string;
  mapVersion?: string;
  mapGenerationVersion?: string;
  stateVersion?: number;
}

export interface BackendMatchCourierState {
  userId?: number | null;
  username?: string | null;
  name?: string | null;
  position?: CoordinateTilePoint;
  direction?: DirectionName | string;
  lives?: number;
  visitedTileKeys?: string[];
  abilitiesActive?: Record<string, unknown>;
  cooldowns?: Record<string, number>;
}

export interface BackendMatchSaboteurState {
  userId?: number | null;
  username?: string | null;
  name?: string | null;
  energyCurrent?: number;
  energyMax?: number;
  energySpent?: number;
  activeHurdleCount?: number;
  activeHurdleCountMax?: number;
  cooldowns?: Partial<Record<SaboteurHurdleType, number>>;
}

export interface BackendTrafficSignalState {
  stateName?: "green" | "red" | string;
  redUntilMs?: number | null;
  activatedBySaboteur?: boolean;
}

export interface BackendActiveHurdleState {
  id?: string;
  hurdleType?: SaboteurHurdleType | string;
  tilePoint?: CoordinateTilePoint;
  startedAtMs?: number;
  expiresAtMs?: number;
  energyCost?: number;
  trafficSignalId?: string;
}

export interface BackendLastMovementState {
  from?: CoordinateTilePoint;
  to?: CoordinateTilePoint;
  direction?: DirectionName | string;
  movementDelayMs?: number;
}

export interface BackendDrawOfferState {
  offeredByRole?: PlayableMatchRole | string;
  offeredByUserId?: number | null;
  offeredByName?: string;
  offeredAtMs?: number;
  expiresAtMs?: number;
}

export interface BackendMatchStateResponse {
  matchId?: string | number;
  status?: number;
  stateVersion?: number;
  difficulty?: string;
  mapVersion?: string;
  mapGenerationVersion?: string;
  mapSeed?: number;
  timerTotalMs?: number;
  startedAtMs?: number | null;
  timerRemainingMs?: number;
  assignedRole?: PlayableMatchRole | string;
  opponentRole?: PlayableMatchRole | string;
  hasChanges?: boolean;
  courier?: BackendMatchCourierState;
  saboteur?: BackendMatchSaboteurState;
  trafficSignals?: Record<string, BackendTrafficSignalState>;
  activeHurdles?: Record<string, BackendActiveHurdleState> | BackendActiveHurdleState[];
  counters?: Record<string, unknown>;
  deliveryProgressPct?: number;
  courierLivesRemaining?: number;
  obstacleEnergyRemaining?: number;
  obstacleEnergySpent?: number;
  energyMax?: number;
  activeHurdleCount?: number;
  winnerRole?: string | null;
  endReason?: string | null;
  lastMovement?: BackendLastMovementState;
  drawOffer?: BackendDrawOfferState | null;
  courierName?: string;
  saboteurName?: string;
}

export interface MatchResultResponse {
  matchId?: string | number;
  assignedRole?: string;
  winnerRole?: "courier" | "saboteur" | "draw";
  endReason?: string;
  difficulty?: string;
  mapVersion?: string;
  mapGenerationVersion?: string;
  mapSeed?: number;
  matchTimeMs?: number;
  timerTotalMs?: number;
  timeRemainingMs?: number;
  courierLivesRemaining?: number;
  deliveryProgressPct?: number;
  obstacleEnergySpent?: number;
  obstacleEnergyRemaining?: number;
  obstacleEnergyMax?: number;
  hurdlesActivated?: number;
  abilitiesUsed?: number;
  hurdleCounts?: Record<string, number>;
  abilityCounts?: Record<string, number>;
  courierName?: string;
  saboteurName?: string;
}

export interface CourierMoveRequest {
  clientActionId?: string;
  knownStateVersion: number;
  from: CoordinateTilePoint;
  to: CoordinateTilePoint;
  direction: DirectionName | string;
}

export interface CourierAbilityRequest {
  clientActionId?: string;
  knownStateVersion: number;
  abilityType: "speedBoost" | "shield" | "revealRoute" | string;
}

export interface SaboteurHurdleRequest {
  clientActionId?: string;
  knownStateVersion: number;
  hurdleType: SaboteurHurdleType | string;
  target: CoordinateTilePoint;
  requestedDurationMs?: number;
}

export interface DrawOfferRequest {
  clientActionId?: string;
  knownStateVersion: number;
}

export interface DrawRespondRequest {
  clientActionId?: string;
  knownStateVersion: number;
  accepted: boolean;
}

export interface MatchForfeitRequest {
  clientActionId?: string;
}

export interface MatchApi {
  create: (payload: MatchCreateRequest) => Promise<MatchCreateResponse>;
  getState: (matchId: string | number, knownVersion: number) => Promise<BackendMatchStateResponse>;
  getMatchState: (matchId: string | number, knownVersion: number) => Promise<BackendMatchStateResponse>;
  getMatchMap: (matchId: string | number) => Promise<BackendCityMapPayload>;
  getResult: (matchId: string | number) => Promise<MatchResultResponse>;
  courierMove: (matchId: string | number, payload: CourierMoveRequest) => Promise<BackendMatchStateResponse>;
  courierAbility: (matchId: string | number, payload: CourierAbilityRequest) => Promise<BackendMatchStateResponse>;
  saboteurHurdle: (matchId: string | number, payload: SaboteurHurdleRequest) => Promise<BackendMatchStateResponse>;
  offerDraw: (matchId: string | number, payload: DrawOfferRequest) => Promise<BackendMatchStateResponse>;
  respondDraw: (matchId: string | number, payload: DrawRespondRequest) => Promise<BackendMatchStateResponse>;
  forfeit: (matchId: string | number, payload?: MatchForfeitRequest) => Promise<BackendMatchStateResponse>;
}