// Defines a tile grid coordinate
export interface CoordinateTilePoint
{
  x: number;
  y: number;
}

// Defines a raw screen coordinate
export interface CoordinateScreenPoint
{
  //coordinates in pixels!!
  x: number;
  y: number;
}

// Defines a Phaser world coordinate in pixels
export interface CoordinateWorldPoint {
  x: number;
  y: number;
}

// Defines rectangular bounds in tile coordinates
export interface CoordinateTileBounds {
  // Stores starting tile x coordinate
  startX: number;

  // Stores starting tile y coordinate
  startY: number;

  // Stores ending tile x coordinate
  endX: number;

  // Stores ending tile y coordinate
  endY: number;
}

// Defines rectangular bounds in world coordinates
export interface CoordinateWorldBounds {
  // Stores world x coordinate of the left edge
  x: number;

  // Stores world y coordinate of the top edge
  y: number;

  // Stores world width in pixels
  width: number;

  // Stores world height in pixels
  height: number;
}

// Defines a rectangular tile area used by parks lakes and zones
export interface CoordinateTileArea {
  // Stores top left tile x coordinate
  startX: number;

  // Stores top left tile y coordinate
  startY: number;

  // Stores area width in tiles
  widthTiles: number;

  // Stores area height in tiles
  heightTiles: number;
}