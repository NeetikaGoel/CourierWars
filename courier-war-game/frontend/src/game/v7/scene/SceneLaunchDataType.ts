// this file stores data passed from page layer into Phaser match scene

import type { BackendCityMapPayload } from "../types/BackendCityMapPayloadType";
import type {
  BackendMatchStateResponse,
  CourierAbilityRequest,
  CourierMoveRequest,
  SaboteurHurdleRequest,
} from "../../../common/apiType/MatchApiType";

export interface MatchGameSceneMatchApi {
  getMatchState: (matchId: string | number, knownVersion: number) => Promise<BackendMatchStateResponse>;
  courierMove: (matchId: string | number, payload: CourierMoveRequest) => Promise<BackendMatchStateResponse>;
  courierAbility: (matchId: string | number, payload: CourierAbilityRequest) => Promise<BackendMatchStateResponse>;
  saboteurHurdle: (matchId: string | number, payload: SaboteurHurdleRequest) => Promise<BackendMatchStateResponse>;
}

export interface MatchGameSceneLaunchData {
  // this is the backend generated map payload
  mapPayload: BackendCityMapPayload;

  // this stores current match id for later api actions
  matchId?: string | number;

  // this stores optional initial match state from backend
  matchState?: unknown;

  // this stores assigned player role when page already knows it
  assignedRole?: string;

  // this stores backend action api used by Phaser input controllers
  matchApi?: MatchGameSceneMatchApi;

  // this runs when backend accepts a new authoritative state
  onStateAccepted?: (matchState: BackendMatchStateResponse) => void;

  // this runs when backend rejects a player action
  onActionRejected?: (message: string) => void;

  // this runs when courier reaches delivery tile in backend accepted flow
  onCourierDelivered?: (matchId?: string | number) => void;
}