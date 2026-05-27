// IsoV5.ts
// Converts normal grid position into isometric screen position

import { GAME_CONFIG } from "./GameConfigV5";
import { GAME_CONSTANTS } from "./GameConstantsV5";

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