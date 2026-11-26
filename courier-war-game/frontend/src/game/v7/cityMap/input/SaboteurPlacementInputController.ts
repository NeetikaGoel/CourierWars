// Imports Phaser types used by pointer and keyboard input
import Phaser from "phaser";

// Imports Saboteur hurdle configuration
import { saboteurHurdleConfig } from "../../config/SaboteurHurdleConfig";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports player role values
import { PlayerRole } from "../../types/PlayerRoleType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports Saboteur hurdle values and result types
import {
  SaboteurHurdlePlacementFailureReason,
  SaboteurHurdleType,
  type SaboteurHurdleActivationRequest,
  type SaboteurHurdlePlacementResult,
} from "../../types/SaboteurHurdleType";

// Imports placement validation rule
import {
  saboteurPlacementCheck,
  saboteurPlacementTargetTileListGet,
} from "../rules/SaboteurPlacementRules";

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

  // Runs instead of local activation in an online match, the backend decides and the next state shows the hurdle
  saboteurPlacementRequested?: (hurdleType: SaboteurHurdleType, tilePointList: CoordinateTilePoint[]) => void;

  // Runs in an online match when a map click picks the target tile for the Activate button
  saboteurTileSelected?: (cityTile: CityTile, placementResult: SaboteurHurdlePlacementResult) => void;
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

    // Activates the selected hurdle on the selected tile in an online match
    private hurdleKeyActivateSpace?: Phaser.Input.Keyboard.Key;
    private hurdleKeyActivateEnter?: Phaser.Input.Keyboard.Key;
    
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

    // Space and Enter place the selected hurdle, the same as the Activate Hurdle button
    this.hurdleKeyActivateSpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);
    this.hurdleKeyActivateEnter = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER, false);
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
    const activateSpacePressed = this.hurdleKeyActivateSpace && Phaser.Input.Keyboard.JustDown(this.hurdleKeyActivateSpace);
    const activateEnterPressed = this.hurdleKeyActivateEnter && Phaser.Input.Keyboard.JustDown(this.hurdleKeyActivateEnter);

    if ((activateSpacePressed || activateEnterPressed) && this.callback.saboteurPlacementRequested) {
      this.saboteurPlacementSelectedActivate();
    }

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
    // In an online match a click only picks the target tile, Activate Hurdle places it
    if (this.callback.saboteurPlacementRequested) {
      this.saboteurPlacementTileSelect(cityTile);
      return;
    }

    // Tries to activate selected hurdle
    const placementResult = this.saboteurPlacementActivationTry(cityTile);

    // Emits rejection callback when placement fails
    if (!placementResult.valid) {
      // Emits rejected placement
      this.callback.saboteurPlacementRejected?.(placementResult);
    }
  }

  // Tries to activate selected hurdle on tile
  // Picks the target tile and reports whether the selected hurdle can go there right now
  saboteurPlacementTileSelect(cityTile: CityTile | undefined): void {
    if (!cityTile) {
      return;
    }

    this.saboteurPlacementRuntimeStateSync();
    this.matchPrototypeState.tileInteraction.tilePointSelected = { x: cityTile.x, y: cityTile.y };

    const placementResult = saboteurPlacementCheck({
      cityMapGenerated: this.cityMapGenerated,
      cityZoneList: this.cityMapGenerated.zoneList,
      cityTile,
      hurdleType: this.matchPrototypeState.saboteur.hurdleTypeSelected,
      matchPrototypeState: this.matchPrototypeState,
      currentTimeMs: this.scene.time.now,
    });

    this.callback.saboteurTileSelected?.(cityTile, placementResult);
  }

  // Places the selected hurdle on the selected tile, used by the Activate Hurdle button and Space or Enter
  saboteurPlacementSelectedActivate(): SaboteurHurdlePlacementResult {
    const tilePointSelected = this.matchPrototypeState.tileInteraction.tilePointSelected;
    const cityTile = tilePointSelected
      ? this.cityMapGenerated.tileRows[tilePointSelected.y]?.[tilePointSelected.x]
      : undefined;

    if (!cityTile) {
      const placementResult: SaboteurHurdlePlacementResult = {
        valid: false,
        failureReason: SaboteurHurdlePlacementFailureReason.TileMissing,
        message: "Click a road tile on the map first",
      };

      this.callback.saboteurPlacementRejected?.(placementResult);
      return placementResult;
    }

    const placementResult = this.saboteurPlacementActivationTry(cityTile);

    if (!placementResult.valid) {
      this.callback.saboteurPlacementRejected?.(placementResult);
    }

    return placementResult;
  }

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
  // Confirms and applies valid Saboteur placement
  saboteurPlacementConfirm(cityTile: CityTile, hurdleType: SaboteurHurdleType): void {
    // Sends the anchor tile first and then the road width tiles so both players block the same tiles
    if (this.callback.saboteurPlacementRequested) {
      const targetTileList =
        hurdleType === SaboteurHurdleType.RedTrafficLight
          ? [cityTile]
          : saboteurPlacementTargetTileListGet(this.cityMapGenerated, cityTile, hurdleType);
      const tilePointList = [cityTile, ...targetTileList.filter((targetTile) => targetTile !== cityTile)].map(
        (targetTile) => ({ x: targetTile.x, y: targetTile.y })
      );

      this.matchPrototypeState.tileInteraction.tilePointSelected = { x: cityTile.x, y: cityTile.y };
      this.callback.saboteurPlacementRequested(hurdleType, tilePointList);

      return;
    }

    // Stores hurdle config
    const hurdleConfig = saboteurHurdleConfig.hurdle[hurdleType];

    // Stores activation duration
    const durationMs = hurdleConfig.durationMsDefault;

    // Stores current scene time
    const currentTimeMs = this.scene.time.now;

    // Activates red traffic signal when selected
    if (hurdleType === SaboteurHurdleType.RedTrafficLight && cityTile.trafficSignalId) {
      this.trafficSignalStateStore.trafficSignalRedActivate(
        cityTile.trafficSignalId,
        currentTimeMs,
        durationMs
      );

      this.activeHurdleStateStore.activeHurdleActivate(
        {
          hurdleType,
          tilePoint: {
            x: cityTile.x,
            y: cityTile.y,
          },
          currentTimeMs,
          requestedDurationMs: durationMs,
        },
        durationMs,
        cityTile.trafficSignalId
      );
    }

    // Activates non signal hurdles across every target tile in the road section
    if (hurdleType !== SaboteurHurdleType.RedTrafficLight) {
      const targetTileList = saboteurPlacementTargetTileListGet(
        this.cityMapGenerated,
        cityTile,
        hurdleType
      );

      for (const targetTile of targetTileList) {
        const activationRequest: SaboteurHurdleActivationRequest = {
          hurdleType,
          tilePoint: {
            x: targetTile.x,
            y: targetTile.y,
          },
          currentTimeMs,
          requestedDurationMs: durationMs,
        };

        this.activeHurdleStateStore.activeHurdleActivate(activationRequest, durationMs);
      }
    }

    // Reduces Saboteur energy only once for one placement action
    this.matchPrototypeState.saboteur.energyCurrent = Math.max(
      0,
      this.matchPrototypeState.saboteur.energyCurrent - hurdleConfig.energyCost
    );

    // Stores cooldown end time only once for one placement action
    this.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[hurdleType] =
      currentTimeMs + hurdleConfig.cooldownMs;

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