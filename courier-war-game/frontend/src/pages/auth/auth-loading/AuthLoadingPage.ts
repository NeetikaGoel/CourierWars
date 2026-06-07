import "./AuthLoadingPage.css";
import authLoadingPageHtml from "./AuthLoadingPage.html?raw";
import { pageErrorShow } from "../../shared/PageErrorBox";

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

export async function mountAuthLoadingPage(root: HTMLElement, deps: AuthLoadingPageDependencies): Promise<() => void> {
  let cancelled = false;

  root.innerHTML = authLoadingPageHtml;

  const runAuthCheck = async (): Promise<void> => {
    try {
      await deps.profileApi.getProfile();

      if (!cancelled) {
        deps.actions.goToHome();
      }
    } catch {
      try {
        await deps.authApi.refresh();
        await deps.profileApi.getProfile();

        if (!cancelled) {
          deps.actions.goToHome();
        }
      } catch (errorObject) {
        if (!cancelled) {
          pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Session expired");
          window.setTimeout(deps.actions.goToLanding, 800);
        }
      }
    }
  };

  void runAuthCheck();

  return () => {
    cancelled = true;
  };
}