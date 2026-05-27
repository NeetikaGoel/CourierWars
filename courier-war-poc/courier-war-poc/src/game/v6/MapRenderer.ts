
// Draws the map array passed by GameSceneV6

import Phaser from "phaser";
import { GAME_CONFIG } from "./GameConfig";
import { GAME_CONSTANTS } from "./GameConstants";
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from "./Iso";
import type { GameMap, MapTile } from "./GameShapeTypes";

export class MapRenderer {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
      this.scene = scene;
    }

  draw(map: GameMap) {
    for (const row of map) {
      for (const tile of row) {
        this.drawTile(tile);
      }
    }
  }

  getTileScreenPosition(tileX: number, tileY: number) {
    const position = isoToScreen(tileX, tileY);

    return {
      x: GAME_CONFIG.map.originX + position.x,
      y: GAME_CONFIG.map.originY + position.y,
    };
  }

  private drawTile(tile: MapTile) {
    const position = this.getTileScreenPosition(tile.x, tile.y);
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(tile.color, GAME_CONFIG.alpha.tile);
    graphics.lineStyle(
      GAME_CONFIG.line.borderWidth,
      GAME_CONFIG.colors.border,
      GAME_CONFIG.alpha.border
    );

    graphics.beginPath();
    graphics.moveTo(position.x, position.y);
    graphics.lineTo(position.x + TILE_WIDTH / GAME_CONSTANTS.math.half, position.y + TILE_HEIGHT / GAME_CONSTANTS.math.half);
    graphics.lineTo(position.x, position.y + TILE_HEIGHT);
    graphics.lineTo(position.x - TILE_WIDTH / GAME_CONSTANTS.math.half, position.y + TILE_HEIGHT / GAME_CONSTANTS.math.half);
    graphics.closePath();

    graphics.fillPath();
    graphics.strokePath();
      graphics.setDepth(position.y);
    
  }
}