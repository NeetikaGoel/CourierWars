// this file drives the saboteur deck under the map: hurdle cards, duration, energy cost and the live hurdle panels
// numbers come from the backend hurdle rules, only names, symbols and descriptions live here

import type { MatchSyncHurdle, MatchSyncHurdleRule } from "../../../common/apiType/MatchApiType";

interface SaboteurDeckHurdle {
  type: string;
  name: string;
  symbol: string;
  key: string;
  description: string;
}

// order and keys match SaboteurPlacementInputController, keys 1 to 9 select the same hurdles
export const SABOTEUR_DECK_HURDLE_LIST: SaboteurDeckHurdle[] = [
  { type: "redTrafficLight", name: "Red Traffic Light", symbol: "▥", key: "1", description: "Turn a traffic signal red to stop the Courier." },
  { type: "roadBlock", name: "Road Block", symbol: "▤", key: "2", description: "Block a road and force the Courier to reroute." },
  { type: "constructionWork", name: "Construction", symbol: "△", key: "3", description: "Slow Courier movement through a road section." },
  { type: "trafficJam", name: "Traffic Jam", symbol: "▨", key: "4", description: "Create a slow movement zone on a route." },
  { type: "closedGate", name: "Closed Gate", symbol: "⊞", key: "5", description: "Close a shortcut, tunnel or bridge entrance." },
  { type: "wrongDirectionSign", name: "Wrong Sign", symbol: "↯", key: "6", description: "Put up a misleading sign near an intersection." },
  { type: "brokenRoad", name: "Broken Road", symbol: "▦", key: "7", description: "Make a road impassable for a while." },
  { type: "movingBarrier", name: "Moving Barrier", symbol: "⇋", key: "8", description: "A timing hazard that costs the Courier a life." },
  { type: "securityCheckpoint", name: "Checkpoint", symbol: "⛉", key: "9", description: "Stop the Courier briefly at a checkpoint." },
];

const DURATION_STEP_MS = 1000;

export interface SaboteurDeckRenderState {
  serverNowMs: number;
  energyCurrent: number;
  energyRecoveryPerSecond?: number;
  activeHurdleCount?: number;
  activeHurdleCountMax?: number;
  hurdles?: MatchSyncHurdle[];
  cooldownUntilMsByType?: Record<string, number> | [];
}

export interface SaboteurDeckCallbacks {
  hurdleSelected: (hurdleType: string) => void;
  activateRequested: () => void;
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function secondsTextGet(durationMs: number): string {
  return `${Math.max(0, Math.ceil(durationMs / 1000))}s`;
}

export class SaboteurDeckController {
  private readonly root: HTMLElement;
  private readonly callbacks: SaboteurDeckCallbacks;
  private ruleByType: Record<string, MatchSyncHurdleRule>;
  private selectedType = SABOTEUR_DECK_HURDLE_LIST[0].type;
  private readonly durationMsByType: Record<string, number> = {};
  private readonly cleanupList: (() => void)[] = [];
  private cardByType = new Map<string, HTMLButtonElement>();

  constructor(root: HTMLElement, ruleByType: Record<string, MatchSyncHurdleRule> | undefined, callbacks: SaboteurDeckCallbacks) {
    this.root = root;
    this.ruleByType = ruleByType ?? {};
    this.callbacks = callbacks;
  }

  mount(): void {
    const dock = this.root.querySelector<HTMLElement>("[data-match-hurdle-dock]");
    const activateButton = this.root.querySelector<HTMLButtonElement>("[data-match-activate-hurdle]");
    const durationInput = this.root.querySelector<HTMLInputElement>("[data-hurdle-duration-input]");

    if (dock) {
      dock.replaceChildren(...SABOTEUR_DECK_HURDLE_LIST.map((hurdle) => this.cardCreate(hurdle)));
    }

    const onActivate = (): void => {
      // blur so a later Space press does not click the button and fire the keyboard shortcut too
      activateButton?.blur();
      this.callbacks.activateRequested();
    };

    const onDurationInput = (): void => {
      if (!durationInput) {
        return;
      }

      this.durationMsByType[this.selectedType] = Number(durationInput.value) * DURATION_STEP_MS;
      setText(this.root, "[data-hurdle-duration-value]", String(Number(durationInput.value)).padStart(2, "0"));
    };

    activateButton?.addEventListener("click", onActivate);
    durationInput?.addEventListener("input", onDurationInput);
    this.cleanupList.push(() => activateButton?.removeEventListener("click", onActivate));
    this.cleanupList.push(() => durationInput?.removeEventListener("input", onDurationInput));

    this.selectionShow(this.selectedType);
  }

