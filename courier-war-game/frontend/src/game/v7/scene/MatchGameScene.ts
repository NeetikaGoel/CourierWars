// this scene renders a backend generated courier war city map

import Phaser from "phaser";
import { phaserGameConfig } from "../config/PhaserGameConfig";
import type { CityMapGenerated } from "../types/CityMapType";
import type { MatchPrototypeStateShape } from "../types/MatchRuntimeStateType";
import { PlayerRole, type PlayerRole as PlayerRoleName } from "../types/PlayerRoleType";
import { backendCityMapPayloadConvert } from "../backendPayload/BackendCityMapPayloadConverter";
import type { MatchGameSceneLaunchData } from "./SceneLaunchDataType";
import { MatchPrototypeState } from "../cityMap/runtime/MatchPrototypeState";
import { TrafficSignalStateStore } from "../cityMap/runtime/TrafficSignalStateStore";
import { ActiveHurdleStateStore } from "../cityMap/runtime/ActiveHurdleStateStore";
import { CourierTrailStateStore } from "../cityMap/runtime/CourierTrailStateStore";
import { PointerTileInputResolver } from "../cityMap/input/PointerTileInputResolver";
import { CourierMovementInputController } from "../cityMap/input/CourierMovementInputController";
import { SaboteurHoverInputController } from "../cityMap/input/SaboteurHoverInputController";
import { SaboteurPlacementInputController } from "../cityMap/input/SaboteurPlacementInputController";
import { CameraGameController } from "../cityMap/camera/CameraGameController";
import { CityMapRenderer } from "../cityMap/rendering/CityMapRenderer";
import { CourierRenderer } from "../cityMap/rendering/CourierRenderer";
import { DebugTextOverlay } from "../debug/DebugTextOverlay";

function playerRoleFromValueGet(value: string | undefined): PlayerRoleName {
  // this treats saboteur as explicit and defaults every other value to courier
  if (value === PlayerRole.Saboteur) {
    return PlayerRole.Saboteur;
  }

  // this gives a safe first playable role
  return PlayerRole.Courier;
}

function assignedRoleFromMatchStateGet(matchState: unknown): string | undefined {
  // this reads assignedRole from a loose backend state object
  if (!matchState || typeof matchState !== "object") {
    return undefined;
  }

  // this safely accesses assignedRole without forcing a strict backend type yet
  const stateRecord = matchState as Record<string, unknown>;

  // this returns assignedRole only when backend sent a string
  return typeof stateRecord.assignedRole === "string" ? stateRecord.assignedRole : undefined;
}

export class MatchGameScene extends Phaser.Scene {
  // this stores launch data passed by page controller
  private launchData!: MatchGameSceneLaunchData;

  // this stores generated city map converted from backend payload
  private cityMapGenerated!: CityMapGenerated;

  // this stores local runtime state owner for first render milestone
  private matchPrototypeStateOwner!: MatchPrototypeState;

  // this stores mutable runtime state used by renderers and input controllers
  private matchPrototypeState!: MatchPrototypeStateShape;

  // this stores traffic signal runtime state
  private trafficSignalStateStore!: TrafficSignalStateStore;

  // this stores active hurdle runtime state
  private activeHurdleStateStore!: ActiveHurdleStateStore;

  // this stores courier visited tile state
  private courierTrailStateStore!: CourierTrailStateStore;

  // this resolves mouse pointer to city tile
  private pointerTileInputResolver!: PointerTileInputResolver;

  // this handles courier arrow movement for local milestone
  private courierMovementInputController!: CourierMovementInputController;

  // this handles saboteur hover preview
  private saboteurHoverInputController!: SaboteurHoverInputController;

  // this handles saboteur placement preview and local activation
  private saboteurPlacementInputController!: SaboteurPlacementInputController;

  // this controls camera zoom drag and focus
  private cameraGameController!: CameraGameController;

  // this draws map terrain roads features and runtime overlays
  private cityMapRenderer!: CityMapRenderer;

  // this draws courier marker
  private courierRenderer!: CourierRenderer;

  // this draws temporary debug hud
  private debugTextOverlay!: DebugTextOverlay;

  // this stores courier game object used as tween target
  private courierGameObject!: Phaser.GameObjects.GameObject & { x: number; y: number };

  constructor() {
    // this registers the scene using phaser config key
    super(phaserGameConfig.scene.key);
  }

  init(data: MatchGameSceneLaunchData): void {
    // this stores launch data for create
    this.launchData = data;
  }

