import "./MatchWaitingPage.css";
import matchWaitingPageHtml from "./MatchWaitingPage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";

export interface MatchWaitingPageDependencies {
  matchId: number;
  pollIntervalMs: number;
  matchApi: {
    getMatchState: (matchId: number, knownVersion: number) => Promise<{ status: string; stateVersion?: number }>;
    startMatch: (matchId: number) => Promise<void>;
  };
  actions: {
    goToHome: () => void;
    goToMatchLoading: (matchId: number) => void;
  };
}

export async function mountMatchWaitingPage(root: HTMLElement, deps: MatchWaitingPageDependencies): Promise<() => void> {
  root.innerHTML = matchWaitingPageHtml;

  let knownVersion = 0;
  let intervalId = 0;

  const homeButton = root.querySelector<HTMLButtonElement>("[data-home-button]");
  const meta = root.querySelector<HTMLElement>("[data-match-waiting-meta]");

  const poll = async (): Promise<void> => {
    try {
      const state = await deps.matchApi.getMatchState(deps.matchId, knownVersion);
      knownVersion = state.stateVersion ?? knownVersion;

      if (meta) {
        meta.textContent = `Status: ${state.status}`;
      }

      if (state.status === "ready") {
        await deps.matchApi.startMatch(deps.matchId);
        deps.actions.goToMatchLoading(deps.matchId);
      }

      if (state.status === "active") {
        deps.actions.goToMatchLoading(deps.matchId);
      }
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Waiting poll failed");
    }
  };

  intervalId = window.setInterval(() => void poll(), deps.pollIntervalMs);
  void poll();

  homeButton?.addEventListener("click", deps.actions.goToHome);

  return () => {
    window.clearInterval(intervalId);
    homeButton?.removeEventListener("click", deps.actions.goToHome);
  };
}