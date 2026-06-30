// this file contains map related backend api calls

import { apiJsonGet } from "./ApiClient";
import type { MapApi, MapCurrentResponse, MapPreviewRequest, MapPreviewResponse } from "../apiType/MapApiType";

export const mapApi: MapApi = {
  async previewMapGet(request: MapPreviewRequest = {}): Promise<MapPreviewResponse> {
    return apiJsonGet<MapPreviewResponse>("/maps/preview", {
      query: {
        seed: request.seed,
      },
    });
  },

  async currentMapGet(): Promise<MapCurrentResponse> {
    return apiJsonGet<MapCurrentResponse>("/maps/current");
  },
};