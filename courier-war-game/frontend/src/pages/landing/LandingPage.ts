import "./LandingPage.css";
import landingPageHtml from "./LandingPage.html?raw";

export interface LandingPageActions {
  goToLogin: () => void;
  goToRegister: () => void;
  goToGuest: () => void;
}

export async function mountLandingPage(root: HTMLElement, actions: LandingPageActions): Promise<() => void> {
  root.innerHTML = landingPageHtml;

  const loginButton = root.querySelector<HTMLButtonElement>("[data-login-button]");
  const registerButton = root.querySelector<HTMLButtonElement>("[data-register-button]");
  const guestButton = root.querySelector<HTMLButtonElement>("[data-guest-button]");

  loginButton?.addEventListener("click", actions.goToLogin);
  registerButton?.addEventListener("click", actions.goToRegister);
  guestButton?.addEventListener("click", actions.goToGuest);

  return () => {
    loginButton?.removeEventListener("click", actions.goToLogin);
    registerButton?.removeEventListener("click", actions.goToRegister);
    guestButton?.removeEventListener("click", actions.goToGuest);
  };
}