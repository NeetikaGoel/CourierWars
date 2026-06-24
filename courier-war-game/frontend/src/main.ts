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
import { authApi } from "./common/api/AuthApi";
import { profileApi } from "./common/api/ProfileApi";
import { PhaserMatchGameController } from "./game/v7/scene/PhaserMatchGameController";

const appRootElement = document.querySelector<HTMLDivElement>("#app");

if (appRootElement === null) {
  throw new Error("App root not found");
}

const appRoot: HTMLDivElement = appRootElement;

type PrototypeRole = "courier" | "saboteur";
type PrototypeResultMode = "courierDelivered" | "saboteurTimeout" | "drawAgreement";
type CurrentProfile = Awaited<ReturnType<typeof profileApi.getProfile>>;
type SessionType = "guest" | "registered";

const MATCH_TIMER_TOTAL_MS = 300000;

let currentCleanup: (() => void) | null = null;
let currentProfile: CurrentProfile | null = null;
let currentMatchAssignedRole: PrototypeRole = "courier";
let currentMatchDifficulty = "medium";
let currentMatchStartedAtMs = Date.now();
let currentMatchStateVersion = 1;
let currentResultMode: PrototypeResultMode | null = null;

async function pageMount(mountFunction: () => Promise<() => void>): Promise<void> {
  currentCleanup?.();
  currentCleanup = await mountFunction();
}

function currentPlayerNameGet(): string {
  return currentProfile?.user.name || currentProfile?.user.username || "Player";
}

function currentSessionTypeGet(): SessionType {
  return currentProfile?.user.isGuest ? "guest" : "registered";
}

function oppositeRoleGet(role: PrototypeRole): PrototypeRole {
  return role === "courier" ? "saboteur" : "courier";
}

function currentParticipantNamesGet(): { courierName: string; saboteurName: string } {
  const playerName = currentPlayerNameGet();

  if (currentMatchAssignedRole === "saboteur") {
    return {
      courierName: "Opponent",
      saboteurName: playerName,
    };
  }

  return {
    courierName: playerName,
    saboteurName: "Opponent",
  };
}