  destroy(): void {
    this.cleanupList.forEach((cleanup) => cleanup());
    this.cleanupList.length = 0;
  }

  rulesSet(ruleByType: Record<string, MatchSyncHurdleRule>): void {
    this.ruleByType = ruleByType;
    SABOTEUR_DECK_HURDLE_LIST.forEach((hurdle) => this.cardCostShow(hurdle.type));
    this.selectionShow(this.selectedType);
  }

  // this follows a keyboard selection made inside the Phaser scene
  selectionShow(hurdleType: string): void {
    const hurdle = SABOTEUR_DECK_HURDLE_LIST.find((entry) => entry.type === hurdleType);

    if (!hurdle) {
      return;
    }

    this.selectedType = hurdleType;
    this.cardByType.forEach((card, cardType) => card.classList.toggle("match-game-hurdle-card-active", cardType === hurdleType));

    setText(this.root, "[data-selected-hurdle-name]", hurdle.name);
    setText(this.root, "[data-selected-hurdle-symbol]", hurdle.symbol);
    setText(this.root, "[data-selected-hurdle-description]", hurdle.description);

    const rule = this.ruleByType[hurdleType];
    setText(this.root, "[data-hurdle-energy-cost]", rule ? String(rule.energyCost) : "–");

    const durationInput = this.root.querySelector<HTMLInputElement>("[data-hurdle-duration-input]");

    if (durationInput && rule) {
      const durationMs = this.durationMsByType[hurdleType] ?? rule.durationMs;

      durationInput.min = String(rule.durationMsMin / DURATION_STEP_MS);
      durationInput.max = String(rule.durationMsMax / DURATION_STEP_MS);
      durationInput.value = String(durationMs / DURATION_STEP_MS);
      setText(this.root, "[data-hurdle-duration-value]", String(durationMs / DURATION_STEP_MS).padStart(2, "0"));
    }
  }

  // the duration the saboteur picked for one type, undefined lets the backend use its default
  durationMsGet(hurdleType: string): number | undefined {
    return this.durationMsByType[hurdleType];
  }

  render(state: SaboteurDeckRenderState): void {
    const cooldownUntilMsByType = Array.isArray(state.cooldownUntilMsByType) ? {} : state.cooldownUntilMsByType ?? {};
    const activeHurdleList = (state.hurdles ?? []).filter((hurdle) => hurdle.expiresAtMs > state.serverNowMs);

    // cards: cooldown time left, or dimmed when energy is short
    for (const hurdle of SABOTEUR_DECK_HURDLE_LIST) {
      const card = this.cardByType.get(hurdle.type);
      const rule = this.ruleByType[hurdle.type];

      if (!card || !rule) {
        continue;
      }

      const cooldownRemainingMs = (cooldownUntilMsByType[hurdle.type] ?? 0) - state.serverNowMs;
      const status = card.querySelector<HTMLElement>("em");
      const unavailable = cooldownRemainingMs > 0 || state.energyCurrent < rule.energyCost;

      card.classList.toggle("match-game-hurdle-card-unavailable", unavailable);

      if (status) {
        status.textContent = cooldownRemainingMs > 0 ? `⏱ ${secondsTextGet(cooldownRemainingMs)}` : `ϟ ${rule.energyCost}`;
      }

      if (hurdle.type === this.selectedType) {
        setText(
          this.root,
          "[data-hurdle-cooldown-text]",
          cooldownRemainingMs > 0
            ? `Cooldown ${secondsTextGet(cooldownRemainingMs)}`
            : state.energyCurrent < rule.energyCost
              ? "Not enough energy"
              : "Ready"
        );
      }
    }

    // top bar
    setText(this.root, "[data-match-energy-recovery]", `+${state.energyRecoveryPerSecond ?? 0} / sec`);
    setText(this.root, "[data-match-hurdle-count]", String(activeHurdleList.length));
    setText(this.root, "[data-match-hurdle-count-max]", String(state.activeHurdleCountMax ?? 5));

    this.activeHurdleListRender(activeHurdleList, state.serverNowMs);
    this.redSignalRender(activeHurdleList, state.serverNowMs);
  }

