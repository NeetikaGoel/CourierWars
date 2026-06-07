import "./LoginPage.css";
import loginPageHtml from "./LoginPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { pageInputValue, pageFirstError, pageLengthBetween, pageRequiredText } from "../../shared/PageFormValidator";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface LoginPageAuthApi {
  login: (payload: { identifier: string; password: string }) => Promise<void>;
}

export interface LoginPageActions {
  goToHome: () => void;
  goToLanding: () => void;
  goToRegister: () => void;
}

export interface LoginPageDependencies {
  authApi: LoginPageAuthApi;
  actions: LoginPageActions;
}

export async function mountLoginPage(root: HTMLElement, deps: LoginPageDependencies): Promise<() => void> {
  root.innerHTML = loginPageHtml;

  const form = root.querySelector<HTMLFormElement>("[data-login-form]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-back-button]");
  const registerButton = root.querySelector<HTMLButtonElement>("[data-register-button]");

  const onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    pageErrorClear(root);

    const identifier = pageInputValue(root, "[data-login-identifier]");
    const password = pageInputValue(root, "[data-login-password]");

    const error = pageFirstError([
      pageRequiredText(identifier, "Username or email"),
      pageLengthBetween(password, "Password", 8, 72),
    ]);

    if (error) {
      pageErrorShow(root, error);
      return;
    }

    try {
      pageLoadingSet(root, true, "Logging in...");
      await deps.authApi.login({ identifier, password });
      deps.actions.goToHome();
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Login failed");
    } finally {
      pageLoadingSet(root, false);
    }
  };

  form?.addEventListener("submit", onSubmit);
  backButton?.addEventListener("click", deps.actions.goToLanding);
  registerButton?.addEventListener("click", deps.actions.goToRegister);

  return () => {
    form?.removeEventListener("submit", onSubmit);
    backButton?.removeEventListener("click", deps.actions.goToLanding);
    registerButton?.removeEventListener("click", deps.actions.goToRegister);
  };
}