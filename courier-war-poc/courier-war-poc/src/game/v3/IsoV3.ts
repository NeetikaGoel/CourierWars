// Isometric helper for 36x36 Courier War city map!

// Smaller tile size because 36x36 is bigger than 25x25!
export const TILE_WIDTH = 52;
export const TILE_HEIGHT = 26;

// Converts grid position to isometric screen position!
export function isoToScreen(tileX: number, tileY: number) {
  return {
    x: (tileX - tileY) * (TILE_WIDTH / 2),
    y: (tileX + tileY) * (TILE_HEIGHT / 2),
  };
}