
// Renders 256x256 Courier War city and handles Courier movement + correct mouse-centered zoom.

import Phaser from "phaser";
import { GAME_CONFIG } from "./GameConfigV4";
import { GAME_CONSTANTS } from "./GameConstantsV4";
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from "./IsoV4";
import {
  mapTiles,
  mapWidth,
  mapHeight,
  findStartTile,
} from "./MapDataV4";
import type { MapTile, TileType, HurdleCandidateType } from "./MapDataV4";

export class GameSceneV4 extends Phaser.Scene {
  private courier!: Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite;

  private courierTileX: number = GAME_CONFIG.cityGeneration.startPoint.x;
    private courierTileY: number = GAME_CONFIG.cityGeneration.startPoint.y;

    private lastPointerX: number = GAME_CONSTANTS.mapGeneration.firstIndex;
    private lastPointerY: number = GAME_CONSTANTS.mapGeneration.firstIndex;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private centerCourierKey!: Phaser.Input.Keyboard.Key;

  private isMoving = false;
  private isDraggingCamera = false;

  constructor() {
    super("GameSceneV4");
  }

  preload() {
    if (!GAME_CONFIG.assets.useTileImages) return;

    const basePath = GAME_CONFIG.assets.basePath;
    const keys = GAME_CONFIG.assets.keys;
    const files = GAME_CONFIG.assets.files;

    this.load.image(keys.road, basePath + files.road);
    this.load.image(keys.building, basePath + files.building);
    this.load.image(keys.start, basePath + files.start);
    this.load.image(keys.delivery, basePath + files.delivery);
    this.load.image(keys.trafficLight, basePath + files.trafficLight);
    this.load.image(keys.construction, basePath + files.construction);
    this.load.image(keys.bridge, basePath + files.bridge);
    this.load.image(keys.tunnel, basePath + files.tunnel);
    this.load.image(keys.shortcut, basePath + files.shortcut);
    this.load.image(keys.park, basePath + files.park);
    this.load.image(keys.water, basePath + files.water);
    this.load.image(keys.courier, basePath + files.courier);
  }

  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.centerCourierKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    const startTile = findStartTile();
    this.courierTileX = startTile.x;
    this.courierTileY = startTile.y;

