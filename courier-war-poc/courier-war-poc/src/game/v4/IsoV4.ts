// IsoV5.ts
// Isometric grid-to-screen conversion.

import { GAME_CONFIG } from "./GameConfigV4";
import { GAME_CONSTANTS } from "./GameConstantsV4";

export const TILE_WIDTH = GAME_CONFIG.map.tileWidth;
export const TILE_HEIGHT = GAME_CONFIG.map.tileHeight;

export function isoToScreen(tileX: number, tileY: number) {
  return {
    x:
      (tileX - tileY) *
      (TILE_WIDTH / GAME_CONSTANTS.tileMath.halfDivisor),

    y:
      (tileX + tileY) *
      (TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor),
  };
}