import "./MatchGamePage.css";
import matchGamePageHtml from "./MatchGamePage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";
import {
  FrontendMatchStatusValue,
  frontendMatchStatusLabelGet,
} from "../../../constants/FrontendMatchStatusValue";

export interface MatchGamePageMatchState {
  matchId?: string | number;
  status?: number;
  stateVersion?: number;
  timerRemainingMs?: number;
  assignedRole?: string;
  difficulty?: string;
  deliveryProgressPct?: number;
  courierLivesRemaining?: number;
  obstacleEnergyRemaining?: number;
  obstacleEnergySpent?: number;
  activeHurdleCount?: number;
}

export interface MatchGamePageGameController {
  start: (payload: {
    container: HTMLElement;
    hud: HTMLElement;
    matchId: string | number;
    mapPayload: unknown;
    matchState: unknown;
    onCourierDelivered?: (matchId?: string | number) => void;
  }) => void;

  applyState: (matchState: unknown) => void;
  stop: () => void;
}

export interface MatchGamePageDependencies {
  matchId: string | number;
  mapPayload: unknown;
  initialMatchState: unknown;
  pollIntervalMs: number;
  matchApi: {
    getMatchState: (matchId: string | number, knownVersion: number) => Promise<MatchGamePageMatchState>;
  };
  gameController: MatchGamePageGameController;
  actions: {
    goToResult: (matchId: string | number) => void;
    goToDisconnected: (matchId: string | number) => void;
  };
}

type MatchGameRole = "courier" | "saboteur";

function recordGet(value: unknown): Record<string, unknown> {
  // this keeps loose backend data safe while match state contracts are still changing
  if (!value || typeof value !== "object") {
    return {};
  }

  // this lets us read optional fields without crashing
  return value as Record<string, unknown>;
}

function nestedRecordGet(record: Record<string, unknown>, key: string): Record<string, unknown> {
  // this reads nested courier or saboteur objects safely
  return recordGet(record[key]);
}

function firstNumberGet(valueList: unknown[], fallbackValue: number): number {
  // this returns the first valid number from possible backend field names
  for (const value of valueList) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  // this keeps the hud filled during prototype state
  return fallbackValue;
}

function firstStringGet(valueList: unknown[], fallbackValue: string): string {
  // this returns the first valid string from possible backend field names
  for (const value of valueList) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  // this keeps the hud filled during prototype state
  return fallbackValue;
}