    this.setupCamera();
    this.drawMap();
    this.createCourier();
    this.addInstructionText();
  }

  update() {
    this.handleCameraCenterOnCourier();

    if (this.isMoving) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.tryMoveCourier(GAME_CONSTANTS.directions.left.dx, GAME_CONSTANTS.directions.left.dy);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.tryMoveCourier(GAME_CONSTANTS.directions.right.dx, GAME_CONSTANTS.directions.right.dy);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.tryMoveCourier(GAME_CONSTANTS.directions.up.dx, GAME_CONSTANTS.directions.up.dy);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.tryMoveCourier(GAME_CONSTANTS.directions.down.dx, GAME_CONSTANTS.directions.down.dy);
    }
  }

  private setupCamera() {
    const camera = this.cameras.main;
  
    camera.setZoom(GAME_CONFIG.camera.startZoom);
  
    const bounds = this.getEstimatedWorldBounds();
  
    camera.setBounds(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );
  
    this.centerCameraOnCourierImmediately();
  
    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number
      ) => {
        this.zoomToPointer(pointer, deltaY);
      }
    );
  
    this.input.on(
      "pointerdown",
      (pointer: Phaser.Input.Pointer) => {
        if (pointer.button !== GAME_CONSTANTS.phaser.defaultPointerButton) {
          return;
        }
  
        this.isDraggingCamera = true;
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
      }
    );
  
    this.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer) => {
        if (!this.isDraggingCamera) {
          return;
        }
  
        const deltaX = pointer.x - this.lastPointerX;
        const deltaY = pointer.y - this.lastPointerY;
  
        camera.scrollX -=
          (deltaX / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;
  
        camera.scrollY -=
          (deltaY / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;
  
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
      }
    );
  
    this.input.on(
      "pointerup",
      () => {
        this.isDraggingCamera = false;
      }
    );
  
    this.input.on(
      "pointerout",
      () => {
        this.isDraggingCamera = false;
      }
    );
  }

  // This is the important fix:
  // Zoom happens around the mouse pointer's world position.
  // The tile under the mouse stays under the mouse while zooming.
  private zoomToPointer(pointer: Phaser.Input.Pointer, deltaY: number) {
    const camera = this.cameras.main;

    const worldPointBeforeZoom = camera.getWorldPoint(pointer.x, pointer.y);

    const nextZoom =
      deltaY > GAME_CONSTANTS.mapGeneration.firstIndex
        ? Math.max(GAME_CONFIG.camera.minZoom, camera.zoom - GAME_CONFIG.camera.zoomStep)
        : Math.min(GAME_CONFIG.camera.maxZoom, camera.zoom + GAME_CONFIG.camera.zoomStep);

    camera.setZoom(nextZoom);

    const worldPointAfterZoom = camera.getWorldPoint(pointer.x, pointer.y);

    camera.scrollX += worldPointBeforeZoom.x - worldPointAfterZoom.x;
    camera.scrollY += worldPointBeforeZoom.y - worldPointAfterZoom.y;
  }

  private drawMap() {
    for (let y = GAME_CONSTANTS.mapGeneration.firstIndex; y < mapHeight; y++) {
      for (let x = GAME_CONSTANTS.mapGeneration.firstIndex; x < mapWidth; x++) {
        const tile = mapTiles[y][x];
        const screenPosition = this.getTileScreenPosition(x, y);

        if (GAME_CONFIG.assets.useTileImages) {
          this.drawTileImage(tile, screenPosition.x, screenPosition.y);
        } else {
          this.drawDiamondTile(tile, screenPosition.x, screenPosition.y);
        }

        this.drawHurdleCandidateMarkers(tile, screenPosition.x, screenPosition.y);
      }
    }
  }

  private drawTileImage(tile: MapTile, x: number, y: number) {
    const assetKey = this.getAssetKeyForTile(tile.type);

    this.add
      .image(x, y + TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor, assetKey)
      .setDepth(y);
  }

  private drawDiamondTile(tile: MapTile, x: number, y: number) {
    const graphics = this.add.graphics();

    graphics.fillStyle(
      this.getColorForTile(tile.type),
      tile.walkable ? GAME_CONFIG.alpha.walkableTile : GAME_CONFIG.alpha.blockedTile
    );

    graphics.lineStyle(
      GAME_CONFIG.line.tileBorderWidth,
      GAME_CONFIG.colors.tileBorder,
      GAME_CONFIG.alpha.tileBorder
    );

    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(
      x + TILE_WIDTH / GAME_CONSTANTS.tileMath.halfDivisor,
      y + TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor
    );
    graphics.lineTo(x, y + TILE_HEIGHT);
    graphics.lineTo(
      x - TILE_WIDTH / GAME_CONSTANTS.tileMath.halfDivisor,
      y + TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor
    );
    graphics.closePath();

    graphics.fillPath();
    graphics.strokePath();

    graphics.setDepth(y);
  }

  private drawHurdleCandidateMarkers(tile: MapTile, x: number, y: number) {
    if (tile.hurdleCandidates.length === GAME_CONSTANTS.mapGeneration.firstIndex) return;

    this.add
      .circle(
        x,
        y + TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor,
        GAME_CONFIG.marker.radius,
        this.getColorForHurdleCandidate(tile.hurdleCandidates[GAME_CONSTANTS.mapGeneration.firstIndex]),
        GAME_CONFIG.alpha.marker
      )
      .setDepth(GAME_CONFIG.marker.depthOffset + y);
  }

  private createCourier() {
    const position = this.getCourierScreenPosition();

    if (GAME_CONFIG.assets.useTileImages) {
      this.courier = this.add.sprite(
        position.x,
        position.y,
        GAME_CONFIG.assets.keys.courier
      );
    } else {
      this.courier = this.add.circle(
        position.x,
        position.y,
        GAME_CONFIG.courier.radius,
        GAME_CONFIG.courier.color
      );
    }

    this.courier.setDepth(GAME_CONFIG.courier.depth);
  }

  private tryMoveCourier(dx: number, dy: number) {
    const nextX = this.courierTileX + dx;
    const nextY = this.courierTileY + dy;

    if (!this.isInsideMap(nextX, nextY)) return;

    const nextTile = mapTiles[nextY][nextX];

    if (!nextTile.walkable) return;

    this.courierTileX = nextX;
    this.courierTileY = nextY;

    const position = this.getCourierScreenPosition();

    const duration =
      GAME_CONFIG.movement.baseMoveDurationMs * nextTile.movementCost;

    this.isMoving = true;

    this.tweens.add({
      targets: this.courier,
      x: position.x,
      y: position.y,
      duration,
      ease: "Power2",
      onComplete: () => {
        this.isMoving = false;
        this.checkDeliveryReached();
      },
    });
  }

  private handleCameraCenterOnCourier() {
    if (!Phaser.Input.Keyboard.JustDown(this.centerCourierKey)) return;

    this.centerCameraOnCourierSmoothly();
  }

  private centerCameraOnCourierImmediately() {
    const position = this.getCourierScreenPosition();

    this.cameras.main.centerOn(position.x, position.y);
  }

  private centerCameraOnCourierSmoothly() {
    const position = this.getCourierScreenPosition();

    this.cameras.main.pan(
      position.x,
      position.y,
      GAME_CONFIG.camera.courierFollowDurationMs,
      "Power2"
    );
  }

  private getCourierScreenPosition() {
    const position = isoToScreen(this.courierTileX, this.courierTileY);

    return {
      x: GAME_CONFIG.map.originX + position.x,
      y:
        GAME_CONFIG.map.originY +
        position.y +
        TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor,
    };
  }

  private getTileScreenPosition(tileX: number, tileY: number) {
    const position = isoToScreen(tileX, tileY);

    return {
      x: GAME_CONFIG.map.originX + position.x,
      y: GAME_CONFIG.map.originY + position.y,
    };
  }

  private getEstimatedWorldBounds() {
    const top = this.getTileScreenPosition(
      GAME_CONSTANTS.mapGeneration.firstIndex,
      GAME_CONSTANTS.mapGeneration.firstIndex
    );

    const right = this.getTileScreenPosition(
      mapWidth - GAME_CONSTANTS.mapGeneration.borderThickness,
      GAME_CONSTANTS.mapGeneration.firstIndex
    );

    const bottom = this.getTileScreenPosition(
      mapWidth - GAME_CONSTANTS.mapGeneration.borderThickness,
      mapHeight - GAME_CONSTANTS.mapGeneration.borderThickness
    );

    const left = this.getTileScreenPosition(
      GAME_CONSTANTS.mapGeneration.firstIndex,
      mapHeight - GAME_CONSTANTS.mapGeneration.borderThickness
    );

    const minX = Math.min(top.x, right.x, bottom.x, left.x) - GAME_CONFIG.camera.worldPadding;
    const maxX = Math.max(top.x, right.x, bottom.x, left.x) + GAME_CONFIG.camera.worldPadding;
    const minY = Math.min(top.y, right.y, bottom.y, left.y) - GAME_CONFIG.camera.worldPadding;
    const maxY = Math.max(top.y, right.y, bottom.y, left.y) + GAME_CONFIG.camera.worldPadding;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private checkDeliveryReached() {
    const currentTile = mapTiles[this.courierTileY][this.courierTileX];

    if (currentTile.type !== "delivery") return;

    this.add
      .text(GAME_CONFIG.ui.winX, GAME_CONFIG.ui.winY, "Courier Wins! Package Delivered!", {
        fontSize: GAME_CONFIG.ui.winFontSize,
        color: GAME_CONFIG.colors.uiText,
        backgroundColor: GAME_CONFIG.colors.winBackground,
        padding: {
          x: GAME_CONFIG.ui.paddingX,
          y: GAME_CONFIG.ui.paddingY,
        },
      })
      .setScrollFactor(GAME_CONSTANTS.mapGeneration.firstIndex)
      .setDepth(GAME_CONFIG.ui.depth);
  }

  private addInstructionText() {
    this.add
      .text(
        GAME_CONFIG.ui.instructionX,
        GAME_CONFIG.ui.instructionY,
        "Courier War V5 | 256x256 City | Arrow Keys = Move | Mouse Wheel = Zoom to Mouse | Drag = Pan | C = Center Courier",
        {
          fontSize: GAME_CONFIG.ui.instructionFontSize,
          color: GAME_CONFIG.colors.uiText,
          backgroundColor: GAME_CONFIG.colors.uiBackground,
          padding: {
            x: GAME_CONFIG.ui.paddingX,
            y: GAME_CONFIG.ui.paddingY,
          },
        }
      )
      .setScrollFactor(GAME_CONSTANTS.mapGeneration.firstIndex)
      .setDepth(GAME_CONFIG.ui.depth);
  }

  private getColorForTile(type: TileType): number {
    return GAME_CONFIG.colors[type];
  }

  private getAssetKeyForTile(type: TileType): string {
    return GAME_CONFIG.assets.keys[type];
  }

  private getColorForHurdleCandidate(type: HurdleCandidateType): number {
    if (type === "roadBlock") return GAME_CONFIG.colors.roadBlockCandidate;
    if (type === "trafficJam") return GAME_CONFIG.colors.trafficJamCandidate;
    if (type === "closedGate") return GAME_CONFIG.colors.closedGateCandidate;
    if (type === "wrongDirectionSign") return GAME_CONFIG.colors.wrongDirectionCandidate;
    if (type === "brokenRoad") return GAME_CONFIG.colors.brokenRoadCandidate;
    if (type === "movingBarrier") return GAME_CONFIG.colors.movingBarrierCandidate;

    return GAME_CONFIG.colors.checkpointCandidate;
  }

  private isInsideMap(x: number, y: number): boolean {
    return (
      x >= GAME_CONSTANTS.mapGeneration.firstIndex &&
      x < mapWidth &&
      y >= GAME_CONSTANTS.mapGeneration.firstIndex &&
      y < mapHeight
    );
  }
}
