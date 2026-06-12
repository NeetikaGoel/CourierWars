// Imports Phaser types used by keyboard role toggle
import Phaser from "phaser";

// Imports player role values and type
import { PlayerRole, type PlayerRole as PlayerRoleName } from "../../types/PlayerRoleType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Defines optional callback emitted when prototype role changes
export interface PrototypeRoleInputControllerCallback {
  // Runs when prototype role changes
  prototypeRoleChanged?: (playerRole: PlayerRoleName) => void;
}

// Handles temporary role switching for local prototype testing
export class PrototypeRoleInputController {
  // Stores Phaser scene reference
  private readonly scene: Phaser.Scene;

  // Stores mutable prototype match state
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // Stores optional callbacks
  private readonly callback: PrototypeRoleInputControllerCallback;

  // Stores Tab key for role toggle
  private roleToggleKey?: Phaser.Input.Keyboard.Key;

  // Creates prototype role input controller
  constructor(
    scene: Phaser.Scene,
    matchPrototypeState: MatchPrototypeStateShape,
    callback: PrototypeRoleInputControllerCallback = {}
  ) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores prototype match state reference
    this.matchPrototypeState = matchPrototypeState;

    // Stores optional callback reference
    this.callback = callback;

    // Sets up keyboard controls
    this.prototypeRoleKeyboardSetup();
  }

  // Sets up role toggle key
  prototypeRoleKeyboardSetup(): void {
    // Stops setup when keyboard plugin is missing
    if (!this.scene.input.keyboard) {
      // Ends keyboard setup
      return;
    }

    // Creates Tab key for role toggle
    this.roleToggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
  }

  // Updates role input state
  prototypeRoleUpdate(): void {
    // Stops when toggle key is missing
    if (!this.roleToggleKey) {
      // Ends role update
      return;
    }

    // Toggles role when Tab is pressed
    if (Phaser.Input.Keyboard.JustDown(this.roleToggleKey)) {
      // Toggles current prototype role
      this.prototypeRoleToggle();
    }
  }

  // Sets prototype role to Courier
  prototypeRoleCourierSet(): void {
    // Updates role to Courier
    this.matchPrototypeState.playerRole = PlayerRole.Courier;

    // Emits role changed callback
    this.callback.prototypeRoleChanged?.(PlayerRole.Courier);
  }

  // Sets prototype role to Saboteur
  prototypeRoleSaboteurSet(): void {
    // Updates role to Saboteur
    this.matchPrototypeState.playerRole = PlayerRole.Saboteur;

    // Emits role changed callback
    this.callback.prototypeRoleChanged?.(PlayerRole.Saboteur);
  }

  // Toggles current prototype role
  prototypeRoleToggle(): void {
    // Switches to Saboteur when current role is Courier
    if (this.matchPrototypeState.playerRole === PlayerRole.Courier) {
      // Sets role to Saboteur
      this.prototypeRoleSaboteurSet();

      // Ends toggle after Saboteur set
      return;
    }

    // Switches to Courier when current role is Saboteur
    this.prototypeRoleCourierSet();
  }

  // Gets current prototype role
  prototypeRoleCurrentGet(): PlayerRoleName {
    // Returns current role from match state
    return this.matchPrototypeState.playerRole;
  }
}