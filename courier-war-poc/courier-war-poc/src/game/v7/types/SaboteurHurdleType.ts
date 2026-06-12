// Imports tile point shape for hurdle placement
import type { CoordinateTilePoint } from "./CoordinateType";

// Defines all Saboteur hurdle names
export const SaboteurHurdleType = {
  // Represents red traffic signal activation
  RedTrafficLight: "redTrafficLight",

  // Represents one road tile being blocked
  RoadBlock: "roadBlock",

  // Represents road slowdown caused by construction
  ConstructionWork: "constructionWork",

  // Represents traffic slowdown zone
  TrafficJam: "trafficJam",

  // Represents temporary closure of shortcut tunnel or bridge entrance
  ClosedGate: "closedGate",

  // Represents misleading direction sign
  WrongDirectionSign: "wrongDirectionSign",

  // Represents temporarily broken road
  BrokenRoad: "brokenRoad",

  // Represents moving obstacle timing challenge
  MovingBarrier: "movingBarrier",

  // Represents brief stop checkpoint
  SecurityCheckpoint: "securityCheckpoint",
} as const;

// Creates a string union type from Saboteur hurdle values
export type SaboteurHurdleType = (typeof SaboteurHurdleType)[keyof typeof SaboteurHurdleType];

// Defines Saboteur placement failure reason values
export const SaboteurHurdlePlacementFailureReason = {
  // Means no tile exists at the target location
  TileMissing: "tileMissing",

  // Means target tile is too close to Courier
  TileTooCloseToCourier: "tileTooCloseToCourier",

  // Means target tile belongs to Courier current zone
  TileInCourierCurrentZone: "tileInCourierCurrentZone",

  // Means target tile was visited and is also in Courier current zone
  TileVisitedInCourierCurrentZone: "tileVisitedInCourierCurrentZone",

  // Means target tile zone is not allowed for placement
  TileZoneNotAllowed: "tileZoneNotAllowed",

  // Means target tile does not support selected hurdle
  TileDoesNotSupportHurdle: "tileDoesNotSupportHurdle",

  // Means target tile is the Courier start tile
  TileIsStart: "tileIsStart",

  // Means target tile is the delivery tile
  TileIsDelivery: "tileIsDelivery",

  // Means target tile already has a conflicting active hurdle
  TileHasActiveHurdle: "tileHasActiveHurdle",

  // Means selected red light action needs a traffic signal but none exists
  TrafficSignalMissing: "trafficSignalMissing",

  // Means selected traffic signal is already red
  TrafficSignalAlreadyRed: "trafficSignalAlreadyRed",

  // Means Saboteur does not have enough energy
  SaboteurEnergyInsufficient: "saboteurEnergyInsufficient",

  // Means selected hurdle type is still on cooldown
  SaboteurHurdleCooldownActive: "saboteurHurdleCooldownActive",
} as const;

// Creates a string union type from placement failure reason values
export type SaboteurHurdlePlacementFailureReason =
  (typeof SaboteurHurdlePlacementFailureReason)[keyof typeof SaboteurHurdlePlacementFailureReason];

// Defines a request to activate a Saboteur hurdle
export interface SaboteurHurdleActivationRequest {
  // Stores selected hurdle type
  hurdleType: SaboteurHurdleType;

  // Stores target tile point for the hurdle
  tilePoint: CoordinateTilePoint;

  // Stores current game time in milliseconds
  currentTimeMs: number;

  // Stores requested duration when hurdle duration is configurable
  requestedDurationMs?: number;
}

// Defines an active runtime hurdle
export interface SaboteurHurdleActive {
  // Stores unique active hurdle id
  id: string;

  // Stores active hurdle type
  hurdleType: SaboteurHurdleType;

  // Stores tile point where hurdle is active
  tilePoint: CoordinateTilePoint;

  // Stores time when hurdle started
  startedAtMs: number;

  // Stores time when hurdle expires
  expiresAtMs: number;

  // Stores linked traffic signal id when hurdle is red traffic light
  trafficSignalId?: string;
}

// Defines result returned by placement validation
export interface SaboteurHurdlePlacementResult {
  // Stores whether placement is allowed
  valid: boolean;

  // Stores failure reason when placement is rejected
  failureReason?: SaboteurHurdlePlacementFailureReason;

  // Stores optional user friendly debug message
  message?: string;
}