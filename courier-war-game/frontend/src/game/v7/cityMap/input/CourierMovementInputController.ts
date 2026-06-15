// Imports Phaser types used by keyboard input and tween movement
import Phaser from "phaser";

// Imports Courier movement configuration
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports direction resolver helper
import { directionDeltaFromNameGet } from "../../utility/DirectionDeltaResolver";

// Imports tile key converter helper
import { cityTileKeyFromPointGet } from "../../utility/CityTileKeyConverter";

// Imports isometric tile center helper
import { isometricTileCenterWorldPointGet } from "../../iso/IsometricCoordinateCalculator";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports direction values
import { DirectionName, type DirectionName as DirectionNameValue } from "../../types/DirectionType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports Courier movement rules
import {
  courierMovementTileDurationMsGet,
  courierMovementTileEnterCheck,
  courierMovementTileLifeLossHazardCheck,
  courierMovementTileStopCheck,
  courierMovementTileStopDurationMsGet,
} from "../rules/CourierMovementRules";

// Defines minimal transform target required for Courier movement tween
export interface CourierMovementTweenTarget {
  // Stores current world x position
  x: number;

  // Stores current world y position
  y: number;
}

// Defines optional callbacks emitted by Courier movement controller
export interface CourierMovementInputControllerCallback {
  // Runs when Courier movement starts
  courierMovementStarted?: (cityTile: CityTile) => void;

  // Runs when Courier movement completes
  courierMovementCompleted?: (cityTile: CityTile) => void;

  // Runs when Courier tries to move into blocked tile
  courierMovementBlocked?: (cityTile: CityTile | undefined) => void;

  // Runs when Courier stops because of tile effect
  courierMovementStopped?: (cityTile: CityTile, stopDurationMs: number) => void;

  // Runs when Courier loses life from a hazard
  courierLifeLost?: (cityTile: CityTile, livesCurrent: number) => void;

  courierDeliveryReached?: (cityTile: CityTile) => void;
}

// Handles held arrow key Courier movement
export class CourierMovementInputController {
  // Stores Phaser scene used for keyboard and tween systems
  private readonly scene: Phaser.Scene;

  // Stores generated city map
  private readonly cityMapGenerated: CityMapGenerated;

  // Stores mutable prototype match state
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // Stores Courier display object or compatible tween target
  private readonly courierTweenTarget: CourierMovementTweenTarget;

  // Stores optional movement callbacks
  private readonly callback: CourierMovementInputControllerCallback;

  // Stores Phaser cursor keys
  private cursorKeys?: Phaser.Types.Input.Keyboard.CursorKeys;

  // Stores whether Courier is currently moving or stopped
  private courierMovementActive = false;

  // Stores queued direction to use after current movement completes
  private courierDirectionQueued: DirectionNameValue = DirectionName.None;

  // Creates Courier movement input controller
  constructor(
    scene: Phaser.Scene,
    cityMapGenerated: CityMapGenerated,
    matchPrototypeState: MatchPrototypeStateShape,
    courierTweenTarget: CourierMovementTweenTarget,
    callback: CourierMovementInputControllerCallback = {}
  ) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores generated city map reference
    this.cityMapGenerated = cityMapGenerated;

    // Stores prototype match state reference
    this.matchPrototypeState = matchPrototypeState;

    // Stores Courier tween target reference
    this.courierTweenTarget = courierTweenTarget;

    // Stores optional callbacks
    this.callback = callback;

