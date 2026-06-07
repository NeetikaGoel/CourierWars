import "./MatchDisconnectedPage.css";
import matchDisconnectedPageHtml from "./MatchDisconnectedPage.html?raw";

export interface MatchDisconnectedPageDependencies {
  matchId: number;
  actions: {
    retryMatch: (matchId: number) => void;
    goToHome: () => void;
  };
}

export async function mountMatchDisconnectedPage(root: HTMLElement, deps: MatchDisconnectedPageDependencies): Promise<() => void> {
  root.innerHTML = matchDisconnectedPageHtml;

  const retryButton = root.querySelector<HTMLButtonElement>("[data-retry-button]");
  const homeButton = root.querySelector<HTMLButtonElement>("[data-home-button]");

  const onRetry = (): void => {
    deps.actions.retryMatch(deps.matchId);
  };

  retryButton?.addEventListener("click", onRetry);
  homeButton?.addEventListener("click", deps.actions.goToHome);

  return () => {
    retryButton?.removeEventListener("click", onRetry);
    homeButton?.removeEventListener("click", deps.actions.goToHome);
  };
}