import "./GuestEntryPage.css";
import guestEntryPageHtml from "./GuestEntryPage.html?raw";
import { pageErrorClear, pageErrorShow } from "../../shared/PageErrorBox";
import { pageInputValue, pageLengthBetween } from "../../shared/PageFormValidator";
import { pageLoadingSet } from "../../shared/PageLoadingSpinner";

export interface GuestEntryPageAuthApi {
  guest: (payload: { name?: string }) => Promise<void>;
}

export interface GuestEntryPageActions {
  goToHome: () => void;
  goToLanding: () => void;
}

export interface GuestEntryPageDependencies {
  authApi: GuestEntryPageAuthApi;
  actions: GuestEntryPageActions;
}

export async function mountGuestEntryPage(root: HTMLElement, deps: GuestEntryPageDependencies): Promise<() => void> {
  root.innerHTML = guestEntryPageHtml;

  const form = root.querySelector<HTMLFormElement>("[data-guest-form]");
  const backButton = root.querySelector<HTMLButtonElement>("[data-back-button]");

  const onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    pageErrorClear(root);

    const name = pageInputValue(root, "[data-guest-name]");
    const nameError = name ? pageLengthBetween(name, "Guest name", 1, 40) : null;

    if (nameError) {
      pageErrorShow(root, nameError);
      return;
    }

    try {
      pageLoadingSet(root, true, "Creating guest session...");
      await deps.authApi.guest({ name: name || undefined });
      deps.actions.goToHome();
    } catch (errorObject) {
      pageErrorShow(root, errorObject instanceof Error ? errorObject.message : "Guest session failed");
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