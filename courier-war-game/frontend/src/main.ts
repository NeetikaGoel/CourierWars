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
import { pageErrorShow } from "./pages/shared/PageErrorBox";
import { mapApi } from "./common/api/MapApi";
import { authApi } from "./common/api/AuthApi";
import { profileApi } from "./common/api/ProfileApi";
import { matchApi } from "./common/api/MatchApi";
import { PhaserMatchGameController } from "./game/v7/scene/PhaserMatchGameController";

const appRootElement = document.querySelector<HTMLDivElement>("#app");

if (appRootElement === null) {
  throw new Error("App root not found");
}

const appRoot: HTMLDivElement = appRootElement;

type PrototypeRole = "courier" | "saboteur";
type CurrentProfile = Awaited<ReturnType<typeof profileApi.getProfile>>;
type SessionType = "guest" | "registered";

let currentCleanup: (() => void) | null = null;
let currentProfile: CurrentProfile | null = null;
let currentMatchAssignedRole: PrototypeRole = "courier";
let currentMatchDifficulty = "medium";

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

// this connects the home page start button to backend matchmaking
const homeMatchApi = {
  create: async (payload: {
    difficulty: string;
    rolePreference: string;
    mapVersion: string;
    mapGenerationVersion: string;
  }) => {
    const state = await matchApi.create(payload);

    currentMatchAssignedRole = state.assignedRole === "saboteur" ? "saboteur" : "courier";
    currentMatchDifficulty = state.difficulty ?? payload.difficulty;

    return {
      matchId: String(state.matchId),
      status: state.status,
      assignedRole: currentMatchAssignedRole,
    };
  },
};

// this gives match pages the backend calls in the shapes they expect
const backendMatchApi = {
  getMatchMap: async (matchId: string | number): Promise<unknown> => {
    // the map is generated from the match seed, the response is gzipped and cached by the browser
    const state = await matchApi.stateGet(matchId, 0);

    return mapApi.previewMapGet({ seed: state.mapSeed });
  },

  getMatchState: (matchId: string | number, knownVersion: number) => matchApi.stateGet(matchId, knownVersion),

  sendCourierSteps: (matchId: string | number, stepList: { seq: number; x: number; y: number }[], lives: number) =>
    matchApi.movesSend(matchId, stepList, lives),

  placeHurdle: (matchId: string | number, hurdleType: string, tilePointList: { x: number; y: number }[], durationMs?: number) =>
    matchApi.hurdlePlace(matchId, hurdleType, tilePointList, durationMs),

  clockOffsetMsGet: () => matchApi.clockOffsetMsGet(),

  getResult: (matchId: string | number): Promise<MatchResultData> => matchApi.resultGet(matchId),
};

// this leaves a match on the backend so the opponent screen ends too, failures are ignored
async function matchLeave(matchId: string | number): Promise<void> {
  if (!matchApi.playerTokenKnownCheck(matchId)) {
    return;
  }

  try {
    await matchApi.cancel(matchId);
  } catch {
    // the match may already be over or gone
  }
}

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
      matchApi: {
        getState: (waitingMatchId: string, knownVersion: number) => matchApi.stateGet(waitingMatchId, knownVersion),
        cancelMatch: async (waitingMatchId: string) => {
          await matchApi.cancel(waitingMatchId);
        },
      },
      actions: {
        goToHome: () => {
          void matchLeave(matchId);
          goToHome();
        },
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
      matchApi: backendMatchApi,
      actions: {
        cancelSearch: () => {
          void matchLeave(matchId);
          goToHome();
        },
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
  // this tells the backend the map is loaded, the timer starts once both players are ready
  void matchApi.ready(matchId).catch(() => {
    // the backend starts the match anyway after a short wait
  });

  void pageMount(async () => {
    const cleanup = await mountMatchGamePage(appRoot, {
      matchId,
      mapPayload,
      initialMatchState: matchState,
      pollIntervalMs: 500,
      matchApi: backendMatchApi,
      gameController: new PhaserMatchGameController(),
      actions: {
        goToResult: goToMatchResult,
        goToDisconnected: goToMatchDisconnected,
        leaveMatch: (leftMatchId) => {
          void matchLeave(leftMatchId).then(() => goToMatchResult(leftMatchId));
        },
      },
    });

    textSet("[data-match-player-name]", currentPlayerNameGet());

    const drawButtonList = Array.from(appRoot.querySelectorAll<HTMLButtonElement>("[data-match-draw-button]"));

    const onDrawClick = (): void => {
      // the first offer waits for the opponent, an offer that answers theirs ends the match for both
      void matchApi
        .drawOffer(matchId)
        .then(() => {
          pageErrorShow(appRoot, "Draw offered. The match ends as a draw if your opponent accepts.");
        })
        .catch((errorObject: unknown) => {
          pageErrorShow(appRoot, errorObject instanceof Error ? errorObject.message : "Draw offer failed");
        });
    };

    drawButtonList.forEach((button) => button.addEventListener("click", onDrawClick));

    return () => {
      drawButtonList.forEach((button) => button.removeEventListener("click", onDrawClick));
      cleanup();
    };
  });
}

function goToMatchResult(matchId: string | number): void {
  void pageMount(async () => {
    const cleanup = await mountMatchResultPage(appRoot, {
      matchId,
      matchApi: backendMatchApi,
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
      matchApi: homeMatchApi,
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