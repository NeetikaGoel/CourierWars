import "./HomeSetupPage.css";
import homeSetupPageHtml from "./HomeSetupPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../shared/PageErrorBox";
import { pageLoadingSet } from "../shared/PageLoadingSpinner";
import { FrontendMatchStatusValue } from "../../constants/FrontendMatchStatusValue";

export interface HomeSetupPageProfileStats {
  totalMatches?: number;
  totalWins?: number;
  totalLosses?: number;
  courierMatches?: number;
  courierWins?: number;
  courierLosses?: number;
  saboteurMatches?: number;
  saboteurWins?: number;
  saboteurLosses?: number;
  fastestDeliveryMs?: number | null;
  bestSaboteurDelayMs?: number | null;
  preferredRole?: string;
  lastPlayedRole?: string | null;
}

export interface HomeSetupPageProfile {
  user?: {
    userId?: number;
    username?: string;
    name?: string | null;
    email?: string | null;
    isGuest?: boolean;
    createdAt?: string;
  };
  stats?: HomeSetupPageProfileStats;
}

export interface HomeSetupPageProfileApi {
  getProfile: () => Promise<HomeSetupPageProfile>;
}

export interface HomeSetupPageMatchCreateResponse {
  matchId?: string | number;
  status?: number;
  assignedRole?: string;
}

export interface HomeSetupPageMatchApi {
  create: (payload: {
    difficulty: string;
    rolePreference: string;
    mapVersion: string;
    mapGenerationVersion: string;
  }) => Promise<HomeSetupPageMatchCreateResponse>;
}

export interface HomeSetupPageActions {
  goToLanding: () => void;
  goToMatchWaiting?: (
    matchId: string,
    launchData: {
      assignedRole: string;
      rolePreference: string;
      difficulty: string;
      mapId: string;
      mapName: string;
      mapVersion: string;
      mapGenerationVersion: string;
    }
  ) => void;
  goToMatchLoading?: (matchId: string) => void;
}

export interface HomeSetupPageDependencies {
  profileApi?: HomeSetupPageProfileApi;
  matchApi?: HomeSetupPageMatchApi;
  actions: HomeSetupPageActions;
}

const HOME_MAP_VERSION = "v1";
const HOME_MAP_GENERATION_VERSION = "city_map_generation_v7";
const HOME_MAP_ID = "neo-city";
const HOME_MAP_NAME = "Neo City";

function numberText(value: number | undefined | null): string {
  return String(value ?? 0);
}

