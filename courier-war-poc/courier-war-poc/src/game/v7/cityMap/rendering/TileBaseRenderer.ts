// Imports Phaser for graphics drawing
import Phaser from "phaser";

// Imports visual configuration for colors alpha line widths and tile geometry
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports color converter for Phaser numeric color values
import { phaserColorNumberFromHexGet } from "../../utility/PhaserColorConverter";

// Imports isometric diamond point helper
import { isometricTileDiamondPointListGet } from "../../iso/IsometricCoordinateCalculator";

// Imports tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Draws base isometric tile diamond shapes
export class TileBaseRenderer {
  // Stores Phaser graphics object used for tile drawing
  private readonly graphics: Phaser.GameObjects.Graphics;

  // Creates base tile renderer
  constructor(graphics: Phaser.GameObjects.Graphics) {
    // Stores graphics reference
    this.graphics = graphics;
  }

  // Draws a filled isometric tile diamond
  tileDiamondDraw(
    tilePoint: CoordinateTilePoint,
    colorHex: string,
    alpha: number = cityMapVisualConfig.alpha.tileFill
  ): void {
    // Stores tile diamond point list
    const diamondPointList = isometricTileDiamondPointListGet(tilePoint);

    // Stores Phaser color number
    const colorNumber = phaserColorNumberFromHexGet(colorHex);

    // Stores border color number
    const borderColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.overlay.tileBorderColorHex);

    // Sets fill style for tile
    this.graphics.fillStyle(colorNumber, alpha);

    // Sets border style for tile
    this.graphics.lineStyle(
      cityMapVisualConfig.line.tileBorderWidth,
      borderColorNumber,
      cityMapVisualConfig.alpha.tileBorder
    );

    // Starts diamond path
    this.graphics.beginPath();

    // Moves to top diamond point
    this.graphics.moveTo(diamondPointList[0].x, diamondPointList[0].y);

    // Draws line to right diamond point
    this.graphics.lineTo(diamondPointList[1].x, diamondPointList[1].y);

    // Draws line to bottom diamond point
    this.graphics.lineTo(diamondPointList[2].x, diamondPointList[2].y);

    // Draws line to left diamond point
    this.graphics.lineTo(diamondPointList[3].x, diamondPointList[3].y);

    // Closes diamond path
    this.graphics.closePath();

    // Fills diamond path
    this.graphics.fillPath();

    // Strokes diamond path
    this.graphics.strokePath();
  }

  // Draws only tile outline
  tileDiamondOutlineDraw(
    tilePoint: CoordinateTilePoint,
    colorHex: string,
    alpha: number,
    lineWidth: number
  ): void {
    // Stores tile diamond point list
    const diamondPointList = isometricTileDiamondPointListGet(tilePoint);

    // Stores Phaser color number
    const colorNumber = phaserColorNumberFromHexGet(colorHex);

    // Sets outline style
    this.graphics.lineStyle(lineWidth, colorNumber, alpha);

    // Starts diamond outline path
    this.graphics.beginPath();

    // Moves to top diamond point
    this.graphics.moveTo(diamondPointList[0].x, diamondPointList[0].y);

    // Draws line to right diamond point
    this.graphics.lineTo(diamondPointList[1].x, diamondPointList[1].y);

    // Draws line to bottom diamond point
    this.graphics.lineTo(diamondPointList[2].x, diamondPointList[2].y);

    // Draws line to left diamond point
    this.graphics.lineTo(diamondPointList[3].x, diamondPointList[3].y);

    // Closes diamond outline path
    this.graphics.closePath();

    // Strokes diamond outline path
    this.graphics.strokePath();
  }

  // Draws a translucent tile fill without default tile border
  tileDiamondFillOnlyDraw(
    tilePoint: CoordinateTilePoint,
    colorHex: string,
    alpha: number
  ): void {
    // Stores tile diamond point list
    const diamondPointList = isometricTileDiamondPointListGet(tilePoint);

    // Stores Phaser color number
    const colorNumber = phaserColorNumberFromHexGet(colorHex);

    // Sets fill style
    this.graphics.fillStyle(colorNumber, alpha);

    // Starts diamond path
    this.graphics.beginPath();

    // Moves to top diamond point
    this.graphics.moveTo(diamondPointList[0].x, diamondPointList[0].y);

    // Draws line to right diamond point
    this.graphics.lineTo(diamondPointList[1].x, diamondPointList[1].y);

    // Draws line to bottom diamond point
    this.graphics.lineTo(diamondPointList[2].x, diamondPointList[2].y);

    // Draws line to left diamond point
    this.graphics.lineTo(diamondPointList[3].x, diamondPointList[3].y);

    // Closes diamond path
    this.graphics.closePath();

    // Fills diamond path
    this.graphics.fillPath();
  }
}