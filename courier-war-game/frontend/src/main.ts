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
import { mountMatchResultPage } from "./pages/match/result/MatchResultPage";
import { authApi } from "./common/api/AuthApi";
import { profileApi } from "./common/api/ProfileApi";
import { matchApi as backendMatchApi } from "./common/api/MatchApi";
import { PhaserMatchGameController } from "./game/v7/scene/PhaserMatchGameController";
import type { ApiClientRequestOptions } from "./common/api/ApiClient";

const appRootElement = document.querySelector<HTMLDivElement>("#app");

if (appRootElement === null) {
  throw new Error("App root not found");
}

const appRoot: HTMLDivElement = appRootElement;

type PlayableRole = "courier" | "saboteur";
type CurrentProfile = Awaited<ReturnType<typeof profileApi.getProfile>>;
type SessionType = "guest" | "registered";

interface MatchSetupRouteData {
  assignedRole: string;
  opponentRole?: string;
  rolePreference: string;
  difficulty: string;
  mapId: string;
  mapName: string;
  mapVersion: string;
  mapGenerationVersion: string;
  stateVersion?: number;
}

const HOME_MAP_VERSION = "v1";
const HOME_MAP_GENERATION_VERSION = "city_map_generation_v7";
const HOME_MAP_ID = "neo-city";
const HOME_MAP_NAME = "Neo City";

let currentCleanup: (() => void) | null = null;
let currentProfile: CurrentProfile | null = null;
let currentMatchAssignedRole: PlayableRole = "courier";
let currentMatchDifficulty = "medium";
let currentMatchSetupData: MatchWaitingPageToLoadingData | null = null;

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

function oppositeRoleGet(role: PlayableRole): PlayableRole {
  return role === "courier" ? "saboteur" : "courier";
}

function playableRoleFromValueGet(value: string | undefined): PlayableRole {
  return value === "saboteur" ? "saboteur" : "courier";
}