    // Sets up keyboard controls
    this.courierMovementKeyboardSetup();
  }

  // Sets up keyboard cursor keys
  courierMovementKeyboardSetup(): void {
    // Stops setup when keyboard plugin is missing
    if (!this.scene.input.keyboard) {
      // Ends keyboard setup
      return;
    }

    // Creates Phaser cursor key collection
    this.cursorKeys = this.scene.input.keyboard.createCursorKeys();
  }

  // Updates Courier movement input
  courierMovementUpdate(): void {
    // Stores held direction from keyboard
    const directionNameHeld = this.courierMovementHeldDirectionGet();

    // Stores queued direction for next tile movement
    this.courierDirectionQueued = directionNameHeld;

    // Stops when Courier is already moving or waiting
    if (this.courierMovementActive) {
      // Ends update until current movement completes
      return;
    }

    // Starts movement when held movement is enabled
    if (courierMovementConfig.input.heldArrowMovementEnabled) {
      // Tries to start movement from held direction
      this.courierMovementStartTry(directionNameHeld);

      // Ends held movement update
      return;
    }

    // Starts movement from just pressed direction when held movement is disabled
    this.courierMovementStartTry(this.courierMovementJustPressedDirectionGet());
  }

  // Gets currently held arrow direction
  courierMovementHeldDirectionGet(): DirectionNameValue {
    // Returns none when cursor keys are missing
    if (!this.cursorKeys) {
      // Returns no movement direction
      return DirectionName.None;
    }

    // Returns left when left arrow is held
    if (this.cursorKeys.left?.isDown) {
      // Returns left direction
      return DirectionName.Left;
    }

    // Returns right when right arrow is held
    if (this.cursorKeys.right?.isDown) {
      // Returns right direction
      return DirectionName.Right;
    }

    // Returns up when up arrow is held
    if (this.cursorKeys.up?.isDown) {
      // Returns up direction
      return DirectionName.Up;
    }

    // Returns down when down arrow is held
    if (this.cursorKeys.down?.isDown) {
      // Returns down direction
      return DirectionName.Down;
    }

    // Returns no movement direction
    return DirectionName.None;
  }

  // Gets just pressed arrow direction
  courierMovementJustPressedDirectionGet(): DirectionNameValue {
    // Returns none when cursor keys are missing
    if (!this.cursorKeys) {
      // Returns no movement direction
      return DirectionName.None;
    }

    // Returns left when left arrow was just pressed
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left!)) {
      // Returns left direction
      return DirectionName.Left;
    }

    // Returns right when right arrow was just pressed
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right!)) {
      // Returns right direction
      return DirectionName.Right;
    }

    // Returns up when up arrow was just pressed
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up!)) {
      // Returns up direction
      return DirectionName.Up;
    }

    // Returns down when down arrow was just pressed
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down!)) {
      // Returns down direction
      return DirectionName.Down;
    }

    // Returns no movement direction
    return DirectionName.None;
  }

  // Tries to start movement in a direction
  courierMovementStartTry(directionName: DirectionNameValue): void {
    // Stops when no direction is active
    if (directionName === DirectionName.None) {
      // Ends movement start
      return;
    }

    // Stops when Courier is already moving
    if (this.courierMovementActive) {
      // Ends movement start
      return;
    }

    // Stores movement delta
    const directionDelta = directionDeltaFromNameGet(directionName);

    // Stores next tile point
    const tilePointNext = {
      // Stores next tile x coordinate
      x: this.matchPrototypeState.courier.tilePoint.x + directionDelta.x,

      // Stores next tile y coordinate
      y: this.matchPrototypeState.courier.tilePoint.y + directionDelta.y,
    };

    // Gets next city tile
    const cityTileNext = this.courierMovementTileGet(tilePointNext);

    // Stores movement context
    const movementContext = {
      // Stores target city tile
      cityTile: cityTileNext,

      // Stores current match runtime state
      matchPrototypeState: this.matchPrototypeState,
    };

    // Rejects blocked movement
    if (!courierMovementTileEnterCheck(movementContext)) {
      // Emits blocked movement callback
      this.callback.courierMovementBlocked?.(cityTileNext);

      // Ends movement start
      return;
    }

    // Moves Courier to next tile
    this.courierMovementTileMove(cityTileNext!, directionName);
  }

  // Moves Courier to one tile
  courierMovementTileMove(cityTileTarget: CityTile, directionName: DirectionNameValue): void {
    // Marks movement as active
    this.courierMovementActive = true;

    // Updates Courier direction in match state
    this.matchPrototypeState.courier.directionName = directionName;

    // Stores target tile point
    const tilePointTarget = {
      // Stores target x coordinate
      x: cityTileTarget.x,

      // Stores target y coordinate
      y: cityTileTarget.y,
    };

    // Stores target world point
    const worldPointTarget = isometricTileCenterWorldPointGet(tilePointTarget);

    // Stores movement duration
    const durationMs = courierMovementTileDurationMsGet({
      // Stores target tile
      cityTile: cityTileTarget,

      // Stores current match runtime state
      matchPrototypeState: this.matchPrototypeState,
    });

    // Emits movement started callback
    this.callback.courierMovementStarted?.(cityTileTarget);

    // Starts Phaser tween for Courier movement
    this.scene.tweens.add({
      // Stores tween target
      targets: this.courierTweenTarget,

      // Stores destination x coordinate
      x: worldPointTarget.x,

      // Stores destination y coordinate
      y: worldPointTarget.y,

      // Stores movement duration
      duration: durationMs,

      // Stores tween easing name
      ease: "Power2",

      // Handles tween completion
      onComplete: () => {
        // Finalizes movement after tween
        this.courierMovementCompleteHandle(cityTileTarget, directionName);
      },
    });
  }

  // Handles movement completion after Courier reaches tile
  courierMovementCompleteHandle(cityTileTarget: CityTile, directionName: DirectionNameValue): void {
    // Stores previous zone id
    const zoneIdPrevious = this.matchPrototypeState.courier.zoneIdCurrent;

    // Updates previous zone when zone changes
    if (zoneIdPrevious !== cityTileTarget.zoneId) {
      // Stores previous zone id
      this.matchPrototypeState.courier.zoneIdPrevious = zoneIdPrevious;
    }

    // Updates Courier tile point
    this.matchPrototypeState.courier.tilePoint = {
      // Stores target x coordinate
      x: cityTileTarget.x,

      // Stores target y coordinate
      y: cityTileTarget.y,
    };

    // Updates Courier current zone id
    this.matchPrototypeState.courier.zoneIdCurrent = cityTileTarget.zoneId;

    // Updates Courier direction
    this.matchPrototypeState.courier.directionName = directionName;

    // Stores visited tile key
    const visitedTileKey = cityTileKeyFromPointGet(this.matchPrototypeState.courier.tilePoint);

    // Marks target tile as visited
    this.matchPrototypeState.courierVisitedTileKeySet.add(visitedTileKey);

    // Applies life loss hazard when needed
    this.courierMovementLifeLossApply(cityTileTarget);

    // Stores stop duration after tile movement
    const stopDurationMs = this.courierMovementStopDurationGet(cityTileTarget);

    // Emits movement completed callback
    this.callback.courierMovementCompleted?.(cityTileTarget);

    if (cityTileTarget.delivery) {
      this.callback.courierDeliveryReached?.(cityTileTarget);
      this.courierMovementActive = false;
      return;
    }

    // Starts stop wait when tile requires it
    if (stopDurationMs > 0) {
      // Emits stopped callback
      this.callback.courierMovementStopped?.(cityTileTarget, stopDurationMs);

      // Waits before allowing next movement
      this.scene.time.delayedCall(stopDurationMs, () => {
        // Releases movement after stop effect
        this.courierMovementReleaseAfterStop();
      });

      // Ends completion handling while stop is active
      return;
    }

    // Releases movement immediately
    this.courierMovementActive = false;
  }

  // Applies life loss when target tile contains active hazard
  private courierMovementLifeLossApply(cityTileTarget: CityTile): void {
    // Stores whether tile has life loss hazard
    const lifeLossHazard = courierMovementTileLifeLossHazardCheck({
      // Stores target tile
      cityTile: cityTileTarget,

      // Stores current match runtime state
      matchPrototypeState: this.matchPrototypeState,
    });

    // Stops when there is no hazard
    if (!lifeLossHazard) {
      // Ends life loss handling
      return;
    }

    // Reduces Courier lives but prevents negative value
    this.matchPrototypeState.courier.livesCurrent = Math.max(
      0,
      this.matchPrototypeState.courier.livesCurrent - 1
    );

    // Emits life lost callback
    this.callback.courierLifeLost?.(cityTileTarget, this.matchPrototypeState.courier.livesCurrent);
  }

  // Gets stop duration for target tile
  private courierMovementStopDurationGet(cityTileTarget: CityTile): number {
    // Stores whether tile should stop Courier
    const stopRequired = courierMovementTileStopCheck({
      // Stores target tile
      cityTile: cityTileTarget,

      // Stores current match runtime state
      matchPrototypeState: this.matchPrototypeState,
    });

    // Returns zero when stop is not required
    if (!stopRequired) {
      // Returns no stop duration
      return 0;
    }

    // Returns configured stop duration for tile effect
    return courierMovementTileStopDurationMsGet({
      // Stores target tile
      cityTile: cityTileTarget,

      // Stores current match runtime state
      matchPrototypeState: this.matchPrototypeState,
    });
  }

  // Releases movement after a stop effect
  private courierMovementReleaseAfterStop(): void {
    // Marks movement as inactive
    this.courierMovementActive = false;

    // Stops when queued direction changes are disabled
    if (!courierMovementConfig.input.queuedDirectionChangeEnabled) {
      // Ends release handling
      return;
    }

    // Attempts next held movement when direction is still active
    this.courierMovementStartTry(this.courierDirectionQueued);
  }

  // Gets city tile from generated map
  private courierMovementTileGet(tilePoint: CoordinateTilePoint): CityTile | undefined {
    // Checks x lower bound
    const tileXMinValid = tilePoint.x >= 0;

    // Checks y lower bound
    const tileYMinValid = tilePoint.y >= 0;

    // Checks x upper bound
    const tileXMaxValid = tilePoint.x < this.cityMapGenerated.widthTiles;

    // Checks y upper bound
    const tileYMaxValid = tilePoint.y < this.cityMapGenerated.heightTiles;

    // Returns undefined when outside map
    if (!tileXMinValid || !tileYMinValid || !tileXMaxValid || !tileYMaxValid) {
      // Returns missing tile
      return undefined;
    }

    // Returns city tile from map rows
    return this.cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }
}