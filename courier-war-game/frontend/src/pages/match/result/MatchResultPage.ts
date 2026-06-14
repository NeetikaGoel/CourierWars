import "./MatchResultPage.css";
import matchResultPageHtml from "./MatchResultPage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface MatchResultData {
  matchId?: string | number;
  winnerRole?: "courier" | "saboteur" | "draw";
  endReason?: string;
  difficulty?: string;
  matchTimeMs?: number;
  timeRemainingMs?: number;
  courierLivesRemaining?: number;
  deliveryProgressPct?: number;
  obstacleEnergySpent?: number;
  obstacleEnergyRemaining?: number;
  obstacleEnergyMax?: number;
  hurdlesActivated?: number;
  successfulDelays?: number;
  mostUsedHurdle?: string;
  longestActiveHurdleMs?: number;
  predictionAccuracyPct?: number;
  abilitiesUsed?: number;
  distanceTravelledKm?: number;
  routesChanged?: number;
  courierName?: string;
  saboteurName?: string;
  hurdleCounts?: {
    redTrafficLight?: number;
    roadBlock?: number;
    construction?: number;
    trafficJam?: number;
    closedGate?: number;
    wrongDirectionSign?: number;
  };
}

export interface MatchResultPageDependencies {
  matchId: string | number;
  matchApi: {
    getResult: (matchId: string | number) => Promise<MatchResultData>;
  };
  actions: {
    goToHome: () => void;
    playAgain: () => void;
    exitMatch?: () => void;
  };
  sessionType?: "guest" | "registered";
}

