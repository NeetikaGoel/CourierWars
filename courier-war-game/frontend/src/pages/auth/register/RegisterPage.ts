import "./RegisterPage.css";
import registerPageHtml from "./RegisterPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { pageEmailLooksValid, pageFirstError, pageInputValue, pageLengthBetween, pageRequiredText } from "../../shared/PageFormValidator";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface RegisterPageAuthApi {
  register: (payload: { username: string; email: string; password: string; name?: string; preferredRole: string }) => Promise<void>;
}

export interface RegisterPageActions {
  goToHome: () => void;
  goToLanding: () => void;
}

export interface RegisterPageDependencies {
  authApi: RegisterPageAuthApi;
  actions: RegisterPageActions;
}

export async function mountRegisterPage(root: HTMLElement, deps: RegisterPageDependencies): Promise<() => void> {
  root.innerHTML = registerPageHtml;

  const form = root.querySelector<HTMLFormElement>("[data-register-form]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-back-button]");

  const onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    pageErrorClear(root);

    const username = pageInputValue(root, "[data-register-username]");
    const email = pageInputValue(root, "[data-register-email]");
    const password = pageInputValue(root, "[data-register-password]");
    const name = pageInputValue(root, "[data-register-name]");
    const preferredRole = pageInputValue(root, "[data-register-role]") || "any";

    const error = pageFirstError([
      pageLengthBetween(username, "Username", 3, 32),
      pageEmailLooksValid(email) ? null : "Email is invalid",
      pageLengthBetween(password, "Password", 8, 72),
      name ? pageLengthBetween(name, "Display name", 1, 40) : null,
      pageRequiredText(preferredRole, "Preferred role"),
    ]);

    if (error) {
      pageErrorShow(root, error);
      return;
    }

    try {
      pageLoadingSet(root, true, "Creating account...");
      await deps.authApi.register({ username, email, password, name: name || undefined, preferredRole });
      deps.actions.goToHome();
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Registration failed");
    } finally {
      pageLoadingSet(root, false);
    }
  };

  form?.addEventListener("submit", onSubmit);
  backButton?.addEventListener("click", deps.actions.goToLanding);

  return () => {
    form?.removeEventListener("submit", onSubmit);
    backButton?.removeEventListener("click", deps.actions.goToLanding);
  };
}