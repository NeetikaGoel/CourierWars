// this file connects frontend auth pages to backend auth apis

import { apiJsonPost } from "./ApiClient";
import type { AuthResponse, GuestRequest, LoginRequest, LogoutResponse, RegisterRequest } from "../apiType/AuthApiType";

const CSRF_COOKIE_NAME = "cw_csrf_token";

function cookieExists(cookieName: string): boolean {
  return document.cookie
    .split("; ")
    .some((cookiePart) => cookiePart.startsWith(`${cookieName}=`));
}

export const authApi = {
  login: async (payload: LoginRequest): Promise<void> => {
    await apiJsonPost<AuthResponse, LoginRequest>("/auth/login", payload);
  },

  register: async (payload: RegisterRequest): Promise<void> => {
    await apiJsonPost<AuthResponse, RegisterRequest>("/auth/register", payload);
  },

  guest: async (payload: GuestRequest): Promise<void> => {
    await apiJsonPost<AuthResponse, GuestRequest>("/auth/guest", payload);
  },

  refresh: async (): Promise<void> => {
    if (!cookieExists(CSRF_COOKIE_NAME)) {
      throw new Error("no saved session");
    }

    await apiJsonPost<AuthResponse, Record<string, never>>("/auth/refresh", {});
  },

  logout: async (): Promise<void> => {
    await apiJsonPost<LogoutResponse, Record<string, never>>("/auth/logout", {});
  },

  forgetGuest: async (): Promise<void> => {
    await apiJsonPost<LogoutResponse, Record<string, never>>("/auth/guest/forget", {});
  },
};