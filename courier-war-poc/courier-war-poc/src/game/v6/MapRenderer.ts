
// Draws the map array passed by GameScene
// so will take map details from game scene as per map data and draw it on screen

import Phaser from "phaser";
import { GAME_CONFIG } from "./GameConfig";
import { GAME_CONSTANTS } from "./GameConstants";
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from "./Iso";
import type { GameMap, MapTile } from "./GameShapeTypes";

export class MapRenderer
{
  //first we always need to store the game scene
  private scene: Phaser.Scene;
  
  //constructor comes always after defining class variables!
  constructor(scene: Phaser.Scene)
    {
      this.scene = scene;
    }

  //now most imp function of this class to draw the map
  //jsut run the for loop
  draw(map: GameMap)
  {
    for (const row of map)
    {
      for (const tile of row)
      {
        this.drawTile(tile);
      }
    }
  }

  //now we have ofc the grid position but to draw on screen we would need screen position
  //cutest file will show its importance here
  //so lets say func to get those screen coordinates and then pass to final drawtile func

  getTileScreenPosition(tileX: number, tileY: number)
  {
    const position = isoToScreen(tileX, tileY);

    return {
      x: GAME_CONFIG.map.originX + position.x,
      y: GAME_CONFIG.map.originY + position.y,
    };
  }

  //now drawtile function final most imp
  private drawTile(tile: MapTile)
  {
    //use the above func dear first to know where to draw
    const position = this.getTileScreenPosition(tile.x, tile.y);
    //graphics obj is always needed to draw shapes, we need to draw diamond here
    const graphics = this.scene.add.graphics();

    //we can define its specialities here!!
    graphics.fillStyle(this.hexStringToNumber(tile.color), GAME_CONFIG.alpha.tile);
    graphics.lineStyle(
      GAME_CONFIG.line.borderWidth,
      this.hexStringToNumber(GAME_CONFIG.colors.border),
      GAME_CONFIG.alpha.border
    );

    //diamond tile creation hehe same format again
    //just update variables of parameters
    graphics.beginPath();
    graphics.moveTo(position.x, position.y);
    graphics.lineTo(position.x + TILE_WIDTH / GAME_CONSTANTS.math.half, position.y + TILE_HEIGHT / GAME_CONSTANTS.math.half);
    graphics.lineTo(position.x, position.y + TILE_HEIGHT);
    graphics.lineTo(position.x - TILE_WIDTH / GAME_CONSTANTS.math.half, position.y + TILE_HEIGHT / GAME_CONSTANTS.math.half);
    graphics.closePath();

    //hehe color add, make border done done done
    graphics.fillPath();
    graphics.strokePath();
    graphics.setDepth(position.y);
    

    //In isometric maps, tiles lower on screen should usually appear above tiles higher on screen!!
    //thats why position.y is used to show top tiles behind and bottom tiles in front
  }

  private hexStringToNumber(color: string): number
  {
    return Number(color.replace("#", "0x"));
  }
}