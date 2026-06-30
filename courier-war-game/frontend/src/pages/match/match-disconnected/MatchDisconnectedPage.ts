import "./MatchDisconnectedPage.css";
import matchDisconnectedPageHtml from "./MatchDisconnectedPage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";

export interface MatchDisconnectedPageDependencies {
  matchId: string | number;
  actions: {
    goToResult: (matchId: string | number) => void;
    goToHome: () => void;
  };
}

const DISCONNECTED_RESULT_SECONDS = 5;

function setText(root: HTMLElement, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function setProgress(root: HTMLElement, progress: number): void {
  const fill = root.querySelector<HTMLElement>("[data-disconnected-progress-fill]");

  if (fill) {
    fill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
}

export async function mountMatchDisconnectedPage(root: HTMLElement, deps: MatchDisconnectedPageDependencies): Promise<() => void> {
  root.innerHTML = matchDisconnectedPageHtml;

  const resultButton = root.querySelector<HTMLButtonElement>("[data-result-button]");
  const homeButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-home-button]"));
  const inactiveNavButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-disconnected-inactive-nav]"));

  let disposed = false;
  let secondsRemaining = DISCONNECTED_RESULT_SECONDS;

  const onResult = (): void => {
    deps.actions.goToResult(deps.matchId);
  };

  const onHome = (): void => {
    deps.actions.goToHome();
  };

  const onInactiveNav = (): void => {
    pageErrorShow(root, "This section is not available yet");
  };

  resultButton?.addEventListener("click", onResult);
  homeButtonList.forEach((button) => button.addEventListener("click", onHome));
  inactiveNavButtonList.forEach((button) => button.addEventListener("click", onInactiveNav));

  setText(root, "[data-disconnected-countdown]", String(secondsRemaining).padStart(2, "0"));
  setProgress(root, 100);

  const intervalId = window.setInterval(() => {
    if (disposed) {
      return;
    }

    secondsRemaining -= 1;

    setText(root, "[data-disconnected-countdown]", String(Math.max(0, secondsRemaining)).padStart(2, "0"));
    setProgress(root, (secondsRemaining / DISCONNECTED_RESULT_SECONDS) * 100);

    if (secondsRemaining <= 0) {
      window.clearInterval(intervalId);
      deps.actions.goToResult(deps.matchId);
    }
  }, 1000);

  return () => {
    disposed = true;
    window.clearInterval(intervalId);
    resultButton?.removeEventListener("click", onResult);
    homeButtonList.forEach((button) => button.removeEventListener("click", onHome));
    inactiveNavButtonList.forEach((button) => button.removeEventListener("click", onInactiveNav));
  };
}