  create(): void {
    // this disables browser context menu so map drag feels clean
    this.input.mouse?.disableContextMenu();

    // this converts backend map payload into renderer ready map data
    this.cityMapGenerated = backendCityMapPayloadConvert(this.launchData.mapPayload);

    // this sets up local runtime state for the first render milestone
    this.runtimeStateSetup();

    // this creates map and courier renderers
    this.rendererSetup();

    // this sets up camera bounds zoom and drag
    this.cameraSetup();

    // this sets up courier and saboteur input controllers
    this.inputControllerSetup();

    // this creates debug hud for map testing
    this.debugSetup();

    // this draws full static map and first runtime overlay
    this.cityMapRenderer.cityMapDraw();

    // this focuses camera on courier start zone
    this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);
  }

  update(): void {
    // this syncs runtime stores into match state before frame logic
    this.runtimeStateSync();

    // this restores expired red signals to green
    this.trafficSignalStateStore.trafficSignalStateUpdate(this.time.now);

    // this removes expired active hurdles
    this.activeHurdleStateStore.activeHurdleStateUpdate(this.time.now);

    // this syncs runtime stores again after expiry updates
    this.runtimeStateSync();

    // this only allows courier movement when current scene role is courier
    if (this.matchPrototypeState.playerRole === PlayerRole.Courier) {
      this.courierMovementInputController.courierMovementUpdate();
    }

    // this only updates saboteur controls when current scene role is saboteur
    if (this.matchPrototypeState.playerRole === PlayerRole.Saboteur) {
      this.saboteurPlacementInputController.saboteurPlacementUpdate();
      this.saboteurHoverInputController.saboteurHoverUpdate();
    }

    // this clears saboteur hover when not in saboteur role
    if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
      this.saboteurHoverInputController.saboteurHoverClear();
    }

    // this updates camera keyboard controls
    this.cameraGameController.cameraUpdate(this.matchPrototypeState.courier.tilePoint);

    // this redraws runtime overlays every frame
    this.cityMapRenderer.cityMapRuntimeLayerRedraw();

    // this updates debug hud values
    this.debugTextOverlay.debugTextUpdate(this.time.now);
  }

  matchStateApply(matchState: unknown): void {
    // this is intentionally light for the first map render milestone
    // later this will convert backend polling state into runtime stores
    this.launchData.matchState = matchState;
  }

  private runtimeStateSetup(): void {
    // this prefers explicit assigned role and falls back to role from match state
    const assignedRole =
      this.launchData.assignedRole ?? assignedRoleFromMatchStateGet(this.launchData.matchState);

    // this creates initial local state from backend generated map
    this.matchPrototypeStateOwner = new MatchPrototypeState(
      this.cityMapGenerated,
      playerRoleFromValueGet(assignedRole)
    );

    // this keeps a mutable reference used by renderers and controllers
    this.matchPrototypeState = this.matchPrototypeStateOwner.matchPrototypeStateGet();

    // this creates traffic signal state from generated signals
    this.trafficSignalStateStore = new TrafficSignalStateStore(this.cityMapGenerated.trafficSignalList);

    // this creates active hurdle store
    this.activeHurdleStateStore = new ActiveHurdleStateStore();

    // this creates courier trail store
    this.courierTrailStateStore = new CourierTrailStateStore();

    // this shares the visited tile set with match runtime state
    this.courierTrailStateStore.courierTrailTileKeySetSet(this.matchPrototypeState.courierVisitedTileKeySet);

    // this syncs store values into match state
    this.runtimeStateSync();
  }

  private rendererSetup(): void {
    // this creates city map renderer
    this.cityMapRenderer = new CityMapRenderer(this, this.cityMapGenerated, this.matchPrototypeState);

    // this creates courier renderer
    this.courierRenderer = new CourierRenderer(this);

    // this creates courier object at backend start tile
    this.courierGameObject = this.courierRenderer.courierCreate(this.cityMapGenerated.startTilePoint);
  }

  private cameraSetup(): void {
    // this creates camera controller
    this.cameraGameController = new CameraGameController(this, this.cityMapGenerated);

    // this applies camera setup
    this.cameraGameController.cameraSetup();
  }

  private inputControllerSetup(): void {
    // this creates pointer tile resolver
    this.pointerTileInputResolver = new PointerTileInputResolver(this, this.cityMapGenerated);

    // this creates courier movement controller
    this.courierMovementInputController = new CourierMovementInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.courierGameObject,
      {
        courierMovementStarted: () => {
          // this keeps camera focused near courier after movement starts
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);

          // this redraws overlays immediately
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        courierMovementCompleted: (cityTile) => {
          // this marks the completed tile as visited
          this.courierTrailStateStore.courierTrailTileVisitedByCoordinatesMark(cityTile.x, cityTile.y);

          // this focuses camera on new courier zone
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);

          // this redraws overlays immediately
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        courierMovementBlocked: () => {
          // this refocuses camera even when movement is blocked
          this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);

          // this redraws overlays immediately
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        courierMovementStopped: () => {
          // this redraws overlays after stop effect starts
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        courierLifeLost: () => {
          // this redraws overlays after life loss
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        courierDeliveryReached: () => {
          // this syncs final local state before result routing
          this.runtimeStateSync();

          // this redraws map so final courier position is visible before page changes
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();

          // this tells page layer courier delivered successfully
          this.launchData.onCourierDelivered?.(this.launchData.matchId);
        },
      }
    );

    // this creates saboteur hover controller
    this.saboteurHoverInputController = new SaboteurHoverInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.pointerTileInputResolver
    );

    // this creates saboteur placement controller
    this.saboteurPlacementInputController = new SaboteurPlacementInputController(
      this,
      this.cityMapGenerated,
      this.matchPrototypeState,
      this.pointerTileInputResolver,
      this.trafficSignalStateStore,
      this.activeHurdleStateStore,
      {
        saboteurHurdleSelected: () => {
          // this redraws overlays after hurdle selection changes
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        saboteurPlacementRejected: () => {
          // this redraws overlays after invalid placement
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        saboteurPlacementActivated: () => {
          // this syncs runtime stores after local placement
          this.runtimeStateSync();

          // this redraws overlays after hurdle activation
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },
      }
    );
  }

  private debugSetup(): void {
    // this creates temporary debug hud for map milestone
    this.debugTextOverlay = new DebugTextOverlay(this.cityMapGenerated, this.matchPrototypeState);

    // this renders debug hud immediately
    this.debugTextOverlay.debugTextCreate(this.time.now);
  }

  private runtimeStateSync(): void {
    // this syncs traffic signal states into match state
    this.matchPrototypeState.trafficSignalStateById =
      this.trafficSignalStateStore.trafficSignalStateByIdGet();

    // this syncs active hurdles into match state
    this.matchPrototypeState.activeHurdleById = this.activeHurdleStateStore.activeHurdleByIdGet();

    // this syncs courier visited tiles into match state
    this.matchPrototypeState.courierVisitedTileKeySet = this.courierTrailStateStore.courierTrailTileKeySetGet();
  }
}