function percentageText(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function msToClockText(value: number | null | undefined): string {
  if (!value || value <= 0) {
    return "--:--";
  }

  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
}

function setSelectedButton(buttonList: HTMLButtonElement[], selectedButton: HTMLButtonElement): void {
  buttonList.forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("home-setup-choice-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function safeStats(profile: HomeSetupPageProfile): Required<HomeSetupPageProfileStats> {
  const stats = profile.stats ?? {};
  const totalMatches = stats.totalMatches ?? 0;
  const totalWins = stats.totalWins ?? 0;
  const courierMatches = stats.courierMatches ?? 0;
  const courierWins = stats.courierWins ?? 0;
  const totalLosses = stats.totalLosses ?? Math.max(0, totalMatches - totalWins);
  const courierLosses = stats.courierLosses ?? Math.max(0, courierMatches - courierWins);
  const saboteurMatches = stats.saboteurMatches ?? Math.max(0, totalMatches - courierMatches);
  const saboteurWins = stats.saboteurWins ?? Math.max(0, totalWins - courierWins);
  const saboteurLosses = stats.saboteurLosses ?? Math.max(0, saboteurMatches - saboteurWins);

  return {
    totalMatches,
    totalWins,
    totalLosses,
    courierMatches,
    courierWins,
    courierLosses,
    saboteurMatches,
    saboteurWins,
    saboteurLosses,
    fastestDeliveryMs: stats.fastestDeliveryMs ?? null,
    bestSaboteurDelayMs: stats.bestSaboteurDelayMs ?? null,
    preferredRole: stats.preferredRole ?? "courier",
    lastPlayedRole: stats.lastPlayedRole ?? null,
  };
}

function renderProfile(root: HTMLElement, profile: HomeSetupPageProfile): void {
  const user = profile.user ?? {};
  const stats = safeStats(profile);
  const name = user.name || user.username || "Player";
  const shownRole = stats.lastPlayedRole || stats.preferredRole || "courier";
  const winRate = stats.totalMatches > 0 ? (stats.totalWins / stats.totalMatches) * 100 : 0;

  setText(root, "[data-home-profile-name]", name);
  setText(root, "[data-home-sidebar-name]", name);
  setText(root, "[data-home-sidebar-role]", shownRole.toUpperCase());
  setText(root, "[data-home-profile-status]", user.isGuest ? "GUEST ONLINE" : "ONLINE");

  setText(root, "[data-home-stat-total-matches]", numberText(stats.totalMatches));
  setText(root, "[data-home-stat-total-wins]", numberText(stats.totalWins));
  setText(root, "[data-home-stat-total-losses]", numberText(stats.totalLosses));
  setText(root, "[data-home-stat-win-rate]", percentageText(winRate));

  setText(root, "[data-home-stat-courier-wins]", numberText(stats.courierWins));
  setText(root, "[data-home-stat-courier-losses]", numberText(stats.courierLosses));
  setText(root, "[data-home-stat-saboteur-wins]", numberText(stats.saboteurWins));
  setText(root, "[data-home-stat-saboteur-losses]", numberText(stats.saboteurLosses));

  setText(root, "[data-home-stat-fastest-delivery]", msToClockText(stats.fastestDeliveryMs));
  setText(root, "[data-home-stat-best-saboteur-delay]", msToClockText(stats.bestSaboteurDelayMs));

  if (user.createdAt) {
    const year = new Date(user.createdAt).getFullYear();
    setText(root, "[data-home-member-since]", Number.isFinite(year) ? `Member since ${year}` : "Member since 2026");
  }
}

function renderFallbackProfile(root: HTMLElement): void {
  renderProfile(root, {
    user: {
      name: "Neetika Goel",
      username: "neetika",
      isGuest: false,
      createdAt: "2026-05-01T00:00:00.000Z",
    },
    stats: {
      totalMatches: 48,
      totalWins: 27,
      totalLosses: 21,
      courierMatches: 27,
      courierWins: 16,
      courierLosses: 11,
      saboteurMatches: 21,
      saboteurWins: 11,
      saboteurLosses: 10,
      fastestDeliveryMs: 138000,
      bestSaboteurDelayMs: 292000,
      preferredRole: "courier",
      lastPlayedRole: "courier",
    },
  });
}

function assignedRoleFromResponseGet(response: HomeSetupPageMatchCreateResponse, selectedRole: string): string {
  // this uses backend assigned role when available
  if (response.assignedRole) {
    return response.assignedRole;
  }

  // this gives a playable fallback when user selected any
  if (selectedRole === "any") {
    return "courier";
  }

  // this keeps selected role for courier or saboteur
  return selectedRole;
}

function goToWaitingOrLoading(
  deps: HomeSetupPageDependencies,
  matchId: string,
  assignedRole: string,
  selectedRole: string,
  selectedDifficulty: string,
  status: number | undefined
): void {
  // this sends player to waiting page when backend says match is waiting
  if (status === FrontendMatchStatusValue.Waiting && deps.actions.goToMatchWaiting) {
    deps.actions.goToMatchWaiting(matchId, {
      assignedRole,
      rolePreference: selectedRole,
      difficulty: selectedDifficulty,
      mapId: HOME_MAP_ID,
      mapName: HOME_MAP_NAME,
      mapVersion: HOME_MAP_VERSION,
      mapGenerationVersion: HOME_MAP_GENERATION_VERSION,
    });
    return;
  }

  // this sends player directly to loading when match is ready or active
  if (deps.actions.goToMatchLoading) {
    deps.actions.goToMatchLoading(matchId);
    return;
  }

  // this is a fallback until all route handlers are connected
  pageErrorShow(document.body, "Match page route is not connected yet");
}

export async function mountHomeSetupPage(root: HTMLElement, deps: HomeSetupPageDependencies): Promise<() => void> {
  root.innerHTML = homeSetupPageHtml;

  let selectedRole = "any";
  let selectedDifficulty = "medium";

  const roleButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-home-role-option]"));
  const difficultyButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-home-difficulty-option]"));
  const startButton = root.querySelector<HTMLButtonElement>("[data-home-start-match]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-home-back-button]");
  const backButtonSecondary = root.querySelector<HTMLButtonElement>("[data-home-back-button-secondary]");
  const mapCard = root.querySelector<HTMLButtonElement>("[data-home-map-option]");
  const mapInfoButton = root.querySelector<HTMLElement>("[data-home-map-info]");
  const clickableOnlyButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(
      "[data-home-nav-stats], [data-home-nav-features], [data-home-nav-how-to-play], [data-home-nav-settings], [data-home-setting-mode], [data-home-setting-lives], [data-home-setting-cooldown]"
    )
  );
  const homeNavButton = root.querySelector<HTMLButtonElement>("[data-home-nav-home]");
  const playNavButton = root.querySelector<HTMLButtonElement>("[data-home-nav-play]");

  const onRoleClickHandlers = roleButtons.map((button) => {
    const handler = (): void => {
      selectedRole = button.dataset.homeRoleOption || "any";
      setSelectedButton(roleButtons, button);
    };

    button.addEventListener("click", handler);

    return { button, handler };
  });

  const onDifficultyClickHandlers = difficultyButtons.map((button) => {
    const handler = (): void => {
      selectedDifficulty = button.dataset.homeDifficultyOption || "medium";
      setSelectedButton(difficultyButtons, button);
    };

    button.addEventListener("click", handler);

    return { button, handler };
  });

  const showPrototypeMessage = (): void => {
    pageErrorShow(root, "This section is not available in the prototype yet");
  };

  const onStartMatch = async (): Promise<void> => {
    pageErrorClear(root);

    try {
      startButton?.setAttribute("disabled", "true");
      pageLoadingSet(root, true, "Creating match...");

      // this branch keeps the page working before real match api is connected
      if (!deps.matchApi) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));

        const prototypeMatchId = "prototype-match";
        const prototypeAssignedRole = selectedRole === "any" ? "courier" : selectedRole;

        goToWaitingOrLoading(
          deps,
          prototypeMatchId,
          prototypeAssignedRole,
          selectedRole,
          selectedDifficulty,
          FrontendMatchStatusValue.Waiting
        );
        return;
      }

      // this calls real or fake match create api
      const response = await deps.matchApi.create({
        difficulty: selectedDifficulty,
        rolePreference: selectedRole,
        mapVersion: HOME_MAP_VERSION,
        mapGenerationVersion: HOME_MAP_GENERATION_VERSION,
      });

      const matchId = String(response.matchId ?? "");

      if (!matchId) {
        pageErrorShow(root, "Match was created but match id was missing");
        return;
      }

      const assignedRole = assignedRoleFromResponseGet(response, selectedRole);

      goToWaitingOrLoading(
        deps,
        matchId,
        assignedRole,
        selectedRole,
        selectedDifficulty,
        response.status
      );
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Unable to create match");
    } finally {
      startButton?.removeAttribute("disabled");
      pageLoadingSet(root, false);
    }
  };

  const onBack = (): void => {
    deps.actions.goToLanding();
  };

  const onMapInfo = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    pageErrorShow(root, "Map info will be available after backend map generation is connected");
  };

  const onMapClick = (): void => {
    pageErrorClear(root);
    mapCard?.classList.add("home-setup-choice-selected");
  };

  startButton?.addEventListener("click", onStartMatch);
  backButton?.addEventListener("click", onBack);
  backButtonSecondary?.addEventListener("click", onBack);
  homeNavButton?.addEventListener("click", onBack);
  playNavButton?.addEventListener("click", showPrototypeMessage);
  mapCard?.addEventListener("click", onMapClick);
  mapInfoButton?.addEventListener("click", onMapInfo);

  clickableOnlyButtons.forEach((button) => {
    button.addEventListener("click", showPrototypeMessage);
  });

  renderFallbackProfile(root);

  if (deps.profileApi) {
    try {
      const profile = await deps.profileApi.getProfile();
      renderProfile(root, profile);
    } catch {
      renderFallbackProfile(root);
    }
  }

  return () => {
    startButton?.removeEventListener("click", onStartMatch);
    backButton?.removeEventListener("click", onBack);
    backButtonSecondary?.removeEventListener("click", onBack);
    homeNavButton?.removeEventListener("click", onBack);
    playNavButton?.removeEventListener("click", showPrototypeMessage);
    mapCard?.removeEventListener("click", onMapClick);
    mapInfoButton?.removeEventListener("click", onMapInfo);

    clickableOnlyButtons.forEach((button) => {
      button.removeEventListener("click", showPrototypeMessage);
    });

    onRoleClickHandlers.forEach(({ button, handler }) => {
      button.removeEventListener("click", handler);
    });

    onDifficultyClickHandlers.forEach(({ button, handler }) => {
      button.removeEventListener("click", handler);
    });
  };
}