import "./MatchGamePage.css";
import matchGamePageHtml from "./MatchGamePage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { SaboteurDeckController } from "./SaboteurDeckController";
import {
  FrontendMatchStatusValue,
  frontendMatchStatusLabelGet,
} from "../../../constants/FrontendMatchStatusValue";
import type { MatchSyncCourierStep, MatchSyncState } from "../../../common/apiType/MatchApiType";

// courier steps are sent in small batches instead of one request per tile
const COURIER_STEP_FLUSH_DELAY_MS = 150;

// a hidden tab polls slowly, the opponent keeps playing and the state catches up on return
const HIDDEN_TAB_POLL_INTERVAL_MS = 5000;

// a failed request is retried after this pause
const REQUEST_RETRY_DELAY_MS = 1000;

// this many polls failing in a row means the match is lost
const POLL_FAILURE_COUNT_MAX = 5;

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
    onCourierStep?: (step: { x: number; y: number; lives: number }) => void;
    onHurdleRequested?: (hurdleType: string, tilePointList: { x: number; y: number }[]) => void;
    onHurdleSelected?: (hurdleType: string) => void;
    onPlacementFeedback?: (message: string, valid: boolean) => void;
  }) => void;

  applyState: (matchState: unknown, serverClockOffsetMs?: number) => void;
  hurdleSelect?: (hurdleType: string) => void;
  hurdleActivate?: () => void;
  courierPositionReset?: (tileX: number, tileY: number) => void;
  stop: () => void;
}

