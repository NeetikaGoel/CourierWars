import "./MatchGamePage.css";
import matchGamePageHtml from "./MatchGamePage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import {
  FrontendMatchStatusValue,
  frontendMatchStatusLabelGet,
} from "../../../constants/FrontendMatchStatusValue";
import type {
  BackendDrawOfferState,
  BackendMatchStateResponse,
  CourierAbilityRequest,
  CourierMoveRequest,
  DrawOfferRequest,
  DrawRespondRequest,
  SaboteurHurdleRequest,
} from "../../../common/apiType/MatchApiType";

export interface MatchGamePageMatchState extends BackendMatchStateResponse {}

export interface MatchGamePageMatchApi {
  getMatchState: (matchId: string | number, knownVersion: number) => Promise<BackendMatchStateResponse>;
  courierMove: (matchId: string | number, payload: CourierMoveRequest) => Promise<BackendMatchStateResponse>;
  courierAbility: (matchId: string | number, payload: CourierAbilityRequest) => Promise<BackendMatchStateResponse>;
  saboteurHurdle: (matchId: string | number, payload: SaboteurHurdleRequest) => Promise<BackendMatchStateResponse>;
  offerDraw: (matchId: string | number, payload: DrawOfferRequest) => Promise<BackendMatchStateResponse>;
  respondDraw: (matchId: string | number, payload: DrawRespondRequest) => Promise<BackendMatchStateResponse>;
}

export interface MatchGamePageGameController {
  start: (payload: {
    container: HTMLElement;
    hud: HTMLElement;
    matchId: string | number;
    mapPayload: unknown;
    matchState: unknown;
    matchApi: MatchGamePageMatchApi;
    onStateAccepted?: (matchState: BackendMatchStateResponse) => void;
    onActionRejected?: (message: string) => void;
    onCourierDelivered?: (matchId?: string | number) => void;
  }) => void;

  applyState: (matchState: unknown) => void;
  selectSaboteurHurdle?: (hurdleType: string) => void;
  stop: () => void;
}

export interface MatchGamePageDependencies {
  matchId: string | number;
  mapPayload: unknown;
  initialMatchState: unknown;
  pollIntervalMs: number;
  matchApi: MatchGamePageMatchApi;
  gameController: MatchGamePageGameController;
  actions: {
    goToResult: (matchId: string | number) => void;
    goToDisconnected: (matchId: string | number) => void;
  };
}

type MatchGameRole = "courier" | "saboteur";

