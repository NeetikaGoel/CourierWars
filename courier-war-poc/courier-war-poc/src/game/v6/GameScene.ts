// GameSceneV6.ts
// Simple scene that uses generated map data and renderer class

import Phaser from "phaser";
import { GAME_CONFIG } from "./GameConfig";
import { GAME_CONSTANTS } from "./GameConstants";
import { TileType } from "./GameEnums";
import { mapTiles, mapWidth, mapHeight, findStartTile } from "./MapData";
import { MapRenderer } from "./MapRenderer";
import { isoToScreen, TILE_HEIGHT } from "./Iso";
import type { MapTile } from "./GameShapeTypes";

export class GameScene extends Phaser.Scene {
  private courier!: Phaser.GameObjects.Arc;
  private mapRenderer!: MapRenderer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private centerKey!: Phaser.Input.Keyboard.Key;

  private courierTileX: number = GAME_CONFIG.map.originX;
  private courierTileY: number = GAME_CONFIG.map.originY;
  private lastPointerX: number = GAME_CONSTANTS.math.zero;
  private lastPointerY: number = GAME_CONSTANTS.math.zero;

  private isMoving = false;
  private isDraggingCamera = false;
  private feedbackElement?: HTMLDivElement;
  private hudElement?: HTMLDivElement;

  constructor() {
    super(GAME_CONFIG.scene.key);
  }


  create() {
    this.mapRenderer = new MapRenderer(this);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.centerKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    const startTile = findStartTile();
    this.courierTileX = startTile.x;
    this.courierTileY = startTile.y;

    this.setupCamera();
    this.mapRenderer.draw(mapTiles);
    this.createCourier();
    this.addInstructionText();
  }

