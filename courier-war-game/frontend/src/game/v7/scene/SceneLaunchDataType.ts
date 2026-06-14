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
}