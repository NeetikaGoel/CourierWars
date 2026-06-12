// Imports Phaser scene base class
import Phaser from "phaser";

// Imports Phaser game configuration
import { phaserGameConfig } from "../config/PhaserGameConfig";

// Imports generated city map type
import type { CityMapGenerated } from "../types/CityMapType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../types/MatchRuntimeStateType";

// Imports player role values
import { PlayerRole } from "../types/PlayerRoleType";

// Imports city map generated store
import { cityMapGeneratedCreate } from "../cityMap/generation/CityMapGeneratedStore";

// Imports prototype match state owner
import { MatchPrototypeState } from "../cityMap/runtime/MatchPrototypeState";

// Imports traffic signal runtime state store
import { TrafficSignalStateStore } from "../cityMap/runtime/TrafficSignalStateStore";

// Imports active hurdle runtime state store
import { ActiveHurdleStateStore } from "../cityMap/runtime/ActiveHurdleStateStore";

// Imports Courier trail runtime state store
import { CourierTrailStateStore } from "../cityMap/runtime/CourierTrailStateStore";

// Imports pointer tile resolver
import { PointerTileInputResolver } from "../cityMap/input/PointerTileInputResolver";

// Imports Courier movement input controller
import { CourierMovementInputController } from "../cityMap/input/CourierMovementInputController";

// Imports Saboteur hover input controller
import { SaboteurHoverInputController } from "../cityMap/input/SaboteurHoverInputController";

// Imports Saboteur placement input controller
import { SaboteurPlacementInputController } from "../cityMap/input/SaboteurPlacementInputController";

// Imports prototype role input controller
import { PrototypeRoleInputController } from "../cityMap/input/PrototypeRoleInputController";

// Imports camera game controller
import { CameraGameController } from "../cityMap/camera/CameraGameController";

// Imports city map renderer that will be implemented in rendering folder
import { CityMapRenderer } from "../cityMap/rendering/CityMapRenderer";

// Imports Courier renderer that will be implemented in rendering folder
import { CourierRenderer } from "../cityMap/rendering/CourierRenderer";

// Imports debug text overlay
import { DebugTextOverlay } from "../debug/DebugTextOverlay";

// Runs the Courier War map prototype scene
export class MapPrototypeScene extends Phaser.Scene {
  // Stores generated city map
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
  private saboteurHoverInputController!: SaboteurHoverInputController;

  // Stores Saboteur placement input controller
  private saboteurPlacementInputController!: SaboteurPlacementInputController;

  // Stores prototype role input controller
  private prototypeRoleInputController!: PrototypeRoleInputController;

  // Stores camera game controller
  private cameraGameController!: CameraGameController;

  // Stores city map renderer
  private cityMapRenderer!: CityMapRenderer;

  // Stores Courier renderer
  private courierRenderer!: CourierRenderer;

  // Stores debug text overlay
  private debugTextOverlay!: DebugTextOverlay;
    

  // Stores Courier game object used as tween target
  private courierGameObject!: Phaser.GameObjects.GameObject & { x: number; y: number };

  // Creates map prototype scene
  constructor() {
    // Sets Phaser scene key from config
    super(phaserGameConfig.scene.key);
  }

  // Creates scene objects and systems
  // Creates scene objects and systems
  create(): void {
    // Disables browser context menu so camera drag works cleanly
    this.input.mouse?.disableContextMenu();

    // Sets up generated map
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

    // Draws initial map
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

    // Updates camera debug controls
    this.cameraGameController.cameraUpdate(this.matchPrototypeState.courier.tilePoint);

    // Redraws runtime overlays
    this.cityMapRenderer.cityMapRuntimeLayerRedraw();

    // Updates debug text overlay using scene time for cooldowns and durations
    this.debugTextOverlay.debugTextUpdate(this.time.now);
  }

  // Sets up generated city map
  private mapSetup(): void {
    // Creates generated city map using default prototype seed
    this.cityMapGenerated = cityMapGeneratedCreate();
  }
    
  // Sets up debug overlay
  private debugSetup(): void {
    // Creates debug text overlay
    this.debugTextOverlay = new DebugTextOverlay(this.cityMapGenerated, this.matchPrototypeState);

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
        // Refocuses camera and redraws runtime layer when Courier starts moving
        courierMovementStarted: () => {
          // Forces camera back to Courier current zone after zoom or drag
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);

          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles completed Courier movement
        courierMovementCompleted: (cityTile) => {
          // Marks completed tile as visited in trail store
          this.courierTrailStateStore.courierTrailTileVisitedByCoordinatesMark(cityTile.x, cityTile.y);

          // Forces camera to show Courier current zone after movement
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);

          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Refocuses camera when movement is blocked
        courierMovementBlocked: () => {
          // Forces camera back to Courier current zone even when movement fails
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);

          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Redraws runtime layer when Courier is stopped
        courierMovementStopped: () => {
          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Redraws runtime layer when Courier loses life
        courierLifeLost: () => {
          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },
      }
    );

    // Creates Saboteur hover controller
    this.saboteurHoverInputController = new SaboteurHoverInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.pointerTileInputResolver
    );

    // Creates Saboteur placement controller
    this.saboteurPlacementInputController = new SaboteurPlacementInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.pointerTileInputResolver,
      this.trafficSignalStateStore,
      this.activeHurdleStateStore,
      {
        // Handles hurdle selection change
        saboteurHurdleSelected: () => {
          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles rejected placement
        saboteurPlacementRejected: () => {
          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        // Handles activated placement
        saboteurPlacementActivated: () => {
          // Synchronizes runtime store state
          this.runtimeStateSync();

          // Redraws runtime overlays
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },
      }
    );

    // Creates prototype role input controller
    this.prototypeRoleInputController = new PrototypeRoleInputController(this, this.matchPrototypeState, {
      // Handles prototype role change
      prototypeRoleChanged: () => {
        // Clears hover state when role changes
        this.matchPrototypeState.tileInteraction.tilePointHovered = null;

        // Clears hover placement result when role changes
        this.matchPrototypeState.tileInteraction.hoverPlacementResult = null;

        // Redraws runtime overlays
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