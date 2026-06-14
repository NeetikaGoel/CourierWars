import "./MatchWaitingPage.css";
import matchWaitingPageHtml from "./MatchWaitingPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { FrontendMatchStatusValue } from "../../../constants/FrontendMatchStatusValue";

export interface MatchWaitingPageMatchState {
  matchId?: string | number;
  status?: number;
  assignedRole?: "courier" | "saboteur" | "any" | string;
  opponentRole?: "courier" | "saboteur" | string;
  stateVersion?: number;
  mapId?: string;
  mapVersion?: string;
  mapGenerationVersion?: string;
}

export interface MatchWaitingPageMatchApi {
  getState?: (matchId: string, knownVersion: number) => Promise<MatchWaitingPageMatchState>;
  cancelMatch?: (matchId: string) => Promise<void>;
}

export interface MatchWaitingPageToLoadingData {
  matchId: string;
  assignedRole: "courier" | "saboteur";
  opponentRole: "courier" | "saboteur";
  rolePreference: string;
  difficulty: string;
  mapId: string;
  mapName: string;
  mapVersion: string;
  mapGenerationVersion: string;
  stateVersion: number;
}

export interface MatchWaitingPageActions {
  goToHome: () => void;
  goToMatchLoading: (launchData: MatchWaitingPageToLoadingData) => void;
}

export interface MatchWaitingPageLaunchData {
  matchId: string;
  assignedRole?: "courier" | "saboteur" | "any" | string;
  rolePreference?: "courier" | "saboteur" | "any" | string;
  difficulty?: "easy" | "medium" | "hard" | string;
  mapId?: string;
  mapName?: string;
  mapVersion?: string;
  mapGenerationVersion?: string;
  estimatedWaitSeconds?: number;
  playerName?: string;
}

export interface MatchWaitingPageDependencies {
  launchData: MatchWaitingPageLaunchData;
  matchApi?: MatchWaitingPageMatchApi;
  actions: MatchWaitingPageActions;
}

type MatchWaitingRole = "courier" | "saboteur";

const MATCH_WAITING_SIMULATED_SECONDS = 10;
const MATCH_WAITING_PROGRESS_INTERVAL_MS = 100;
const MATCH_WAITING_POLL_INTERVAL_MS = 1000;
const MATCH_WAITING_FOUND_PAUSE_MS = 900;

const MATCH_WAITING_TIPS = [
  "Use abilities wisely. Timing and strategy are the keys to victory.",
  "A good route can beat a strong hurdle if you react fast.",
  "Saboteur wins by prediction, not random placement.",
  "Courier wins by rerouting calmly under pressure.",
];

function isPlayableRole(value: string | undefined): value is MatchWaitingRole {
  return value === "courier" || value === "saboteur";
}

function roleFromLaunchData(assignedRole: string | undefined, rolePreference: string | undefined): MatchWaitingRole {
  if (isPlayableRole(assignedRole)) {
    return assignedRole;
  }

  if (isPlayableRole(rolePreference)) {
    return rolePreference;
  }

  return "courier";
}

function roleFromValue(value: string | undefined): MatchWaitingRole {
  return value === "saboteur" ? "saboteur" : "courier";
}

function oppositeRole(role: MatchWaitingRole): MatchWaitingRole {
  return role === "courier" ? "saboteur" : "courier";
}

function roleTitle(role: MatchWaitingRole): string {
  return role === "courier" ? "Courier" : "Saboteur";
}

function roleImage(role: MatchWaitingRole): string {
  return role === "courier" ? "/assets/homepage/courier.png" : "/assets/homepage/saboteur.png";
}

function roleCopy(role: MatchWaitingRole, isSelf: boolean): string {
  if (role === "courier") {
    return isSelf
      ? "Deliver the package before time runs out. Find the safest route."
      : "Moves fast, reroutes quickly, and tries to complete the delivery.";
  }

  return isSelf
    ? "Predict the Courier's route and place hurdles before they arrive."
    : "Predicts your route and places hurdles to stop the delivery.";
}

