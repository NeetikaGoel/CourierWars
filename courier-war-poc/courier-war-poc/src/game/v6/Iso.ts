// this is the cutest file of all time!!!!
// just converts tile coordinates into isometric screen coordinates

import { GAME_CONFIG } from "./GameConfig";
import { GAME_CONSTANTS } from "./GameConstants";

export const TILE_WIDTH = GAME_CONFIG.map.tileWidth;
export const TILE_HEIGHT = GAME_CONFIG.map.tileHeight;

export function isoToScreen(tileX: number, tileY: number)
{
  return {
    x: (tileX - tileY) * (TILE_WIDTH / GAME_CONSTANTS.math.half),
    y: (tileX + tileY) * (TILE_HEIGHT / GAME_CONSTANTS.math.half),
  };
}