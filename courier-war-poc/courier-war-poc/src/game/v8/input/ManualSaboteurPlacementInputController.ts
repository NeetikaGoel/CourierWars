// Imports Phaser types used by pointer and keyboard input
import Phaser from "phaser";

// Imports Saboteur hurdle configuration
import { saboteurHurdleConfig } from "../../v7/config/SaboteurHurdleConfig";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../v7/types/CityMapType";

// Imports player role values
import { PlayerRole } from "../../v7/types/PlayerRoleType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../v7/types/MatchRuntimeStateType";

// Imports Saboteur hurdle values and result types
import {
  SaboteurHurdleType,
  type SaboteurHurdleActivationRequest,
  type SaboteurHurdlePlacementResult,
} from "../../v7/types/SaboteurHurdleType";

// Imports active hurdle state store
import { ActiveHurdleStateStore } from "../../v7/cityMap/runtime/ActiveHurdleStateStore";

// Imports traffic signal state store
import { TrafficSignalStateStore } from "../../v7/cityMap/runtime/TrafficSignalStateStore";

// Imports pointer tile resolver
import { PointerTileInputResolver } from "../../v7/cityMap/input/PointerTileInputResolver";

// Imports V8 placement rules
import {
  manualSaboteurPlacementCheck,
  manualSaboteurPlacementTargetTileListGet,
} from "../rules/ManualSaboteurPlacementRules";

// Defines optional callbacks emitted by Saboteur placement controller
export interface ManualSaboteurPlacementInputControllerCallback {
  // Runs when selected hurdle type changes
  saboteurHurdleSelected?: (hurdleType: SaboteurHurdleType) => void;

  // Runs when placement validation rejects activation
  saboteurPlacementRejected?: (placementResult: SaboteurHurdlePlacementResult) => void;

  // Runs when placement activation succeeds
  saboteurPlacementActivated?: (cityTile: CityTile, hurdleType: SaboteurHurdleType) => void;
}

// Handles V8 Saboteur hurdle selection and placement input
export class ManualSaboteurPlacementInputController {
  // Stores Phaser scene reference
  private readonly scene: Phaser.Scene;

  // Stores generated city map
  private readonly cityMapGenerated: CityMapGenerated;

  // Stores mutable prototype match state
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // Stores pointer tile resolver
  private readonly pointerTileInputResolver: PointerTileInputResolver;

  // Stores traffic signal runtime state store
  private readonly trafficSignalStateStore: TrafficSignalStateStore;

  // Stores active hurdle runtime state store
  private readonly activeHurdleStateStore: ActiveHurdleStateStore;

  // Stores optional callbacks
  private readonly callback: ManualSaboteurPlacementInputControllerCallback;

  // Stores number key references
  private hurdleKeyRedTrafficLight?: Phaser.Input.Keyboard.Key;
  private hurdleKeyRoadBlock?: Phaser.Input.Keyboard.Key;
  private hurdleKeyConstructionWork?: Phaser.Input.Keyboard.Key;
  private hurdleKeyTrafficJam?: Phaser.Input.Keyboard.Key;
  private hurdleKeyClosedGate?: Phaser.Input.Keyboard.Key;
  private hurdleKeyWrongDirectionSign?: Phaser.Input.Keyboard.Key;
  private hurdleKeyBrokenRoad?: Phaser.Input.Keyboard.Key;
  private hurdleKeyMovingBarrier?: Phaser.Input.Keyboard.Key;
  private hurdleKeySecurityCheckpoint?: Phaser.Input.Keyboard.Key;

  // Stores whether pointer press started for possible placement
  private placementPointerPressActive = false;

  // Stores pointer x coordinate when press started
  private placementPointerStartX = 0;

  // Stores pointer y coordinate when press started
  private placementPointerStartY = 0;

  // Stores maximum movement allowed to still count as a click
  private readonly placementPointerClickDistanceMaxPixels = 5;

  // Creates Saboteur placement input controller
  constructor(
    scene: Phaser.Scene,
    cityMapGenerated: CityMapGenerated,
    matchPrototypeState: MatchPrototypeStateShape,
    pointerTileInputResolver: PointerTileInputResolver,
    trafficSignalStateStore: TrafficSignalStateStore,
    activeHurdleStateStore: ActiveHurdleStateStore,
    callback: ManualSaboteurPlacementInputControllerCallback = {}
  ) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores generated city map reference
    this.cityMapGenerated = cityMapGenerated;

    // Stores prototype match state reference
    this.matchPrototypeState = matchPrototypeState;

    // Stores pointer tile resolver reference
    this.pointerTileInputResolver = pointerTileInputResolver;

