import { ApiClientError, apiJsonPost } from "./ApiClient";
import type {
  AuthResponse,
  GuestRequest,
  LoginRequest,
  LogoutResponse,
  RegisterRequest,
} from "../apiType/AuthApiType";

const CSRF_COOKIE_NAME = "cw_csrf_token";
const SESSION_HINT_COOKIE_NAME = "cw_user_id";
const NO_SAVED_SESSION_STATUS = 401;
const NO_SAVED_SESSION_CODE = "UNAUTHORIZED";

const cookieExists = (cookieName: string): boolean => {
  return document.cookie
    .split(";")
    .map((cookiePart) => cookiePart.trim())
    .some((cookiePart) => cookiePart.startsWith(`${cookieName}=`));
};

const savedSessionHintExists = (): boolean => {
  return cookieExists(CSRF_COOKIE_NAME) && cookieExists(SESSION_HINT_COOKIE_NAME);
};

export const authApi = {
  register: (request: RegisterRequest): Promise<AuthResponse> =>
    apiJsonPost<AuthResponse, RegisterRequest>("/auth/register", request, { authRetry: false }),

  login: (request: LoginRequest): Promise<AuthResponse> =>
    apiJsonPost<AuthResponse, LoginRequest>("/auth/login", request, { authRetry: false }),

  guest: (request: GuestRequest): Promise<AuthResponse> =>
    apiJsonPost<AuthResponse, GuestRequest>("/auth/guest", request, { authRetry: false }),

  refresh: async (): Promise<AuthResponse> => {
    if (!savedSessionHintExists()) {
      throw new ApiClientError(
        "no saved session",
        NO_SAVED_SESSION_CODE,
        undefined,
        NO_SAVED_SESSION_STATUS
      );
    }

    return apiJsonPost<AuthResponse, Record<string, never>>("/auth/refresh", {}, { authRetry: false });
  },

  logout: (): Promise<LogoutResponse> =>
    apiJsonPost<LogoutResponse, Record<string, never>>("/auth/logout", {}, { authRetry: false }),

  forgetGuest: (): Promise<LogoutResponse> =>
    apiJsonPost<LogoutResponse, Record<string, never>>("/auth/guest/forget", {}, { authRetry: false }),
};