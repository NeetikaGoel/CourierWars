import "./HomeSetupPage.css";
import homeSetupPageHtml from "./HomeSetupPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../shared/PageErrorBox";
import { pageInputValue } from "../shared/PageFormValidator";
import { pageLoadingSet } from "../shared/PageLoadingSpinner";
import { pageStatsSummaryRender } from "../shared/PageStatsSummary";
import type { PageStatsSummaryData } from "../shared/PageStatsSummary";

export interface HomeProfile {
  user: { name?: string | null; username: string; isGuest: boolean };
  stats: PageStatsSummaryData;
}

export interface HomeMatchResponse {
  matchId: number;
  status: "waiting" | "ready" | "active";
  assignedRole: "courier" | "saboteur";
}

export interface HomeSetupPageDependencies {
  profileApi: { getProfile: () => Promise<HomeProfile> };
  matchApi: { createMatch: (payload: { difficulty: string; rolePreference: string }) => Promise<HomeMatchResponse> };
  authApi: { logout: () => Promise<void>; forgetGuest: () => Promise<void> };
  actions: {
    goToLanding: () => void;
    goToMatchWaiting: (matchId: number) => void;
    goToMatchLoading: (matchId: number) => void;
  };
}

export async function mountHomeSetupPage(root: HTMLElement, deps: HomeSetupPageDependencies): Promise<() => void> {
  root.innerHTML = homeSetupPageHtml;

  const startButton = root.querySelector<HTMLButtonElement>("[data-home-start]");
  const logoutButton = root.querySelector<HTMLButtonElement>("[data-home-logout]");
  const forgetButton = root.querySelector<HTMLButtonElement>("[data-home-forget]");
  const statsBox = root.querySelector<HTMLElement>("[data-home-stats]");
  const nameBox = root.querySelector<HTMLElement>("[data-home-name]");
  const typeBox = root.querySelector<HTMLElement>("[data-home-user-type]");

  const profile = await deps.profileApi.getProfile();

  if (nameBox) {
    nameBox.textContent = profile.user.name || profile.user.username;
  }

  if (typeBox) {
    typeBox.textContent = profile.user.isGuest ? "Guest User" : "Registered User";
  }

  if (statsBox) {
    pageStatsSummaryRender(statsBox, profile.stats);
  }

  if (logoutButton) {
    logoutButton.hidden = profile.user.isGuest;
  }

  if (forgetButton) {
    forgetButton.hidden = !profile.user.isGuest;
  }

  const onStart = async (): Promise<void> => {
    pageErrorClear(root);

    const difficulty = pageInputValue(root, "[data-home-difficulty]");
    const rolePreference = pageInputValue(root, "[data-home-role]");

    try {
      pageLoadingSet(root, true, "Finding match...");
      const match = await deps.matchApi.createMatch({ difficulty, rolePreference });

      if (match.status === "waiting") {
        deps.actions.goToMatchWaiting(match.matchId);
        return;
      }

      deps.actions.goToMatchLoading(match.matchId);
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Matchmaking failed");
    } finally {
      pageLoadingSet(root, false);
    }
  };

  const onLogout = async (): Promise<void> => {
    await deps.authApi.logout();
    deps.actions.goToLanding();
  };

  const onForget = async (): Promise<void> => {
    await deps.authApi.forgetGuest();
    deps.actions.goToLanding();
  };

  startButton?.addEventListener("click", onStart);
  logoutButton?.addEventListener("click", onLogout);
  forgetButton?.addEventListener("click", onForget);

  return () => {
    startButton?.removeEventListener("click", onStart);
    logoutButton?.removeEventListener("click", onLogout);
    forgetButton?.removeEventListener("click", onForget);
  };
}