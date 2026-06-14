// Imports Phaser for camera and input types
import Phaser from "phaser";

// Imports map camera configuration
import { mapCameraConfig } from "../../config/MapCameraConfig";

// Imports isometric coordinate helper
import { isometricTileCenterWorldPointGet } from "../../iso/IsometricCoordinateCalculator";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map type
import type { CityMapGenerated } from "../../types/CityMapType";

// Imports city zone type
import type { CityZone, CityZoneId } from "../../types/CityZoneType";

// Imports camera zone view calculator
import { CameraZoneViewCalculator } from "./CameraZoneViewCalculator";

// Controls Phaser camera behavior for the city map
export class CameraGameController {
  // Stores Phaser scene reference
  private readonly scene: Phaser.Scene;

  // Stores generated city map reference
  private readonly cityMapGenerated: CityMapGenerated;

  // Stores zone view calculator
  private readonly cameraZoneViewCalculator = new CameraZoneViewCalculator();

  // Stores whether camera drag is active
  private cameraDragActive = false;

  // Stores previous pointer x coordinate during drag
  private cameraDragPointerLastX = 0;

  // Stores previous pointer y coordinate during drag
  private cameraDragPointerLastY = 0;

  // Stores current focused zone id
  private cameraZoneIdFocused: CityZoneId | null = null;

  // Stores debug center key
  private cameraCenterKey?: Phaser.Input.Keyboard.Key;

