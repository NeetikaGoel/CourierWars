// GameSceneV5.ts
// Renders the 128x128 city and handles Courier movement, camera drag and zoom

import Phaser from "phaser";
import { GAME_CONFIG } from "./GameConfigV5";
import { GAME_CONSTANTS } from "./GameConstantsV5";
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from "./IsoV5";
import {
  mapTiles,
  mapWidth,
  mapHeight,
  findStartTile,
} from "./MapDataV5";
import type { MapTile, HurdleCandidateType } from "./MapDataV5";

export class GameSceneV5 extends Phaser.Scene {
  private courier!: Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite;

  private courierTileX: number = GAME_CONFIG.cityGeneration.startPoint.x;
  private courierTileY: number = GAME_CONFIG.cityGeneration.startPoint.y;

  private lastPointerX: number = GAME_CONSTANTS.mapGeneration.firstIndex;
  private lastPointerY: number = GAME_CONSTANTS.mapGeneration.firstIndex;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private centerCourierKey!: Phaser.Input.Keyboard.Key;

  private tileFeedbackElement?: HTMLDivElement;
  private hudElement?: HTMLDivElement;

  private isMoving = false;
  private isDraggingCamera = false;

  constructor() {
    super("GameSceneV5");
  }

  preload() {
    if (GAME_CONFIG.assets.useRoadTileImage) {
      this.load.image(
        GAME_CONFIG.assets.render.roadImageKey,
        GAME_CONFIG.assets.render.roadImagePath
      );
    }

    if (!GAME_CONFIG.assets.useTileImages) return;

    this.loadTileImageArray(GAME_CONFIG.assets.keys.road, GAME_CONFIG.assets.files.road);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.building, GAME_CONFIG.assets.files.building);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.park, GAME_CONFIG.assets.files.park);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.water, GAME_CONFIG.assets.files.water);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.bridge, GAME_CONFIG.assets.files.bridge);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.tunnel, GAME_CONFIG.assets.files.tunnel);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.shortcut, GAME_CONFIG.assets.files.shortcut);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.trafficLight, GAME_CONFIG.assets.files.trafficLight);
    this.loadTileImageArray(GAME_CONFIG.assets.keys.construction, GAME_CONFIG.assets.files.construction);

    this.load.image(
      GAME_CONFIG.assets.keys.start,
      GAME_CONFIG.assets.basePath + GAME_CONFIG.assets.files.start
    );

    this.load.image(
      GAME_CONFIG.assets.keys.delivery,
      GAME_CONFIG.assets.basePath + GAME_CONFIG.assets.files.delivery
    );

    if (GAME_CONFIG.assets.files.courier !== "") {
      this.load.image(
        GAME_CONFIG.assets.keys.courier,
        GAME_CONFIG.assets.basePath + GAME_CONFIG.assets.files.courier
      );
    }
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

  private loadTileImageArray(keys: readonly string[], files: readonly string[]) {
    keys.forEach((key, index) => {
      this.load.image(key, GAME_CONFIG.assets.basePath + files[index]);
    });
  }

  private setupCamera() {
    const camera = this.cameras.main;

    camera.setZoom(GAME_CONFIG.camera.startZoom);

    const bounds = this.getEstimatedWorldBounds();

    camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

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

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== GAME_CONSTANTS.phaser.defaultPointerButton) return;

      this.isDraggingCamera = true;
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDraggingCamera) return;

      const deltaX = pointer.x - this.lastPointerX;
      const deltaY = pointer.y - this.lastPointerY;

      camera.scrollX -= (deltaX / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;
      camera.scrollY -= (deltaY / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;

      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.input.on("pointerup", () => {
      this.isDraggingCamera = false;
    });

    this.input.on("pointerout", () => {
      this.isDraggingCamera = false;
    });
  }

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
          this.drawRoadTileImage(tile, screenPosition.x, screenPosition.y);
        }

        this.drawHurdleCandidateMarkers(tile, screenPosition.x, screenPosition.y);
      }
    }
  }

  private drawTileImage(tile: MapTile, x: number, y: number) {
    const assetKey = this.getAssetKeyForTile(tile);
    const centerY = y + TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor;
    const renderSettings = this.getTileImageRenderSettings(tile);

    const image = this.add
      .image(x, centerY + renderSettings.offsetY, assetKey)
      .setOrigin(renderSettings.originX, renderSettings.originY)
      .setScale(renderSettings.scale)
      .setDepth(y + renderSettings.depthOffset);

    if (renderSettings.tint !== undefined) {
      image.setTint(renderSettings.tint);
    }
  }

  private drawRoadTileImage(tile: MapTile, x: number, y: number) {
    if (!GAME_CONFIG.assets.useRoadTileImage) return;
    if (tile.type !== "road") return;

    const render = GAME_CONFIG.assets.render;
    const centerY = y + TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor;
    const image = this.add
      .image(x, centerY, render.roadImageKey)
      .setOrigin(render.roadImageOriginX, render.roadImageOriginY)
      .setCrop(
        render.roadImageCropX,
        render.roadImageCropY,
        render.roadImageCropWidth,
        render.roadImageCropHeight
      )
      .setDisplaySize(render.roadImageDisplayWidth, render.roadImageDisplayHeight)
      .setDepth(y + render.roadImageDepthOffset);

    if (this.isVerticalRoadTile(tile)) {
      image.setAngle(render.roadImageVerticalAngle);
    }
  }

  private drawDiamondTile(tile: MapTile, x: number, y: number) {
    const graphics = this.add.graphics();

    graphics.fillStyle(
      this.getColorForTile(tile),
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
    if (!GAME_CONFIG.marker.showHurdleMarkers) return;
  
    if (tile.hurdleCandidates.length === GAME_CONSTANTS.mapGeneration.firstIndex) return;
  
    this.add
      .circle(
        x,
        y + TILE_HEIGHT / GAME_CONSTANTS.tileMath.halfDivisor,
        GAME_CONFIG.marker.radius,
        this.getColorForHurdleCandidate(tile.hurdleCandidates[GAME_CONSTANTS.array.firstItemIndex]),
        GAME_CONFIG.alpha.marker
      )
      .setDepth(GAME_CONFIG.marker.depthOffset + y);
  }

  private createCourier() {
    const position = this.getCourierRenderPosition();

    if (
      GAME_CONFIG.assets.useTileImages &&
      GAME_CONFIG.assets.files.courier !== "" &&
      this.textures.exists(GAME_CONFIG.assets.keys.courier)
    ) {
      this.courier = this.add.sprite(
        position.x,
        position.y,
        GAME_CONFIG.assets.keys.courier
      ).setScale(GAME_CONFIG.assets.render.courierScale);
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
  
    const position = this.getCourierRenderPosition();
  
    const duration =
      GAME_CONFIG.movement.baseMoveDurationMs * nextTile.movementCost;
  
    this.showTileFeedback(nextTile);
  
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

  private showTileFeedback(tile: MapTile) {
    if (!GAME_CONFIG.tileFeedback.enabled) return;
  
    const message = this.getTileFeedbackMessage(tile);
  
    if (message === GAME_CONFIG.tileFeedback.normalText) return;
  
    if (this.tileFeedbackElement) {
      this.tileFeedbackElement.remove();
    }
  
    this.tileFeedbackElement = this.addHudText(
      GAME_CONFIG.ui.feedbackX,
      GAME_CONFIG.ui.feedbackY,
      message,
      GAME_CONFIG.ui.feedbackFontSize,
      GAME_CONFIG.colors.feedbackBackground
    );
  
    this.time.delayedCall(GAME_CONFIG.tileFeedback.messageDurationMs, () => {
      if (!this.tileFeedbackElement) return;
  
      this.tileFeedbackElement.remove();
      this.tileFeedbackElement = undefined;
    });
  }

  private getTileFeedbackMessage(tile: MapTile): string {
    if (tile.type === "trafficLight") return GAME_CONFIG.tileFeedback.trafficLightText;
    if (tile.type === "construction") return GAME_CONFIG.tileFeedback.constructionText;
    if (tile.type === "bridge") return GAME_CONFIG.tileFeedback.bridgeText;
    if (tile.type === "tunnel") return GAME_CONFIG.tileFeedback.tunnelText;
    if (tile.type === "shortcut") return GAME_CONFIG.tileFeedback.shortcutText;
  
    return GAME_CONFIG.tileFeedback.normalText;
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

  private getCourierRenderPosition() {
    const position = this.getCourierScreenPosition();

    if (
      GAME_CONFIG.assets.useTileImages &&
      GAME_CONFIG.assets.files.courier !== "" &&
      this.textures.exists(GAME_CONFIG.assets.keys.courier)
    ) {
      return {
        x: position.x,
        y: position.y + GAME_CONFIG.assets.render.courierOffsetY,
      };
    }

    return position;
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

  private addHudText(
    x: number,
    y: number,
    text: string,
    fontSize: string,
    backgroundColor: string
  ) {
    const element = document.createElement("div");
    element.textContent = text;
    element.style.position = "fixed";
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.zIndex = `${GAME_CONFIG.ui.depth}`;
    element.style.color = GAME_CONFIG.colors.uiText;
    element.style.backgroundColor = backgroundColor;
    element.style.fontFamily = GAME_CONFIG.ui.fontFamily;
    element.style.fontSize = fontSize;
    element.style.padding = `${GAME_CONFIG.ui.paddingY}px ${GAME_CONFIG.ui.paddingX}px`;
    element.style.pointerEvents = "none";
    element.style.whiteSpace = "nowrap";

    this.getHudElement().appendChild(element);

    return element;
  }

  private getHudElement() {
    if (this.hudElement) return this.hudElement;

    document.getElementById(GAME_CONFIG.ui.hudElementId)?.remove();

    const hudElement = document.createElement("div");
    hudElement.id = GAME_CONFIG.ui.hudElementId;
    hudElement.style.position = "fixed";
    hudElement.style.inset = GAME_CONFIG.ui.hudInset;
    hudElement.style.pointerEvents = "none";
    hudElement.style.zIndex = `${GAME_CONFIG.ui.depth}`;

    document.body.appendChild(hudElement);
    this.hudElement = hudElement;

    return hudElement;
  }

  private getColorForTile(tile: MapTile): number {
    if (tile.type === "building") {
      if (tile.visualVariant === GAME_CONSTANTS.array.firstItemIndex) return GAME_CONFIG.colors.building;
      if (tile.visualVariant === GAME_CONFIG.cityGeneration.areaStepOffset) return GAME_CONFIG.colors.buildingAltA;

      return GAME_CONFIG.colors.buildingAltB;
    }

    if (tile.type === "road") {
      if (tile.visualVariant === GAME_CONSTANTS.array.firstItemIndex) return GAME_CONFIG.colors.road;
      if (tile.visualVariant === GAME_CONFIG.cityGeneration.areaStepOffset) return GAME_CONFIG.colors.roadAltA;

      return GAME_CONFIG.colors.roadAltB;
    }

    if (tile.type === "park") {
      if (tile.visualVariant === GAME_CONSTANTS.array.firstItemIndex) return GAME_CONFIG.colors.park;
      if (tile.visualVariant === GAME_CONFIG.cityGeneration.areaStepOffset) return GAME_CONFIG.colors.parkAltA;

      return GAME_CONFIG.colors.parkAltB;
    }

    if (tile.type === "water") {
      if (tile.visualVariant === GAME_CONSTANTS.array.firstItemIndex) return GAME_CONFIG.colors.water;
      if (tile.visualVariant === GAME_CONFIG.cityGeneration.areaStepOffset) return GAME_CONFIG.colors.waterAltA;

      return GAME_CONFIG.colors.waterAltB;
    }

    return GAME_CONFIG.colors[tile.type];
  }

  private getAssetKeyForTile(tile: MapTile): string {
    const keys = GAME_CONFIG.assets.keys;

    if (tile.type === "road") return keys.road[tile.visualVariant];
    if (tile.type === "building") return keys.building[tile.visualVariant];
    if (tile.type === "park") return keys.park[tile.visualVariant];
    if (tile.type === "water") return keys.water[tile.visualVariant];
    if (tile.type === "bridge") return keys.bridge[tile.visualVariant];
    if (tile.type === "tunnel") return keys.tunnel[tile.visualVariant];
    if (tile.type === "shortcut") return keys.shortcut[tile.visualVariant];
    if (tile.type === "trafficLight") return keys.trafficLight[tile.visualVariant];
    if (tile.type === "construction") return keys.construction[tile.visualVariant];

    if (tile.type === "start") return keys.start;
    if (tile.type === "delivery") return keys.delivery;

    return keys.road[GAME_CONSTANTS.array.firstItemIndex];
  }

  private getTileImageRenderSettings(tile: MapTile) {
    const render = GAME_CONFIG.assets.render;

    if (tile.type === "building" || tile.type === "park" || tile.type === "tunnel") {
      return {
        originX: render.objectOriginX,
        originY: render.objectOriginY,
        offsetY: render.objectOffsetY,
        depthOffset: render.objectDepthOffset,
        scale: this.getObjectTileScale(tile),
        tint: undefined,
      };
    }

    if (tile.type === "trafficLight" || tile.type === "construction") {
      return {
        originX: render.objectOriginX,
        originY: render.objectOriginY,
        offsetY: render.objectOffsetY,
        depthOffset: render.objectDepthOffset,
        scale: render.objectScale,
        tint: tile.type === "trafficLight" ? render.trafficTint : render.constructionTint,
      };
    }

    if (tile.type === "start" || tile.type === "delivery") {
      return {
        originX: render.markerOriginX,
        originY: render.markerOriginY,
        offsetY: render.markerOffsetY,
        depthOffset: render.markerDepthOffset,
        scale: render.markerScale,
        tint: undefined,
      };
    }

    return {
      originX: render.flatOriginX,
      originY: render.flatOriginY,
      offsetY: render.flatOffsetY,
      depthOffset: render.flatDepthOffset,
      scale: render.flatScale,
      tint: this.getFlatTileTint(tile),
    };
  }

  private getFlatTileTint(tile: MapTile): number | undefined {
    if (tile.type === "water") return GAME_CONFIG.assets.render.waterTint;
    if (tile.type === "bridge") return GAME_CONFIG.assets.render.bridgeTint;
    if (tile.type === "shortcut") return GAME_CONFIG.assets.render.shortcutTint;

    return undefined;
  }

  private isVerticalRoadTile(tile: MapTile): boolean {
    const horizontalConnections =
      this.isRoadLikeTile(tile.x - GAME_CONFIG.cityGeneration.areaStepOffset, tile.y) ||
      this.isRoadLikeTile(tile.x + GAME_CONFIG.cityGeneration.areaStepOffset, tile.y);

    const verticalConnections =
      this.isRoadLikeTile(tile.x, tile.y - GAME_CONFIG.cityGeneration.areaStepOffset) ||
      this.isRoadLikeTile(tile.x, tile.y + GAME_CONFIG.cityGeneration.areaStepOffset);

    return verticalConnections && !horizontalConnections;
  }

  private isRoadLikeTile(x: number, y: number): boolean {
    if (!this.isInsideMap(x, y)) return false;

    const tile = mapTiles[y][x];

    return (
      tile.type === "road" ||
      tile.type === "start" ||
      tile.type === "delivery" ||
      tile.type === "trafficLight" ||
      tile.type === "construction" ||
      tile.type === "bridge" ||
      tile.type === "tunnel" ||
      tile.type === "shortcut"
    );
  }

  private getObjectTileScale(tile: MapTile): number {
    if (tile.type === "building") return GAME_CONFIG.assets.render.buildingScale;
    if (tile.type === "park") return GAME_CONFIG.assets.render.parkScale;

    return GAME_CONFIG.assets.render.objectScale;
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
