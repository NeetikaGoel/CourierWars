// this file defines the common backend api response envelope
// every api call should use this shape so frontend parsing stays consistent

export interface ApiResponseError {
  // this is the stable backend error code when backend provides one
  code?: string;

  // this is the readable error message shown or logged by frontend
  message: string;

  // this stores optional backend validation details
  details?: unknown;
}

export interface ApiResponseMeta {
  // this helps trace one request in logs
  requestId?: string;

  // this stores backend server time when returned
  serverTime?: string;

  // this stores api version when returned
  apiVersion?: string;
}

export interface ApiResponse<TData> {
  // this tells whether backend accepted the request
  success: boolean;

  // this stores response data when success is true
  data: TData | null;

  // this stores error information when success is false
  error: ApiResponseError | null;

  // this stores optional request metadata
  meta?: ApiResponseMeta;
}