import "./MatchLoadingPage.css";
import matchLoadingPageHtml from "./MatchLoadingPage.html?raw";
import { FrontendMatchStatusValue } from "../../../constants/FrontendMatchStatusValue";
import { pageErrorShow } from "../../shared/PageErrorBox";

export interface MatchLoadingPageMatchState {
  status?: number;
}

export interface MatchLoadingPageDependencies {
  matchId: string | number;
  matchApi: {
    getMatchMap: (matchId: string | number) => Promise<unknown>;
    getMatchState: (matchId: string | number, knownVersion: number) => Promise<MatchLoadingPageMatchState>;
  };
  actions: {
    goToMatchWaiting: (matchId: string | number) => void;
    goToMatchGame: (matchId: string | number, mapPayload: unknown, matchState: unknown) => void;
    goToDisconnected: (matchId: string | number) => void;
  };
}

const MATCH_LOADING_MIN_VISIBLE_MS = 10000;
const MATCH_LOADING_PHASE_INTERVAL_MS = 1600;
const MATCH_LOADING_FINAL_PAUSE_MS = 320;

const loadingPhaseList = [
  { label: "System Check", progress: 12 },
  { label: "Creating City", progress: 34 },
  { label: "Routes & Zones", progress: 57 },
  { label: "Props & Obstacles", progress: 78 },
  { label: "Optimizing Map", progress: 92 },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function setProgress(root: HTMLElement, progress: number): void {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const fill = root.querySelector<HTMLElement>("[data-loading-progress-fill]");

  if (fill) {
    fill.style.width = `${safeProgress}%`;
  }

  setText(root, "[data-loading-progress-percent]", `${safeProgress}%`);
}

function setActiveStep(root: HTMLElement, stepIndex: number): void {
  root.querySelectorAll<HTMLElement>("[data-loading-step]").forEach((step) => {
    const currentIndex = Number(step.dataset.loadingStep ?? 0);

    step.classList.toggle("match-loading-step-active", currentIndex === stepIndex);
    step.classList.toggle("match-loading-step-complete", currentIndex < stepIndex);
  });

  const phase = loadingPhaseList[Math.min(stepIndex, loadingPhaseList.length - 1)];

  setText(root, "[data-loading-phase-label]", phase.label);
}

export async function mountMatchLoadingPage(root: HTMLElement, deps: MatchLoadingPageDependencies): Promise<() => void> {
  let cancelled = false;
  let phaseIndex = 0;
  const loadingStartedAtMs = Date.now();

  root.innerHTML = matchLoadingPageHtml;

  const homeButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-loading-home-button], [data-loading-home-nav]"));
  const inactiveNavButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-loading-inactive-nav]"));

  const goHome = (): void => {
    deps.actions.goToDisconnected(deps.matchId);
  };

  const showPrototypeMessage = (): void => {
    pageErrorShow(root, "This section is not available in the prototype yet");
  };

  homeButtonList.forEach((button) => button.addEventListener("click", goHome));
  inactiveNavButtonList.forEach((button) => button.addEventListener("click", showPrototypeMessage));

  setProgress(root, 8);
  setActiveStep(root, 0);

  const intervalId = window.setInterval(() => {
    if (cancelled) {
      return;
    }

    phaseIndex = Math.min(phaseIndex + 1, loadingPhaseList.length - 1);
    setActiveStep(root, phaseIndex);
    setProgress(root, loadingPhaseList[phaseIndex].progress);
    setText(root, "[data-loading-estimated-time]", `00:${String(Math.max(1, 8 - phaseIndex * 2)).padStart(2, "0")}`);
  }, MATCH_LOADING_PHASE_INTERVAL_MS);

  const loadMatch = async (): Promise<void> => {
    try {
      const mapPayload = await deps.matchApi.getMatchMap(deps.matchId);
      const matchState = await deps.matchApi.getMatchState(deps.matchId, 0);

      if (cancelled) {
        return;
      }

      const elapsedMs = Date.now() - loadingStartedAtMs;
      const remainingVisibleMs = Math.max(0, MATCH_LOADING_MIN_VISIBLE_MS - elapsedMs);

      if (remainingVisibleMs > 0) {
        await delay(remainingVisibleMs);
      }

      if (cancelled) {
        return;
      }

      setActiveStep(root, 4);
      setProgress(root, 100);
      setText(root, "[data-loading-estimated-time]", "00:00");

      window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        if (matchState.status === FrontendMatchStatusValue.Waiting) {
          deps.actions.goToMatchWaiting(deps.matchId);
          return;
        }

        deps.actions.goToMatchGame(deps.matchId, mapPayload, matchState);
      }, MATCH_LOADING_FINAL_PAUSE_MS);
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
    window.clearInterval(intervalId);
    homeButtonList.forEach((button) => button.removeEventListener("click", goHome));
    inactiveNavButtonList.forEach((button) => button.removeEventListener("click", showPrototypeMessage));
  };
}