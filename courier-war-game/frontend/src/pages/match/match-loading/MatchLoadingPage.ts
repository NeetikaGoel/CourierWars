import "./MatchLoadingPage.css";
import matchLoadingPageHtml from "./MatchLoadingPage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";

export interface MatchLoadingPageDependencies {
  matchId: number;
  matchApi: {
    getMatchMap: (matchId: number) => Promise<unknown>;
    getMatchState: (matchId: number, knownVersion: number) => Promise<{ status: string }>;
  };
  actions: {
    goToMatchWaiting: (matchId: number) => void;
    goToMatchGame: (matchId: number, mapPayload: unknown, matchState: unknown) => void;
    goToDisconnected: (matchId: number) => void;
  };
}

export async function mountMatchLoadingPage(root: HTMLElement, deps: MatchLoadingPageDependencies): Promise<() => void> {
  let cancelled = false;

  root.innerHTML = matchLoadingPageHtml;

  const loadMatch = async (): Promise<void> => {
    try {
      const mapPayload = await deps.matchApi.getMatchMap(deps.matchId);
      const matchState = await deps.matchApi.getMatchState(deps.matchId, 0);

      if (cancelled) {
        return;
      }

      if (matchState.status === "waiting") {
        deps.actions.goToMatchWaiting(deps.matchId);
        return;
      }

      deps.actions.goToMatchGame(deps.matchId, mapPayload, matchState);
    } catch (errorObject) {
      if (!cancelled) {
        pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Match loading failed");
        window.setTimeout(() => deps.actions.goToDisconnected(deps.matchId), 900);
      }
    }
  };

  void loadMatch();

  return () => {
    cancelled = true;
  };
}