  // Creates game camera controller
  constructor(scene: Phaser.Scene, cityMapGenerated: CityMapGenerated) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores generated city map reference
    this.cityMapGenerated = cityMapGenerated;
  }

  // Sets up camera bounds zoom drag and key controls
  cameraSetup(): void {
    // Disables browser context menu so right click does not disturb camera work
    this.scene.input.mouse?.disableContextMenu();

    // Stores main camera
    const camera = this.scene.cameras.main;

    // Stores full map world bounds
    const mapWorldBounds = this.cameraZoneViewCalculator.cameraMapWorldBoundsGet(
      this.cityMapGenerated.widthTiles,
      this.cityMapGenerated.heightTiles
    );

    // Sets camera zoom
    camera.setZoom(mapCameraConfig.zoom.start);

    // Sets camera bounds with configured padding
    camera.setBounds(
      mapWorldBounds.x - mapCameraConfig.movement.worldPaddingPixels,
      mapWorldBounds.y - mapCameraConfig.movement.worldPaddingPixels,
      mapWorldBounds.width + mapCameraConfig.movement.worldPaddingPixels * 2,
      mapWorldBounds.height + mapCameraConfig.movement.worldPaddingPixels * 2
    );

    // Sets up mouse wheel zoom
    this.cameraPointerZoomSetup();

    // Sets up V6 style left drag camera panning
    this.cameraDragEnable();

    // Sets up C key camera center
    this.cameraCenterKeySetup();
  }

  // Updates camera based on Courier tile position
  cameraCourierUpdate(courierTilePoint: CoordinateTilePoint, forceFocus = false): void {
    // Centers directly on Courier when zone focus is disabled
    if (!mapCameraConfig.zone.courierCurrentZoneFocusEnabled) {
      // Centers camera on Courier
      this.cameraCourierCenter(courierTilePoint);

      // Ends update
      return;
    }

    // Gets Courier current tile
    const courierTile = this.cityMapGenerated.tileRows[courierTilePoint.y]?.[courierTilePoint.x];

    // Stops when Courier tile is missing
    if (!courierTile) {
      // Ends update
      return;
    }

    // Focuses Courier current zone
    this.cameraZoneFocusById(courierTile.zoneId, forceFocus);
  }

  // Updates camera key controls
  cameraUpdate(courierTilePoint: CoordinateTilePoint): void {
    // Centers camera when C key is pressed
    if (this.cameraCenterKey && Phaser.Input.Keyboard.JustDown(this.cameraCenterKey)) {
      // Centers camera on Courier
      this.cameraCourierCenter(courierTilePoint);
    }
  }

  // Focuses camera on one city zone
  cameraZoneFocus(cityZone: CityZone): void {
    // Stores zone target world point
    const zoneTargetPoint = this.cameraZoneViewCalculator.cameraZoneCourierTargetGet(cityZone);

    // Stores viewport width
    const viewportWidthPixels = this.scene.scale.width;

    // Stores viewport height
    const viewportHeightPixels = this.scene.scale.height;

    // Stores zone world bounds
    const zoneWorldBounds = this.cameraZoneViewCalculator.cameraZoneWorldBoundsGet(cityZone);

    // Stores zoom required to show zone
    const zoomTarget = this.cameraZoneViewCalculator.cameraZoneZoomForBoundsGet(
      viewportWidthPixels,
      viewportHeightPixels,
      zoneWorldBounds
    );

    // Applies clamped zone zoom
    this.scene.cameras.main.setZoom(
      Math.max(mapCameraConfig.zoom.min, Math.min(mapCameraConfig.zoom.max, zoomTarget))
    );

    // Pans camera to zone target
    this.scene.cameras.main.pan(
      zoneTargetPoint.x,
      zoneTargetPoint.y,
      mapCameraConfig.movement.panDurationMs,
      "Power2"
    );
  }

  // Focuses camera by zone id
  cameraZoneFocusById(cityZoneId: CityZoneId, forceFocus = false): void {
    // Stops repeated focus when zone has not changed and focus is not forced
    if (!forceFocus && this.cameraZoneIdFocused === cityZoneId && mapCameraConfig.zone.focusOnZoneChangeEnabled) {
      // Ends without repeated pan
      return;
    }

    // Finds city zone by id
    const cityZone = this.cameraZoneFromIdGet(cityZoneId);

    // Stops when zone is missing
    if (!cityZone) {
      // Ends focus
      return;
    }

    // Stores focused zone id
    this.cameraZoneIdFocused = cityZoneId;

    // Focuses camera on zone
    this.cameraZoneFocus(cityZone);
  }

  // Centers camera directly on Courier
  cameraCourierCenter(courierTilePoint: CoordinateTilePoint): void {
    // Stores Courier world point
    const courierWorldPoint = isometricTileCenterWorldPointGet(courierTilePoint);

    // Pans camera to Courier
    this.scene.cameras.main.pan(
      courierWorldPoint.x,
      courierWorldPoint.y,
      mapCameraConfig.movement.panDurationMs,
      "Power2"
    );
  }

  // Applies mouse wheel zoom around pointer
  cameraPointerZoomApply(pointer: Phaser.Input.Pointer, deltaY: number): void {
    // Stores main camera
    const camera = this.scene.cameras.main;

    // Stores world point before zoom
    const worldPointBefore = camera.getWorldPoint(pointer.x, pointer.y);

    // Stores next zoom value
    const zoomNext =
      deltaY > 0
        ? Math.max(mapCameraConfig.zoom.min, camera.zoom - mapCameraConfig.zoom.step)
        : Math.min(mapCameraConfig.zoom.max, camera.zoom + mapCameraConfig.zoom.step);

    // Applies zoom
    camera.setZoom(zoomNext);

    // Stores world point after zoom
    const worldPointAfter = camera.getWorldPoint(pointer.x, pointer.y);

    // Adjusts camera scroll x so zoom happens around pointer
    camera.scrollX += worldPointBefore.x - worldPointAfter.x;

    // Adjusts camera scroll y so zoom happens around pointer
    camera.scrollY += worldPointBefore.y - worldPointAfter.y;

    // Clears focused zone so next Courier movement can refocus cleanly
    this.cameraZoneIdFocused = null;
  }

  // Enables V6 style left drag camera panning
  cameraDragEnable(): void {
    // Stops when manual drag is disabled
    if (!mapCameraConfig.manual.dragEnabled) {
      // Ends drag setup
      return;
    }

    // Starts camera drag on pointer down
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Stops when pointer should not drag camera
      if (!this.cameraDragStartCheck(pointer)) {
        // Ends drag start
        return;
      }

      // Marks drag active
      this.cameraDragActive = true;

      // Stores pointer x coordinate
      this.cameraDragPointerLastX = pointer.x;

      // Stores pointer y coordinate
      this.cameraDragPointerLastY = pointer.y;
    });

    // Moves camera while dragging
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // Stops when drag is inactive
      if (!this.cameraDragActive) {
        // Ends pointer move
        return;
      }

      // Stores main camera
      const camera = this.scene.cameras.main;

      // Updates camera scroll x using V6 style delta logic
      camera.scrollX -=
        ((pointer.x - this.cameraDragPointerLastX) / camera.zoom) *
        mapCameraConfig.movement.dragSpeedMultiplier;

      // Updates camera scroll y using V6 style delta logic
      camera.scrollY -=
        ((pointer.y - this.cameraDragPointerLastY) / camera.zoom) *
        mapCameraConfig.movement.dragSpeedMultiplier;

      // Stores latest pointer x coordinate
      this.cameraDragPointerLastX = pointer.x;

      // Stores latest pointer y coordinate
      this.cameraDragPointerLastY = pointer.y;

      // Clears focused zone because user manually moved camera
      this.cameraZoneIdFocused = null;
    });

    // Stops drag on pointer up
    this.scene.input.on("pointerup", () => {
      // Marks drag inactive
      this.cameraDragActive = false;
    });

    // Stops drag on pointer up outside canvas
    this.scene.input.on("pointerupoutside", () => {
      // Marks drag inactive
      this.cameraDragActive = false;
    });

    // Stops drag when pointer leaves canvas
    this.scene.input.on("pointerout", () => {
      // Marks drag inactive
      this.cameraDragActive = false;
    });
  }

  // Checks whether pointer should start camera drag
  private cameraDragStartCheck(pointer: Phaser.Input.Pointer): boolean {
    // Stores native pointer event
    const pointerEvent = pointer.event as PointerEvent;

    // Stores whether primary left button is active
    const primaryButton =
      pointer.button === 0 ||
      pointerEvent.button === 0 ||
      (typeof pointerEvent.buttons === "number" && (pointerEvent.buttons & 1) === 1);

    // Stores whether middle button is active
    const middleButton =
      pointer.button === 1 ||
      pointerEvent.button === 1 ||
      (typeof pointerEvent.buttons === "number" && (pointerEvent.buttons & 4) === 4);

    // Stores whether secondary right button is active
    const secondaryButton =
      pointer.button === 2 ||
      pointerEvent.button === 2 ||
      (typeof pointerEvent.buttons === "number" && (pointerEvent.buttons & 2) === 2);

    // Allows V6 style left drag and also supports middle or right drag
    return primaryButton || middleButton || secondaryButton;
  }

  // Sets up mouse wheel zoom
  private cameraPointerZoomSetup(): void {
    // Stops when pointer zoom is disabled
    if (!mapCameraConfig.manual.pointerZoomEnabled) {
      // Ends zoom setup
      return;
    }

    // Handles wheel input
    this.scene.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number
      ) => {
        // Applies zoom around pointer
        this.cameraPointerZoomApply(pointer, deltaY);
      }
    );
  }

  // Sets up C key center action
  private cameraCenterKeySetup(): void {
    // Stops when center key is disabled
    if (!mapCameraConfig.manual.centerKeyEnabled) {
      // Ends key setup
      return;
    }

    // Stops when keyboard plugin is missing
    if (!this.scene.input.keyboard) {
      // Ends key setup
      return;
    }

    // Stores C key
    this.cameraCenterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
  }

  // Gets city zone by id
  private cameraZoneFromIdGet(cityZoneId: CityZoneId): CityZone | undefined {
    // Returns matching zone
    return this.cityMapGenerated.zoneList.find((cityZone) => cityZone.id === cityZoneId);
  }
}