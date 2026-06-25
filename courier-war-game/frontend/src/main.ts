import { mountLandingPage } from "./pages/landing/LandingPage";
import { mountLoginPage } from "./pages/auth/login/LoginPage";
import { mountRegisterPage } from "./pages/auth/register/RegisterPage";
import { mountGuestEntryPage } from "./pages/auth/guest/GuestEntryPage";
import { mountHomeSetupPage } from "./pages/home/HomeSetupPage";
import { mountAuthLoadingPage } from "./pages/auth/auth-loading/AuthLoadingPage";
import { mountMatchWaitingPage, type MatchWaitingPageToLoadingData } from "./pages/match/match-waiting/MatchWaitingPage";
import { mountMatchLoadingPage } from "./pages/match/match-loading/MatchLoadingPage";
import { mountMatchGamePage } from "./pages/match/match-game/MatchGamePage";
import { mountMatchDisconnectedPage } from "./pages/match/match-disconnected/MatchDisconnectedPage";
import { mountMatchResultPage, type MatchResultData } from "./pages/match/result/MatchResultPage";
import { FrontendMatchStatusValue } from "./constants/FrontendMatchStatusValue";
import { mapApi } from "./common/api/MapApi";
import { PhaserMatchGameController } from "./game/v7/scene/PhaserMatchGameController";

const appRootElement = document.querySelector<HTMLDivElement>("#app");

if (appRootElement === null) {
  throw new Error("App root not found");
}

const appRoot: HTMLDivElement = appRootElement;

type PrototypeRole = "courier" | "saboteur";
type PrototypeResultMode = "courierDelivered" | "saboteurTimeout" | "drawAgreement";

const MATCH_TIMER_TOTAL_MS = 300000;

let currentCleanup: (() => void) | null = null;
let fakeSessionActive = false;
let currentMatchAssignedRole: PrototypeRole = "courier";
let currentMatchDifficulty = "medium";
let currentMatchStartedAtMs = Date.now();
let currentMatchStateVersion = 1;
let currentResultMode: PrototypeResultMode | null = null;

async function pageMount(mountFunction: () => Promise<() => void>): Promise<void> {
  currentCleanup?.();
  currentCleanup = await mountFunction();
}

function matchTimerRemainingMsGet(): number {
  const elapsedMs = Date.now() - currentMatchStartedAtMs;

  return Math.max(0, MATCH_TIMER_TOTAL_MS - elapsedMs);
}

function deliveryProgressGet(timerRemainingMs: number): number {
  const elapsedRatio = 1 - timerRemainingMs / MATCH_TIMER_TOTAL_MS;

  return Math.max(0, Math.min(96, Math.round(18 + elapsedRatio * 78)));
}

function currentMatchStatusGet(timerRemainingMs: number): number {
  if (currentResultMode === "drawAgreement") {
    return FrontendMatchStatusValue.Draw;
  }

  if (timerRemainingMs <= 0) {
    currentResultMode = "saboteurTimeout";
    return FrontendMatchStatusValue.Completed;
  }

  return FrontendMatchStatusValue.Active;
}

const fakeAuthApi = {
  login: async (_payload: { identifier: string; password: string }): Promise<void> => {
    console.log("fake login", _payload);
    fakeSessionActive = true;
  },

  register: async (_payload: {
    username: string;
    email: string;
    password: string;
    name?: string;
    preferredRole: string;
  }): Promise<void> => {
    console.log("fake register", _payload);
    fakeSessionActive = true;
  },

  guest: async (_payload: { name?: string }): Promise<void> => {
    console.log("fake guest", _payload);
    fakeSessionActive = true;
  },

  refresh: async (): Promise<void> => {
    console.log("fake refresh");

    if (!fakeSessionActive) {
      throw new Error("UNAUTHORIZED");
    }
  },

  logout: async (): Promise<void> => {
    console.log("fake logout");
    fakeSessionActive = false;
  },

  forgetGuest: async (): Promise<void> => {
    console.log("fake forget guest");
    fakeSessionActive = false;
  },
};

const fakeProfileApi = {
  getProfile: async () => {
    if (!fakeSessionActive) {
      throw new Error("UNAUTHORIZED");
    }

    return {
      user: {
        userId: 1,
        username: "neetika_demo",
        name: "Neetika Goel",
        email: null,
        isGuest: true,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
      stats: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        courierMatches: 0,
        courierWins: 0,
        courierLosses: 0,
        saboteurMatches: 0,
        saboteurWins: 0,
        saboteurLosses: 0,
        fastestDeliveryMs: null,
        bestSaboteurDelayMs: null,
        preferredRole: "any",
        lastPlayedRole: null,
      },
    };
  },
};

