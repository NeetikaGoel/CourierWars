// Imports visual config for tile size and map origin
import { cityMapVisualConfig } from "../config/CityMapVisualConfig";

// Imports coordinate shapes used by isometric math
import type {
  CoordinateScreenPoint,
  CoordinateTilePoint,
  CoordinateWorldPoint,
} from "../types/CoordinateType";

// Gets half tile width in pixels
function isometricTileWidthHalfGet(): number {
  // Returns half of configured tile width
  return cityMapVisualConfig.tile.widthPixels / 2;
}

// Gets half tile height in pixels
function isometricTileHeightHalfGet(): number {
  // Returns half of configured tile height
  return cityMapVisualConfig.tile.heightPixels / 2;
}

// Converts tile point to local isometric point before origin is applied
function isometricLocalPointFromTilePointGet(tilePoint: CoordinateTilePoint): CoordinateWorldPoint {
  // Stores half tile width for x projection
  const tileWidthHalf = isometricTileWidthHalfGet();

  // Stores half tile height for y projection
  const tileHeightHalf = isometricTileHeightHalfGet();

  // Returns local isometric point for the top vertex of the tile diamond
  return {
    // Stores local x position
    x: (tilePoint.x - tilePoint.y) * tileWidthHalf,

    // Stores local y position
    y: (tilePoint.x + tilePoint.y) * tileHeightHalf,
  };
}

// Converts tile point to screen point without camera information
export function isometricScreenPointFromTilePointGet(
  tilePoint: CoordinateTilePoint
): CoordinateScreenPoint {
  // Stores world point because screen and world are same before camera transform
  const worldPoint = isometricWorldPointFromTilePointGet(tilePoint);

  // Returns screen style point for systems that do not need camera conversion
  return {
    // Stores x coordinate
    x: worldPoint.x,

    // Stores y coordinate
    y: worldPoint.y,
  };
}

// Converts tile point to Phaser world point
export function isometricWorldPointFromTilePointGet(
  tilePoint: CoordinateTilePoint
): CoordinateWorldPoint {
  // Stores local isometric point before origin offset
  const localPoint = isometricLocalPointFromTilePointGet(tilePoint);

  // Returns world point after applying configured origin
  return {
    // Stores world x coordinate
    x: cityMapVisualConfig.tile.originWorldX + localPoint.x,

    // Stores world y coordinate
    y: cityMapVisualConfig.tile.originWorldY + localPoint.y,
  };
}

// Converts world point to nearest tile point
export function isometricTilePointFromWorldPointGet(
  worldPoint: CoordinateWorldPoint
): CoordinateTilePoint {
  // Stores half tile width for reverse x projection
  const tileWidthHalf = isometricTileWidthHalfGet();

  // Stores half tile height for reverse y projection
  const tileHeightHalf = isometricTileHeightHalfGet();

  // Stores local x coordinate after removing world origin
  const localX = worldPoint.x - cityMapVisualConfig.tile.originWorldX;

  // Stores local y coordinate after removing world origin
  const localY = worldPoint.y - cityMapVisualConfig.tile.originWorldY;

  // Stores local y coordinate shifted toward tile center for better pointer picking
  const localYCentered = localY - tileHeightHalf;

  // Stores floating tile x coordinate from inverse isometric projection
  const tileXFloat = (localYCentered / tileHeightHalf + localX / tileWidthHalf) / 2;

  // Stores floating tile y coordinate from inverse isometric projection
  const tileYFloat = (localYCentered / tileHeightHalf - localX / tileWidthHalf) / 2;

  // Returns nearest tile coordinate
  return {
    // Stores rounded tile x coordinate
    x: Math.round(tileXFloat),

    // Stores rounded tile y coordinate
    y: Math.round(tileYFloat),
  };
}

// Gets diamond corner points for drawing a tile
export function isometricTileDiamondPointListGet(
  tilePoint: CoordinateTilePoint
): CoordinateWorldPoint[] {
  // Stores top vertex world point
  const topPoint = isometricWorldPointFromTilePointGet(tilePoint);

  // Stores half tile width for diamond corners
  const tileWidthHalf = isometricTileWidthHalfGet();

  // Stores half tile height for diamond corners
  const tileHeightHalf = isometricTileHeightHalfGet();

  // Stores tile height for bottom vertex
  const tileHeight = cityMapVisualConfig.tile.heightPixels;

  // Returns diamond points in top right bottom left order
  return [
    // Stores top vertex
    {
      // Stores top vertex x coordinate
      x: topPoint.x,

      // Stores top vertex y coordinate
      y: topPoint.y,
    },

    // Stores right vertex
    {
      // Stores right vertex x coordinate
      x: topPoint.x + tileWidthHalf,

      // Stores right vertex y coordinate
      y: topPoint.y + tileHeightHalf,
    },

    // Stores bottom vertex
    {
      // Stores bottom vertex x coordinate
      x: topPoint.x,

      // Stores bottom vertex y coordinate
      y: topPoint.y + tileHeight,
    },

    // Stores left vertex
    {
      // Stores left vertex x coordinate
      x: topPoint.x - tileWidthHalf,

      // Stores left vertex y coordinate
      y: topPoint.y + tileHeightHalf,
    },
  ];
}

// Gets visual center point for a tile
export function isometricTileCenterWorldPointGet(
  tilePoint: CoordinateTilePoint
): CoordinateWorldPoint {
  // Stores top vertex world point
  const topPoint = isometricWorldPointFromTilePointGet(tilePoint);

  // Returns center point of the tile diamond
  return {
    // Stores center x coordinate
    x: topPoint.x,

    // Stores center y coordinate
    y: topPoint.y + isometricTileHeightHalfGet(),
  };
}

// Gets depth base value for a tile
export function isometricTileDepthBaseGet(tilePoint: CoordinateTilePoint): number {
  // Stores world point for tile
  const worldPoint = isometricWorldPointFromTilePointGet(tilePoint);

  // Returns y based depth so lower tiles draw above upper tiles
  return worldPoint.y;
}