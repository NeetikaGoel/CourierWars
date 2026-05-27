// Phaser scene for 25x25 Courier War city map rendering and Courier movement!

import Phaser from "phaser";
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from "./IsoV2";
import { mapTiles, mapWidth, mapHeight, findStartTile } from "./MapDataV2";
import type { MapTile } from "./MapDataV2";

export class GameSceneV2 extends Phaser.Scene {
  // Courier is currently a circle
  // Phaser creates circles as Arc objects internally
  private courier!: Phaser.GameObjects.Arc;

  // Courier logical grid location
  private courierTileX = 0;
  private courierTileY = 0;

  // Arrow key controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // We keep all drawn tile graphics here
  // Later will help in updating tile color/state without redrawing everything
  private tileGraphics: Phaser.GameObjects.Graphics[] = [];

  // Map origin
  // shifting the whole isometric city to a nice visible position
  private originX = 900;
  private originY = 80;

  // To prevent player from starting another movement while tween is running!!
  // allows to create smooth, time-based changes to obj props
  private isMoving = false;

  constructor()
  {
    super("GameSceneV2");
  }

  create() {
    // Creating keyboard arrow controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Finding start tile from map data
    const startTile = findStartTile();
    this.courierTileX = startTile.x;
    this.courierTileY = startTile.y;

    // Drawing city map first
    this.drawMap();

    // Creating Courier after map so Courier appears on top ofc
    this.createCourier();

    // Adding helper text
    this.addInstructionText();

    // Adding camera controls for big 25x25 map
    this.setupCamera();
  }

  update()
  {
    // We do not want to allow new move while current movement animation is running!!
    if (this.isMoving)
    {
      return;
    }

    //now same controls
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

  // Drawing the complete 25x25 city map!!
  private drawMap() {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = mapTiles[y][x];

        // Converting grid position to isometric screen position ofc
        const pos = isoToScreen(x, y);
        const screenX = this.originX + pos.x;
        const screenY = this.originY + pos.y;

        // Picking color based on tile type!!
        const color = this.getTileColor(tile);

        // Drawing tile finally
        this.drawDiamond(screenX, screenY, color, tile.walkable);

        // Optional tiny labels for debugging!
        // For 25x25, labels can make map look crowded, so default is false!!
        const showCoordinates = false;

        if (showCoordinates)
        {
          this.add
            .text(screenX - 12, screenY - 7, `${x},${y}`, {
              fontSize: "9px",
              color: "#ffffff",
            })
            .setDepth(20);
        }
      }
    }
  }

  // Deciding color of each tile type now!!!
  private getTileColor(tile: MapTile): number
  {
    if (tile.type==="empty") return 0x1f2933;        // dark buildings
    if (tile.type==="blocked") return 0x111111;      // blocked
    if (tile.type==="road") return 0x607d8b;         // normal road
    if (tile.type==="start") return 0x4caf50;        // green start
    if (tile.type==="delivery") return 0xffc107;     // yellow delivery
    if (tile.type==="trafficLight") return 0xef4444; // red signal tile
    if (tile.type==="construction") return 0xf97316; // orange slow zone
    if (tile.type==="bridge") return 0x38bdf8;       // blue bridge
    if (tile.type==="tunnel") return 0x8b5cf6;       // purple tunnel
    if (tile.type==="shortcut") return 0x22c55e;     // green shortcut

    return 0xffffff;
  }

  // Drawing 1 diamond tile!!
  private drawDiamond(x: number, y: number, color: number, walkable: boolean)
  {
    const graphics = this.add.graphics();

    // Non-walkable tiles are slightly darker
    const alpha = walkable ? 1 : 0.65;

    graphics.fillStyle(color, alpha);
    graphics.lineStyle(1, 0xffffff, 0.25);

    // Diamond points:
    // top -> right -> bottom -> left -> back to top
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    graphics.lineTo(x, y + TILE_HEIGHT);
    graphics.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    graphics.closePath();

    graphics.fillPath();
    graphics.strokePath();

    graphics.setDepth(y);

    this.tileGraphics.push(graphics);
  }

  // Creating Courier as red circle
  private createCourier()
  {
    const pos = this.getCourierScreenPosition();

    this.courier = this.add.circle(pos.x, pos.y, 10, 0xff0000);

    // Courier should always appear above map okii
    this.courier.setDepth(10000);
  }

  // Trying to move Courier now by dx/dy
  private tryMoveCourier(dx: number, dy: number)
  {
    const nextX = this.courierTileX + dx;
    const nextY = this.courierTileY + dy;

    // Checking first outside map boundary
    if (nextX < 0 || nextX >= mapWidth || nextY < 0 || nextY >= mapHeight)
    {
      return;
    }

    const nextTile = mapTiles[nextY][nextX];

    // Checking if next tile can be walked on or not
    if (!nextTile.walkable)
    {
      return;
    }

    // Updating logical position
    this.courierTileX = nextX;
    this.courierTileY = nextY;

    const pos = this.getCourierScreenPosition();

    // Movement duration depends on tile movement cost
    // Construction/traffic light tiles are slower
    // Bridge/tunnel/shortcut can feel faster
    const duration = 150 * nextTile.movementCost;

    this.isMoving = true;

    //adding animation for it
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

  // Converting Courier tile position to screen position
  private getCourierScreenPosition()
  {
    const pos = isoToScreen(this.courierTileX, this.courierTileY);

    return {
      x: this.originX + pos.x,
      y: this.originY + pos.y + TILE_HEIGHT / 2,
    };
  }

  // Checking if Courier reached delivery tile omgggg
  private checkDeliveryReached()
  {
    const currentTile = mapTiles[this.courierTileY][this.courierTileX];

    if (currentTile.type==="delivery")
    {
      this.add
        .text(30, 80, "Courier Wins! Package Delivered!!", {
          fontSize: "28px",
          color: "#ffffff",
          backgroundColor: "#16a34a",
          padding: { x: 12, y: 8 },
        })
        .setScrollFactor(0)
        .setDepth(20000);
    }
  }

  // Adding fixed UI text!!
  private addInstructionText() {
    this.add
      .text(
        30,
        30,
        "Courier War V2: 25x25 Isometric City Map | Arrow Keys = Move | Mouse Wheel = Zoom",
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

  // Simple camera controls for large map!!
  private setupCamera() {
    // Camera starting at normal zoom
    this.cameras.main.setZoom(1);

    // Mouse wheel zoom!!
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      const camera = this.cameras.main;

      if (deltaY > 0)
      {
        camera.zoom = Math.max(0.5, camera.zoom - 0.05);
      }
      else
      {
        camera.zoom = Math.min(1.5, camera.zoom + 0.05);
      }
    });
  }
}