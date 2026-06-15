import "./AuthLoadingPage.css";
import authLoadingPageHtml from "./AuthLoadingPage.html?raw";

export interface AuthLoadingPageAuthApi {
  refresh: () => Promise<void>;
}

export interface AuthLoadingPageProfileApi {
  getProfile: () => Promise<unknown>;
}

export interface AuthLoadingPageActions {
  goToHome: () => void;
  goToLanding: () => void;
}

export interface AuthLoadingPageDependencies {
  authApi: AuthLoadingPageAuthApi;
  profileApi: AuthLoadingPageProfileApi;
  actions: AuthLoadingPageActions;
}

type AuthLoadingStepName = "tokens" | "profile" | "userData" | "gameData";
type AuthLoadingStepStatus = "idle" | "active" | "complete" | "error";

const AUTH_LOADING_STEP_ACTIVE_MS = 760;
const AUTH_LOADING_STEP_COMPLETE_PAUSE_MS = 360;
const AUTH_LOADING_NO_SESSION_VISIBLE_MS = 1600;
const AUTH_LOADING_HOME_VISIBLE_MS = 1000;

function sleep(ms: number, timeoutList: number[]): Promise<void> {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(resolve, ms);
    timeoutList.push(timeoutId);
  });
}

function isExpectedNoSessionError(errorObject: unknown): boolean {
  const message = errorObject instanceof Error ? errorObject.message.toLowerCase() : String(errorObject).toLowerCase();

  return (
    message.includes("unauthorized") ||
    message.includes("no valid") ||
    message.includes("no refresh") ||
    message.includes("missing") ||
    message.includes("expired") ||
    message.includes("no saved") ||
    message.includes("not found")
  );
}

