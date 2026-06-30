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
  // Runs before placement is applied, backend is final authority
  saboteurPlacementRequested?: (cityTile: CityTile, hurdleType: SaboteurHurdleType, requestedDurationMs: number) => Promise<boolean>;

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

  // Stores whether placement request is currently waiting for backend
  private placementRequestPending = false;

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

    // Stores traffic signal store reference
    this.trafficSignalStateStore = trafficSignalStateStore;

    // Stores active hurdle store reference
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
      void this.saboteurPlacementTileClickHandle(cityTile);
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
  async saboteurPlacementTileClickHandle(cityTile: CityTile | undefined): Promise<void> {
    // Stops duplicate placement request while backend is pending
    if (this.placementRequestPending) {
      // Ends duplicate click
      return;
    }

    // Tries to activate selected hurdle
    const placementResult = await this.saboteurPlacementActivationTry(cityTile);

    // Emits rejection callback when placement fails
    if (!placementResult.valid) {
      // Emits rejected placement
      this.callback.saboteurPlacementRejected?.(placementResult);
    }
  }

  // Tries to activate selected hurdle on tile
  async saboteurPlacementActivationTry(cityTile: CityTile | undefined): Promise<SaboteurHurdlePlacementResult> {
    // Synchronizes match state from runtime stores before validation
    this.saboteurPlacementRuntimeStateSync();

    // Stores selected hurdle type
    const hurdleType = this.matchPrototypeState.saboteur.hurdleTypeSelected;

    // Validates placement locally before backend request
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
      currentTimeMs: Date.now(),
    });

    // Returns failure when placement is invalid
    if (!placementResult.valid) {
      // Stores hover placement result for renderer feedback
      this.matchPrototypeState.tileInteraction.hoverPlacementResult = placementResult;

      // Returns invalid placement result
      return placementResult;
    }

    // Confirms placement through backend
    const accepted = await this.saboteurPlacementConfirm(cityTile!, hurdleType);

    if (!accepted) {
      return {
        valid: false,
        message: "Backend rejected hurdle placement",
      };
    }

    // Returns valid placement result
    return placementResult;
  }

  // Confirms and applies valid Saboteur placement through backend
  async saboteurPlacementConfirm(cityTile: CityTile, hurdleType: SaboteurHurdleType): Promise<boolean> {
    // Stores hurdle config
    const hurdleConfig = saboteurHurdleConfig.hurdle[hurdleType];

    // Stores activation duration
    const durationMs = hurdleConfig.durationMsDefault;

    // Marks placement request pending
    this.placementRequestPending = true;

    try {
      // Sends placement request to backend authority
      const accepted = await this.callback.saboteurPlacementRequested?.(cityTile, hurdleType, durationMs);

      if (!accepted) {
        return false;
      }

      // Stores selected tile point after backend accepted
      this.matchPrototypeState.tileInteraction.tilePointSelected = {
        x: cityTile.x,
        y: cityTile.y,
      };

      // Emits activation callback
      this.callback.saboteurPlacementActivated?.(cityTile, hurdleType);

      return true;
    } finally {
      // Releases placement request pending flag
      this.placementRequestPending = false;
    }
  }

  // Synchronizes match state references from runtime stores
  private saboteurPlacementRuntimeStateSync(): void {
    // Syncs traffic signal runtime lookup
    this.matchPrototypeState.trafficSignalStateById = this.trafficSignalStateStore.trafficSignalStateByIdGet();

    // Syncs active hurdle runtime lookup
    this.matchPrototypeState.activeHurdleById = this.activeHurdleStateStore.activeHurdleByIdGet();
  }
}