    // Stores traffic signal state store reference
    this.trafficSignalStateStore = trafficSignalStateStore;

    // Stores active hurdle state store reference
    this.activeHurdleStateStore = activeHurdleStateStore;

    // Stores optional callbacks
    this.callback = callback;

    // Sets up keyboard selection
    this.saboteurPlacementKeyboardSetup();

    // Sets up pointer placement
    this.saboteurPlacementPointerSetup();
  }

  // Sets up number key hurdle selection
  private saboteurPlacementKeyboardSetup(): void {
    // Stops setup when keyboard plugin is missing
    if (!this.scene.input.keyboard) {
      return;
    }

    // Creates keys for each hurdle type
    this.hurdleKeyRedTrafficLight = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.hurdleKeyRoadBlock = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.hurdleKeyConstructionWork = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.hurdleKeyTrafficJam = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    this.hurdleKeyClosedGate = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    this.hurdleKeyWrongDirectionSign = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX);
    this.hurdleKeyBrokenRoad = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN);
    this.hurdleKeyMovingBarrier = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT);
    this.hurdleKeySecurityCheckpoint = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
  }

  // Sets up pointer click placement
  private saboteurPlacementPointerSetup(): void {
    // Handles pointer down for possible click placement
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Stores native pointer event
      const pointerEvent = pointer.event as PointerEvent;

      // Stops when role is not Saboteur
      if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
        return;
      }

      // Stops when pointer is not left click
      if (pointer.button !== 0 && pointerEvent.button !== 0) {
        return;
      }

      // Marks placement press active
      this.placementPointerPressActive = true;

      // Stores pointer start coordinates
      this.placementPointerStartX = pointer.x;
      this.placementPointerStartY = pointer.y;
    });

    // Handles pointer up for actual click placement
    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      // Stores native pointer event
      const pointerEvent = pointer.event as PointerEvent;

      // Stops when no placement press is active
      if (!this.placementPointerPressActive) {
        return;
      }

      // Clears placement press active flag
      this.placementPointerPressActive = false;

      // Stops when role is not Saboteur
      if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
        return;
      }

      // Stops when pointer is not left click
      if (pointer.button !== 0 && pointerEvent.button !== 0) {
        return;
      }

      // Stores drag distance
      const pointerDistanceX = Math.abs(pointer.x - this.placementPointerStartX);
      const pointerDistanceY = Math.abs(pointer.y - this.placementPointerStartY);

      // Stops placement when pointer was used for dragging
      if (
        pointerDistanceX > this.placementPointerClickDistanceMaxPixels ||
        pointerDistanceY > this.placementPointerClickDistanceMaxPixels
      ) {
        return;
      }

      // Gets clicked city tile
      const cityTile = this.pointerTileInputResolver.pointerTileFromPointerGet(pointer);

      // Handles tile click
      this.saboteurPlacementTileClickHandle(cityTile);
    });

    // Clears placement press when pointer leaves canvas
    this.scene.input.on("pointerout", () => {
      this.placementPointerPressActive = false;
    });
  }

  // Updates number key hurdle selection
  saboteurPlacementUpdate(): void {
    // Stops when role is not Saboteur
    if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
      return;
    }

    // Selects each hurdle by number key
    this.saboteurPlacementKeyCheck(this.hurdleKeyRedTrafficLight, SaboteurHurdleType.RedTrafficLight);
    this.saboteurPlacementKeyCheck(this.hurdleKeyRoadBlock, SaboteurHurdleType.RoadBlock);
    this.saboteurPlacementKeyCheck(this.hurdleKeyConstructionWork, SaboteurHurdleType.ConstructionWork);
    this.saboteurPlacementKeyCheck(this.hurdleKeyTrafficJam, SaboteurHurdleType.TrafficJam);
    this.saboteurPlacementKeyCheck(this.hurdleKeyClosedGate, SaboteurHurdleType.ClosedGate);
    this.saboteurPlacementKeyCheck(this.hurdleKeyWrongDirectionSign, SaboteurHurdleType.WrongDirectionSign);
    this.saboteurPlacementKeyCheck(this.hurdleKeyBrokenRoad, SaboteurHurdleType.BrokenRoad);
    this.saboteurPlacementKeyCheck(this.hurdleKeyMovingBarrier, SaboteurHurdleType.MovingBarrier);
    this.saboteurPlacementKeyCheck(this.hurdleKeySecurityCheckpoint, SaboteurHurdleType.SecurityCheckpoint);
  }

  // Checks one key and selects hurdle when pressed
  private saboteurPlacementKeyCheck(
    key: Phaser.Input.Keyboard.Key | undefined,
    hurdleType: SaboteurHurdleType
  ): void {
    // Selects hurdle when key was just pressed
    if (key && Phaser.Input.Keyboard.JustDown(key)) {
      this.saboteurPlacementHurdleSelect(hurdleType);
    }
  }

  // Selects a Saboteur hurdle type
  private saboteurPlacementHurdleSelect(hurdleType: SaboteurHurdleType): void {
    // Updates selected hurdle in match state
    this.matchPrototypeState.saboteur.hurdleTypeSelected = hurdleType;

    // Emits selection callback
    this.callback.saboteurHurdleSelected?.(hurdleType);
  }

  // Handles Saboteur tile click
  private saboteurPlacementTileClickHandle(cityTile: CityTile | undefined): void {
    // Tries to activate selected hurdle
    const placementResult = this.saboteurPlacementActivationTry(cityTile);

    // Emits rejection callback when placement fails
    if (!placementResult.valid) {
      this.callback.saboteurPlacementRejected?.(placementResult);
    }
  }

  // Tries to activate selected hurdle on tile
  private saboteurPlacementActivationTry(cityTile: CityTile | undefined): SaboteurHurdlePlacementResult {
    // Synchronizes match state from runtime stores before validation
    this.saboteurPlacementRuntimeStateSync();

    // Stores selected hurdle type
    const hurdleType = this.matchPrototypeState.saboteur.hurdleTypeSelected;

    // Validates placement
    const placementResult = manualSaboteurPlacementCheck({
      cityMapGenerated: this.cityMapGenerated,
      cityTile,
      hurdleType,
      matchPrototypeState: this.matchPrototypeState,
      currentTimeMs: this.scene.time.now,
    });

    // Returns failure when placement is invalid
    if (!placementResult.valid) {
      this.matchPrototypeState.tileInteraction.hoverPlacementResult = placementResult;
      return placementResult;
    }

    // Confirms valid placement
    this.saboteurPlacementConfirm(cityTile!, hurdleType);

    // Returns valid placement result
    return placementResult;
  }

  // Confirms and applies valid Saboteur placement
  private saboteurPlacementConfirm(cityTile: CityTile, hurdleType: SaboteurHurdleType): void {
    // Stores hurdle config
    const hurdleConfig = saboteurHurdleConfig.hurdle[hurdleType];

    // Stores activation duration
    const durationMs = hurdleConfig.durationMsDefault;

    // Activates red traffic signal when selected
    if (hurdleType === SaboteurHurdleType.RedTrafficLight && cityTile.trafficSignalId) {
      this.trafficSignalStateStore.trafficSignalRedActivate(cityTile.trafficSignalId, this.scene.time.now, durationMs);
    }

    // Stores target tiles for V8 activation
    const targetTileList = manualSaboteurPlacementTargetTileListGet(this.cityMapGenerated, cityTile, hurdleType);

    // Activates one active hurdle per target tile so movement and rendering both work
    for (const targetTile of targetTileList) {
      // Stores activation request
      const activationRequest: SaboteurHurdleActivationRequest = {
        hurdleType,
        tilePoint: {
          x: targetTile.x,
          y: targetTile.y,
        },
        currentTimeMs: this.scene.time.now,
        requestedDurationMs: durationMs,
      };

      // Activates active hurdle
      this.activeHurdleStateStore.activeHurdleActivate(
        activationRequest,
        durationMs,
        hurdleType === SaboteurHurdleType.RedTrafficLight ? cityTile.trafficSignalId : undefined
      );
    }

    // Reduces Saboteur energy once per action
    this.matchPrototypeState.saboteur.energyCurrent = Math.max(
      0,
      this.matchPrototypeState.saboteur.energyCurrent - hurdleConfig.energyCost
    );

    // Stores cooldown end time once per action
    this.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[hurdleType] =
      this.scene.time.now + hurdleConfig.cooldownMs;

    // Synchronizes match state after activation
    this.saboteurPlacementRuntimeStateSync();

    // Stores selected tile point
    this.matchPrototypeState.tileInteraction.tilePointSelected = {
      x: cityTile.x,
      y: cityTile.y,
    };

    // Emits activation callback
    this.callback.saboteurPlacementActivated?.(cityTile, hurdleType);
  }

  // Synchronizes match state references from runtime stores
  private saboteurPlacementRuntimeStateSync(): void {
    // Syncs traffic signal runtime lookup
    this.matchPrototypeState.trafficSignalStateById = this.trafficSignalStateStore.trafficSignalStateByIdGet();

    // Syncs active hurdle runtime lookup
    this.matchPrototypeState.activeHurdleById = this.activeHurdleStateStore.activeHurdleByIdGet();
  }
}
