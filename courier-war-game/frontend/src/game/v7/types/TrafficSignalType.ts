// Imports tile point shape for signal location
import type { CoordinateTilePoint } from "./CoordinateType";

// Defines traffic signal state names
export const TrafficSignalStateName = {
  // Represents default passable traffic signal state
  Green: "green",

  // Represents active stop state caused by Saboteur
  Red: "red",
} as const;

// Creates a string union type from traffic signal state values
export type TrafficSignalStateName = (typeof TrafficSignalStateName)[keyof typeof TrafficSignalStateName];

// Defines generated traffic signal data
export interface TrafficSignalGenerated {
  // Stores unique traffic signal id
  id: string;

  // Stores tile point where signal exists
  tilePoint: CoordinateTilePoint;

  // Stores road intersection id that owns the signal
  intersectionId: string;
}

// Defines runtime traffic signal state
export interface TrafficSignalRuntimeState {
  // Stores linked generated traffic signal id
  signalId: string;

  // Stores current traffic signal state name
  stateName: TrafficSignalStateName;

  // Stores timestamp when red state ends
  redUntilMs: number | null;

  // Stores whether red state was activated by Saboteur
  activatedBySaboteur: boolean;
}

// Defines lookup map from traffic signal id to runtime state
export type TrafficSignalRuntimeStateByIdMap = Record<string, TrafficSignalRuntimeState>;