function recordGet(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

function nestedRecordGet(record: Record<string, unknown>, key: string): Record<string, unknown> {
  return recordGet(record[key]);
}

function firstNumberGet(valueList: unknown[], fallbackValue: number): number {
  for (const value of valueList) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return fallbackValue;
}

function firstStringGet(valueList: unknown[], fallbackValue: string): string {
  for (const value of valueList) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return fallbackValue;
}

function errorMessageGet(errorObject: unknown, fallbackMessage: string): string {
  return errorObject instanceof Error ? errorObject.message : fallbackMessage;
}

function timerTextGet(timerRemainingMs: number | undefined): string {
  if (timerRemainingMs === undefined) {
    return "--:--";
  }

  const totalSeconds = Math.max(0, Math.ceil(timerRemainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function roleFromStateGet(matchState: unknown): MatchGameRole {
  const stateRecord = recordGet(matchState);
  const assignedRole = firstStringGet([stateRecord.assignedRole], "courier").toLowerCase();

  return assignedRole === "saboteur" ? "saboteur" : "courier";
}

function abilityTypeFromLabelGet(label: string): string {
  if (label === "Shield") {
    return "shield";
  }

  if (label === "Reveal Route") {
    return "revealRoute";
  }

  return "speedBoost";
}

function hurdleTypeFromNameGet(name: string): string {
  if (name === "Road Block") {
    return "roadBlock";
  }

  if (name === "Construction") {
    return "constructionWork";
  }

  if (name === "Traffic Jam") {
    return "trafficJam";
  }

  if (name === "Closed Gate") {
    return "closedGate";
  }

  return "redTrafficLight";
}

function matchStateIsEnded(matchState: BackendMatchStateResponse): boolean {
  return matchState.status === FrontendMatchStatusValue.Completed || matchState.status === FrontendMatchStatusValue.Draw;
}

function drawOfferFromStateGet(matchState: unknown): BackendDrawOfferState | null {
  const stateRecord = recordGet(matchState);
  const drawOffer = stateRecord.drawOffer;

  if (!drawOffer || typeof drawOffer !== "object") {
    return null;
  }

  return drawOffer as BackendDrawOfferState;
}

function drawOfferRoleGet(drawOffer: BackendDrawOfferState | null): MatchGameRole | null {
  if (!drawOffer) {
    return null;
  }

  return drawOffer.offeredByRole === "saboteur" ? "saboteur" : "courier";
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function setProgress(root: HTMLElement, selector: string, value: number): void {
  const element = root.querySelector<HTMLElement>(selector);
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  if (element) {
    element.style.width = `${safeValue}%`;
  }
}

function roleThemeApply(root: HTMLElement, role: MatchGameRole): void {
  const page = root.querySelector<HTMLElement>("[data-match-game-page]");

  if (page) {
    page.classList.toggle("match-game-page-courier", role === "courier");
    page.classList.toggle("match-game-page-saboteur", role === "saboteur");
  }
}

function renderHud(root: HTMLElement, matchId: string | number, matchState: unknown): number {
  const stateRecord = recordGet(matchState);
  const courierRecord = nestedRecordGet(stateRecord, "courier");
  const saboteurRecord = nestedRecordGet(stateRecord, "saboteur");

  const role = roleFromStateGet(matchState);
  roleThemeApply(root, role);

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
  const courierName = firstStringGet([stateRecord.courierName, courierRecord.name, courierRecord.username], "Courier");
  const saboteurName = firstStringGet([stateRecord.saboteurName, saboteurRecord.name, saboteurRecord.username], "Saboteur");

  setText(root, "[data-match-id]", `#CW-${String(matchId).toUpperCase()}`);
  setText(root, "[data-match-difficulty]", difficulty.toUpperCase());
  setText(root, "[data-match-role]", role.toUpperCase());
  setText(root, "[data-match-status]", frontendMatchStatusLabelGet(status));
  setText(root, "[data-match-version]", String(stateVersion));
  setText(root, "[data-match-courier-name]", courierName);
  setText(root, "[data-match-saboteur-name]", saboteurName);

  setText(root, "[data-match-timer]", timerTextGet(timerRemainingMs));
  setText(root, "[data-match-timer-side]", timerTextGet(timerRemainingMs));

  setText(root, "[data-match-life-row]", Array.from({ length: Math.max(0, lives) }, () => "♥").join(" "));
  setText(root, "[data-match-lives-text]", `${lives} / 3`);
  setText(root, "[data-match-progress-percent]", `${Math.round(deliveryProgressPct)}%`);
  setText(root, "[data-match-progress-side]", `${Math.round(deliveryProgressPct)}%`);
  setProgress(root, "[data-match-progress-fill]", deliveryProgressPct);
  setProgress(root, "[data-match-progress-fill-side]", deliveryProgressPct);

  setText(root, "[data-match-energy-current]", String(Math.round(energyCurrent)));
  setText(root, "[data-match-energy-max]", String(Math.round(energyMax)));
  setText(root, "[data-match-hurdle-count]", String(Math.round(activeHurdleCount)));
  setProgress(root, "[data-match-energy-fill]", energyMax > 0 ? (energyCurrent / energyMax) * 100 : 0);

  return stateVersion;
}

export async function mountMatchGamePage(root: HTMLElement, deps: MatchGamePageDependencies): Promise<() => void> {
  root.innerHTML = matchGamePageHtml;

  let disposed = false;
  let latestMatchState: unknown = deps.initialMatchState;
  let knownVersion = renderHud(root, deps.matchId, deps.initialMatchState);
  let intervalId = 0;
  let drawRequestActive = false;

  const container = root.querySelector<HTMLElement>("[data-phaser-container]");
  const hud = root.querySelector<HTMLElement>("[data-match-hud]");
  const homeButton = root.querySelector<HTMLButtonElement>("[data-match-home-button]");
  const drawButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-match-draw-button]"));
  const drawOfferModal = root.querySelector<HTMLElement>("[data-draw-offer-modal]");
  const drawOfferName = root.querySelector<HTMLElement>("[data-draw-offer-name]");
  const drawOfferAcceptButton = root.querySelector<HTMLButtonElement>("[data-draw-offer-accept]");
  const drawOfferRejectButton = root.querySelector<HTMLButtonElement>("[data-draw-offer-reject]");
  const drawConfirmModal = root.querySelector<HTMLElement>("[data-draw-confirm-modal]");
  const drawConfirmCancelButton = root.querySelector<HTMLButtonElement>("[data-draw-confirm-cancel]");
  const drawConfirmSendButton = root.querySelector<HTMLButtonElement>("[data-draw-confirm-send]");

  const actionButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-match-action-button]"));
  const hurdleButtonList = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-match-hurdle-button]"));
  const activateHurdleButton = root.querySelector<HTMLButtonElement>("[data-match-activate-hurdle]");
  const selectedHurdleName = root.querySelector<HTMLElement>("[data-selected-hurdle-name]");
  const selectedHurdleSymbol = root.querySelector<HTMLElement>("[data-selected-hurdle-symbol]");
  const selectedHurdleDescription = root.querySelector<HTMLElement>("[data-selected-hurdle-description]");
  const hurdleDurationInput = root.querySelector<HTMLInputElement>("[data-hurdle-duration-input]");
  const hurdleDurationValue = root.querySelector<HTMLElement>("[data-hurdle-duration-value]");
  const hurdleEnergyCost = root.querySelector<HTMLElement>("[data-hurdle-energy-cost]");

  const drawButtonStateRender = (matchState: unknown): void => {
    const drawOffer = drawOfferFromStateGet(matchState);
    const currentRole = roleFromStateGet(matchState);
    const offeredByRole = drawOfferRoleGet(drawOffer);
    const stateRecord = recordGet(matchState);
    const status = firstNumberGet([stateRecord.status], FrontendMatchStatusValue.Active);
    const matchEnded = status === FrontendMatchStatusValue.Completed || status === FrontendMatchStatusValue.Draw;

    let buttonText = "Offer Draw";
    let disabled = false;

    if (drawRequestActive) {
      buttonText = "Sending Draw...";
      disabled = true;
    } else if (matchEnded) {
      buttonText = "Match Ended";
      disabled = true;
    } else if (drawOffer && offeredByRole === currentRole) {
      buttonText = "Draw Offered";
      disabled = true;
    } else if (drawOffer && offeredByRole !== currentRole) {
      buttonText = "Respond In Popup";
      disabled = true;
    }

    drawButtonList.forEach((button) => {
      button.textContent = buttonText;
      button.disabled = disabled;
    });
  };

  const actionReject = (message: string): void => {
    pageErrorShow(root, message);
  };

  const drawOfferModalHide = (): void => {
    if (drawOfferModal) {
      drawOfferModal.hidden = true;
    }
  };

  const drawConfirmModalHide = (): void => {
    if (drawConfirmModal) {
      drawConfirmModal.hidden = true;
    }
  };

  const drawConfirmModalShow = (): void => {
    if (drawRequestActive) {
      return;
    }

    drawOfferModalHide();

    if (drawConfirmCancelButton) {
      drawConfirmCancelButton.disabled = false;
    }

    if (drawConfirmSendButton) {
      drawConfirmSendButton.disabled = false;
    }

    if (drawConfirmModal) {
      drawConfirmModal.hidden = false;
      drawConfirmSendButton?.focus();
    }
  };

  const drawOfferModalRender = (matchState: unknown): void => {
    const drawOffer = drawOfferFromStateGet(matchState);
    const currentRole = roleFromStateGet(matchState);
    const offeredByRole = drawOfferRoleGet(drawOffer);

    if (!drawOffer || offeredByRole === currentRole) {
      drawOfferModalHide();
      return;
    }

    if (drawOfferName) {
      drawOfferName.textContent = firstStringGet([drawOffer.offeredByName], "Opponent");
    }

    drawConfirmModalHide();

    if (drawOfferAcceptButton) {
      drawOfferAcceptButton.disabled = drawRequestActive;
    }

    if (drawOfferRejectButton) {
      drawOfferRejectButton.disabled = drawRequestActive;
    }

    if (drawOfferModal) {
      const wasHidden = drawOfferModal.hidden;
      drawOfferModal.hidden = false;

      if (wasHidden) {
        drawOfferAcceptButton?.focus();
      }
    }
  };

  const drawOfferRespond = async (accepted: boolean): Promise<void> => {
    const drawOffer = drawOfferFromStateGet(latestMatchState);
    const currentRole = roleFromStateGet(latestMatchState);
    const offeredByRole = drawOfferRoleGet(drawOffer);

    if (drawRequestActive || !drawOffer || offeredByRole === currentRole) {
      drawOfferModalHide();
      return;
    }

    try {
      pageErrorClear(root);
      drawRequestActive = true;
      drawButtonStateRender(latestMatchState);
      drawOfferModalRender(latestMatchState);

      const state = await deps.matchApi.respondDraw(deps.matchId, {
        knownStateVersion: knownVersion,
        accepted,
      });

      if (!disposed) {
        stateAccept(state);
      }
    } catch (errorObject) {
      if (!disposed) {
        pageErrorShow(root, errorMessageGet(errorObject, "Draw response was rejected"));
      }
    } finally {
      drawRequestActive = false;

      if (!disposed) {
        drawButtonStateRender(latestMatchState);
        drawOfferModalRender(latestMatchState);
      }
    }
  };

  const stateAccept = (state: BackendMatchStateResponse): void => {
    latestMatchState = state;
    knownVersion = renderHud(root, deps.matchId, state);
    drawButtonStateRender(state);
    deps.gameController.applyState(state);

    if (matchStateIsEnded(state)) {
      drawOfferModalHide();
      drawConfirmModalHide();
      deps.actions.goToResult(deps.matchId);
      return;
    }

    drawOfferModalRender(state);
  };

  const onActionButtonClick = async (event: Event): Promise<void> => {
    const button = event.currentTarget as HTMLButtonElement;
    const label = button.dataset.matchActionLabel || "Speed Boost";
    const abilityType = abilityTypeFromLabelGet(label);

    try {
      pageErrorClear(root);
      button.disabled = true;

      const state = await deps.matchApi.courierAbility(deps.matchId, {
        knownStateVersion: knownVersion,
        abilityType,
      });

      stateAccept(state);
    } catch (errorObject) {
      actionReject(errorMessageGet(errorObject, "Ability was rejected"));
    } finally {
      button.disabled = false;
    }
  };

  const onDrawOfferAcceptClick = (): void => {
    void drawOfferRespond(true);
  };

  const onDrawOfferRejectClick = (): void => {
    void drawOfferRespond(false);
  };

  const onHurdleButtonClick = (event: Event): void => {
    const button = event.currentTarget as HTMLButtonElement;
    const hurdleName = button.dataset.hurdleName || "Selected hurdle";
    const hurdleType = hurdleTypeFromNameGet(hurdleName);

    pageErrorClear(root);

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

    deps.gameController.selectSaboteurHurdle?.(hurdleType);
  };

  const onActivateHurdleClick = (): void => {
    pageErrorShow(root, "Click a valid future tile on the map to activate the selected hurdle");
  };

  const drawOfferSend = async (): Promise<void> => {
    if (drawRequestActive) {
      return;
    }

    drawConfirmModalHide();

    try {
      pageErrorClear(root);
      drawRequestActive = true;
      drawButtonStateRender(latestMatchState);

      if (drawConfirmCancelButton) {
        drawConfirmCancelButton.disabled = true;
      }

      if (drawConfirmSendButton) {
        drawConfirmSendButton.disabled = true;
      }

      const state = await deps.matchApi.offerDraw(deps.matchId, {
        knownStateVersion: knownVersion,
      });

      if (!disposed) {
        stateAccept(state);
      }
    } catch (errorObject) {
      if (!disposed) {
        pageErrorShow(root, errorMessageGet(errorObject, "Draw offer was rejected"));
      }
    } finally {
      drawRequestActive = false;

      if (!disposed) {
        drawButtonStateRender(latestMatchState);
      }
    }
  };

  const onDrawClick = (): void => {
    drawConfirmModalShow();
  };

  const onDrawConfirmCancelClick = (): void => {
    drawConfirmModalHide();
  };

  const onDrawConfirmSendClick = (): void => {
    void drawOfferSend();
  };

  const onDurationInput = (): void => {
    if (!hurdleDurationInput || !hurdleDurationValue) {
      return;
    }

    hurdleDurationValue.textContent = String(Number(hurdleDurationInput.value)).padStart(2, "0");
  };

  if (!container || !hud) {
    throw new Error("Match game container missing");
  }

  const onHome = (): void => {
    deps.actions.goToDisconnected(deps.matchId);
  };

  homeButton?.addEventListener("click", onHome);
  drawButtonList.forEach((button) => button.addEventListener("click", onDrawClick));
  actionButtonList.forEach((button) => button.addEventListener("click", onActionButtonClick));
  hurdleButtonList.forEach((button) => button.addEventListener("click", onHurdleButtonClick));
  activateHurdleButton?.addEventListener("click", onActivateHurdleClick);
  hurdleDurationInput?.addEventListener("input", onDurationInput);
  drawOfferAcceptButton?.addEventListener("click", onDrawOfferAcceptClick);
  drawOfferRejectButton?.addEventListener("click", onDrawOfferRejectClick);
  drawConfirmCancelButton?.addEventListener("click", onDrawConfirmCancelClick);
  drawConfirmSendButton?.addEventListener("click", onDrawConfirmSendClick);

  drawButtonStateRender(latestMatchState);

  deps.gameController.start({
    container,
    hud,
    matchId: deps.matchId,
    mapPayload: deps.mapPayload,
    matchState: deps.initialMatchState,
    matchApi: deps.matchApi,
    onStateAccepted: stateAccept,
    onActionRejected: actionReject,
    onCourierDelivered: () => {
      deps.actions.goToResult(deps.matchId);
    },
  });

  const poll = async (): Promise<void> => {
    if (disposed) {
      return;
    }

    try {
      const state = await deps.matchApi.getMatchState(deps.matchId, knownVersion);

      if (disposed) {
        return;
      }

      stateAccept(state);
    } catch (errorObject) {
      pageErrorShow(root, errorMessageGet(errorObject, "Match state could not be refreshed"));
    }
  };

  intervalId = window.setInterval(() => void poll(), deps.pollIntervalMs);
  void poll();

  return () => {
    disposed = true;
    window.clearInterval(intervalId);
    homeButton?.removeEventListener("click", onHome);
    drawButtonList.forEach((button) => button.removeEventListener("click", onDrawClick));
    actionButtonList.forEach((button) => button.removeEventListener("click", onActionButtonClick));
    hurdleButtonList.forEach((button) => button.removeEventListener("click", onHurdleButtonClick));
    activateHurdleButton?.removeEventListener("click", onActivateHurdleClick);
    hurdleDurationInput?.removeEventListener("input", onDurationInput);
    drawOfferAcceptButton?.removeEventListener("click", onDrawOfferAcceptClick);
    drawOfferRejectButton?.removeEventListener("click", onDrawOfferRejectClick);
    drawConfirmCancelButton?.removeEventListener("click", onDrawConfirmCancelClick);
    drawConfirmSendButton?.removeEventListener("click", onDrawConfirmSendClick);
    deps.gameController.stop();
  };
}