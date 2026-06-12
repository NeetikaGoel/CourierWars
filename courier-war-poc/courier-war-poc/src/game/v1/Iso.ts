
//Basic isometric helper

// This converts logical tile coordinates into screen coordinates.

// So logical grid position is lets say x=1, y=1
// But we need to change it to screen position screenX and screenY to render it correctly in isometric view

// So , x and y are actual grid position of courier
//Now, screenX and screenY are where Phaser draws the object on the browser screen!!
export const TILE_WIDTH = 96; //distance of left to right corner of tile in pixels
export const TILE_HEIGHT = 48; //distance of top to bottom corner of tile in pixels

// 96/48 = 2 which is 2:1 which is common for isometric tiles

//so now we have a function which will take grid coordinates that is gridx and gridy and convert it to screen coordinates screenx and screeny 
export function isoToScreen(tileX: number, tileY: number)
{
    //now it needs to return obj of 2 values
  return {
    x: (tileX - tileY) * (TILE_WIDTH / 2),
    y: (tileX + tileY) * (TILE_HEIGHT / 2),
  };
}