const fakeMatchApi = {
  create: async (_payload: {
    difficulty: string;
    rolePreference: string;
    mapVersion: string;
    mapGenerationVersion: string;
  }) => {
    console.log("fake create match", _payload);

    currentMatchAssignedRole = _payload.rolePreference === "saboteur" ? "saboteur" : "courier";
    currentMatchDifficulty = _payload.difficulty;
    currentMatchStateVersion = 1;
    currentResultMode = null;

    return {
      matchId: "1",
      status: FrontendMatchStatusValue.Waiting,
      assignedRole: currentMatchAssignedRole,
    };
  },
};

const mapPreviewMatchApi = {
  getMatchMap: async (_matchId: string | number): Promise<unknown> => {
    return mapApi.previewMapGet({ seed: 20260531 });
  },

  getMatchState: async (_matchId: string | number, _knownVersion: number) => {
    const timerRemainingMs = matchTimerRemainingMsGet();
    const status = currentMatchStatusGet(timerRemainingMs);

    return {
      matchId: _matchId,
      status,
      assignedRole: currentMatchAssignedRole,
      stateVersion: currentMatchStateVersion++,
      timerRemainingMs,
      difficulty: currentMatchDifficulty,
      deliveryProgressPct: status === FrontendMatchStatusValue.Completed ? 100 : deliveryProgressGet(timerRemainingMs),
      courierLivesRemaining: 3,
      obstacleEnergyRemaining: 72,
      obstacleEnergySpent: 120,
      energyMax: 100,
      activeHurdleCount: 3,
    };
  },

  getResult: async (matchId: string | number): Promise<MatchResultData> => {
    if (currentResultMode === "drawAgreement") {
      return {
        matchId,
        winnerRole: "draw",
        endReason: "drawAgreement",
        difficulty: currentMatchDifficulty,
        matchTimeMs: MATCH_TIMER_TOTAL_MS,
        timeRemainingMs: matchTimerRemainingMsGet(),
        courierLivesRemaining: 3,
        deliveryProgressPct: deliveryProgressGet(matchTimerRemainingMsGet()),
        obstacleEnergySpent: 120,
        obstacleEnergyRemaining: 72,
        obstacleEnergyMax: 200,
        hurdlesActivated: 9,
        successfulDelays: 6,
        mostUsedHurdle: "Traffic Light",
        longestActiveHurdleMs: 18000,
        predictionAccuracyPct: 68,
        abilitiesUsed: 3,
        distanceTravelledKm: 4.23,
        routesChanged: 5,
        courierName: "Neetika Goel",
        saboteurName: "Santosh Shedbalkar",
      };
    }

    if (currentResultMode === "saboteurTimeout") {
      return {
        matchId,
        winnerRole: "saboteur",
        endReason: "timerExpired",
        difficulty: currentMatchDifficulty,
        matchTimeMs: MATCH_TIMER_TOTAL_MS,
        timeRemainingMs: 0,
        courierLivesRemaining: 2,
        deliveryProgressPct: 84,
        obstacleEnergySpent: 145,
        obstacleEnergyRemaining: 40,
        obstacleEnergyMax: 200,
        hurdlesActivated: 11,
        successfulDelays: 8,
        mostUsedHurdle: "Road Block",
        longestActiveHurdleMs: 22000,
        predictionAccuracyPct: 74,
        abilitiesUsed: 3,
        distanceTravelledKm: 3.84,
        routesChanged: 7,
        courierName: "Neetika Goel",
        saboteurName: "Santosh Shedbalkar",
      };
    }

    return {
      matchId,
      winnerRole: "courier",
      endReason: "delivered",
      difficulty: currentMatchDifficulty,
      matchTimeMs: MATCH_TIMER_TOTAL_MS,
      timeRemainingMs: Math.max(12000, matchTimerRemainingMsGet()),
      courierLivesRemaining: 3,
      deliveryProgressPct: 100,
      obstacleEnergySpent: 120,
      obstacleEnergyRemaining: 72,
      obstacleEnergyMax: 200,
      hurdlesActivated: 9,
      successfulDelays: 6,
      mostUsedHurdle: "Traffic Light",
      longestActiveHurdleMs: 18000,
      predictionAccuracyPct: 68,
      abilitiesUsed: 3,
      distanceTravelledKm: 4.23,
      routesChanged: 5,
      courierName: "Neetika Goel",
      saboteurName: "Santosh Shedbalkar",
      hurdleCounts: {
        redTrafficLight: 3,
        roadBlock: 2,
        construction: 2,
        trafficJam: 1,
        closedGate: 1,
        wrongDirectionSign: 0,
      },
    };
  },
};

function goToLanding(): void {
  void pageMount(() =>
    mountLandingPage(appRoot, {
      goToLogin,
      goToRegister,
      goToGuest,
    })
  );
}

function goToAuthLoading(): void {
  void pageMount(() =>
    mountAuthLoadingPage(appRoot, {
      authApi: fakeAuthApi,
      profileApi: fakeProfileApi,
      actions: {
        goToHome,
        goToLanding,
      },
    })
  );
}

