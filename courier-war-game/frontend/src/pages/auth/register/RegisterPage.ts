import "./RegisterPage.css";
import registerPageHtml from "./RegisterPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { pageEmailLooksValid, pageFirstError, pageInputValue, pageLengthBetween } from "../../shared/PageFormValidator";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface RegisterPageAuthApi {
  register: (payload: { username: string; email: string; password: string; name?: string; preferredRole: string }) => Promise<void>;
}

export interface RegisterPageActions {
  goToHome: () => void;
  goToLanding: () => void;
  goToLogin: () => void;
  goToGuest: () => void;
}

export interface RegisterPageDependencies {
  authApi: RegisterPageAuthApi;
  actions: RegisterPageActions;
}

export async function mountRegisterPage(root: HTMLElement, deps: RegisterPageDependencies): Promise<() => void> {
  root.innerHTML = registerPageHtml;

  const form = root.querySelector<HTMLFormElement>("[data-register-form]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-back-button]");
  const loginTab = root.querySelector<HTMLButtonElement>("[data-login-tab]");
  const loginLink = root.querySelector<HTMLButtonElement>("[data-login-link]");
  const guestTab = root.querySelector<HTMLButtonElement>("[data-guest-tab]");
  const guestButton = root.querySelector<HTMLButtonElement>("[data-guest-button]");
  const passwordToggle = root.querySelector<HTMLButtonElement>("[data-password-toggle]");
  const confirmPasswordToggle = root.querySelector<HTMLButtonElement>("[data-confirm-password-toggle]");
  const submitButton = root.querySelector<HTMLButtonElement>(".register-primary-button");

  const togglePasswordInput = (selector: string, button: HTMLButtonElement | null): void => {
    const input = root.querySelector<HTMLInputElement>(selector);

    if (!input || !button) {
      return;
    }

    const isPasswordVisible = input.type === "text";
    input.type = isPasswordVisible ? "password" : "text";
    button.setAttribute("aria-pressed", String(!isPasswordVisible));
  };

  const onPasswordToggle = (): void => {
    togglePasswordInput("[data-register-password]", passwordToggle);
  };

  const onConfirmPasswordToggle = (): void => {
    togglePasswordInput("[data-register-confirm-password]", confirmPasswordToggle);
  };

  const onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    pageErrorClear(root);

    const username = pageInputValue(root, "[data-register-username]");
    const email = pageInputValue(root, "[data-register-email]");
    const password = pageInputValue(root, "[data-register-password]");
    const confirmPassword = pageInputValue(root, "[data-register-confirm-password]");
    const name = pageInputValue(root, "[data-register-name]");
    const preferredRole = pageInputValue(root, "[data-register-role]") || "any";

    const error = pageFirstError([
      pageLengthBetween(username, "Username", 3, 32),
      pageEmailLooksValid(email) ? null : "Email is invalid",
      pageLengthBetween(password, "Password", 8, 72),
      password === confirmPassword ? null : "Passwords do not match",
      name ? pageLengthBetween(name, "Display name", 1, 40) : null,
    ]);

    if (error) {
      pageErrorShow(root, error);
      return;
    }

    try {
      submitButton?.setAttribute("disabled", "true");
      pageLoadingSet(root, true, "Creating account...");
      await deps.authApi.register({ username, email, password, name: name || undefined, preferredRole });
      deps.actions.goToHome();
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Registration failed");
    } finally {
      submitButton?.removeAttribute("disabled");
      pageLoadingSet(root, false);
    }
  };

  form?.addEventListener("submit", onSubmit);
  backButton?.addEventListener("click", deps.actions.goToLanding);
  loginTab?.addEventListener("click", deps.actions.goToLogin);
  loginLink?.addEventListener("click", deps.actions.goToLogin);
  guestTab?.addEventListener("click", deps.actions.goToGuest);
  guestButton?.addEventListener("click", deps.actions.goToGuest);
  passwordToggle?.addEventListener("click", onPasswordToggle);
  confirmPasswordToggle?.addEventListener("click", onConfirmPasswordToggle);

  return () => {
    form?.removeEventListener("submit", onSubmit);
    backButton?.removeEventListener("click", deps.actions.goToLanding);
    loginTab?.removeEventListener("click", deps.actions.goToLogin);
    loginLink?.removeEventListener("click", deps.actions.goToLogin);
    guestTab?.removeEventListener("click", deps.actions.goToGuest);
    guestButton?.removeEventListener("click", deps.actions.goToGuest);
    passwordToggle?.removeEventListener("click", onPasswordToggle);
    confirmPasswordToggle?.removeEventListener("click", onConfirmPasswordToggle);
  };
}