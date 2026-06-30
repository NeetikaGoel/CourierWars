// this file connects frontend match gameplay to backend authoritative match apis

import { apiJsonGet, apiJsonPost } from "./ApiClient";
import { clientActionIdCreate } from "./ClientActionIdFactory";
import type {
  BackendMatchStateResponse,
  CourierAbilityRequest,
  CourierMoveRequest,
  DrawOfferRequest,
  DrawRespondRequest,
  MatchApi,
  MatchCreateRequest,
  MatchCreateResponse,
  MatchForfeitRequest,
  MatchResultResponse,
  SaboteurHurdleRequest,
} from "../apiType/MatchApiType";
import type { BackendCityMapPayload } from "../../game/v7/types/BackendCityMapPayloadType";

function matchIdPathPartGet(matchId: string | number): string {
  return encodeURIComponent(String(matchId));
}

function mutationActionIdGet(prefix: string, existingActionId?: string): string {
  return existingActionId || clientActionIdCreate(prefix);
}

async function matchStateGet(matchId: string | number, knownVersion: number): Promise<BackendMatchStateResponse> {
  return apiJsonGet<BackendMatchStateResponse>(`/matches/${matchIdPathPartGet(matchId)}/state`, {
    query: {
      knownVersion,
    },
  });
}

export const matchApi: MatchApi = {
  async create(payload: MatchCreateRequest): Promise<MatchCreateResponse> {
    const clientActionId = clientActionIdCreate("match_create");

    return apiJsonPost<MatchCreateResponse, MatchCreateRequest>("/matches", payload, {
      idempotencyKey: clientActionId,
    });
  },

  async getState(matchId: string | number, knownVersion: number): Promise<BackendMatchStateResponse> {
    return matchStateGet(matchId, knownVersion);
  },

  async getMatchState(matchId: string | number, knownVersion: number): Promise<BackendMatchStateResponse> {
    return matchStateGet(matchId, knownVersion);
  },

  async getMatchMap(matchId: string | number): Promise<BackendCityMapPayload> {
    return apiJsonGet<BackendCityMapPayload>(`/matches/${matchIdPathPartGet(matchId)}/map`);
  },

  async getResult(matchId: string | number): Promise<MatchResultResponse> {
    return apiJsonGet<MatchResultResponse>(`/matches/${matchIdPathPartGet(matchId)}/result`);
  },

  async courierMove(matchId: string | number, payload: CourierMoveRequest): Promise<BackendMatchStateResponse> {
    const clientActionId = mutationActionIdGet("courier_move", payload.clientActionId);

    return apiJsonPost<BackendMatchStateResponse, CourierMoveRequest>(
      `/matches/${matchIdPathPartGet(matchId)}/courier/move`,
      {
        ...payload,
        clientActionId,
      },
      {
        idempotencyKey: clientActionId,
      }
    );
  },

  async courierAbility(matchId: string | number, payload: CourierAbilityRequest): Promise<BackendMatchStateResponse> {
    const clientActionId = mutationActionIdGet("courier_ability", payload.clientActionId);

    return apiJsonPost<BackendMatchStateResponse, CourierAbilityRequest>(
      `/matches/${matchIdPathPartGet(matchId)}/courier/ability`,
      {
        ...payload,
        clientActionId,
      },
      {
        idempotencyKey: clientActionId,
      }
    );
  },

  async saboteurHurdle(matchId: string | number, payload: SaboteurHurdleRequest): Promise<BackendMatchStateResponse> {
    const clientActionId = mutationActionIdGet("saboteur_hurdle", payload.clientActionId);

    return apiJsonPost<BackendMatchStateResponse, SaboteurHurdleRequest>(
      `/matches/${matchIdPathPartGet(matchId)}/saboteur/hurdle`,
      {
        ...payload,
        clientActionId,
      },
      {
        idempotencyKey: clientActionId,
      }
    );
  },

  async offerDraw(matchId: string | number, payload: DrawOfferRequest): Promise<BackendMatchStateResponse> {
    const clientActionId = mutationActionIdGet("draw_offer", payload.clientActionId);

    return apiJsonPost<BackendMatchStateResponse, DrawOfferRequest>(
      `/matches/${matchIdPathPartGet(matchId)}/draw/offer`,
      {
        ...payload,
        clientActionId,
      },
      {
        idempotencyKey: clientActionId,
      }
    );
  },

  async respondDraw(matchId: string | number, payload: DrawRespondRequest): Promise<BackendMatchStateResponse> {
    const clientActionId = mutationActionIdGet("draw_respond", payload.clientActionId);

    return apiJsonPost<BackendMatchStateResponse, DrawRespondRequest>(
      `/matches/${matchIdPathPartGet(matchId)}/draw/respond`,
      {
        ...payload,
        clientActionId,
      },
      {
        idempotencyKey: clientActionId,
      }
    );
  },

  async forfeit(matchId: string | number, payload: MatchForfeitRequest = {}): Promise<BackendMatchStateResponse> {
    const clientActionId = mutationActionIdGet("match_forfeit", payload.clientActionId);

    return apiJsonPost<BackendMatchStateResponse, MatchForfeitRequest>(
      `/matches/${matchIdPathPartGet(matchId)}/forfeit`,
      {
        ...payload,
        clientActionId,
      },
      {
        idempotencyKey: clientActionId,
      }
    );
  },
};