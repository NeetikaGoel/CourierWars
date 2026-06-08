import "./GuestEntryPage.css";
import guestEntryPageHtml from "./GuestEntryPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { pageFirstError, pageInputValue, pageLengthBetween } from "../../shared/PageFormValidator";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface GuestEntryPageAuthApi {
  guest: (payload: { name?: string }) => Promise<void>;
}

export interface GuestEntryPageActions {
  goToHome: () => void;
  goToLanding: () => void;
  goToLogin: () => void;
  goToRegister: () => void;
}

export interface GuestEntryPageDependencies {
  authApi: GuestEntryPageAuthApi;
  actions: GuestEntryPageActions;
}

export async function mountGuestEntryPage(root: HTMLElement, deps: GuestEntryPageDependencies): Promise<() => void> {
  root.innerHTML = guestEntryPageHtml;

  const form = root.querySelector<HTMLFormElement>("[data-guest-form]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-back-button]");
  const loginTab = root.querySelector<HTMLButtonElement>("[data-login-tab]");
  const guestBackButton = root.querySelector<HTMLButtonElement>("[data-guest-back-button]");
  const registerTab = root.querySelector<HTMLButtonElement>("[data-register-tab]");
  const nameInput = root.querySelector<HTMLInputElement>("[data-guest-name]");
  const nameCount = root.querySelector<HTMLElement>("[data-guest-name-count]");
  const submitButton = root.querySelector<HTMLButtonElement>(".guest-primary-button");

  const updateNameCount = (): void => {
    if (!nameInput || !nameCount) {
      return;
    }

    nameCount.textContent = `${nameInput.value.length}/20`;
  };

  const onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    pageErrorClear(root);

    const name = pageInputValue(root, "[data-guest-name]");

    const error = pageFirstError([
      name ? pageLengthBetween(name, "Display name", 1, 20) : null,
    ]);

    if (error) {
      pageErrorShow(root, error);
      return;
    }

    try {
      submitButton?.setAttribute("disabled", "true");
      pageLoadingSet(root, true, "Starting guest session...");
      await deps.authApi.guest({ name: name || undefined });
      deps.actions.goToHome();
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Guest session failed");
    } finally {
      submitButton?.removeAttribute("disabled");
      pageLoadingSet(root, false);
    }
  };

  form?.addEventListener("submit", onSubmit);
  backButton?.addEventListener("click", deps.actions.goToLanding);
  loginTab?.addEventListener("click", deps.actions.goToLogin);
  guestBackButton?.addEventListener("click", deps.actions.goToLanding);
  registerTab?.addEventListener("click", deps.actions.goToRegister);
  nameInput?.addEventListener("input", updateNameCount);

  updateNameCount();

  return () => {
    form?.removeEventListener("submit", onSubmit);
    backButton?.removeEventListener("click", deps.actions.goToLanding);
    loginTab?.removeEventListener("click", deps.actions.goToLogin);
    guestBackButton?.removeEventListener("click", deps.actions.goToLanding);
    registerTab?.removeEventListener("click", deps.actions.goToRegister);
    nameInput?.removeEventListener("input", updateNameCount);
  };
}