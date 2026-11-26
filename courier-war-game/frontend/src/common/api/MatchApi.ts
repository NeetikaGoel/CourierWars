// this file contains the match calls both players use to stay in sync

import { apiJsonGet, apiJsonPost } from "./ApiClient";
import type { MatchSyncCourierStep, MatchSyncState } from "../apiType/MatchApiType";
import type { MatchResultData } from "../../pages/match/result/MatchResultPage";

// the player token is per tab, so two tabs of one account can play each other while testing
const playerTokenByMatchId = new Map<string, string>();

// this keeps the smallest round trip seen so far, that sample gives the most accurate clock offset
let clockOffsetBestRoundTripMs = Number.POSITIVE_INFINITY;
let clockOffsetMs = 0;

function playerTokenGet(matchId: string | number): string {
  const playerToken = playerTokenByMatchId.get(String(matchId));

  if (!playerToken) {
    throw new Error("This tab is not a player in that match");
  }

  return playerToken;
}

// estimates backend clock minus local clock from one request
function clockOffsetSample(requestStartedAtMs: number, state: MatchSyncState): void {
  const requestEndedAtMs = Date.now();
  const roundTripMs = requestEndedAtMs - requestStartedAtMs;

  if (typeof state.serverNowMs !== "number" || roundTripMs > clockOffsetBestRoundTripMs * 2 + 50) {
    return;
  }

  // a slower sample still replaces an old one slowly so drift is followed
  const sampleOffsetMs = state.serverNowMs - (requestStartedAtMs + roundTripMs / 2);
  const sampleWeight = roundTripMs <= clockOffsetBestRoundTripMs ? 1 : 0.2;

  clockOffsetBestRoundTripMs = Math.min(clockOffsetBestRoundTripMs, roundTripMs);
  clockOffsetMs = clockOffsetMs + (sampleOffsetMs - clockOffsetMs) * sampleWeight;
}

async function stateRequest(request: () => Promise<MatchSyncState>): Promise<MatchSyncState> {
  const requestStartedAtMs = Date.now();
  const state = await request();

  clockOffsetSample(requestStartedAtMs, state);

  return state;
}

function matchActionPost(matchId: string | number, action: string, body: Record<string, unknown> = {}): Promise<MatchSyncState> {
  return stateRequest(() =>
    apiJsonPost<MatchSyncState>(`/matches/${encodeURIComponent(String(matchId))}/${action}`, {
      ...body,
      playerToken: playerTokenGet(matchId),
    })
  );
}

export const matchApi = {
  async create(payload: { difficulty: string; rolePreference: string }): Promise<MatchSyncState> {
    const state = await stateRequest(() =>
      apiJsonPost<MatchSyncState>("/matches", {
        difficulty: payload.difficulty,
        rolePreference: payload.rolePreference,
      })
    );

    if (state.playerToken) {
      playerTokenByMatchId.set(String(state.matchId), state.playerToken);
    }

    return state;
  },

  stateGet(matchId: string | number, knownVersion: number): Promise<MatchSyncState> {
    return stateRequest(() =>
      apiJsonGet<MatchSyncState>(`/matches/${encodeURIComponent(String(matchId))}/state`, {
        query: { playerToken: playerTokenGet(matchId), knownVersion },
      })
    );
  },

  resultGet(matchId: string | number): Promise<MatchResultData> {
    return apiJsonGet<MatchResultData>(`/matches/${encodeURIComponent(String(matchId))}/result`, {
      query: { playerToken: playerTokenGet(matchId) },
    });
  },

  ready(matchId: string | number): Promise<MatchSyncState> {
    return matchActionPost(matchId, "ready");
  },

  movesSend(matchId: string | number, stepList: MatchSyncCourierStep[], lives: number): Promise<MatchSyncState> {
    return matchActionPost(matchId, "moves", { steps: stepList, lives });
  },

  hurdlePlace(
    matchId: string | number,
    hurdleType: string,
    tilePointList: { x: number; y: number }[],
    durationMs?: number
  ): Promise<MatchSyncState> {
    return matchActionPost(matchId, "hurdles", { hurdleType, tiles: tilePointList, durationMs });
  },

  cancel(matchId: string | number): Promise<MatchSyncState> {
    return matchActionPost(matchId, "cancel");
  },

  drawOffer(matchId: string | number): Promise<MatchSyncState> {
    return matchActionPost(matchId, "draw");
  },

  playerTokenKnownCheck(matchId: string | number): boolean {
    return playerTokenByMatchId.has(String(matchId));
  },

  clockOffsetMsGet(): number {
    return clockOffsetMs;
  },
};
