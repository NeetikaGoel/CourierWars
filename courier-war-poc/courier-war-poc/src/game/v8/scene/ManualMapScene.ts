// Imports Phaser scene base class
import Phaser from "phaser";

// Imports V8 Phaser game configuration
import { phaserGameConfig } from "../config/PhaserGameConfig";

// Imports generated city map type from the V7 renderer contract
import type { CityMapGenerated } from "../../v7/types/CityMapType";

// Imports match runtime state shape from the V7 prototype contract
import type { MatchPrototypeStateShape } from "../../v7/types/MatchRuntimeStateType";

// Imports player role values
import { PlayerRole } from "../../v7/types/PlayerRoleType";

// Imports V8 manual city map creator
import { manualCityMapCreate } from "../manualMap/ManualCityMap";

// Imports prototype match state owner
import { MatchPrototypeState } from "../../v7/cityMap/runtime/MatchPrototypeState";

// Imports traffic signal runtime state store
import { TrafficSignalStateStore } from "../../v7/cityMap/runtime/TrafficSignalStateStore";

// Imports active hurdle runtime state store
import { ActiveHurdleStateStore } from "../../v7/cityMap/runtime/ActiveHurdleStateStore";

// Imports Courier trail runtime state store
import { CourierTrailStateStore } from "../../v7/cityMap/runtime/CourierTrailStateStore";

// Imports pointer tile resolver
import { PointerTileInputResolver } from "../../v7/cityMap/input/PointerTileInputResolver";

// Imports Courier movement input controller
import { CourierMovementInputController } from "../../v7/cityMap/input/CourierMovementInputController";

// Imports V8 Saboteur hover input controller
import { ManualSaboteurHoverInputController } from "../input/ManualSaboteurHoverInputController";

// Imports V8 Saboteur placement input controller
import { ManualSaboteurPlacementInputController } from "../input/ManualSaboteurPlacementInputController";

// Imports prototype role input controller
import { PrototypeRoleInputController } from "../../v7/cityMap/input/PrototypeRoleInputController";

// Imports camera game controller
import { CameraGameController } from "../../v7/cityMap/camera/CameraGameController";

// Imports V8 city map renderer
import { CityMapRenderer } from "../rendering/CityMapRenderer";

// Imports Courier renderer
import { CourierRenderer } from "../../v7/cityMap/rendering/CourierRenderer";

// Imports V8 debug text overlay
import { ManualDebugTextOverlay } from "../debug/ManualDebugTextOverlay";

// Runs the Courier War V8 manual map prototype scene
export class ManualMapScene extends Phaser.Scene {
  // Stores generated manual city map
  private cityMapGenerated!: CityMapGenerated;

  // Stores prototype match state owner
  private matchPrototypeStateOwner!: MatchPrototypeState;

  // Stores mutable match prototype state
  private matchPrototypeState!: MatchPrototypeStateShape;

  // Stores traffic signal state store
  private trafficSignalStateStore!: TrafficSignalStateStore;

  // Stores active hurdle state store
  private activeHurdleStateStore!: ActiveHurdleStateStore;

  // Stores Courier trail state store
  private courierTrailStateStore!: CourierTrailStateStore;

  // Stores pointer tile input resolver
  private pointerTileInputResolver!: PointerTileInputResolver;

  // Stores Courier movement input controller
  private courierMovementInputController!: CourierMovementInputController;

  // Stores Saboteur hover input controller
  private saboteurHoverInputController!: ManualSaboteurHoverInputController;

  // Stores Saboteur placement input controller
  private saboteurPlacementInputController!: ManualSaboteurPlacementInputController;

  // Stores prototype role input controller
  private prototypeRoleInputController!: PrototypeRoleInputController;

  // Stores camera game controller
  private cameraGameController!: CameraGameController;

  // Stores city map renderer
  private cityMapRenderer!: CityMapRenderer;

  // Stores Courier renderer
  private courierRenderer!: CourierRenderer;

  // Stores debug text overlay
  private debugTextOverlay!: ManualDebugTextOverlay;

  // Stores Courier game object used as tween target
  private courierGameObject!: Phaser.GameObjects.GameObject & { x: number; y: number };

  // Creates manual map prototype scene
  constructor() {
    // Sets Phaser scene key from V8 config
    super(phaserGameConfig.scene.key);
  }

