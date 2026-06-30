// this file owns common fetch logic for backend json apis
// individual api files should call this instead of using fetch directly

import type { ApiResponse } from "../apiType/ApiResponseType";

// this is the backend api base path used by the current frontend
const API_BASE_PATH = "/api/v1";

// this csrf cookie is readable by frontend and sent on mutating auth apis
const CSRF_COOKIE_NAME = "cw_csrf_token";

// this frontend-only cookie is a session hint because refresh cookie is HttpOnly
const SESSION_HINT_COOKIE_NAME = "cw_user_id";

// this csrf header must match backend/config/CsrfConfig.php
const CSRF_HEADER_NAME = "X-CSRF-Token";

// this header must match backend/constants/HttpRequestValue.php
const IDEMPOTENCY_HEADER_NAME = "Idempotency-Key";

const AUTH_REFRESH_PATH = "/auth/refresh";
const AUTH_PATH_PREFIX = "/auth/";
const HTTP_STATUS_UNAUTHORIZED = 401;

export class ApiClientError extends Error {
  // this stores backend error code when available
  readonly code?: string;

  // this stores full backend details for debugging
  readonly details?: unknown;

  // this stores the http status so pages can classify auth/session failures correctly
  readonly status?: number;

  constructor(message: string, code?: string, details?: unknown, status?: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
    this.status = status;

    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export interface ApiClientRequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  basePath?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  authRetry?: boolean;
}

function queryStringFromObjectGet(query: ApiClientRequestOptions["query"]): string {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

function apiUrlGet(path: string, options: ApiClientRequestOptions = {}): string {
  const basePath = options.basePath ?? API_BASE_PATH;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${basePath}${normalizedPath}${queryStringFromObjectGet(options.query)}`;
}

function cookieValueGet(cookieName: string): string | null {
  const cookiePartList = document.cookie.split("; ");

  for (const cookiePart of cookiePartList) {
    const separatorIndex = cookiePart.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const currentCookieName = cookiePart.slice(0, separatorIndex);

    if (currentCookieName !== cookieName) {
      continue;
    }

    return decodeURIComponent(cookiePart.slice(separatorIndex + 1));
  }

  return null;
}

function csrfTokenFromCookieGet(): string | null {
  return cookieValueGet(CSRF_COOKIE_NAME);
}

function sessionRefreshPossibleCheck(): boolean {
  return csrfTokenFromCookieGet() !== null && cookieValueGet(SESSION_HINT_COOKIE_NAME) !== null;
}

function normalizedPathGet(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function authPathCheck(path: string): boolean {
  return normalizedPathGet(path).startsWith(AUTH_PATH_PREFIX);
}

function jsonHeadersGet(includeJsonContentType: boolean, options: ApiClientRequestOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  const csrfToken = csrfTokenFromCookieGet();

  if (csrfToken) {
    headers[CSRF_HEADER_NAME] = csrfToken;
  }

  if (options.idempotencyKey) {
    headers[IDEMPOTENCY_HEADER_NAME] = options.idempotencyKey;
  }

  return headers;
}

async function apiResponseJsonParse<TData>(response: Response): Promise<ApiResponse<TData>> {
  const responseText = await response.text();

  if (!responseText) {
    throw new ApiClientError("Backend returned an empty response", undefined, undefined, response.status);
  }

  try {
    return JSON.parse(responseText) as ApiResponse<TData>;
  } catch {
    throw new ApiClientError("Backend returned invalid JSON", undefined, undefined, response.status);
  }
}

function apiResponseDataUnwrap<TData>(responseEnvelope: ApiResponse<TData>, httpStatus: number): TData {
  if (responseEnvelope.success && responseEnvelope.data !== null) {
    return responseEnvelope.data;
  }

  const message = responseEnvelope.error?.message || `Request failed with status ${httpStatus}`;

  throw new ApiClientError(message, responseEnvelope.error?.code, responseEnvelope.error?.details, httpStatus);
}

async function apiEnvelopeFetch<TData, TBody>(
  method: "GET" | "POST",
  path: string,
  body: TBody | undefined,
  includeJsonContentType: boolean,
  options: ApiClientRequestOptions
): Promise<{ response: Response; envelope: ApiResponse<TData> }> {
  const requestInit: RequestInit = {
    method,
    credentials: "include",
    headers: jsonHeadersGet(includeJsonContentType, options),
  };

  if (includeJsonContentType) {
    requestInit.body = JSON.stringify(body ?? {});
  }

  const response = await fetch(apiUrlGet(path, options), requestInit);
  const envelope = await apiResponseJsonParse<TData>(response);

  return { response, envelope };
}

async function authRefreshRun(basePath?: string): Promise<void> {
  if (!sessionRefreshPossibleCheck()) {
    throw new ApiClientError("no saved session", "UNAUTHORIZED", undefined, HTTP_STATUS_UNAUTHORIZED);
  }

  const refreshOptions: ApiClientRequestOptions = {
    basePath,
    authRetry: false,
  };

  const { response, envelope } = await apiEnvelopeFetch<unknown, Record<string, never>>(
    "POST",
    AUTH_REFRESH_PATH,
    {},
    true,
    refreshOptions
  );

  apiResponseDataUnwrap(envelope, response.status);
}

function authRetryAllowedCheck(path: string, options: ApiClientRequestOptions, response: Response): boolean {
  if (response.status !== HTTP_STATUS_UNAUTHORIZED) {
    return false;
  }

  if (options.authRetry === false) {
    return false;
  }

  if (authPathCheck(path)) {
    return false;
  }

  return sessionRefreshPossibleCheck();
}

async function apiJsonRequest<TData, TBody>(
  method: "GET" | "POST",
  path: string,
  body: TBody | undefined,
  includeJsonContentType: boolean,
  options: ApiClientRequestOptions
): Promise<TData> {
  const firstResult = await apiEnvelopeFetch<TData, TBody>(method, path, body, includeJsonContentType, options);

  if (!firstResult.envelope.success && authRetryAllowedCheck(path, options, firstResult.response)) {
    try {
      await authRefreshRun(options.basePath);

      const retryResult = await apiEnvelopeFetch<TData, TBody>(method, path, body, includeJsonContentType, {
        ...options,
        authRetry: false,
      });

      return apiResponseDataUnwrap(retryResult.envelope, retryResult.response.status);
    } catch {
      // Keep original response behavior if refresh fails.
    }
  }

  return apiResponseDataUnwrap(firstResult.envelope, firstResult.response.status);
}

export async function apiJsonGet<TData>(
  path: string,
  options: ApiClientRequestOptions = {}
): Promise<TData> {
  return apiJsonRequest<TData, undefined>("GET", path, undefined, false, options);
}

export async function apiJsonPost<TData, TBody = unknown>(
  path: string,
  body: TBody,
  options: ApiClientRequestOptions = {}
): Promise<TData> {
  return apiJsonRequest<TData, TBody>("POST", path, body, true, options);
}