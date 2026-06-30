import "./AuthLoadingPage.css";
import authLoadingPageHtml from "./AuthLoadingPage.html?raw";
import { ApiClientError } from "../../../common/api/ApiClient";

type AuthLoadingStepName = "tokens" | "profile" | "userData" | "gameData";
type AuthLoadingStepStatus = "waiting" | "active" | "complete" | "error";
type AuthLoadingSessionSource = "access" | "refresh" | "none";

export interface AuthLoadingAuthApi {
  refresh: () => Promise<unknown>;
}

export interface AuthLoadingProfileApi {
  getProfile: (options?: { authRetry?: boolean }) => Promise<unknown>;
}

export interface AuthLoadingPageDependencies {
  authApi: AuthLoadingAuthApi;
  profileApi: AuthLoadingProfileApi;
  actions: {
    goToHome: () => void;
    goToLanding: () => void;
  };
}

const AUTH_LOADING_STEP_COMPLETE_PAUSE_MS = 450;
const AUTH_LOADING_NO_SESSION_PAUSE_MS = 650;

const EXPECTED_NO_SESSION_STATUS_CODES = new Set([401, 403]);

const EXPECTED_NO_SESSION_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "CSRF_TOKEN_REQUIRED",
  "CSRF_TOKEN_INVALID",
]);

const EXPECTED_NO_SESSION_MESSAGE_PARTS = [
  "no saved session",
  "no access token",
  "no refresh token",
  "refresh token",
  "csrf",
  "unauthorized",
  "forbidden",
];

export async function mountAuthLoadingPage(root: HTMLElement, deps: AuthLoadingPageDependencies): Promise<() => void> {
  root.innerHTML = authLoadingPageHtml;

  let isDestroyed = false;
  const timeoutList: number[] = [];

  const sleep = (durationMs: number): Promise<void> => {
    return new Promise((resolve) => {
      const timeoutId = window.setTimeout(resolve, durationMs);
      timeoutList.push(timeoutId);
    });
  };

  const textSet = (title: string, message: string): void => {
    const titleElement = root.querySelector<HTMLElement>("[data-auth-loading-title]");
    const messageElement = root.querySelector<HTMLElement>("[data-auth-loading-message]");

    if (titleElement) {
      titleElement.textContent = title;
    }

    if (messageElement) {
      messageElement.textContent = message;
    }
  };

  const stepStatusSet = (stepName: AuthLoadingStepName, status: AuthLoadingStepStatus): void => {
    const stepElement = root.querySelector<HTMLElement>(`[data-auth-step="${stepName}"]`);
    const statusElement = root.querySelector<HTMLElement>(`[data-auth-step-status="${stepName}"]`);

    if (!stepElement || !statusElement) {
      return;
    }

    stepElement.classList.remove(
      "auth-loading-step-active",
      "auth-loading-step-complete",
      "auth-loading-step-error"
    );

    if (status === "active") {
      stepElement.classList.add("auth-loading-step-active");
      statusElement.textContent = "...";
      return;
    }

    if (status === "complete") {
      stepElement.classList.add("auth-loading-step-complete");
      statusElement.textContent = "✓";
      return;
    }

    if (status === "error") {
      stepElement.classList.add("auth-loading-step-error");
      statusElement.textContent = "!";
      return;
    }

    statusElement.textContent = ".";
  };

  const stepsReset = (): void => {
    stepStatusSet("tokens", "waiting");
    stepStatusSet("profile", "waiting");
    stepStatusSet("userData", "waiting");
    stepStatusSet("gameData", "waiting");

    textSet(
      "Validating Tokens",
      "Checking whether a saved access token or refresh token can restore your session."
    );
  };

  const stepComplete = async (stepName: AuthLoadingStepName): Promise<void> => {
    stepStatusSet(stepName, "complete");
    await sleep(AUTH_LOADING_STEP_COMPLETE_PAUSE_MS);
  };

  const expectedNoSessionErrorCheck = (error: unknown): boolean => {
    if (error instanceof ApiClientError) {
      if (typeof error.status === "number" && EXPECTED_NO_SESSION_STATUS_CODES.has(error.status)) {
        return true;
      }

      if (typeof error.code === "string" && EXPECTED_NO_SESSION_ERROR_CODES.has(error.code)) {
        return true;
      }
    }

    if (error instanceof Error) {
      const normalizedMessage = error.message.toLowerCase();

      return EXPECTED_NO_SESSION_MESSAGE_PARTS.some((messagePart) =>
        normalizedMessage.includes(messagePart)
      );
    }

    return false;
  };

  const directAccessSessionCheck = async (): Promise<AuthLoadingSessionSource> => {
    stepStatusSet("tokens", "active");
    textSet("Checking Saved Session", "Trying saved access token first.");

    await deps.profileApi.getProfile({ authRetry: false });

    textSet("Access Token Valid", "Signed in using the saved access token.");
    await stepComplete("tokens");

    return "access";
  };

  const refreshSessionCheck = async (): Promise<AuthLoadingSessionSource> => {
    stepStatusSet("tokens", "active");
    textSet("Refreshing Session", "Saved access token was not usable. Trying refresh token now.");

    await deps.authApi.refresh();
    await deps.profileApi.getProfile({ authRetry: false });

    textSet("Session Refreshed", "Refresh token issued a new access token.");
    await stepComplete("tokens");

    return "refresh";
  };

  const sessionSourceGet = async (): Promise<AuthLoadingSessionSource> => {
    try {
      return await directAccessSessionCheck();
    } catch (error) {
      if (!expectedNoSessionErrorCheck(error)) {
        throw error;
      }
    }

    try {
      return await refreshSessionCheck();
    } catch (error) {
      if (expectedNoSessionErrorCheck(error)) {
        return "none";
      }

      throw error;
    }
  };

  const successfulSessionComplete = async (sessionSource: Exclude<AuthLoadingSessionSource, "none">): Promise<void> => {
    const profileMessage = sessionSource === "access"
      ? "Loading profile from saved access-token session."
      : "Loading profile from refreshed session.";

    stepStatusSet("profile", "active");
    textSet("Loading Profile", profileMessage);
    await stepComplete("profile");

    stepStatusSet("userData", "active");
    textSet("Fetching User Data", "Loading stats, role preference, and progress data.");
    await stepComplete("userData");

    stepStatusSet("gameData", "active");
    textSet("Preparing Game Data", "Preparing dashboard, match setup, and game entry.");
    await stepComplete("gameData");

    if (!isDestroyed) {
      textSet("Ready", "Opening home.");
      deps.actions.goToHome();
    }
  };

  const noSessionComplete = async (message: string): Promise<void> => {
    stepStatusSet("tokens", "error");
    stepStatusSet("profile", "waiting");
    stepStatusSet("userData", "waiting");
    stepStatusSet("gameData", "waiting");

    textSet("No Saved Session", message);

    await sleep(AUTH_LOADING_NO_SESSION_PAUSE_MS);

    if (!isDestroyed) {
      deps.actions.goToLanding();
    }
  };

  const sessionCheckRun = async (): Promise<void> => {
    stepsReset();

    try {
      const sessionSource = await sessionSourceGet();

      if (sessionSource === "none") {
        await noSessionComplete("No access token or refresh session was usable.");
        return;
      }

      await successfulSessionComplete(sessionSource);
    } catch {
      await noSessionComplete("Session check failed. Please sign in again.");
    }
  };

  void sessionCheckRun();

  return () => {
    isDestroyed = true;

    for (const timeoutId of timeoutList) {
      window.clearTimeout(timeoutId);
    }

    timeoutList.length = 0;
  };
}