function textSet(selector: string, value: string): void {
  const element = appRoot.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function sessionButtonWire(): () => void {
  const buttonList = Array.from(appRoot.querySelectorAll<HTMLButtonElement>("[data-session-end-button]"));
  const label = currentSessionTypeGet() === "registered" ? "Logout" : "Forget Session";

  const onClick = (): void => {
    void sessionEndAndGoLanding();
  };

  buttonList.forEach((button) => {
    button.textContent = label;
    button.addEventListener("click", onClick);
  });

  return () => {
    buttonList.forEach((button) => {
      button.removeEventListener("click", onClick);
    });
  };
}

function profileHeaderHydrate(): void {
  textSet("[data-current-profile-name]", currentPlayerNameGet());
  textSet("[data-current-profile-status]", currentSessionTypeGet() === "guest" ? "GUEST ONLINE" : "ONLINE");
}

const trackedProfileApi = {
  getProfile: async (): Promise<CurrentProfile> => {
    currentProfile = await profileApi.getProfile();

    return currentProfile;
  },
};

const trackedAuthApi = {
  login: async (payload: { identifier: string; password: string }): Promise<void> => {
    await authApi.login(payload);
    currentProfile = await profileApi.getProfile();
  },

  register: async (payload: {
    username: string;
    email: string;
    password: string;
    name?: string;
    preferredRole: string;
  }): Promise<void> => {
    await authApi.register(payload);
    currentProfile = await profileApi.getProfile();
  },

  guest: async (payload: { name?: string }): Promise<void> => {
    await authApi.guest(payload);
    currentProfile = await profileApi.getProfile();
  },

  refresh: async (): Promise<void> => {
    await authApi.refresh();
  },

  logout: async (): Promise<void> => {
    await authApi.logout();
    currentProfile = null;
  },

  forgetGuest: async (): Promise<void> => {
    await authApi.forgetGuest();
    currentProfile = null;
  },
};

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

const MatchApi = {
  create: async (payload: {
    difficulty: string;
    rolePreference: string;
    mapVersion: string;
    mapGenerationVersion: string;
  }) => {
    currentMatchAssignedRole = payload.rolePreference === "saboteur" ? "saboteur" : "courier";
    currentMatchDifficulty = payload.difficulty;
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

  getMatchState: async (matchId: string | number, _knownVersion: number) => {
    const timerRemainingMs = matchTimerRemainingMsGet();
    const status = currentMatchStatusGet(timerRemainingMs);

    return {
      matchId,
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
      playerName: currentPlayerNameGet(),
    };
  },

  getResult: async (matchId: string | number): Promise<MatchResultData> => {
    const participantNames = currentParticipantNamesGet();

    return {
      matchId,
      winnerRole: currentResultMode === "drawAgreement" ? "draw" : "courier",
      endReason: currentResultMode === "drawAgreement" ? "drawAgreement" : "delivered",
      difficulty: currentMatchDifficulty,
      matchTimeMs: MATCH_TIMER_TOTAL_MS,
      timeRemainingMs: Math.max(12000, matchTimerRemainingMsGet()),
      courierLivesRemaining: 3,
      deliveryProgressPct: currentResultMode === "drawAgreement" ? deliveryProgressGet(matchTimerRemainingMsGet()) : 100,
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
      courierName: participantNames.courierName,
      saboteurName: participantNames.saboteurName,
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

async function sessionEndAndGoLanding(): Promise<void> {
  try {
    if (currentProfile?.user.isGuest) {
      await authApi.forgetGuest();
    } else if (currentProfile) {
      await authApi.logout();
    }
  } catch {
    // ignore auth cleanup failure and still return to landing
  } finally {
    currentProfile = null;
    goToLanding();
  }
}

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
      authApi: trackedAuthApi,
      profileApi: trackedProfileApi,
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

  void pageMount(async () => {
    const cleanup = await mountMatchWaitingPage(appRoot, {
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
        playerName: currentPlayerNameGet(),
      },
      actions: {
        goToHome,
        goToMatchLoading,
      },
    });

    profileHeaderHydrate();
    const sessionCleanup = sessionButtonWire();

    return () => {
      sessionCleanup();
      cleanup();
    };
  });
}

function goToMatchLoading(loadingData: MatchWaitingPageToLoadingData | string): void {
  const matchId = typeof loadingData === "string" ? loadingData : loadingData.matchId;
  const opponentRole = typeof loadingData === "string" ? oppositeRoleGet(currentMatchAssignedRole) : loadingData.opponentRole;

  if (typeof loadingData !== "string") {
    currentMatchAssignedRole = loadingData.assignedRole;
    currentMatchDifficulty = loadingData.difficulty;
  }

  void pageMount(async () => {
    const cleanup = await mountMatchLoadingPage(appRoot, {
      matchId,
      launchData: {
        assignedRole: currentMatchAssignedRole,
        opponentRole,
        playerName: currentPlayerNameGet(),
        sessionType: currentSessionTypeGet(),
      },
      matchApi: mapPreviewMatchApi,
      actions: {
        cancelSearch: goToHome,
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
    });

    profileHeaderHydrate();
    const sessionCleanup = sessionButtonWire();

    return () => {
      sessionCleanup();
      cleanup();
    };
  });
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

    textSet("[data-match-player-name]", currentPlayerNameGet());

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

  void pageMount(async () => {
    const cleanup = await mountMatchResultPage(appRoot, {
      matchId,
      matchApi: mapPreviewMatchApi,
      sessionType: currentSessionTypeGet(),
      currentPlayerName: currentPlayerNameGet(),
      actions: {
        goToHome,
        playAgain: goToHome,
        exitMatch: () => {
          void sessionEndAndGoLanding();
        },
      },
    });

    profileHeaderHydrate();
    const sessionCleanup = sessionButtonWire();

    return () => {
      sessionCleanup();
      cleanup();
    };
  });
}

function goToMatchDisconnected(matchId: string | number): void {
  void pageMount(async () => {
    const cleanup = await mountMatchDisconnectedPage(appRoot, {
      matchId,
      actions: {
        retryMatch: (retryMatchId) => {
          goToMatchLoading(String(retryMatchId));
        },
        goToHome: goToHome,
      },
    });

    textSet("[data-disconnected-profile-name]", currentPlayerNameGet());
    profileHeaderHydrate();
    const sessionCleanup = sessionButtonWire();

    return () => {
      sessionCleanup();
      cleanup();
    };
  });
}

function goToLogin(): void {
  void pageMount(() =>
    mountLoginPage(appRoot, {
      authApi: trackedAuthApi,
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
      authApi: trackedAuthApi,
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
      authApi: trackedAuthApi,
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
  void pageMount(async () => {
    const cleanup = await mountHomeSetupPage(appRoot, {
      profileApi: trackedProfileApi,
      matchApi: MatchApi,
      actions: {
        goToLanding,
        goToMatchWaiting,
        goToMatchLoading: (matchId) => {
          goToMatchLoading(matchId);
        },
      },
    });

    profileHeaderHydrate();
    const sessionCleanup = sessionButtonWire();

    return () => {
      sessionCleanup();
      cleanup();
    };
  });
}

goToAuthLoading();