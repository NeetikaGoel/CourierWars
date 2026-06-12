import "./MatchGamePage.css";
import matchGamePageHtml from "./MatchGamePage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";

export interface MatchGamePageGameController {
  start: (payload: { container: HTMLElement; hud: HTMLElement; matchId: number; mapPayload: unknown; matchState: unknown }) => void;
  applyState: (matchState: unknown) => void;
  stop: () => void;
}

export interface MatchGamePageDependencies {
  matchId: number;
  mapPayload: unknown;
  initialMatchState: unknown;
  pollIntervalMs: number;
  matchApi: {
    getMatchState: (matchId: number, knownVersion: number) => Promise<{ status: string; stateVersion?: number; timerRemainingMs?: number }>;
  };
  gameController: MatchGamePageGameController;
  actions: {
    goToResult: (matchId: number) => void;
    goToDisconnected: (matchId: number) => void;
  };
}

export async function mountMatchGamePage(root: HTMLElement, deps: MatchGamePageDependencies): Promise<() => void> {
  root.innerHTML = matchGamePageHtml;

  let knownVersion = 0;
  let intervalId = 0;

  const container = root.querySelector<HTMLElement>("[data-phaser-container]");
  const hud = root.querySelector<HTMLElement>("[data-match-hud]");
  const statusBox = root.querySelector<HTMLElement>("[data-match-status]");
  const timerBox = root.querySelector<HTMLElement>("[data-match-timer]");
  const versionBox = root.querySelector<HTMLElement>("[data-match-version]");

  if (!container || !hud) {
    throw new Error("Match game container missing");
  }

  deps.gameController.start({
    container,
    hud,
    matchId: deps.matchId,
    mapPayload: deps.mapPayload,
    matchState: deps.initialMatchState,
  });

  const poll = async (): Promise<void> => {
    try {
      const state = await deps.matchApi.getMatchState(deps.matchId, knownVersion);
      knownVersion = state.stateVersion ?? knownVersion;

      deps.gameController.applyState(state);

      if (statusBox) {
        statusBox.textContent = `Status: ${state.status}`;
      }

      if (timerBox) {
        timerBox.textContent = String(state.timerRemainingMs ?? "--");
      }

      if (versionBox) {
        versionBox.textContent = String(knownVersion);
      }

      if (state.status === "completed" || state.status === "draw") {
        deps.actions.goToResult(deps.matchId);
      }
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Match state lost");
      deps.actions.goToDisconnected(deps.matchId);
    }
  };

  intervalId = window.setInterval(() => void poll(), deps.pollIntervalMs);
  void poll();

  return () => {
    window.clearInterval(intervalId);
    deps.gameController.stop();
  };
}