function textSet(root: HTMLElement, selector: string, value: string): void {
  // this updates a field only when the template has it
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function numberGet(value: unknown, fallbackValue: number): number {
  // this keeps result rendering safe while backend response is still changing
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallbackValue;
}

function stringGet(value: unknown, fallbackValue: string): string {
  // this keeps result rendering safe while backend response is still changing
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return fallbackValue;
}

function timeTextGet(milliseconds: number): string {
  // this converts milliseconds into mm:ss
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function livesTextGet(lives: number): string {
  // this renders hearts for courier remaining lives
  const safeLives = Math.max(0, Math.min(3, Math.round(lives)));

  if (safeLives === 0) {
    return "0";
  }

  return Array.from({ length: safeLives }, () => "♥").join(" ");
}

function reasonTextGet(endReason: string): string {
  // this turns backend reason codes into readable result copy
  if (endReason === "delivered") {
    return "Package delivered successfully";
  }

  if (endReason === "timerExpired") {
    return "Timer reached zero";
  }

  if (endReason === "courierLivesZero") {
    return "Courier lives reached zero";
  }

  if (endReason === "drawAgreement") {
    return "Both players agreed to draw";
  }

  if (endReason === "draw") {
    return "Match ended in a draw";
  }

  return endReason || "Match completed";
}

function pageThemeApply(root: HTMLElement, winnerRole: string): void {
  // this switches result styling for normal win or draw
  const page = root.querySelector<HTMLElement>("[data-match-result-page]");

  if (!page) {
    return;
  }

  page.classList.toggle("match-result-page-draw", winnerRole === "draw");
  page.classList.toggle("match-result-page-courier-win", winnerRole === "courier");
  page.classList.toggle("match-result-page-saboteur-win", winnerRole === "saboteur");
}

function resultRender(root: HTMLElement, matchId: string | number, result: MatchResultData): void {
  // this reads safe values from backend result payload
  const winnerRole = stringGet(result.winnerRole, "courier");
  const endReason = stringGet(result.endReason, "delivered");
  const matchTimeMs = numberGet(result.matchTimeMs, 300000);
  const timeRemainingMs = numberGet(result.timeRemainingMs, 12000);
  const lives = numberGet(result.courierLivesRemaining, 3);
  const deliveryProgress = numberGet(result.deliveryProgressPct, winnerRole === "saboteur" ? 78 : 100);
  const energySpent = numberGet(result.obstacleEnergySpent, 120);
  const energyRemaining = numberGet(result.obstacleEnergyRemaining, 80);
  const energyMax = numberGet(result.obstacleEnergyMax, energySpent + energyRemaining);
  const hurdlesActivated = numberGet(result.hurdlesActivated, 9);
  const successfulDelays = numberGet(result.successfulDelays, 6);
  const predictionAccuracy = numberGet(result.predictionAccuracyPct, 68);
  const abilitiesUsed = numberGet(result.abilitiesUsed, 3);
  const distanceTravelled = numberGet(result.distanceTravelledKm, 4.23);
  const routesChanged = numberGet(result.routesChanged, 5);
  const longestHurdleMs = numberGet(result.longestActiveHurdleMs, 18000);
  const mostUsedHurdle = stringGet(result.mostUsedHurdle, "Traffic Light");

  pageThemeApply(root, winnerRole);

  textSet(root, "[data-result-match-id]", `CW-${String(result.matchId ?? matchId).toUpperCase()}`);
  textSet(root, "[data-result-match-time]", timeTextGet(matchTimeMs));

  textSet(root, "[data-result-courier-name]", stringGet(result.courierName, "Neetika Goel"));
  textSet(root, "[data-result-saboteur-name]", stringGet(result.saboteurName, "Santosh Shedbalkar"));

  if (winnerRole === "draw") {
    textSet(root, "[data-result-courier-headline]", "Courier Draws");
    textSet(root, "[data-result-saboteur-headline]", "Saboteur Draws");
    textSet(root, "[data-result-courier-subtitle]", reasonTextGet(endReason));
    textSet(root, "[data-result-saboteur-subtitle]", reasonTextGet(endReason));
    textSet(root, "[data-result-courier-ribbon]", "Draw");
    textSet(root, "[data-result-saboteur-ribbon]", "Draw");
  } else if (winnerRole === "saboteur") {
    textSet(root, "[data-result-courier-headline]", "Courier Loses!");
    textSet(root, "[data-result-saboteur-headline]", "Saboteur Wins!");
    textSet(root, "[data-result-courier-subtitle]", reasonTextGet(endReason));
    textSet(root, "[data-result-saboteur-subtitle]", "Delivery stopped successfully");
    textSet(root, "[data-result-courier-ribbon]", "Runner-Up");
    textSet(root, "[data-result-saboteur-ribbon]", "Winner");
  } else {
    textSet(root, "[data-result-courier-headline]", "Courier Wins!");
    textSet(root, "[data-result-saboteur-headline]", "Saboteur Loses!");
    textSet(root, "[data-result-courier-subtitle]", reasonTextGet(endReason));
    textSet(root, "[data-result-saboteur-subtitle]", "Delivery completed before timeout");
    textSet(root, "[data-result-courier-ribbon]", "Winner");
    textSet(root, "[data-result-saboteur-ribbon]", "Runner-Up");
  }

  textSet(root, "[data-result-time-remaining]", timeTextGet(timeRemainingMs));
  textSet(root, "[data-result-delivery-progress]", `${Math.round(deliveryProgress)}%`);
  textSet(root, "[data-result-lives]", livesTextGet(lives));
  textSet(root, "[data-result-abilities-used]", String(Math.round(abilitiesUsed)));
  textSet(root, "[data-result-distance]", `${distanceTravelled.toFixed(2)} km`);
  textSet(root, "[data-result-routes-changed]", String(Math.round(routesChanged)));

  textSet(root, "[data-result-hurdles-activated]", String(Math.round(hurdlesActivated)));
  textSet(root, "[data-result-energy-used]", `${Math.round(energySpent)} / ${Math.round(energyMax)}`);
  textSet(root, "[data-result-successful-delays]", String(Math.round(successfulDelays)));
  textSet(root, "[data-result-most-used-hurdle]", mostUsedHurdle);
  textSet(root, "[data-result-longest-hurdle]", timeTextGet(longestHurdleMs));
  textSet(root, "[data-result-prediction]", `${Math.round(predictionAccuracy)}%`);

  textSet(root, "[data-result-traffic-light-count]", String(result.hurdleCounts?.redTrafficLight ?? 3));
  textSet(root, "[data-result-road-block-count]", String(result.hurdleCounts?.roadBlock ?? 2));
  textSet(root, "[data-result-construction-count]", String(result.hurdleCounts?.construction ?? 2));
  textSet(root, "[data-result-traffic-jam-count]", String(result.hurdleCounts?.trafficJam ?? 1));
  textSet(root, "[data-result-closed-gate-count]", String(result.hurdleCounts?.closedGate ?? 1));
  textSet(root, "[data-result-wrong-direction-count]", String(result.hurdleCounts?.wrongDirectionSign ?? 0));
}

export async function mountMatchResultPage(root: HTMLElement, deps: MatchResultPageDependencies): Promise<() => void> {
  root.innerHTML = matchResultPageHtml;

  const playAgainButton = root.querySelector<HTMLButtonElement>("[data-play-again-button]");
  const homeButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-home-button]"));
  const exitButton = root.querySelector<HTMLButtonElement>("[data-exit-button]");

  if (exitButton) {
    exitButton.textContent = deps.sessionType === "registered" ? "⇥ Logout" : "⇥ Forget Session";
  }

  try {
    pageLoadingSet(root, true, "Loading result...");
    resultRender(root, deps.matchId, await deps.matchApi.getResult(deps.matchId));
  } catch (errorObject) {
    pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Result loading failed");

    resultRender(root, deps.matchId, {
      matchId: deps.matchId,
      winnerRole: "courier",
      endReason: "delivered",
    });
  } finally {
    pageLoadingSet(root, false);
  }

  playAgainButton?.addEventListener("click", deps.actions.playAgain);
  homeButtonList.forEach((button) => button.addEventListener("click", deps.actions.goToHome));
  exitButton?.addEventListener("click", deps.actions.exitMatch ?? deps.actions.goToHome);

  return () => {
    playAgainButton?.removeEventListener("click", deps.actions.playAgain);
    homeButtonList.forEach((button) => button.removeEventListener("click", deps.actions.goToHome));
    exitButton?.removeEventListener("click", deps.actions.exitMatch ?? deps.actions.goToHome);
  };
}