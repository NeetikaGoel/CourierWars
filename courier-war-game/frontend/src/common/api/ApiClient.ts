// this file owns common fetch logic for backend json apis
// individual api files should call this instead of using fetch directly

import type { ApiResponse } from "../apiType/ApiResponseType";

// this is the backend api base path used by the current frontend
const API_BASE_PATH = "/api/v1";

// this csrf cookie is readable by frontend and sent on mutating auth apis
const CSRF_COOKIE_NAME = "cw_csrf_token";

// this csrf header must match backend/config/CsrfConfig.php
const CSRF_HEADER_NAME = "X-CSRF-Token";

export class ApiClientError extends Error {
  // this stores backend error code when available
  readonly code?: string;

  // this stores full backend details for debugging
  readonly details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

export interface ApiClientRequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  basePath?: string;
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

function csrfTokenFromCookieGet(): string | null {
  const cookiePartList = document.cookie.split("; ");

  for (const cookiePart of cookiePartList) {
    const separatorIndex = cookiePart.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const cookieName = cookiePart.slice(0, separatorIndex);

    if (cookieName !== CSRF_COOKIE_NAME) {
      continue;
    }

    return decodeURIComponent(cookiePart.slice(separatorIndex + 1));
  }

  return null;
}

function jsonHeadersGet(includeJsonContentType: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  const csrfToken = csrfTokenFromCookieGet();

  if (csrfToken) {
    headers[CSRF_HEADER_NAME] = csrfToken;
  }

  return headers;
}

async function apiResponseJsonParse<TData>(response: Response): Promise<ApiResponse<TData>> {
  const responseText = await response.text();

  if (!responseText) {
    throw new ApiClientError("Backend returned an empty response");
  }

  try {
    return JSON.parse(responseText) as ApiResponse<TData>;
  } catch {
    throw new ApiClientError("Backend returned invalid JSON");
  }
}

function apiResponseDataUnwrap<TData>(responseEnvelope: ApiResponse<TData>, httpStatus: number): TData {
  if (responseEnvelope.success && responseEnvelope.data !== null) {
    return responseEnvelope.data;
  }

  const message = responseEnvelope.error?.message || `Request failed with status ${httpStatus}`;

  throw new ApiClientError(message, responseEnvelope.error?.code, responseEnvelope.error?.details);
}

export async function apiJsonGet<TData>(
  path: string,
  options: ApiClientRequestOptions = {}
): Promise<TData> {
  const response = await fetch(apiUrlGet(path, options), {
    method: "GET",
    credentials: "include",
    headers: jsonHeadersGet(false),
  });

  const responseEnvelope = await apiResponseJsonParse<TData>(response);

  return apiResponseDataUnwrap(responseEnvelope, response.status);
}

export async function apiJsonPost<TData, TBody = unknown>(
  path: string,
  body: TBody,
  options: ApiClientRequestOptions = {}
): Promise<TData> {
  const response = await fetch(apiUrlGet(path, options), {
    method: "POST",
    credentials: "include",
    headers: jsonHeadersGet(true),
    body: JSON.stringify(body),
  });

  const responseEnvelope = await apiResponseJsonParse<TData>(response);

  return apiResponseDataUnwrap(responseEnvelope, response.status);
}