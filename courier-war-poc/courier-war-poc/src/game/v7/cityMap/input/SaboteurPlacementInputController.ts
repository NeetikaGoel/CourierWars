// Imports Phaser types used by pointer and keyboard input
import Phaser from "phaser";

// Imports Saboteur hurdle configuration
import { saboteurHurdleConfig } from "../../config/SaboteurHurdleConfig";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports player role values
import { PlayerRole } from "../../types/PlayerRoleType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports Saboteur hurdle values and result types
import {
  SaboteurHurdleType,
  type SaboteurHurdleActivationRequest,
  type SaboteurHurdlePlacementResult,
} from "../../types/SaboteurHurdleType";

// Imports placement validation rule
import { saboteurPlacementCheck } from "../rules/SaboteurPlacementRules";

// Imports active hurdle state store
import { ActiveHurdleStateStore } from "../runtime/ActiveHurdleStateStore";

// Imports traffic signal state store
import { TrafficSignalStateStore } from "../runtime/TrafficSignalStateStore";

// Imports pointer tile resolver
import { PointerTileInputResolver } from "./PointerTileInputResolver";

// Defines optional callbacks emitted by Saboteur placement controller
export interface SaboteurPlacementInputControllerCallback {
  // Runs when selected hurdle type changes
  saboteurHurdleSelected?: (hurdleType: SaboteurHurdleType) => void;

  // Runs when placement validation rejects activation
  saboteurPlacementRejected?: (placementResult: SaboteurHurdlePlacementResult) => void;

  // Runs when placement activation succeeds
  saboteurPlacementActivated?: (cityTile: CityTile, hurdleType: SaboteurHurdleType) => void;
}

// Handles Saboteur hurdle selection and placement input
export class SaboteurPlacementInputController {
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
  private readonly callback: SaboteurPlacementInputControllerCallback;

  // Stores key for red traffic light
  private hurdleKeyRedTrafficLight?: Phaser.Input.Keyboard.Key;

  // Stores key for road block
  private hurdleKeyRoadBlock?: Phaser.Input.Keyboard.Key;

  // Stores key for construction work
  private hurdleKeyConstructionWork?: Phaser.Input.Keyboard.Key;

  // Stores key for traffic jam
  private hurdleKeyTrafficJam?: Phaser.Input.Keyboard.Key;

  // Stores key for closed gate
  private hurdleKeyClosedGate?: Phaser.Input.Keyboard.Key;

  // Stores key for wrong direction sign
  private hurdleKeyWrongDirectionSign?: Phaser.Input.Keyboard.Key;

  // Stores key for broken road
  private hurdleKeyBrokenRoad?: Phaser.Input.Keyboard.Key;

  // Stores key for moving barrier
  private hurdleKeyMovingBarrier?: Phaser.Input.Keyboard.Key;

  // Stores key for security checkpoint
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
    callback: SaboteurPlacementInputControllerCallback = {}
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
  saboteurPlacementKeyboardSetup(): void {
    // Stops setup when keyboard plugin is missing
    if (!this.scene.input.keyboard) {
      // Ends keyboard setup
      return;
    }

    // Creates key for red traffic light
    this.hurdleKeyRedTrafficLight = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);

    // Creates key for road block
    this.hurdleKeyRoadBlock = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

    // Creates key for construction work
    this.hurdleKeyConstructionWork = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

    // Creates key for traffic jam
    this.hurdleKeyTrafficJam = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

    // Creates key for closed gate
    this.hurdleKeyClosedGate = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

