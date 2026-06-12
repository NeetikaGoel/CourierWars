import "./MatchResultPage.css";
import matchResultPageHtml from "./MatchResultPage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface MatchResultData {
  winnerRole: "courier" | "saboteur";
  endReason: string;
  difficulty: string;
  timeRemainingMs: number;
  courierLivesRemaining: number;
  deliveryProgressPct: number;
  obstacleEnergySpent: number;
  obstacleEnergyRemaining: number;
}

export interface MatchResultPageDependencies {
  matchId: number;
  matchApi: { getResult: (matchId: number) => Promise<MatchResultData> };
  actions: {
    goToHome: () => void;
    playAgain: () => void;
  };
}

export async function mountMatchResultPage(root: HTMLElement, deps: MatchResultPageDependencies): Promise<() => void> {
  root.innerHTML = matchResultPageHtml;

  const playAgainButton = root.querySelector<HTMLButtonElement>("[data-play-again-button]");
  const homeButton = root.querySelector<HTMLButtonElement>("[data-home-button]");

  const renderResult = (result: MatchResultData): void => {
    const title = root.querySelector<HTMLElement>("[data-result-title]");
    const reason = root.querySelector<HTMLElement>("[data-result-reason]");
    const difficulty = root.querySelector<HTMLElement>("[data-result-difficulty]");
    const time = root.querySelector<HTMLElement>("[data-result-time]");
    const lives = root.querySelector<HTMLElement>("[data-result-lives]");
    const progress = root.querySelector<HTMLElement>("[data-result-progress]");
    const energySpent = root.querySelector<HTMLElement>("[data-result-energy-spent]");
    const energyLeft = root.querySelector<HTMLElement>("[data-result-energy-left]");

    if (title) title.textContent = `${result.winnerRole.toUpperCase()} Wins`;
    if (reason) reason.textContent = result.endReason;
    if (difficulty) difficulty.textContent = result.difficulty;
    if (time) time.textContent = `${result.timeRemainingMs} ms`;
    if (lives) lives.textContent = String(result.courierLivesRemaining);
    if (progress) progress.textContent = `${result.deliveryProgressPct}%`;
    if (energySpent) energySpent.textContent = String(result.obstacleEnergySpent);
    if (energyLeft) energyLeft.textContent = String(result.obstacleEnergyRemaining);
  };

  try {
    pageLoadingSet(root, true, "Loading result...");
    renderResult(await deps.matchApi.getResult(deps.matchId));
  } catch (errorObject) {
    pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Result loading failed");
  } finally {
    pageLoadingSet(root, false);
  }

  playAgainButton?.addEventListener("click", deps.actions.playAgain);
  homeButton?.addEventListener("click", deps.actions.goToHome);

  return () => {
    playAgainButton?.removeEventListener("click", deps.actions.playAgain);
    homeButton?.removeEventListener("click", deps.actions.goToHome);
  };
}