function goToMatchWaiting(
  matchId: string,
  setupData: {
    assignedRole: string;
    rolePreference: string;
    difficulty: string;
    mapId: string;
    mapName: string;
    mapVersion: string;
    mapGenerationVersion: string;
  }
): void {
  currentMatchAssignedRole = setupData.assignedRole === "saboteur" ? "saboteur" : "courier";
  currentMatchDifficulty = setupData.difficulty;
  currentResultMode = null;

  void pageMount(() =>
    mountMatchWaitingPage(appRoot, {
      launchData: {
        matchId,
        assignedRole: setupData.assignedRole,
        rolePreference: setupData.rolePreference,
        difficulty: setupData.difficulty,
        mapId: setupData.mapId,
        mapName: setupData.mapName,
        mapVersion: setupData.mapVersion,
        mapGenerationVersion: setupData.mapGenerationVersion,
        estimatedWaitSeconds: 3,
        playerName: "Neetika Goel",
      },
      actions: {
        goToHome,
        goToMatchLoading,
      },
    })
  );
}

function goToMatchLoading(loadingData: MatchWaitingPageToLoadingData | string): void {
  const matchId = typeof loadingData === "string" ? loadingData : loadingData.matchId;

  if (typeof loadingData !== "string") {
    currentMatchAssignedRole = loadingData.assignedRole;
    currentMatchDifficulty = loadingData.difficulty;
  }

  void pageMount(() =>
    mountMatchLoadingPage(appRoot, {
      matchId,
      matchApi: mapPreviewMatchApi,
      actions: {
        goToMatchWaiting: (waitingMatchId) => {
          goToMatchWaiting(String(waitingMatchId), {
            assignedRole: currentMatchAssignedRole,
            rolePreference: currentMatchAssignedRole,
            difficulty: currentMatchDifficulty,
            mapId: "neo-city",
            mapName: "Neo City",
            mapVersion: "v1",
            mapGenerationVersion: "city_map_generation_v7",
          });
        },
        goToMatchGame,
        goToDisconnected: goToMatchDisconnected,
      },
    })
  );
}

function goToMatchGame(matchId: string | number, mapPayload: unknown, matchState: unknown): void {
  currentMatchStartedAtMs = Date.now();
  currentMatchStateVersion = 1;
  currentResultMode = null;

  void pageMount(async () => {
    const cleanup = await mountMatchGamePage(appRoot, {
      matchId,
      mapPayload,
      initialMatchState: matchState,
      pollIntervalMs: 500,
      matchApi: mapPreviewMatchApi,
      gameController: new PhaserMatchGameController(),
      actions: {
        goToResult: goToMatchResult,
        goToDisconnected: goToMatchDisconnected,
      },
    });

    const drawButtonList = Array.from(appRoot.querySelectorAll<HTMLButtonElement>("[data-match-draw-button]"));

    const onDrawClick = (): void => {
      currentResultMode = "drawAgreement";
      goToMatchResult(matchId);
    };

    drawButtonList.forEach((button) => button.addEventListener("click", onDrawClick));

    return () => {
      drawButtonList.forEach((button) => button.removeEventListener("click", onDrawClick));
      cleanup();
    };
  });
}

function goToMatchResult(matchId: string | number): void {
  if (currentResultMode === null) {
    currentResultMode = "courierDelivered";
  }

  void pageMount(() =>
    mountMatchResultPage(appRoot, {
      matchId,
      matchApi: mapPreviewMatchApi,
      sessionType: "guest",
      actions: {
        goToHome,
        playAgain: goToHome,
        exitMatch: goToLanding,
      },
    })
  );
}

function goToMatchDisconnected(matchId: string | number): void {
  void pageMount(() =>
    mountMatchDisconnectedPage(appRoot, {
      matchId,
      actions: {
        retryMatch: (retryMatchId) => {
          goToMatchLoading(String(retryMatchId));
        },
        goToHome: goToHome,
      },
    })
  );
}

function goToLogin(): void {
  void pageMount(() =>
    mountLoginPage(appRoot, {
      authApi: fakeAuthApi,
      actions: {
        goToHome,
        goToLanding,
        goToRegister,
        goToGuest,
      },
    })
  );
}

function goToRegister(): void {
  void pageMount(() =>
    mountRegisterPage(appRoot, {
      authApi: fakeAuthApi,
      actions: {
        goToHome,
        goToLanding,
        goToLogin,
        goToGuest,
      },
    })
  );
}

function goToGuest(): void {
  void pageMount(() =>
    mountGuestEntryPage(appRoot, {
      authApi: fakeAuthApi,
      actions: {
        goToHome,
        goToLanding,
        goToLogin,
        goToRegister,
      },
    })
  );
}

function goToHome(): void {
  void pageMount(() =>
    mountHomeSetupPage(appRoot, {
      profileApi: fakeProfileApi,
      matchApi: fakeMatchApi,
      actions: {
        goToLanding,
        goToMatchWaiting,
        goToMatchLoading: (matchId) => {
          goToMatchLoading(matchId);
        },
      },
    })
  );
}

goToAuthLoading();