function formatClock(seconds: number): string {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function setRoleCard(root: HTMLElement, role: MatchWaitingRole, isSelf: boolean): void {
  const cardSelector = isSelf ? "[data-waiting-self-card]" : "[data-waiting-opponent-card]";
  const imageSelector = isSelf ? "[data-waiting-self-role-image]" : "[data-waiting-opponent-role-image]";
  const titleSelector = isSelf ? "[data-waiting-self-role-title]" : "[data-waiting-opponent-role-title]";
  const copySelector = isSelf ? "[data-waiting-self-role-copy]" : "[data-waiting-opponent-role-copy]";

  const card = root.querySelector<HTMLElement>(cardSelector);
  const image = root.querySelector<HTMLImageElement>(imageSelector);

  if (card) {
    card.classList.remove("match-waiting-role-card-courier");
    card.classList.remove("match-waiting-role-card-saboteur");
    card.classList.add(role === "courier" ? "match-waiting-role-card-courier" : "match-waiting-role-card-saboteur");
  }

  if (image) {
    image.src = roleImage(role);
  }

  setText(root, titleSelector, roleTitle(role));
  setText(root, copySelector, roleCopy(role, isSelf));
}

function setProgress(root: HTMLElement, progress: number): void {
  const fill = root.querySelector<HTMLElement>("[data-waiting-progress-fill]");
  const safeProgress = Math.max(0, Math.min(100, progress));

  if (fill) {
    fill.style.width = `${safeProgress}%`;
  }
}

function shouldLeaveWaiting(state: MatchWaitingPageMatchState): boolean {
  // this leaves waiting when backend says map/game can start
  return state.status === FrontendMatchStatusValue.Ready || state.status === FrontendMatchStatusValue.Active;
}

export async function mountMatchWaitingPage(root: HTMLElement, deps: MatchWaitingPageDependencies): Promise<() => void> {
  root.innerHTML = matchWaitingPageHtml;

  const timeoutList: number[] = [];
  const intervalList: number[] = [];

  let disposed = false;
  let knownVersion = 0;
  let didNavigateToLoading = false;
  let simulatedOpponentReady = false;
  let currentTipIndex = 0;

  const matchId = String(deps.launchData.matchId);
  const rolePreference = deps.launchData.rolePreference ?? deps.launchData.assignedRole ?? "any";
  const estimatedWaitSeconds = deps.launchData.estimatedWaitSeconds ?? MATCH_WAITING_SIMULATED_SECONDS;
  const startedAtMs = Date.now();

  let selfRole = roleFromLaunchData(deps.launchData.assignedRole, deps.launchData.rolePreference);
  let opponentRole = oppositeRole(selfRole);

  const difficulty = deps.launchData.difficulty ?? "medium";
  const mapId = deps.launchData.mapId ?? "neo-city";
  const mapName = deps.launchData.mapName ?? "Neo City";
  const mapVersion = deps.launchData.mapVersion ?? "v1";
  const mapGenerationVersion = deps.launchData.mapGenerationVersion ?? "city_map_generation_v7";

  const homeButton = root.querySelector<HTMLButtonElement>("[data-waiting-home-button]");
  const homeNavButton = root.querySelector<HTMLButtonElement>("[data-waiting-home-nav]");
  const cancelButton = root.querySelector<HTMLButtonElement>("[data-waiting-cancel-button]");
  const inactiveNavButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-waiting-stats-nav], [data-waiting-features-nav], [data-waiting-settings-nav]")
  );

  setText(root, "[data-waiting-profile-name]", deps.launchData.playerName ?? "Neetika Goel");
  setRoleCard(root, selfRole, true);
  setRoleCard(root, opponentRole, false);
  setText(root, "[data-waiting-estimated-time]", formatClock(estimatedWaitSeconds));

  const showPrototypeMessage = (): void => {
    pageErrorShow(root, "This section is not available in the prototype yet");
  };

  const goToMatchLoadingSoon = (): void => {
    if (disposed || didNavigateToLoading) {
      return;
    }

    didNavigateToLoading = true;

    setText(root, "[data-waiting-heading]", "Opponent Ready");
    setText(root, "[data-waiting-message]", "Opponent found. Locking roles and preparing map data...");
    setText(root, "[data-waiting-estimated-time]", "00:00");
    setProgress(root, 100);

    const timeoutId = window.setTimeout(() => {
      if (!disposed) {
        deps.actions.goToMatchLoading({
          matchId,
          assignedRole: selfRole,
          opponentRole,
          rolePreference,
          difficulty,
          mapId,
          mapName,
          mapVersion,
          mapGenerationVersion,
          stateVersion: knownVersion,
        });
      }
    }, MATCH_WAITING_FOUND_PAUSE_MS);

    timeoutList.push(timeoutId);
  };

  const updateProgress = (): void => {
    if (didNavigateToLoading) {
      return;
    }

    const elapsedMs = Date.now() - startedAtMs;
    const elapsedSeconds = elapsedMs / 1000;
    const rawProgress = (elapsedSeconds / estimatedWaitSeconds) * 100;
    const progress = deps.matchApi?.getState ? Math.min(rawProgress, 96) : Math.min(rawProgress, 100);
    const remainingSeconds = Math.max(0, estimatedWaitSeconds - elapsedSeconds);

    setProgress(root, progress);
    setText(root, "[data-waiting-estimated-time]", formatClock(remainingSeconds));

    // this simulates matchmaking until real backend matchmaking exists
    if (!deps.matchApi?.getState && progress >= 100 && !simulatedOpponentReady) {
      simulatedOpponentReady = true;
      goToMatchLoadingSoon();
    }
  };

  const updateTip = (): void => {
    currentTipIndex = (currentTipIndex + 1) % MATCH_WAITING_TIPS.length;
    setText(root, "[data-waiting-tip-text]", MATCH_WAITING_TIPS[currentTipIndex]);
  };

  const pollMatchState = async (): Promise<void> => {
    if (!deps.matchApi?.getState || disposed || didNavigateToLoading) {
      return;
    }

    try {
      const state = await deps.matchApi.getState(matchId, knownVersion);

      if (disposed || didNavigateToLoading) {
        return;
      }

      knownVersion = state.stateVersion ?? knownVersion;

      if (state.assignedRole) {
        selfRole = roleFromValue(state.assignedRole);
        opponentRole = state.opponentRole ? roleFromValue(state.opponentRole) : oppositeRole(selfRole);

        setRoleCard(root, selfRole, true);
        setRoleCard(root, opponentRole, false);
      }

      if (shouldLeaveWaiting(state)) {
        goToMatchLoadingSoon();
      }
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Unable to poll match state");
    }
  };

  const onCancel = async (): Promise<void> => {
    pageErrorClear(root);

    try {
      cancelButton?.setAttribute("disabled", "true");

      if (deps.matchApi?.cancelMatch) {
        await deps.matchApi.cancelMatch(matchId);
      }

      deps.actions.goToHome();
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Unable to cancel matchmaking");
    } finally {
      cancelButton?.removeAttribute("disabled");
    }
  };

  homeButton?.addEventListener("click", deps.actions.goToHome);
  homeNavButton?.addEventListener("click", deps.actions.goToHome);
  cancelButton?.addEventListener("click", onCancel);

  inactiveNavButtons.forEach((button) => {
    button.addEventListener("click", showPrototypeMessage);
  });

  const progressIntervalId = window.setInterval(updateProgress, MATCH_WAITING_PROGRESS_INTERVAL_MS);
  const pollIntervalId = window.setInterval(() => void pollMatchState(), MATCH_WAITING_POLL_INTERVAL_MS);
  const tipIntervalId = window.setInterval(updateTip, 2600);

  intervalList.push(progressIntervalId, pollIntervalId, tipIntervalId);

  void pollMatchState();
  updateProgress();

  return () => {
    disposed = true;

    timeoutList.forEach((timeoutId) => window.clearTimeout(timeoutId));
    intervalList.forEach((intervalId) => window.clearInterval(intervalId));

    homeButton?.removeEventListener("click", deps.actions.goToHome);
    homeNavButton?.removeEventListener("click", deps.actions.goToHome);
    cancelButton?.removeEventListener("click", onCancel);

    inactiveNavButtons.forEach((button) => {
      button.removeEventListener("click", showPrototypeMessage);
    });
  };
}