  // Creates scene objects and systems
  create(): void {
    // Disables browser context menu so camera drag works cleanly
    this.input.mouse?.disableContextMenu();

    // Sets up manual map
    this.mapSetup();

    // Sets up runtime state stores
    this.runtimeStateSetup();

    // Sets up renderers
    this.rendererSetup();

    // Sets up camera
    this.cameraSetup();

    // Sets up input controllers
    this.inputControllerSetup();

    // Sets up debug overlay
    this.debugSetup();

    // Draws initial manual city map
    this.cityMapRenderer.cityMapDraw();

    // Focuses camera on Courier start zone
    this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);
  }

  // Updates scene systems every frame
  update(): void {
    // Synchronizes runtime stores into match state
    this.runtimeStateSync();

    // Updates runtime signal durations
    this.trafficSignalStateStore.trafficSignalStateUpdate(this.time.now);

    // Updates active hurdle durations
    this.activeHurdleStateStore.activeHurdleStateUpdate(this.time.now);

    // Synchronizes state again after runtime updates
    this.runtimeStateSync();

    // Updates role input
    this.prototypeRoleInputController.prototypeRoleUpdate();

    // Updates Courier movement input
    this.courierMovementInputController.courierMovementUpdate();

    // Updates Saboteur hurdle selection input
    this.saboteurPlacementInputController.saboteurPlacementUpdate();

    // Updates Saboteur hover feedback
    this.saboteurHoverInputController.saboteurHoverUpdate();

    // Updates camera controls
    this.cameraGameController.cameraUpdate(this.matchPrototypeState.courier.tilePoint);

    // Redraws runtime overlays
    this.cityMapRenderer.cityMapRuntimeLayerRedraw();

    // Updates debug text overlay
    this.debugTextOverlay.debugTextUpdate(this.time.now);
  }

  // Sets up fixed manual city map
  private mapSetup(): void {
    // Creates manual city map instead of random generated map
    this.cityMapGenerated = manualCityMapCreate();
  }

  // Sets up debug overlay
  private debugSetup(): void {
    // Creates debug text overlay
    this.debugTextOverlay = new ManualDebugTextOverlay(this.cityMapGenerated, this.matchPrototypeState);

    // Creates debug text element using scene time
    this.debugTextOverlay.debugTextCreate(this.time.now);
  }

  // Sets up match runtime state and stores
  private runtimeStateSetup(): void {
    // Creates prototype match state owner
    this.matchPrototypeStateOwner = new MatchPrototypeState(this.cityMapGenerated, PlayerRole.Courier);

    // Gets mutable prototype match state
    this.matchPrototypeState = this.matchPrototypeStateOwner.matchPrototypeStateGet();

    // Creates traffic signal state store from generated signals
    this.trafficSignalStateStore = new TrafficSignalStateStore(this.cityMapGenerated.trafficSignalList);

    // Creates active hurdle state store
    this.activeHurdleStateStore = new ActiveHurdleStateStore();

    // Creates Courier trail state store
    this.courierTrailStateStore = new CourierTrailStateStore();

    // Shares match state visited set with Courier trail store
    this.courierTrailStateStore.courierTrailTileKeySetSet(this.matchPrototypeState.courierVisitedTileKeySet);

    // Synchronizes runtime store state into match state
    this.runtimeStateSync();
  }

  // Sets up map and Courier renderers
  private rendererSetup(): void {
    // Creates city map renderer
    this.cityMapRenderer = new CityMapRenderer(this, this.cityMapGenerated, this.matchPrototypeState);

    // Creates Courier renderer
    this.courierRenderer = new CourierRenderer(this);

    // Creates Courier game object at start tile
    this.courierGameObject = this.courierRenderer.courierCreate(this.cityMapGenerated.startTilePoint);
  }

  // Sets up camera system
  private cameraSetup(): void {
    // Creates camera controller
    this.cameraGameController = new CameraGameController(this, this.cityMapGenerated);

    // Sets up camera
    this.cameraGameController.cameraSetup();
  }

  // Sets up input controllers
  private inputControllerSetup(): void {
    // Creates pointer tile resolver
    this.pointerTileInputResolver = new PointerTileInputResolver(this, this.cityMapGenerated);

    // Creates Courier movement input controller
    this.courierMovementInputController = new CourierMovementInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.courierGameObject,
      {
        // Handles movement start
        courierMovementStarted: () => {
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles completed movement
        courierMovementCompleted: (cityTile) => {
          this.courierTrailStateStore.courierTrailTileVisitedByCoordinatesMark(cityTile.x, cityTile.y);
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles blocked movement
        courierMovementBlocked: () => {
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles stopped movement
        courierMovementStopped: () => {
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles Courier life loss
        courierLifeLost: () => {
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },
      }
    );

    // Creates Saboteur hover controller
    this.saboteurHoverInputController = new ManualSaboteurHoverInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.pointerTileInputResolver
    );

    // Creates Saboteur placement controller
    this.saboteurPlacementInputController = new ManualSaboteurPlacementInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.pointerTileInputResolver,
      this.trafficSignalStateStore,
      this.activeHurdleStateStore,
      {
        // Handles hurdle selection change
        saboteurHurdleSelected: () => {
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles rejected placement
        saboteurPlacementRejected: () => {
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles activated placement
        saboteurPlacementActivated: () => {
          this.runtimeStateSync();
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },
      }
    );

    // Creates prototype role input controller
    this.prototypeRoleInputController = new PrototypeRoleInputController(this, this.matchPrototypeState, {
      // Handles prototype role change
      prototypeRoleChanged: () => {
        this.matchPrototypeState.tileInteraction.tilePointHovered = null;
        this.matchPrototypeState.tileInteraction.hoverPlacementResult = null;
        this.cityMapRenderer.cityMapRuntimeLayerRedraw();
      },
    });
  }

  // Synchronizes runtime store data into match state
  private runtimeStateSync(): void {
    // Syncs traffic signal state lookup
    this.matchPrototypeState.trafficSignalStateById =
      this.trafficSignalStateStore.trafficSignalStateByIdGet();

    // Syncs active hurdle lookup
    this.matchPrototypeState.activeHurdleById = this.activeHurdleStateStore.activeHurdleByIdGet();

    // Syncs Courier visited tile key set
    this.matchPrototypeState.courierVisitedTileKeySet = this.courierTrailStateStore.courierTrailTileKeySetGet();
  }
}
