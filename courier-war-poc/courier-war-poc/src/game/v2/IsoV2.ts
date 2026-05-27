// Isometric file for Courier War V2 map!

// Width of 1 diamond tile from left corner to right corner
export const TILE_WIDTH = 64;

// Ht of 1 diamond tile from top corner to bottom corner
// 64:32 is a common 2:1 isometric ratio
export const TILE_HEIGHT = 32;

// This converts logical grid coordinates into screen coordinates!
// Phaser cannot directly draw that as isometric, so we convert it okii
export function isoToScreen(tileX: number, tileY: number)
{
  return {
    x: (tileX - tileY) * (TILE_WIDTH / 2),
    y: (tileX + tileY) * (TILE_HEIGHT / 2),
  };
}