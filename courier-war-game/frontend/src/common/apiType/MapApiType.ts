// this file stores frontend api types for map related backend calls

import type { BackendCityMapPayload } from "../../game/v7/types/BackendCityMapPayloadType.ts";

export interface MapPreviewRequest {
  // this seed lets us request the same generated map again during development
  seed?: number;
}

export type MapPreviewResponse = BackendCityMapPayload;

export type MapCurrentResponse = BackendCityMapPayload;

export interface MapApi {
  // this calls direct backend generation for the first milestone
  previewMapGet: (request?: MapPreviewRequest) => Promise<MapPreviewResponse>;

  // this will call cache backed current map in the next milestone
  currentMapGet: () => Promise<MapCurrentResponse>;
}