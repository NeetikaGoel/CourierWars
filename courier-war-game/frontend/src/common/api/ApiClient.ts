// Purpose: one reusable fetch wrapper so every API call behaves the same.

// It should:

// call backend URL
// send cookies with credentials: "include"
// parse JSON
// unwrap { success, data, error }
// throw readable errors


// this file owns common fetch logic for backend json apis
// individual api files should call this instead of using fetch directly

import type { ApiResponse } from "../apiType/ApiResponseType";

// this is the backend api base path used by the current frontend
const API_BASE_PATH = "/api/v1";

export class ApiClientError extends Error {
  // this stores backend error code when available
  readonly code?: string;

  // this stores full backend details for debugging
  readonly details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    // this passes readable message to normal error handling
    super(message);

    // this keeps the error name useful in console logs
    this.name = "ApiClientError";

    // this stores optional backend code
    this.code = code;

    // this stores optional backend details
    this.details = details;
  }
}

export interface ApiClientRequestOptions {
  // this stores query params for get requests
  query?: Record<string, string | number | boolean | undefined | null>;

  // this lets a caller override the default base path later
  basePath?: string;
}

function queryStringFromObjectGet(query: ApiClientRequestOptions["query"]): string {
  // this returns empty query string when no query params exist
  if (!query) {
    return "";
  }

  // this creates browser native query param builder
  const searchParams = new URLSearchParams();

  // this adds only useful query values
  Object.entries(query).forEach(([key, value]) => {
    // this skips null and undefined because backend should not receive them
    if (value === undefined || value === null) {
      return;
    }

    // this converts number boolean and string values to query strings
    searchParams.set(key, String(value));
  });

  // this creates final query string
  const queryString = searchParams.toString();

  // this avoids adding a question mark when no params survived filtering
  if (!queryString) {
    return "";
  }

  // this returns browser ready query string
  return `?${queryString}`;
}

function apiUrlGet(path: string, options: ApiClientRequestOptions = {}): string {
  // this lets later config replace /api/v1 if needed
  const basePath = options.basePath ?? API_BASE_PATH;

  // this normalizes a path whether caller gives maps/current or /maps/current
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // this appends query params safely
  return `${basePath}${normalizedPath}${queryStringFromObjectGet(options.query)}`;
}

async function apiResponseJsonParse<TData>(response: Response): Promise<ApiResponse<TData>> {
  // this reads response body as text first so bad json can be handled cleanly
  const responseText = await response.text();

  // this handles empty backend response as a clear frontend error
  if (!responseText) {
    throw new ApiClientError("Backend returned an empty response");
  }

  try {
    // this parses backend json into the common api envelope
    return JSON.parse(responseText) as ApiResponse<TData>;
  } catch {
    // this avoids exposing raw html or server errors as json
    throw new ApiClientError("Backend returned invalid JSON");
  }
}

function apiResponseDataUnwrap<TData>(responseEnvelope: ApiResponse<TData>, httpStatus: number): TData {
  // this returns data when backend says request succeeded
  if (responseEnvelope.success && responseEnvelope.data !== null) {
    return responseEnvelope.data;
  }

  // this prefers backend error message when available
  const message = responseEnvelope.error?.message || `Request failed with status ${httpStatus}`;

  // this throws one consistent frontend error type
  throw new ApiClientError(message, responseEnvelope.error?.code, responseEnvelope.error?.details);
}

export async function apiJsonGet<TData>(
  path: string,
  options: ApiClientRequestOptions = {}
): Promise<TData> {
  // this builds the final backend url
  const url = apiUrlGet(path, options);

  // this performs a get request and includes cookies for future auth
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  // this parses the common backend response envelope
  const responseEnvelope = await apiResponseJsonParse<TData>(response);

  // this converts failed http or failed backend envelope into thrown error
  if (!response.ok || !responseEnvelope.success) {
    return apiResponseDataUnwrap(responseEnvelope, response.status);
  }

  // this returns only the useful data object to caller
  return apiResponseDataUnwrap(responseEnvelope, response.status);
}