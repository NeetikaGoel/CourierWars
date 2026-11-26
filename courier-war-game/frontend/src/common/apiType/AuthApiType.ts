// this file stores frontend auth api request and response types

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  preferredRole: string;
}

export interface GuestRequest {
  name?: string;
}

export interface AuthUserResponse {
  userId: number;
  username: string;
  name: string | null;
  userType: string;
  isGuest: boolean;
}

export interface AuthSessionResponse {
  accessExpiresAtMs: number;
  refreshExpiresAtMs: number;
}

export interface AuthResponse {
  user: AuthUserResponse;
  session: AuthSessionResponse;
}

export interface LogoutResponse {
  loggedOut?: boolean;
  guestForgotten?: boolean;
  // false when the guest appears in match history, so their rows are kept
  guestDataDeleted?: boolean;
}