  private activeHurdleListRender(activeHurdleList: MatchSyncHurdle[], serverNowMs: number): void {
    const list = this.root.querySelector<HTMLElement>("[data-match-active-hurdle-list]");

    if (!list) {
      return;
    }

    if (activeHurdleList.length === 0) {
      const empty = document.createElement("p");
      empty.className = "match-game-muted";
      empty.textContent = "No hurdles active";
      list.replaceChildren(empty);
      return;
    }

    list.replaceChildren(
      ...activeHurdleList.map((hurdle) => {
        const row = document.createElement("div");
        const name = document.createElement("strong");
        const remaining = document.createElement("span");

        row.className = "match-game-list-row";
        name.textContent = SABOTEUR_DECK_HURDLE_LIST.find((entry) => entry.type === hurdle.type)?.name ?? hurdle.type;
        remaining.textContent = secondsTextGet(hurdle.expiresAtMs - serverNowMs);
        row.append(name, remaining);

        return row;
      })
    );
  }

  private redSignalRender(activeHurdleList: MatchSyncHurdle[], serverNowMs: number): void {
    const redList = activeHurdleList.filter((hurdle) => hurdle.type === "redTrafficLight");
    const fill = this.root.querySelector<HTMLElement>("[data-match-red-signal-fill]");

    if (redList.length === 0) {
      setText(this.root, "[data-match-red-signal-title]", "No Red Lights");
      setText(this.root, "[data-match-red-signal-detail]", "All signals green");

      if (fill) {
        fill.style.width = "0%";
      }

      return;
    }

    // the meter shows how much of the longest running red light is left
    const longest = redList.reduce((best, hurdle) => (hurdle.expiresAtMs > best.expiresAtMs ? hurdle : best));
    const totalMs = Math.max(1, longest.expiresAtMs - longest.startedAtMs);
    const remainingMs = Math.max(0, longest.expiresAtMs - serverNowMs);

    setText(this.root, "[data-match-red-signal-title]", redList.length === 1 ? "Active Red Light" : `${redList.length} Active Red Lights`);
    setText(this.root, "[data-match-red-signal-detail]", `Green again in ${secondsTextGet(remainingMs)}`);

    if (fill) {
      fill.style.width = `${Math.round((remainingMs / totalMs) * 100)}%`;
    }
  }

  private cardCreate(hurdle: SaboteurDeckHurdle): HTMLButtonElement {
    const card = document.createElement("button");
    const symbol = document.createElement("span");
    const name = document.createElement("strong");
    const status = document.createElement("em");
    const key = document.createElement("kbd");

    card.type = "button";
    card.className = "match-game-hurdle-card";
    card.dataset.matchHurdleButton = "";
    card.dataset.hurdleType = hurdle.type;
    card.title = `${hurdle.description} (key ${hurdle.key})`;
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = hurdle.symbol;
    name.textContent = hurdle.name;
    key.textContent = hurdle.key;
    card.append(symbol, name, status, key);

    const onClick = (): void => {
      card.blur();
      this.selectionShow(hurdle.type);
      this.callbacks.hurdleSelected(hurdle.type);
    };

    card.addEventListener("click", onClick);
    this.cleanupList.push(() => card.removeEventListener("click", onClick));
    this.cardByType.set(hurdle.type, card);
    this.cardCostShow(hurdle.type);

    return card;
  }

  private cardCostShow(hurdleType: string): void {
    const status = this.cardByType.get(hurdleType)?.querySelector<HTMLElement>("em");
    const rule = this.ruleByType[hurdleType];

    if (status) {
      status.textContent = rule ? `ϟ ${rule.energyCost}` : "ϟ –";
    }
  }
}