function optionalPlayableRoleFromValueGet(value: string | undefined): PlayableRole | null {
  if (value === "courier" || value === "saboteur") {
    return value;
  }

  return null;
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

function setupDataNormalize(matchId: string | number, setupData: MatchSetupRouteData): MatchWaitingPageToLoadingData {
  const assignedRole = playableRoleFromValueGet(setupData.assignedRole);
  const opponentRole = optionalPlayableRoleFromValueGet(setupData.opponentRole) ?? oppositeRoleGet(assignedRole);

  return {
    matchId: String(matchId),
    assignedRole,
    opponentRole,
    rolePreference: setupData.rolePreference,
    difficulty: setupData.difficulty,
    mapId: setupData.mapId,
    mapName: setupData.mapName,
    mapVersion: setupData.mapVersion,
    mapGenerationVersion: setupData.mapGenerationVersion,
    stateVersion: setupData.stateVersion ?? 0,
  };
}

function matchWaitingFallbackDataGet(
  matchId: string | number,
  assignedRole: PlayableRole,
  opponentRole: PlayableRole
): MatchWaitingPageToLoadingData {
  return {
    matchId: String(matchId),
    assignedRole,
    opponentRole,
    rolePreference: currentMatchSetupData?.rolePreference ?? assignedRole,
    difficulty: currentMatchSetupData?.difficulty ?? currentMatchDifficulty,
    mapId: currentMatchSetupData?.mapId ?? HOME_MAP_ID,
    mapName: currentMatchSetupData?.mapName ?? HOME_MAP_NAME,
    mapVersion: currentMatchSetupData?.mapVersion ?? HOME_MAP_VERSION,
    mapGenerationVersion: currentMatchSetupData?.mapGenerationVersion ?? HOME_MAP_GENERATION_VERSION,
    stateVersion: currentMatchSetupData?.stateVersion ?? 0,
  };
}

const trackedProfileApi = {
  getProfile: async (options: ApiClientRequestOptions = {}): Promise<CurrentProfile> => {
    currentProfile = await profileApi.getProfile(options);

    return currentProfile;
  },
};

const trackedAuthApi = {
  login: async (payload: { identifier: string; password: string }): Promise<void> => {
    await authApi.login(payload);
    currentProfile = await trackedProfileApi.getProfile();
  },

  register: async (payload: {
    username: string;
    email: string;
    password: string;
    name?: string;
    preferredRole: string;
  }): Promise<void> => {
    await authApi.register(payload);
    currentProfile = await trackedProfileApi.getProfile();
  },

  guest: async (payload: { name?: string }): Promise<void> => {
    await authApi.guest(payload);
    currentProfile = await trackedProfileApi.getProfile();
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

const trackedMatchApi = {
  ...backendMatchApi,

  create: async (payload: {
    difficulty: string;
    rolePreference: string;
    mapVersion: string;
    mapGenerationVersion: string;
  }) => {
    const response = await backendMatchApi.create(payload);

    currentMatchAssignedRole = playableRoleFromValueGet(response.assignedRole);
    currentMatchDifficulty = response.difficulty || payload.difficulty;

    currentMatchSetupData = setupDataNormalize(response.matchId, {
      assignedRole: response.assignedRole,
      opponentRole: response.opponentRole,
      rolePreference: payload.rolePreference,
      difficulty: response.difficulty || payload.difficulty,
      mapId: HOME_MAP_ID,
      mapName: HOME_MAP_NAME,
      mapVersion: response.mapVersion || payload.mapVersion,
      mapGenerationVersion: response.mapGenerationVersion || payload.mapGenerationVersion,
      stateVersion: response.stateVersion ?? 0,
    });

    return response;
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
    currentMatchSetupData = null;
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

function goToMatchWaiting(matchId: string, setupData: MatchSetupRouteData): void {
  const waitingData = setupDataNormalize(matchId, setupData);

  currentMatchSetupData = waitingData;
  currentMatchAssignedRole = waitingData.assignedRole;
  currentMatchDifficulty = waitingData.difficulty;

  void pageMount(async () => {
    const cleanup = await mountMatchWaitingPage(appRoot, {
      launchData: {
        ...waitingData,
        estimatedWaitSeconds: 30,
        playerName: currentPlayerNameGet(),
      },
      matchApi: {
        getState: backendMatchApi.getState,
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

function goToMatchLoading(loadingData: MatchWaitingPageToLoadingData | string | number): void {
  const matchId = typeof loadingData === "object" ? loadingData.matchId : loadingData;

  if (typeof loadingData === "object") {
    currentMatchSetupData = loadingData;
    currentMatchAssignedRole = loadingData.assignedRole;
    currentMatchDifficulty = loadingData.difficulty;
  }

  const assignedRole = currentMatchSetupData?.assignedRole ?? currentMatchAssignedRole;
  const opponentRole = currentMatchSetupData?.opponentRole ?? oppositeRoleGet(assignedRole);

  void pageMount(async () => {
    const cleanup = await mountMatchLoadingPage(appRoot, {
      matchId,
      launchData: {
        assignedRole,
        opponentRole,
        playerName: currentPlayerNameGet(),
        sessionType: currentSessionTypeGet(),
      },
      matchApi: backendMatchApi,
      actions: {
        cancelSearch: goToHome,
        goToMatchWaiting: (waitingMatchId) => {
          const waitingData = matchWaitingFallbackDataGet(waitingMatchId, assignedRole, opponentRole);

          currentMatchSetupData = waitingData;
          goToMatchWaiting(String(waitingMatchId), waitingData);
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
      },
    });

    textSet("[data-match-player-name]", currentPlayerNameGet());

    const sessionCleanup = sessionButtonWire();

    return () => {
      sessionCleanup();
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
        goToResult: goToMatchResult,
        goToHome,
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
      matchApi: trackedMatchApi,
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