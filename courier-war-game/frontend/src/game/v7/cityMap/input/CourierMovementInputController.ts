// Imports Phaser types used by keyboard input
import Phaser from "phaser";

// Imports Courier movement configuration
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports direction resolver helper
import { directionDeltaFromNameGet } from "../../utility/DirectionDeltaResolver";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports direction values
import { DirectionName, type DirectionName as DirectionNameValue } from "../../types/DirectionType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Defines minimal transform target kept for compatibility with scene setup
export interface CourierMovementTweenTarget {
  // Stores current world x position
  x: number;

  // Stores current world y position
  y: number;
}

// Defines backend movement request emitted by controller
export interface CourierMovementBackendRequest {
  // Stores current backend-known courier tile
  from: CoordinateTilePoint;

  // Stores requested target tile
  to: CoordinateTilePoint;

  // Stores requested movement direction
  direction: DirectionNameValue;
}

// Defines optional callbacks emitted by Courier movement controller
export interface CourierMovementInputControllerCallback {
  // Runs before local movement is accepted, backend is final authority
  courierMovementRequested?: (request: CourierMovementBackendRequest) => Promise<boolean>;

  // Runs when Courier movement starts
  courierMovementStarted?: (cityTile: CityTile) => void;

  // Runs when Courier movement completes
  courierMovementCompleted?: (cityTile: CityTile) => void;

  // Runs when Courier tries to move into blocked tile
  courierMovementBlocked?: (cityTile: CityTile | undefined) => void;
}

// Handles held arrow key Courier movement
export class CourierMovementInputController {
  // Stores Phaser scene used for keyboard input
  private readonly scene: Phaser.Scene;

  // Stores generated city map
  private readonly cityMapGenerated: CityMapGenerated;

  // Stores mutable prototype match state
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // Stores optional movement callbacks
  private readonly callback: CourierMovementInputControllerCallback;

  // Stores Phaser cursor keys
  private cursorKeys?: Phaser.Types.Input.Keyboard.CursorKeys;

  // Stores whether Courier is currently waiting for backend movement response
  private courierMovementActive = false;

  // Creates Courier movement input controller
  constructor(
    scene: Phaser.Scene,
    cityMapGenerated: CityMapGenerated,
    matchPrototypeState: MatchPrototypeStateShape,
    _courierTweenTarget: CourierMovementTweenTarget,
    callback: CourierMovementInputControllerCallback = {}
  ) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores generated city map reference
    this.cityMapGenerated = cityMapGenerated;

    // Stores prototype match state reference
    this.matchPrototypeState = matchPrototypeState;

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

    // Stops when Courier is already waiting for backend
    if (this.courierMovementActive) {
      // Ends update until current request completes
      return;
    }

    // Starts movement when held movement is enabled
    if (courierMovementConfig.input.heldArrowMovementEnabled) {
      // Tries to request movement from held direction
      void this.courierMovementStartTry(directionNameHeld);

      // Ends held movement update
      return;
    }

    // Starts movement from just pressed direction when held movement is disabled
    void this.courierMovementStartTry(this.courierMovementJustPressedDirectionGet());
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
  async courierMovementStartTry(directionName: DirectionNameValue): Promise<void> {
    // Stops when no direction is active
    if (directionName === DirectionName.None) {
      // Ends movement start
      return;
    }

    // Stops when Courier is already moving or waiting
    if (this.courierMovementActive) {
      // Ends movement start
      return;
    }

    // Stores current tile point
    const tilePointFrom = {
      // Stores current x coordinate
      x: this.matchPrototypeState.courier.tilePoint.x,

      // Stores current y coordinate
      y: this.matchPrototypeState.courier.tilePoint.y,
    };

    // Stores movement delta
    const directionDelta = directionDeltaFromNameGet(directionName);

    // Stores next tile point
    const tilePointNext = {
      // Stores next tile x coordinate
      x: tilePointFrom.x + directionDelta.x,

      // Stores next tile y coordinate
      y: tilePointFrom.y + directionDelta.y,
    };

    // Gets next city tile
    const cityTileNext = this.courierMovementTileGet(tilePointNext);

    // Rejects impossible map movement locally before backend request
    if (!cityTileNext || !cityTileNext.walkable) {
      // Emits blocked movement callback
      this.callback.courierMovementBlocked?.(cityTileNext);

      // Ends movement start
      return;
    }

    // Marks movement as pending while backend validates
    this.courierMovementActive = true;

    // Emits movement started callback
    this.callback.courierMovementStarted?.(cityTileNext);

    try {
      // Sends movement request to backend authority
      const accepted = await this.callback.courierMovementRequested?.({
        from: tilePointFrom,
        to: tilePointNext,
        direction: directionName,
      });

      // Emits completed only after backend accepted
      if (accepted) {
        this.callback.courierMovementCompleted?.(cityTileNext);
      } else {
        this.callback.courierMovementBlocked?.(cityTileNext);
      }
    } finally {
      // Releases movement lock after backend completes
      this.courierMovementActive = false;
    }
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