function timerTextGet(timerRemainingMs: number | undefined): string {
  // this keeps hud safe before backend sends timer value
  if (timerRemainingMs === undefined) {
    return "--:--";
  }

  // this converts milliseconds into mm:ss
  const totalSeconds = Math.max(0, Math.ceil(timerRemainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // this returns readable timer text
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function roleFromStateGet(matchState: unknown): MatchGameRole {
  // this reads role from loose match state
  const stateRecord = recordGet(matchState);
  const assignedRole = firstStringGet([stateRecord.assignedRole], "courier").toLowerCase();

  // this makes saboteur explicit and keeps courier as fallback
  return assignedRole === "saboteur" ? "saboteur" : "courier";
}

function setText(root: HTMLElement, selector: string, value: string): void {
  // this updates text only when element exists on the current role layout
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function setProgress(root: HTMLElement, selector: string, value: number): void {
  // this clamps progress to css safe percentage range
  const element = root.querySelector<HTMLElement>(selector);
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  if (element) {
    element.style.width = `${safeValue}%`;
  }
}

function roleThemeApply(root: HTMLElement, role: MatchGameRole): void {
  // this switches between courier and saboteur visual layouts
  const page = root.querySelector<HTMLElement>("[data-match-game-page]");

  if (page) {
    page.classList.toggle("match-game-page-courier", role === "courier");
    page.classList.toggle("match-game-page-saboteur", role === "saboteur");
  }
}

function renderHud(root: HTMLElement, matchId: string | number, matchState: unknown): number {
  // this reads top level and nested backend state safely
  const stateRecord = recordGet(matchState);
  const courierRecord = nestedRecordGet(stateRecord, "courier");
  const saboteurRecord = nestedRecordGet(stateRecord, "saboteur");

  // this gets current role and applies role specific page layout
  const role = roleFromStateGet(matchState);
  roleThemeApply(root, role);

  // this reads values from current or future backend payload shapes
  const status = firstNumberGet([stateRecord.status], FrontendMatchStatusValue.Active);
  const stateVersion = firstNumberGet([stateRecord.stateVersion], 0);
  const timerRemainingMs = firstNumberGet([stateRecord.timerRemainingMs], 300000);
  const difficulty = firstStringGet([stateRecord.difficulty], "medium");
  const deliveryProgressPct = firstNumberGet([stateRecord.deliveryProgressPct], 68);
  const lives = firstNumberGet(
    [stateRecord.courierLivesRemaining, stateRecord.courierLives, courierRecord.lives],
    3
  );
  const energyCurrent = firstNumberGet(
    [stateRecord.obstacleEnergyRemaining, stateRecord.energyCurrent, saboteurRecord.energyCurrent],
    72
  );
  const energyMax = firstNumberGet([stateRecord.energyMax, saboteurRecord.energyMax], 100);
  const activeHurdleCount = firstNumberGet(
    [stateRecord.activeHurdleCount, saboteurRecord.activeHurdleCount],
    3
  );

  // this updates common match text
  setText(root, "[data-match-id]", `#CW-${String(matchId).toUpperCase()}`);
  setText(root, "[data-match-difficulty]", difficulty.toUpperCase());
  setText(root, "[data-match-role]", role.toUpperCase());
  setText(root, "[data-match-status]", frontendMatchStatusLabelGet(status));
  setText(root, "[data-match-version]", String(stateVersion));

  // this updates timer in both top hud and side hud
  setText(root, "[data-match-timer]", timerTextGet(timerRemainingMs));
  setText(root, "[data-match-timer-side]", timerTextGet(timerRemainingMs));

  // this updates courier values
  setText(root, "[data-match-life-row]", Array.from({ length: Math.max(0, lives) }, () => "♥").join(" "));
  setText(root, "[data-match-lives-text]", `${lives} / 3`);
  setText(root, "[data-match-progress-percent]", `${Math.round(deliveryProgressPct)}%`);
  setText(root, "[data-match-progress-side]", `${Math.round(deliveryProgressPct)}%`);
  setProgress(root, "[data-match-progress-fill]", deliveryProgressPct);
  setProgress(root, "[data-match-progress-fill-side]", deliveryProgressPct);

  // this updates saboteur values
  setText(root, "[data-match-energy-current]", String(Math.round(energyCurrent)));
  setText(root, "[data-match-energy-max]", String(Math.round(energyMax)));
  setText(root, "[data-match-hurdle-count]", String(Math.round(activeHurdleCount)));
  setProgress(root, "[data-match-energy-fill]", energyMax > 0 ? (energyCurrent / energyMax) * 100 : 0);

  // this returns current version so polling can continue from latest version
  return stateVersion;
}

export async function mountMatchGamePage(root: HTMLElement, deps: MatchGamePageDependencies): Promise<() => void> {
  root.innerHTML = matchGamePageHtml;

  let knownVersion = renderHud(root, deps.matchId, deps.initialMatchState);
  let intervalId = 0;

  const container = root.querySelector<HTMLElement>("[data-phaser-container]");
  const hud = root.querySelector<HTMLElement>("[data-match-hud]");
  const homeButton = root.querySelector<HTMLButtonElement>("[data-match-home-button]");

  const actionButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-match-action-button]"));
  const hurdleButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-match-hurdle-button]"));
  const activateHurdleButton = root.querySelector<HTMLButtonElement>("[data-match-activate-hurdle]");
  const selectedHurdleName = root.querySelector<HTMLElement>("[data-selected-hurdle-name]");
  const selectedHurdleSymbol = root.querySelector<HTMLElement>("[data-selected-hurdle-symbol]");
  const selectedHurdleDescription = root.querySelector<HTMLElement>("[data-selected-hurdle-description]");
  const hurdleDurationInput = root.querySelector<HTMLInputElement>("[data-hurdle-duration-input]");
  const hurdleDurationValue = root.querySelector<HTMLElement>("[data-hurdle-duration-value]");
  const hurdleEnergyCost = root.querySelector<HTMLElement>("[data-hurdle-energy-cost]");

  const showBackendPending = (message: string): void => {
    // this keeps buttons clickable until real backend action api is connected
    pageErrorShow(root, `${message}. Backend action API is not connected yet.`);
  };

  const onActionButtonClick = (event: Event): void => {
    // this handles placeholder action buttons
    const button = event.currentTarget as HTMLButtonElement;
    showBackendPending(button.dataset.matchActionLabel || "This action");
  };

  const onHurdleButtonClick = (event: Event): void => {
    // this updates selected hurdle hud card
    const button = event.currentTarget as HTMLButtonElement;
    const hurdleName = button.dataset.hurdleName || "Selected hurdle";

    hurdleButtonList.forEach((hurdleButton) => {
      hurdleButton.classList.toggle("match-game-hurdle-card-active", hurdleButton === button);
    });

    if (selectedHurdleName) {
      selectedHurdleName.textContent = hurdleName;
    }

    if (selectedHurdleSymbol) {
      selectedHurdleSymbol.textContent = button.dataset.hurdleSymbol || "▥";
    }

    if (selectedHurdleDescription) {
      selectedHurdleDescription.textContent = button.dataset.hurdleDescription || "";
    }

    if (hurdleEnergyCost) {
      hurdleEnergyCost.textContent = button.dataset.hurdleCost || "15";
    }

    if (hurdleDurationInput && hurdleDurationValue) {
      const defaultDuration = button.dataset.hurdleDefaultDuration || "4";

      hurdleDurationInput.value = defaultDuration;
      hurdleDurationValue.textContent = defaultDuration.padStart(2, "0");
    }

    showBackendPending(`${hurdleName} selected`);
  };

  const onActivateHurdleClick = (): void => {
    // this keeps activate button responsive before backend action api exists
    showBackendPending("Activate hurdle");
  };

  const onDurationInput = (): void => {
    // this updates visible duration while saboteur adjusts duration slider
    if (!hurdleDurationInput || !hurdleDurationValue) {
      return;
    }

    hurdleDurationValue.textContent = String(Number(hurdleDurationInput.value)).padStart(2, "0");
  };

  if (!container || !hud) {
    throw new Error("Match game container missing");
  }

  const onHome = (): void => {
    // this returns to disconnected flow until a pause or exit match api exists
    deps.actions.goToDisconnected(deps.matchId);
  };

  homeButton?.addEventListener("click", onHome);
  actionButtonList.forEach((button) => button.addEventListener("click", onActionButtonClick));
  hurdleButtonList.forEach((button) => button.addEventListener("click", onHurdleButtonClick));
  activateHurdleButton?.addEventListener("click", onActivateHurdleClick);
  hurdleDurationInput?.addEventListener("input", onDurationInput);

  // this starts Phaser with backend map payload
  deps.gameController.start({
    container,
    hud,
    matchId: deps.matchId,
    mapPayload: deps.mapPayload,
    matchState: deps.initialMatchState,
    onCourierDelivered: () => {
      deps.actions.goToResult(deps.matchId);
    },
  });

  const poll = async (): Promise<void> => {
    try {
      // this asks backend for latest match state using known state version
      const state = await deps.matchApi.getMatchState(deps.matchId, knownVersion);

      // this updates hud and returns newest known version
      knownVersion = renderHud(root, deps.matchId, state);

      // this forwards state into Phaser controller
      deps.gameController.applyState(state);

      // this moves to result screen when match is finished
      if (state.status === FrontendMatchStatusValue.Completed || state.status === FrontendMatchStatusValue.Draw) {
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
    homeButton?.removeEventListener("click", onHome);
    actionButtonList.forEach((button) => button.removeEventListener("click", onActionButtonClick));
    hurdleButtonList.forEach((button) => button.removeEventListener("click", onHurdleButtonClick));
    activateHurdleButton?.removeEventListener("click", onActivateHurdleClick);
    hurdleDurationInput?.removeEventListener("input", onDurationInput);
    deps.gameController.stop();
  };
}