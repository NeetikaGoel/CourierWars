// this file stores frontend api types for map related backend calls

import type { BackendCityMapPayload } from "../../game/v7/types/BackendCityMapPayloadType.ts";

// this is used only by preview map api
export interface MapPreviewRequest {
  // backend can default this when frontend does not send it
  seed?: number;
}

// /maps/preview returns the full readable generated map payload
export type MapPreviewResponse = BackendCityMapPayload;

// /maps/current returns metadata, not full map tiles
export interface MapCurrentMetadata {
  mapId?: string;
  mapName?: string;
  mapVersion?: string;
  mapGenerationVersion?: string;
  widthTiles?: number;
  heightTiles?: number;
  zoneColumns?: number;
  zoneRows?: number;
  tileSize?: {
    widthPixels?: number;
    heightPixels?: number;
  };
}

// this matches backend MapGenerationService::currentMapMetadataGet()
export interface MapCurrentResponse {
  map?: MapCurrentMetadata;
  featureCountRanges?: Record<string, Record<string, number>>;
  preview?: {
    seedDefault?: number;
    endpoint?: string;
  };
}

export interface MapApi {
  // development/demo preview endpoint
  previewMapGet: (request?: MapPreviewRequest) => Promise<MapPreviewResponse>;

  // current backend map metadata endpoint
  currentMapGet: () => Promise<MapCurrentResponse>;
}