    // Creates key for wrong direction sign
    this.hurdleKeyWrongDirectionSign = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX);

    // Creates key for broken road
    this.hurdleKeyBrokenRoad = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN);

    // Creates key for moving barrier
    this.hurdleKeyMovingBarrier = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT);

    // Creates key for security checkpoint
    this.hurdleKeySecurityCheckpoint = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
  }

  // Sets up pointer click placement
  saboteurPlacementPointerSetup(): void {
    // Handles pointer down for possible click placement
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Stores native pointer event
      const pointerEvent = pointer.event as PointerEvent;

      // Stops when role is not Saboteur
      if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
        // Ends pointer down placement tracking
        return;
      }

      // Stops when pointer is not left click
      if (pointer.button !== 0 && pointerEvent.button !== 0) {
        // Ends pointer down placement tracking
        return;
      }

      // Marks placement press active
      this.placementPointerPressActive = true;

      // Stores pointer start x coordinate
      this.placementPointerStartX = pointer.x;

      // Stores pointer start y coordinate
      this.placementPointerStartY = pointer.y;
    });

    // Handles pointer up for actual click placement
    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      // Stores native pointer event
      const pointerEvent = pointer.event as PointerEvent;

      // Stops when no placement press is active
      if (!this.placementPointerPressActive) {
        // Ends pointer up placement
        return;
      }

      // Clears placement press active flag
      this.placementPointerPressActive = false;

      // Stops when role is not Saboteur
      if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
        // Ends pointer up placement
        return;
      }

      // Stops when pointer is not left click
      if (pointer.button !== 0 && pointerEvent.button !== 0) {
        // Ends pointer up placement
        return;
      }

      // Stores pointer drag distance x
      const pointerDistanceX = Math.abs(pointer.x - this.placementPointerStartX);

      // Stores pointer drag distance y
      const pointerDistanceY = Math.abs(pointer.y - this.placementPointerStartY);

      // Stores whether pointer moved too far to count as click
      const pointerMovedTooFar =
        pointerDistanceX > this.placementPointerClickDistanceMaxPixels ||
        pointerDistanceY > this.placementPointerClickDistanceMaxPixels;

      // Stops placement when pointer was used for dragging
      if (pointerMovedTooFar) {
        // Ends pointer up placement
        return;
      }

      // Gets clicked city tile
      const cityTile = this.pointerTileInputResolver.pointerTileFromPointerGet(pointer);

      // Handles tile click
      this.saboteurPlacementTileClickHandle(cityTile);
    });

    // Clears placement press when pointer leaves canvas
    this.scene.input.on("pointerout", () => {
      // Clears placement press active flag
      this.placementPointerPressActive = false;
    });
  }

  // Updates number key hurdle selection
  saboteurPlacementUpdate(): void {
    // Stops when role is not Saboteur
    if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
      // Ends placement update
      return;
    }

    // Selects red traffic light
    if (this.hurdleKeyRedTrafficLight && Phaser.Input.Keyboard.JustDown(this.hurdleKeyRedTrafficLight)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.RedTrafficLight);
    }

    // Selects road block
    if (this.hurdleKeyRoadBlock && Phaser.Input.Keyboard.JustDown(this.hurdleKeyRoadBlock)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.RoadBlock);
    }

    // Selects construction work
    if (this.hurdleKeyConstructionWork && Phaser.Input.Keyboard.JustDown(this.hurdleKeyConstructionWork)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.ConstructionWork);
    }

    // Selects traffic jam
    if (this.hurdleKeyTrafficJam && Phaser.Input.Keyboard.JustDown(this.hurdleKeyTrafficJam)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.TrafficJam);
    }

    // Selects closed gate
    if (this.hurdleKeyClosedGate && Phaser.Input.Keyboard.JustDown(this.hurdleKeyClosedGate)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.ClosedGate);
    }

    // Selects wrong direction sign
    if (this.hurdleKeyWrongDirectionSign && Phaser.Input.Keyboard.JustDown(this.hurdleKeyWrongDirectionSign)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.WrongDirectionSign);
    }

    // Selects broken road
    if (this.hurdleKeyBrokenRoad && Phaser.Input.Keyboard.JustDown(this.hurdleKeyBrokenRoad)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.BrokenRoad);
    }

    // Selects moving barrier
    if (this.hurdleKeyMovingBarrier && Phaser.Input.Keyboard.JustDown(this.hurdleKeyMovingBarrier)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.MovingBarrier);
    }

    // Selects security checkpoint
    if (this.hurdleKeySecurityCheckpoint && Phaser.Input.Keyboard.JustDown(this.hurdleKeySecurityCheckpoint)) {
      // Updates selected hurdle
      this.saboteurPlacementHurdleSelect(SaboteurHurdleType.SecurityCheckpoint);
    }
  }

  // Selects a Saboteur hurdle type
  saboteurPlacementHurdleSelect(hurdleType: SaboteurHurdleType): void {
    // Updates selected hurdle in match state
    this.matchPrototypeState.saboteur.hurdleTypeSelected = hurdleType;

    // Emits selection callback
    this.callback.saboteurHurdleSelected?.(hurdleType);
  }

  // Handles Saboteur tile click
  saboteurPlacementTileClickHandle(cityTile: CityTile | undefined): void {
    // Tries to activate selected hurdle
    const placementResult = this.saboteurPlacementActivationTry(cityTile);

    // Emits rejection callback when placement fails
    if (!placementResult.valid) {
      // Emits rejected placement
      this.callback.saboteurPlacementRejected?.(placementResult);
    }
  }

  // Tries to activate selected hurdle on tile
  saboteurPlacementActivationTry(cityTile: CityTile | undefined): SaboteurHurdlePlacementResult {
    // Synchronizes match state from runtime stores before validation
    this.saboteurPlacementRuntimeStateSync();

    // Stores selected hurdle type
    const hurdleType = this.matchPrototypeState.saboteur.hurdleTypeSelected;

    // Validates placement
    const placementResult = saboteurPlacementCheck({
      // Stores generated city map
      cityMapGenerated: this.cityMapGenerated,

      // Stores generated zone list
      cityZoneList: this.cityMapGenerated.zoneList,

      // Stores target city tile
      cityTile,

      // Stores selected hurdle type
      hurdleType,

      // Stores current match runtime state
      matchPrototypeState: this.matchPrototypeState,

      // Stores current time
      currentTimeMs: this.scene.time.now,
    });

    // Returns failure when placement is invalid
    if (!placementResult.valid) {
      // Stores hover placement result for renderer feedback
      this.matchPrototypeState.tileInteraction.hoverPlacementResult = placementResult;

      // Returns invalid placement result
      return placementResult;
    }

    // Confirms valid placement
    this.saboteurPlacementConfirm(cityTile!, hurdleType);

    // Returns valid placement result
    return placementResult;
  }

  // Confirms and applies valid Saboteur placement
  saboteurPlacementConfirm(cityTile: CityTile, hurdleType: SaboteurHurdleType): void {
    // Stores hurdle config
    const hurdleConfig = saboteurHurdleConfig.hurdle[hurdleType];

    // Stores activation duration
    const durationMs = hurdleConfig.durationMsDefault;

    // Stores activation request
    const activationRequest: SaboteurHurdleActivationRequest = {
      // Stores hurdle type
      hurdleType,

      // Stores target tile point
      tilePoint: {
        // Stores target x coordinate
        x: cityTile.x,

        // Stores target y coordinate
        y: cityTile.y,
      },

      // Stores current time
      currentTimeMs: this.scene.time.now,

      // Stores requested duration
      requestedDurationMs: durationMs,
    };

    // Activates red traffic signal when selected
    if (hurdleType === SaboteurHurdleType.RedTrafficLight && cityTile.trafficSignalId) {
      // Activates red signal state
      this.trafficSignalStateStore.trafficSignalRedActivate(
        cityTile.trafficSignalId,
        this.scene.time.now,
        durationMs
      );

      // Tracks red signal as an active hurdle too
      this.activeHurdleStateStore.activeHurdleActivate(
        activationRequest,
        durationMs,
        cityTile.trafficSignalId
      );
    }

    // Activates non signal hurdle
    if (hurdleType !== SaboteurHurdleType.RedTrafficLight) {
      // Creates active hurdle runtime state
      this.activeHurdleStateStore.activeHurdleActivate(activationRequest, durationMs);
    }

    // Reduces Saboteur energy
    this.matchPrototypeState.saboteur.energyCurrent = Math.max(
      0,
      this.matchPrototypeState.saboteur.energyCurrent - hurdleConfig.energyCost
    );

    // Stores cooldown end time
    this.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[hurdleType] =
      this.scene.time.now + hurdleConfig.cooldownMs;

    // Synchronizes match state after activation
    this.saboteurPlacementRuntimeStateSync();

    // Stores selected tile point
    this.matchPrototypeState.tileInteraction.tilePointSelected = {
      // Stores selected tile x coordinate
      x: cityTile.x,

      // Stores selected tile y coordinate
      y: cityTile.y,
    };

    // Emits activation callback
    this.callback.saboteurPlacementActivated?.(cityTile, hurdleType);
  }

  // Cancels current selected tile placement
  saboteurPlacementCancel(): void {
    // Clears selected tile point
    this.matchPrototypeState.tileInteraction.tilePointSelected = null;
  }

  // Synchronizes match state references from runtime stores
  private saboteurPlacementRuntimeStateSync(): void {
    // Syncs traffic signal runtime lookup
    this.matchPrototypeState.trafficSignalStateById = this.trafficSignalStateStore.trafficSignalStateByIdGet();

    // Syncs active hurdle runtime lookup
    this.matchPrototypeState.activeHurdleById = this.activeHurdleStateStore.activeHurdleByIdGet();
  }
}