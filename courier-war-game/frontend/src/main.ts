import { mountLandingPage } from "./pages/landing/LandingPage";
import { mountLoginPage } from "./pages/auth/login/LoginPage";
import { mountRegisterPage } from "./pages/auth/register/RegisterPage";
import { mountGuestEntryPage } from "./pages/auth/guest/GuestEntryPage";
import { mountHomeSetupPage } from "./pages/home/HomeSetupPage";

const appRootElement = document.querySelector<HTMLDivElement>("#app");

if (appRootElement === null) {
  throw new Error("App root not found");
}

const appRoot: HTMLDivElement = appRootElement;

let currentCleanup: (() => void) | null = null;

async function pageMount(mountFunction: () => Promise<() => void>): Promise<void> {
  currentCleanup?.();
  currentCleanup = await mountFunction();
}

const fakeAuthApi = {
  login: async (_payload: { identifier: string; password: string }): Promise<void> => {
    console.log("fake login", _payload);
  },

  register: async (_payload: { username: string; email: string; password: string; name?: string; preferredRole: string }): Promise<void> => {
    console.log("fake register", _payload);
  },

  guest: async (_payload: { name?: string }): Promise<void> => {
    console.log("fake guest", _payload);
  },

  logout: async (): Promise<void> => {
    console.log("fake logout");
  },

  forgetGuest: async (): Promise<void> => {
    console.log("fake forget guest");
  },
};

const fakeProfileApi = {
  getProfile: async () => ({
    user: {
      username: "guest_demo",
      name: "Guest Demo",
      isGuest: true,
    },
    stats: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      courierMatches: 0,
      courierWins: 0,
      saboteurMatches: 0,
      saboteurWins: 0,
      fastestDeliveryMs: null,
      bestSaboteurDelayMs: null,
    },
  }),
};

const fakeMatchApi = {
  createMatch: async (_payload: { difficulty: string; rolePreference: string }) => ({
    matchId: 1,
    status: "waiting" as const,
    assignedRole: "courier" as const,
  }),
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

function goToLogin(): void {
  void pageMount(() =>
    mountLoginPage(appRoot, {
      authApi: fakeAuthApi,
      actions: {
        goToHome,
        goToLanding,
        goToRegister,
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
      },
    })
  );
}

function goToHome(): void {
  void pageMount(() =>
    mountHomeSetupPage(appRoot, {
      profileApi: fakeProfileApi,
      matchApi: fakeMatchApi,
      authApi: fakeAuthApi,
      actions: {
        goToLanding,
        goToMatchWaiting: (matchId: number) => console.log("waiting match", matchId),
        goToMatchLoading: (matchId: number) => console.log("loading match", matchId),
      },
    })
  );
}

goToLanding();