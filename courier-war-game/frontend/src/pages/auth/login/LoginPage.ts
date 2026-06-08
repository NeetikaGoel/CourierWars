import "./LoginPage.css";
import loginPageHtml from "./LoginPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { pageFirstError, pageInputValue, pageLengthBetween } from "../../shared/PageFormValidator";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface LoginPageAuthApi {
  login: (payload: { identifier: string; password: string }) => Promise<void>;
}

export interface LoginPageActions {
  goToHome: () => void;
  goToLanding: () => void;
  goToRegister: () => void;
  goToGuest: () => void;
}

export interface LoginPageDependencies {
  authApi: LoginPageAuthApi;
  actions: LoginPageActions;
}

const LOGIN_IDENTIFIER_STORAGE_KEY = "cw_login_identifier";

export async function mountLoginPage(root: HTMLElement, deps: LoginPageDependencies): Promise<() => void> {
  root.innerHTML = loginPageHtml;

  const form = root.querySelector<HTMLFormElement>("[data-login-form]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-back-button]");
  const registerTab = root.querySelector<HTMLButtonElement>("[data-register-tab]");
  const registerLink = root.querySelector<HTMLButtonElement>("[data-register-link]");
  const registerButton = root.querySelector<HTMLButtonElement>("[data-register-button]");
  const guestTab = root.querySelector<HTMLButtonElement>("[data-guest-tab]");
  const guestButton = root.querySelector<HTMLButtonElement>("[data-guest-button]");
  const forgotButton = root.querySelector<HTMLButtonElement>("[data-forgot-password]");
  const passwordToggle = root.querySelector<HTMLButtonElement>("[data-password-toggle]");
  const submitButton = root.querySelector<HTMLButtonElement>(".login-primary-button");
  const identifierInput = root.querySelector<HTMLInputElement>("[data-login-identifier]");
  const rememberCheckbox = root.querySelector<HTMLInputElement>("[data-login-remember]");

  const savedIdentifier = localStorage.getItem(LOGIN_IDENTIFIER_STORAGE_KEY);

  if (savedIdentifier && identifierInput) {
    identifierInput.value = savedIdentifier;
  }

  const onPasswordToggle = (): void => {
    const input = root.querySelector<HTMLInputElement>("[data-login-password]");

    if (!input || !passwordToggle) {
      return;
    }

    const isPasswordVisible = input.type === "text";
    input.type = isPasswordVisible ? "password" : "text";
    passwordToggle.setAttribute("aria-pressed", String(!isPasswordVisible));
  };

  const onForgotPassword = (): void => {
    pageErrorShow(root, "Forgot password is not available in this prototype yet");
  };

  const onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    pageErrorClear(root);

    const identifier = pageInputValue(root, "[data-login-identifier]");
    const password = pageInputValue(root, "[data-login-password]");

    const error = pageFirstError([
      pageLengthBetween(identifier, "Email or username", 3, 254),
      pageLengthBetween(password, "Password", 8, 72),
    ]);

    if (error) {
      pageErrorShow(root, error);
      return;
    }

    try {
      submitButton?.setAttribute("disabled", "true");
      pageLoadingSet(root, true, "Logging in...");

      if (rememberCheckbox?.checked) {
        localStorage.setItem(LOGIN_IDENTIFIER_STORAGE_KEY, identifier);
      } else {
        localStorage.removeItem(LOGIN_IDENTIFIER_STORAGE_KEY);
      }

      await deps.authApi.login({ identifier, password });
      deps.actions.goToHome();
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Login failed");
    } finally {
      submitButton?.removeAttribute("disabled");
      pageLoadingSet(root, false);
    }
  };

  form?.addEventListener("submit", onSubmit);
  backButton?.addEventListener("click", deps.actions.goToLanding);
  registerTab?.addEventListener("click", deps.actions.goToRegister);
  registerLink?.addEventListener("click", deps.actions.goToRegister);
  registerButton?.addEventListener("click", deps.actions.goToRegister);
  guestTab?.addEventListener("click", deps.actions.goToGuest);
  guestButton?.addEventListener("click", deps.actions.goToGuest);
  forgotButton?.addEventListener("click", onForgotPassword);
  passwordToggle?.addEventListener("click", onPasswordToggle);

  return () => {
    form?.removeEventListener("submit", onSubmit);
    backButton?.removeEventListener("click", deps.actions.goToLanding);
    registerTab?.removeEventListener("click", deps.actions.goToRegister);
    registerLink?.removeEventListener("click", deps.actions.goToRegister);
    registerButton?.removeEventListener("click", deps.actions.goToRegister);
    guestTab?.removeEventListener("click", deps.actions.goToGuest);
    guestButton?.removeEventListener("click", deps.actions.goToGuest);
    forgotButton?.removeEventListener("click", onForgotPassword);
    passwordToggle?.removeEventListener("click", onPasswordToggle);
  };
}