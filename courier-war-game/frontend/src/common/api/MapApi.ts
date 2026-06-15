// Purpose: map-specific API calls only.

// It should have:

// previewMapGet(seed) for current direct backend map-generation test
// later currentMapGet() for cache-backed bootstrap map

// this file contains map related backend api calls

import { apiJsonGet } from "./ApiClient";
import type { MapApi, MapCurrentResponse, MapPreviewRequest, MapPreviewResponse } from "../apiType/MapApiType";

// this seed gives a stable development map until backend cache bootstrap is connected
const MAP_PREVIEW_SEED_DEFAULT = 20260531;

export const mapApi: MapApi = {
  async previewMapGet(request: MapPreviewRequest = {}): Promise<MapPreviewResponse> {
    // this asks backend to generate a readable map json payload
    return apiJsonGet<MapPreviewResponse>("/maps/preview", {
      query: {
        seed: request.seed ?? MAP_PREVIEW_SEED_DEFAULT,
      },
    });
  },

  async currentMapGet(): Promise<MapCurrentResponse> {
    // this will be used after cache bootstrap is connected
    return apiJsonGet<MapCurrentResponse>("/maps/current");
  },
};