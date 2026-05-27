// GameSceneV3.ts
// 36x36 isometric city scene for Courier War.

import Phaser from "phaser";
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from "./IsoV3";
import {
  mapTiles,
  mapWidth,
  mapHeight,
  findStartTile,
} from "./MapDataV3";
import type { MapTile } from "./MapDataV3";

export class GameSceneV3 extends Phaser.Scene {
  private courier!: Phaser.GameObjects.Arc;

  private courierTileX = 0;
  private courierTileY = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private originX = 250;
  private originY = 0;

  private isMoving = false;

  constructor()
  {
    super("GameSceneV3");
  }

  create()
  {
    this.cursors = this.input.keyboard!.createCursorKeys();

    const startTile = findStartTile();
    this.courierTileX = startTile.x;
    this.courierTileY = startTile.y;

    this.drawMap();
    this.createCourier();
    this.addInstructionText();
    this.setupCamera();
  }

  update()
  {
    if (this.isMoving) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!))
    {
      this.tryMoveCourier(-1, 0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!))
    {
      this.tryMoveCourier(1, 0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!))
    {
      this.tryMoveCourier(0, -1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!))
    {
      this.tryMoveCourier(0, 1);
    }
  }

  private drawMap()
  {
    for (let y = 0; y < mapHeight; y++)
    {
      for (let x = 0; x < mapWidth; x++)
      {
        const tile = mapTiles[y][x];
        const pos = isoToScreen(x, y);

        const screenX = this.originX + pos.x;
        const screenY = this.originY + pos.y;

        this.drawDiamond(
          screenX,
          screenY,
          this.getTileColor(tile),
          tile.walkable
        );
      }
    }
  }

  private getTileColor(tile: MapTile): number
  {
    if (tile.type==="building") return 0x1f2937;
    if (tile.type==="road") return 0x64748b;
    if (tile.type==="start") return 0x22c55e;
    if (tile.type==="delivery") return 0xfacc15;
    if (tile.type==="trafficLight") return 0xef4444;
    if (tile.type==="construction") return 0xf97316;
    if (tile.type==="bridge") return 0x38bdf8;
    if (tile.type==="tunnel") return 0x8b5cf6;
    if (tile.type==="shortcut") return 0x16a34a;
    if (tile.type==="park") return 0x14532d;
    if (tile.type==="water") return 0x0284c7;

    return 0xffffff; //white then ofc
  }

  private drawDiamond(
    x: number,
    y: number,
    color: number,
    walkable: boolean
  )
  {
    const graphics = this.add.graphics();

    graphics.fillStyle(color, walkable ? 1 : 0.85);
    graphics.lineStyle(1, 0xffffff, 0.18);

    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    graphics.lineTo(x, y + TILE_HEIGHT);
    graphics.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    graphics.closePath();

    graphics.fillPath();
    graphics.strokePath();

    graphics.setDepth(y);
  }

  private createCourier()
  {
    const pos = this.getCourierScreenPosition();

    this.courier = this.add.circle(pos.x, pos.y, 9, 0xff0000);
    this.courier.setDepth(10000);
  }

  private tryMoveCourier(dx: number, dy: number)
  {
    const nextX = this.courierTileX + dx;
    const nextY = this.courierTileY + dy;

    if (nextX < 0 || nextX >= mapWidth || nextY < 0 || nextY >= mapHeight)
    {
      return;
    }

    const nextTile = mapTiles[nextY][nextX];

    if (!nextTile.walkable)
    {
      return;
    }

    this.courierTileX = nextX;
    this.courierTileY = nextY;

    const pos = this.getCourierScreenPosition();
    const duration = 140 * nextTile.movementCost;

    this.isMoving = true;

    //animation time
    this.tweens.add({
      targets: this.courier,
      x: pos.x,
      y: pos.y,
      duration,
      ease: "Power2",
      onComplete: () => {
        this.isMoving = false;
        this.checkDeliveryReached();
      },
    });
  }

  private getCourierScreenPosition()
  {
    const pos = isoToScreen(this.courierTileX, this.courierTileY);

    return {
      x: this.originX + pos.x,
      y: this.originY + pos.y + TILE_HEIGHT / 2,
    };
  }

  private checkDeliveryReached()
  {
    const currentTile = mapTiles[this.courierTileY][this.courierTileX];

    if (currentTile.type==="delivery") {
      this.add
        .text(30, 80, "Courier Wins! Package Delivered!", {
          fontSize: "28px",
          color: "#ffffff",
          backgroundColor: "#16a34a",
          padding: { x: 12, y: 8 },
        })
        .setScrollFactor(0)
        .setDepth(20000);
    }
  }

  private addInstructionText()
  {
    this.add
      .text(
        30,
        30,
        "Courier War V3 | 36x36 City | Arrow Keys = Move | Mouse Wheel = Zoom",
        {
          fontSize: "18px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 10, y: 6 },
        }
      )
      .setScrollFactor(0)
      .setDepth(20000);
  }

  //camera positioning
  private setupCamera()
  {
    this.cameras.main.setZoom(0.95);

    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: unknown,
        _deltaX: number,
        deltaY: number
      ) => {
        const camera = this.cameras.main;

        if (deltaY > 0)
        {
          camera.zoom = Math.max(0.45, camera.zoom - 0.05);
        }
        else
        {
          camera.zoom = Math.min(1.6, camera.zoom + 0.05);
        }
      }
    );
  }
}