export interface MatchGamePageDependencies {
  matchId: string | number;
  mapPayload: unknown;
  initialMatchState: unknown;
  pollIntervalMs: number;
  matchApi: {
    getMatchState: (matchId: string | number, knownVersion: number) => Promise<MatchGamePageMatchState>;
    sendCourierSteps?: (matchId: string | number, stepList: MatchSyncCourierStep[], lives: number) => Promise<MatchGamePageMatchState>;
    placeHurdle?: (
      matchId: string | number,
      hurdleType: string,
      tilePointList: { x: number; y: number }[],
      durationMs?: number
    ) => Promise<MatchGamePageMatchState>;
    clockOffsetMsGet?: () => number;
  };
  gameController: MatchGamePageGameController;
  actions: {
    goToResult: (matchId: string | number) => void;
    goToDisconnected: (matchId: string | number) => void;
    leaveMatch?: (matchId: string | number) => void;
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
  const deliveryProgressPct = firstNumberGet([stateRecord.deliveryProgressPct], 0);
  const lives = firstNumberGet(
    [stateRecord.courierLivesRemaining, stateRecord.courierLives, courierRecord.lives],
    3
  );
  const energyCurrent = firstNumberGet(
    [stateRecord.obstacleEnergyRemaining, stateRecord.energyCurrent, saboteurRecord.energyCurrent],
    0
  );
  const energyMax = firstNumberGet([stateRecord.energyMax, saboteurRecord.energyMax], 100);
  const activeHurdleCount = firstNumberGet(
    [stateRecord.activeHurdleCount, saboteurRecord.activeHurdleCount],
    0
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

  const container = root.querySelector<HTMLElement>("[data-phaser-container]");
  const hud = root.querySelector<HTMLElement>("[data-match-hud]");
  const homeButton = root.querySelector<HTMLButtonElement>("[data-match-home-button]");

  const actionButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-match-action-button]"));
  let noticeTimeoutId = 0;

  // short lived message over the map, errors stay red and other feedback uses the info style
  const noticeShow = (message: string, isError: boolean): void => {
    const box = root.querySelector<HTMLElement>("[data-page-error]");

    pageErrorShow(root, message);
    box?.classList.toggle("match-game-error-info", !isError);
    window.clearTimeout(noticeTimeoutId);
    noticeTimeoutId = window.setTimeout(() => {
      box?.classList.remove("match-game-error-info");
      pageErrorClear(root);
    }, isError ? 4000 : 2500);
  };

  const onActionButtonClick = (event: Event): void => {
    // courier abilities have no game rules or backend action yet
    const button = event.currentTarget as HTMLButtonElement;
    noticeShow(`${button.dataset.matchActionLabel || "This ability"} is not available yet`, true);
  };

  // the saboteur deck under the map talks to the Phaser scene, the scene talks to the backend
  const saboteurDeck = new SaboteurDeckController(root, recordGet(deps.initialMatchState).hurdleRules as never, {
    hurdleSelected: (hurdleType) => deps.gameController.hurdleSelect?.(hurdleType),
    activateRequested: () => deps.gameController.hurdleActivate?.(),
  });

  saboteurDeck.mount();

  if (!container || !hud) {
    throw new Error("Match game container missing");
  }

  const onHome = (): void => {
    // leaving an online match is a forfeit, so ask first
    if (deps.actions.leaveMatch) {
      if (window.confirm("Leave the match? Your opponent wins by forfeit.")) {
        deps.actions.leaveMatch(deps.matchId);
      }

      return;
    }

    deps.actions.goToDisconnected(deps.matchId);
  };

  homeButton?.addEventListener("click", onHome);
  actionButtonList.forEach((button) => button.addEventListener("click", onActionButtonClick));

  const online = deps.matchApi.sendCourierSteps !== undefined;
  const initialSync = recordGet(deps.initialMatchState) as Partial<MatchSyncState>;

  // this holds the last full state, polls with an unchanged version only overlay the ticking fields
  let mergedState: Record<string, unknown> = { ...recordGet(deps.initialMatchState) };
  let appliedVersion = firstNumberGet([initialSync.stateVersion], 0);
  let disposed = false;
  let navigated = false;
  let pollTimeoutId = 0;
  let pollInFlight = false;
  let pollFailureCount = 0;
  let drawOfferNoticeShownFor: string | null = null;

  // this queues courier steps until the backend acknowledged them
  let pendingStepList: MatchSyncCourierStep[] = [];
  let nextStepSeq = firstNumberGet([initialSync.courier?.moveSeq], 0) + 1;
  let latestLives = firstNumberGet([initialSync.courier?.lives], 3);
  let stepFlushTimeoutId = 0;
  let stepFlushInFlight = false;

  const resultGo = (): void => {
    if (navigated || disposed) {
      return;
    }

    navigated = true;
    deps.actions.goToResult(deps.matchId);
  };

  const disconnectedGo = (): void => {
    if (navigated || disposed) {
      return;
    }

    navigated = true;
    deps.actions.goToDisconnected(deps.matchId);
  };

  // this is the single place every backend state passes through, from polls and from action replies
  const stateApply = (state: MatchGamePageMatchState): void => {
    if (disposed) {
      return;
    }

    const syncState = state as unknown as MatchSyncState;
    const stateVersion = firstNumberGet([syncState.stateVersion], 0);

    // this drops a slow poll reply that left before a newer action reply arrived
    if (stateVersion < appliedVersion) {
      return;
    }

    appliedVersion = stateVersion;
    mergedState = syncState.changed ? { ...recordGet(syncState) } : { ...mergedState, ...recordGet(syncState), changed: false };
    knownVersion = renderHud(root, deps.matchId, mergedState);
    deps.gameController.applyState(syncState, deps.matchApi.clockOffsetMsGet?.() ?? 0);

    if (syncState.hurdleRules) {
      saboteurDeck.rulesSet(syncState.hurdleRules);
    }

    const merged = mergedState as Partial<MatchSyncState>;
    saboteurDeck.render({
      serverNowMs: firstNumberGet([syncState.serverNowMs], Date.now()),
      energyCurrent: firstNumberGet([merged.obstacleEnergyRemaining], 0),
      energyRecoveryPerSecond: merged.energyRecoveryPerSecond,
      activeHurdleCount: merged.activeHurdleCount,
      activeHurdleCountMax: merged.activeHurdleCountMax,
      hurdles: merged.hurdles,
      cooldownUntilMsByType: merged.cooldownUntilMsByType,
    });

    if (syncState.changed && syncState.drawOfferedBy && syncState.drawOfferedBy !== mergedState.assignedRole) {
      if (drawOfferNoticeShownFor !== String(stateVersion)) {
        drawOfferNoticeShownFor = String(stateVersion);
        pageErrorShow(root, "Your opponent offered a draw. Press Draw to accept.");
      }
    }

    if (syncState.status === FrontendMatchStatusValue.Completed || syncState.status === FrontendMatchStatusValue.Draw) {
      resultGo();
    }
  };

  const pollSchedule = (delayMs: number): void => {
    window.clearTimeout(pollTimeoutId);

    if (!disposed && !navigated) {
      pollTimeoutId = window.setTimeout(() => void poll(), delayMs);
    }
  };

  const pollIntervalGet = (): number => {
    if (document.hidden) {
      return HIDDEN_TAB_POLL_INTERVAL_MS;
    }

    return firstNumberGet([mergedState.pollIntervalMs], deps.pollIntervalMs);
  };

  // this polls one request at a time, a slow backend stretches the interval instead of stacking requests
  const poll = async (): Promise<void> => {
    if (disposed || navigated || pollInFlight) {
      return;
    }

    pollInFlight = true;

    try {
      stateApply(await deps.matchApi.getMatchState(deps.matchId, knownVersion));
      pollFailureCount = 0;
      pollSchedule(pollIntervalGet());
    } catch (errorObject) {
      pollFailureCount += 1;

      if (pollFailureCount >= POLL_FAILURE_COUNT_MAX) {
        pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Match state lost");
        disconnectedGo();
        return;
      }

      pollSchedule(REQUEST_RETRY_DELAY_MS);
    } finally {
      pollInFlight = false;
    }
  };

  const stepFlushSchedule = (delayMs: number): void => {
    if (stepFlushTimeoutId !== 0 || disposed) {
      return;
    }

    stepFlushTimeoutId = window.setTimeout(() => {
      stepFlushTimeoutId = 0;
      void stepFlush();
    }, delayMs);
  };

  const stepFlush = async (): Promise<void> => {
    if (!deps.matchApi.sendCourierSteps || stepFlushInFlight || pendingStepList.length === 0 || disposed) {
      return;
    }

    stepFlushInFlight = true;
    const sentStepList = pendingStepList.slice();

    try {
      const state = (await deps.matchApi.sendCourierSteps(deps.matchId, sentStepList, latestLives)) as unknown as MatchSyncState;
      const acceptedSeq = state.courier?.moveSeq ?? 0;

      if (state.moveRejected && state.courier) {
        // the backend kept the courier where it was, everything after the accepted step is void
        pendingStepList = [];
        nextStepSeq = acceptedSeq + 1;
        deps.gameController.courierPositionReset?.(state.courier.x, state.courier.y);
      } else {
        pendingStepList = pendingStepList.filter((step) => step.seq > acceptedSeq);
      }

      stateApply(state as unknown as MatchGamePageMatchState);

      // a move reply already carries the newest state, so the next poll can wait a full interval
      if (!pollInFlight) {
        pollSchedule(pollIntervalGet());
      }
    } catch {
      // steps stay queued and are sent again, each one has a seq so a repeat is harmless
      stepFlushSchedule(REQUEST_RETRY_DELAY_MS);
    } finally {
      stepFlushInFlight = false;
    }

    if (pendingStepList.length > 0) {
      stepFlushSchedule(COURIER_STEP_FLUSH_DELAY_MS);
    }
  };

  // this starts Phaser with backend map payload
  deps.gameController.start({
    container,
    hud,
    matchId: deps.matchId,
    mapPayload: deps.mapPayload,
    matchState: deps.initialMatchState,
    onCourierDelivered: () => {
      if (!online) {
        resultGo();
        return;
      }

      // the result screen opens for both players once the backend confirms the delivery
      window.clearTimeout(stepFlushTimeoutId);
      stepFlushTimeoutId = 0;
      void stepFlush();
    },
    onCourierStep: online
      ? (step) => {
          latestLives = step.lives;
          pendingStepList.push({ seq: nextStepSeq, x: step.x, y: step.y });
          nextStepSeq += 1;
          stepFlushSchedule(COURIER_STEP_FLUSH_DELAY_MS);
        }
      : undefined,
    onHurdleRequested: deps.matchApi.placeHurdle
      ? (hurdleType, tilePointList) => {
          deps.matchApi
            .placeHurdle?.(deps.matchId, hurdleType, tilePointList, saboteurDeck.durationMsGet(hurdleType))
            .then((state) => {
              stateApply(state);
              noticeShow("Hurdle activated", false);
            })
            .catch((errorObject: unknown) => {
              noticeShow(errorObject instanceof Error ? errorObject.message : "Hurdle was rejected", true);
            });
        }
      : undefined,
    onHurdleSelected: (hurdleType) => saboteurDeck.selectionShow(hurdleType),
    onPlacementFeedback: (message, valid) => noticeShow(message, !valid),
  });

  const onVisibilityChange = (): void => {
    // this polls right away when the player comes back to the tab
    if (!document.hidden) {
      pollSchedule(0);
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  pollSchedule(0);

  return () => {
    disposed = true;
    window.clearTimeout(pollTimeoutId);
    window.clearTimeout(stepFlushTimeoutId);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    homeButton?.removeEventListener("click", onHome);
    actionButtonList.forEach((button) => button.removeEventListener("click", onActionButtonClick));
    saboteurDeck.destroy();
    window.clearTimeout(noticeTimeoutId);
    deps.gameController.stop();
  };
}