  update() {
    this.handleCameraCenter();

    if (this.isMoving) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) this.tryMove(GAME_CONSTANTS.directions.left.dx, GAME_CONSTANTS.directions.left.dy);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) this.tryMove(GAME_CONSTANTS.directions.right.dx, GAME_CONSTANTS.directions.right.dy);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) this.tryMove(GAME_CONSTANTS.directions.up.dx, GAME_CONSTANTS.directions.up.dy);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) this.tryMove(GAME_CONSTANTS.directions.down.dx, GAME_CONSTANTS.directions.down.dy);
  }

  private setupCamera() {
    const camera = this.cameras.main;
    const bounds = this.getWorldBounds();

    camera.setZoom(GAME_CONFIG.camera.startZoom);
    camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.centerCameraOnMap();

    this.input.on("wheel", (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.zoomToPointer(pointer, dy);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== GAME_CONSTANTS.phaser.leftMouseButton) return;

      this.isDraggingCamera = true;
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDraggingCamera) return;

      camera.scrollX -= ((pointer.x - this.lastPointerX) / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;
      camera.scrollY -= ((pointer.y - this.lastPointerY) / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;

      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.input.on("pointerup", () => (this.isDraggingCamera = false));
    this.input.on("pointerout", () => (this.isDraggingCamera = false));
  }
    
  private centerCameraOnMap() {
    const centerTileX = Math.floor(mapWidth / GAME_CONSTANTS.math.half);
    const centerTileY = Math.floor(mapHeight / GAME_CONSTANTS.math.half);
  
    const centerPosition = this.mapRenderer.getTileScreenPosition(
      centerTileX,
      centerTileY
    );
  
    this.cameras.main.centerOn(centerPosition.x, centerPosition.y);
  }

  private tryMove(dx: number, dy: number) {
    const nextX = this.courierTileX + dx;
    const nextY = this.courierTileY + dy;

    if (!this.isInsideMap(nextX, nextY)) return;

    const tile = mapTiles[nextY][nextX];

    if (!tile.walkable) return;

    this.courierTileX = nextX;
    this.courierTileY = nextY;
    this.showTileFeedback(tile);

    this.isMoving = true;

    this.tweens.add({
      targets: this.courier,
      ...this.getCourierScreenPosition(),
      duration: GAME_CONFIG.movement.baseDurationMs * tile.movementCost,
      ease: GAME_CONFIG.camera.ease,
      onComplete: () => {
        this.isMoving = false;
        this.checkWin(tile);
      },
    });
  }

  private createCourier() {
    const position = this.getCourierScreenPosition();

    this.courier = this.add.circle(
      position.x,
      position.y,
      GAME_CONFIG.courier.radius,
      GAME_CONFIG.colors.courier
    );

    this.courier.setDepth(GAME_CONFIG.courier.depth);
  }

  private getCourierScreenPosition() {
    const position = isoToScreen(this.courierTileX, this.courierTileY);

    return {
      x: GAME_CONFIG.map.originX + position.x,
      y: GAME_CONFIG.map.originY + position.y + TILE_HEIGHT / GAME_CONSTANTS.math.half,
    };
  }

  private zoomToPointer(pointer: Phaser.Input.Pointer, deltaY: number) {
    const camera = this.cameras.main;
    const before = camera.getWorldPoint(pointer.x, pointer.y);
    const zoom = deltaY > GAME_CONSTANTS.math.zero
      ? Math.max(GAME_CONFIG.camera.minZoom, camera.zoom - GAME_CONFIG.camera.zoomStep)
      : Math.min(GAME_CONFIG.camera.maxZoom, camera.zoom + GAME_CONFIG.camera.zoomStep);

    camera.setZoom(zoom);

    const after = camera.getWorldPoint(pointer.x, pointer.y);

    camera.scrollX += before.x - after.x;
    camera.scrollY += before.y - after.y;
  }

  private handleCameraCenter() {
    if (Phaser.Input.Keyboard.JustDown(this.centerKey)) {
      this.centerCameraOnCourier();
    }
  }

  private centerCameraOnCourier() {
    const position = this.getCourierScreenPosition();
    this.cameras.main.pan(
        position.x,
        position.y,
        GAME_CONFIG.camera.panDurationMs,
        GAME_CONFIG.camera.ease
      );
  }

  private getWorldBounds() {
    const top = this.mapRenderer.getTileScreenPosition(
      GAME_CONSTANTS.math.zero,
      GAME_CONSTANTS.math.zero
    );
  
    const right = this.mapRenderer.getTileScreenPosition(
      mapWidth,
      GAME_CONSTANTS.math.zero
    );
  
    const bottom = this.mapRenderer.getTileScreenPosition(
      mapWidth,
      mapHeight
    );
  
    const left = this.mapRenderer.getTileScreenPosition(
      GAME_CONSTANTS.math.zero,
      mapHeight
    );
  
    const minX =
      Math.min(top.x, right.x, bottom.x, left.x) - GAME_CONFIG.camera.worldPadding;
  
    const maxX =
      Math.max(top.x, right.x, bottom.x, left.x) + GAME_CONFIG.camera.worldPadding;
  
    const minY =
      Math.min(top.y, right.y, bottom.y, left.y) - GAME_CONFIG.camera.worldPadding;
  
    const maxY =
      Math.max(top.y, right.y, bottom.y, left.y) + GAME_CONFIG.camera.worldPadding;
  
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private showTileFeedback(tile: MapTile) {
    const message = this.getFeedbackText(tile);

    if (!GAME_CONFIG.feedback.enabled || message === GAME_CONFIG.feedback.normalText) return;

    this.feedbackElement?.remove();

    this.feedbackElement = this.addHudText(
      GAME_CONFIG.ui.feedbackX,
      GAME_CONFIG.ui.feedbackY,
      message,
      GAME_CONFIG.ui.feedbackFontSize,
      GAME_CONFIG.colors.feedbackBackground
    );

    this.time.delayedCall(GAME_CONFIG.feedback.durationMs, () => {
      this.feedbackElement?.remove();
      this.feedbackElement = undefined;
    });
  }

  private getFeedbackText(tile: MapTile) {
    if (tile.type === TileType.TrafficLight) return GAME_CONFIG.feedback.trafficText;
    if (tile.type === TileType.Construction) return GAME_CONFIG.feedback.constructionText;
    if (tile.type === TileType.Bridge) return GAME_CONFIG.feedback.bridgeText;
    if (tile.type === TileType.Tunnel) return GAME_CONFIG.feedback.tunnelText;
    if (tile.type === TileType.Shortcut) return GAME_CONFIG.feedback.shortcutText;

    return GAME_CONFIG.feedback.normalText;
  }

  private checkWin(tile: MapTile) {
    if (tile.type !== TileType.Delivery) return;

    this.addHudText(
      GAME_CONFIG.ui.winX,
      GAME_CONFIG.ui.winY,
      GAME_CONFIG.ui.winText,
      GAME_CONFIG.ui.winFontSize,
      GAME_CONFIG.colors.winBackground
    );
  }

  private addInstructionText() {
    this.addHudText(
      GAME_CONFIG.ui.instructionX,
      GAME_CONFIG.ui.instructionY,
      GAME_CONFIG.ui.instructionText,
      GAME_CONFIG.ui.instructionFontSize,
      GAME_CONFIG.colors.uiBackground
    );
  }

  private addHudText(x: number, y: number, text: string, fontSize: string, backgroundColor: string) {
    const element = document.createElement("div");

    element.textContent = text;
    element.style.position = "fixed";
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.zIndex = `${GAME_CONFIG.ui.depth}`;
    element.style.color = GAME_CONFIG.colors.uiText;
    element.style.backgroundColor = backgroundColor;
    element.style.fontSize = fontSize;
    element.style.padding = `${GAME_CONFIG.ui.paddingY}px ${GAME_CONFIG.ui.paddingX}px`;
    element.style.pointerEvents = "none";

    this.getHudElement().appendChild(element);

    return element;
  }

  private getHudElement() {
    if (this.hudElement) return this.hudElement;

    document.getElementById(GAME_CONFIG.ui.hudElementId)?.remove();

    this.hudElement = document.createElement("div");
    this.hudElement.id = GAME_CONFIG.ui.hudElementId;
    this.hudElement.style.position = "fixed";
    this.hudElement.style.inset = GAME_CONFIG.ui.hudInset;
    this.hudElement.style.pointerEvents = "none";

    document.body.appendChild(this.hudElement);

    return this.hudElement;
  }

  private isInsideMap(x: number, y: number) {
    return x >= GAME_CONSTANTS.math.zero && x < mapWidth && y >= GAME_CONSTANTS.math.zero && y < mapHeight;
  }
}