export async function mountAuthLoadingPage(root: HTMLElement, deps: AuthLoadingPageDependencies): Promise<() => void> {
  root.innerHTML = authLoadingPageHtml;

  let disposed = false;
  const timeoutList: number[] = [];

  const titleElement = root.querySelector<HTMLElement>("[data-auth-loading-title]");
  const messageElement = root.querySelector<HTMLElement>("[data-auth-loading-message]");
  const errorBox = root.querySelector<HTMLElement>("[data-auth-loading-error]");
  const errorMessage = root.querySelector<HTMLElement>("[data-auth-loading-error-message]");
  const retryButton = root.querySelector<HTMLButtonElement>("[data-auth-loading-retry]");
  const continueButton = root.querySelector<HTMLButtonElement>("[data-auth-loading-continue]");

  const setText = (title: string, message: string): void => {
    if (titleElement) {
      titleElement.textContent = title;
    }

    if (messageElement) {
      messageElement.textContent = message;
    }
  };

  const setStepStatus = (stepName: AuthLoadingStepName, status: AuthLoadingStepStatus): void => {
    const stepElements = Array.from(root.querySelectorAll<HTMLElement>(`[data-auth-step="${stepName}"]`));
    const statusElements = Array.from(root.querySelectorAll<HTMLElement>(`[data-auth-step-status="${stepName}"]`));

    stepElements.forEach((step) => {
      step.classList.remove("auth-loading-step-active");
      step.classList.remove("auth-loading-step-complete");
      step.classList.remove("auth-loading-step-error");

      if (status === "active") {
        step.classList.add("auth-loading-step-active");
      }

      if (status === "complete") {
        step.classList.add("auth-loading-step-complete");
      }

      if (status === "error") {
        step.classList.add("auth-loading-step-error");
      }
    });

    statusElements.forEach((statusElement) => {
      if (status === "idle") {
        statusElement.textContent = "○";
      }

      if (status === "active") {
        statusElement.textContent = "●";
      }

      if (status === "complete") {
        statusElement.textContent = "✓";
      }

      if (status === "error") {
        statusElement.textContent = "!";
      }
    });
  };

  const resetSteps = (): void => {
    setStepStatus("tokens", "idle");
    setStepStatus("profile", "idle");
    setStepStatus("userData", "idle");
    setStepStatus("gameData", "idle");
  };

  const hideError = (): void => {
    if (errorBox) {
      errorBox.hidden = true;
    }
  };

  const showFatalError = (message: string): void => {
    setText("Session Check Failed", "Something went wrong while checking your saved session.");

    if (errorMessage) {
      errorMessage.textContent = message;
    }

    if (errorBox) {
      errorBox.hidden = false;
    }
  };

  const activateStep = async (stepName: AuthLoadingStepName, title: string, message: string): Promise<void> => {
    if (disposed) {
      return;
    }

    setText(title, message);
    setStepStatus(stepName, "active");

    await sleep(AUTH_LOADING_STEP_ACTIVE_MS, timeoutList);
  };

  const completeStep = async (stepName: AuthLoadingStepName): Promise<void> => {
    if (disposed) {
      return;
    }

    setStepStatus(stepName, "complete");

    await sleep(AUTH_LOADING_STEP_COMPLETE_PAUSE_MS, timeoutList);
  };

  const failStep = async (stepName: AuthLoadingStepName): Promise<void> => {
    if (disposed) {
      return;
    }

    setStepStatus(stepName, "error");

    await sleep(AUTH_LOADING_STEP_COMPLETE_PAUSE_MS, timeoutList);
  };

  const runSuccessFlow = async (): Promise<void> => {
    await activateStep("profile", "Loading Profile...", "Your session is valid. Loading your profile.");
    await completeStep("profile");

    await activateStep("userData", "Fetching User Data...", "Loading stats, preferences, and player information.");
    await completeStep("userData");

    await activateStep("gameData", "Preparing Game Data...", "Preparing your home dashboard.");
    await completeStep("gameData");

    setText("Session Ready", "Everything is ready. Taking you to your dashboard.");

    await sleep(AUTH_LOADING_HOME_VISIBLE_MS, timeoutList);

    if (!disposed) {
      deps.actions.goToHome();
    }
  };

  const runNoSessionFlow = async (): Promise<void> => {
    await activateStep("profile", "Loading Profile...", "No active saved profile was found.");
    await failStep("profile");

    await activateStep("userData", "Fetching User Data...", "Saved user data is not available for this browser session.");
    await failStep("userData");

    await activateStep("gameData", "Preparing Game Data...", "Game dashboard cannot be prepared without a saved session.");
    await failStep("gameData");

    setText("No Saved Session", "Taking you to the start screen.");

    await sleep(AUTH_LOADING_NO_SESSION_VISIBLE_MS, timeoutList);

    if (!disposed) {
      deps.actions.goToLanding();
    }
  };

  const checkProfileDirectly = async (): Promise<boolean> => {
    await activateStep("tokens", "Validating Tokens...", "Checking saved access token and session metadata.");

    try {
      await deps.profileApi.getProfile();

      if (disposed) {
        return false;
      }

      await completeStep("tokens");

      return true;
    } catch {
      if (disposed) {
        return false;
      }

      return false;
    }
  };

  const checkRefreshThenProfile = async (): Promise<boolean> => {
    setText("Refreshing Session...", "Access token may have expired. Trying refresh token now.");
    setStepStatus("tokens", "active");

    await sleep(AUTH_LOADING_STEP_ACTIVE_MS, timeoutList);

    await deps.authApi.refresh();

    if (disposed) {
      return false;
    }

    await completeStep("tokens");

    await deps.profileApi.getProfile();

    if (disposed) {
      return false;
    }

    return true;
  };

  const checkSession = async (): Promise<void> => {
    hideError();
    resetSteps();

    setText("Checking Session...", "Verifying your login session and preparing your experience.");

    const directProfileSuccess = await checkProfileDirectly();

    if (disposed) {
      return;
    }

    if (directProfileSuccess) {
      await runSuccessFlow();
      return;
    }

    try {
      const refreshProfileSuccess = await checkRefreshThenProfile();

      if (disposed) {
        return;
      }

      if (refreshProfileSuccess) {
        await runSuccessFlow();
        return;
      }

      setStepStatus("tokens", "complete");
      await runNoSessionFlow();
    } catch (refreshError) {
      if (disposed) {
        return;
      }

      if (isExpectedNoSessionError(refreshError)) {
        setStepStatus("tokens", "complete");
        await runNoSessionFlow();
        return;
      }

      setStepStatus("tokens", "error");
      setStepStatus("profile", "error");
      setStepStatus("userData", "error");
      setStepStatus("gameData", "error");

      const errorText = refreshError instanceof Error ? refreshError.message : "Unable to check saved session.";
      showFatalError(errorText);
    }
  };

  const onRetry = (): void => {
    void checkSession();
  };

  const onContinue = (): void => {
    deps.actions.goToLanding();
  };

  retryButton?.addEventListener("click", onRetry);
  continueButton?.addEventListener("click", onContinue);

  void checkSession();

  return () => {
    disposed = true;

    for (const timeoutId of timeoutList) {
      window.clearTimeout(timeoutId);
    }

    retryButton?.removeEventListener("click", onRetry);
    continueButton?.removeEventListener("click", onContinue);
  };
}