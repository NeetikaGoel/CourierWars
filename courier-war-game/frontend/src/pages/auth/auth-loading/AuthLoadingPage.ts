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

const AUTH_LOADING_MINIMUM_VISIBLE_MS = 2200;

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
    message.includes("expired")
  );
}

export async function mountAuthLoadingPage(root: HTMLElement, deps: AuthLoadingPageDependencies): Promise<() => void> {
  root.innerHTML = authLoadingPageHtml;

  let disposed = false;
  const timeoutList: number[] = [];
  const startedAtMs = Date.now();

  const titleElement = root.querySelector<HTMLElement>("[data-auth-loading-title]");
  const messageElement = root.querySelector<HTMLElement>("[data-auth-loading-message]");
  const errorBox = root.querySelector<HTMLElement>("[data-auth-loading-error]");
  const errorMessage = root.querySelector<HTMLElement>("[data-auth-loading-error-message]");
  const retryButton = root.querySelector<HTMLButtonElement>("[data-auth-loading-retry]");
  const continueButton = root.querySelector<HTMLButtonElement>("[data-auth-loading-continue]");

  const minimumWait = async (): Promise<void> => {
    const elapsedMs = Date.now() - startedAtMs;
    const remainingMs = Math.max(0, AUTH_LOADING_MINIMUM_VISIBLE_MS - elapsedMs);

    if (remainingMs > 0) {
      await sleep(remainingMs, timeoutList);
    }
  };

  const setText = (title: string, message: string): void => {
    if (titleElement) {
      titleElement.textContent = title;
    }

    if (messageElement) {
      messageElement.textContent = message;
    }
  };

  const setStepStatus = (stepName: AuthLoadingStepName, status: AuthLoadingStepStatus): void => {
    const step = root.querySelector<HTMLElement>(`[data-auth-step="${stepName}"]`);
    const statusElement = root.querySelector<HTMLElement>(`[data-auth-step-status="${stepName}"]`);

    if (!step || !statusElement) {
      return;
    }

    step.classList.remove("auth-loading-step-active");
    step.classList.remove("auth-loading-step-complete");
    step.classList.remove("auth-loading-step-error");

    if (status === "active") {
      step.classList.add("auth-loading-step-active");
      statusElement.textContent = "○";
    }

    if (status === "complete") {
      step.classList.add("auth-loading-step-complete");
      statusElement.textContent = "✓";
    }

    if (status === "error") {
      step.classList.add("auth-loading-step-error");
      statusElement.textContent = "!";
    }

    if (status === "idle") {
      statusElement.textContent = "○";
    }
  };

  const resetSteps = (): void => {
    setStepStatus("tokens", "idle");
    setStepStatus("profile", "idle");
    setStepStatus("userData", "idle");
    setStepStatus("gameData", "idle");
  };

  const showFatalError = (message: string): void => {
    setText("Session Check Failed", "Something went wrong while checking your saved session.");

    setStepStatus("tokens", "error");
    setStepStatus("profile", "error");

    if (errorMessage) {
      errorMessage.textContent = message;
    }

    if (errorBox) {
      errorBox.hidden = false;
    }
  };

  const hideError = (): void => {
    if (errorBox) {
      errorBox.hidden = true;
    }
  };

  const goToLandingAfterMinimumWait = async (): Promise<void> => {
    setText("No Saved Session", "Taking you to the start screen...");

    setStepStatus("tokens", "complete");
    setStepStatus("profile", "idle");
    setStepStatus("userData", "idle");
    setStepStatus("gameData", "idle");

    await minimumWait();

    if (!disposed) {
      deps.actions.goToLanding();
    }
  };

  const goToHomeAfterProfileLoaded = async (): Promise<void> => {
    setText("Session Found", "Loading your profile and preparing your game dashboard.");

    setStepStatus("tokens", "complete");

    await sleep(260, timeoutList);
    setStepStatus("profile", "complete");

    await sleep(260, timeoutList);
    setStepStatus("userData", "complete");

    await sleep(260, timeoutList);
    setStepStatus("gameData", "complete");

    await minimumWait();

    if (!disposed) {
      deps.actions.goToHome();
    }
  };

  const checkSession = async (): Promise<void> => {
    hideError();
    resetSteps();

    setText("Checking Session...", "Verifying your login session and preparing your experience.");

    try {
      setStepStatus("tokens", "active");
      await sleep(420, timeoutList);

      setStepStatus("tokens", "complete");
      setStepStatus("profile", "active");

      await deps.profileApi.getProfile();

      if (disposed) {
        return;
      }

      await goToHomeAfterProfileLoaded();
    } catch (profileError) {
      if (disposed) {
        return;
      }

      try {
        setText("Refreshing Session...", "Your access token may have expired. Trying refresh token now.");

        setStepStatus("tokens", "active");
        await deps.authApi.refresh();

        setStepStatus("tokens", "complete");
        setStepStatus("profile", "active");

        await deps.profileApi.getProfile();

        if (disposed) {
          return;
        }

        await goToHomeAfterProfileLoaded();
      } catch (refreshError) {
        if (disposed) {
          return;
        }

        if (isExpectedNoSessionError(profileError) || isExpectedNoSessionError(refreshError)) {
          await goToLandingAfterMinimumWait();
          return;
        }

        const errorText = refreshError instanceof Error ? refreshError.message : "Unable to check saved session.";
        showFatalError(errorText);
      }
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