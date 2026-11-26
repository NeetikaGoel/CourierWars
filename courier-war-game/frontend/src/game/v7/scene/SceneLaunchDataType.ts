// this file stores data passed from page layer into Phaser match scene

import type { BackendCityMapPayload } from "../types/BackendCityMapPayloadType";

export interface MatchGameSceneLaunchData {
  // this is the backend generated map payload
  mapPayload: BackendCityMapPayload;

  // this stores current match id for later api actions
  matchId?: string | number;

  // this stores optional initial match state from backend
  matchState?: unknown;

  // this stores assigned player role when page already knows it
  assignedRole?: string;

  // this runs when courier reaches delivery tile in local prototype flow
  onCourierDelivered?: (matchId?: string | number) => void;

  // this runs after every finished courier tile step in an online match
  onCourierStep?: (step: { x: number; y: number; lives: number }) => void;

  // this runs when the saboteur confirms a placement in an online match
  onHurdleRequested?: (hurdleType: string, tilePointList: { x: number; y: number }[]) => void;

  // this runs when the saboteur selects a hurdle with keys 1 to 9 so the page deck can follow
  onHurdleSelected?: (hurdleType: string) => void;

  // this runs with a short message after a tile pick or a placement the local rules refused
  onPlacementFeedback?: (message: string, valid: boolean) => void;
}