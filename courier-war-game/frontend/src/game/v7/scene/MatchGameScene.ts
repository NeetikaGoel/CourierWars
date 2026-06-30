// this scene renders a backend generated courier war city map

import Phaser from "phaser";
import { phaserGameConfig } from "../config/PhaserGameConfig";
import type { CityMapGenerated, CityTile } from "../types/CityMapType";
import type { MatchPrototypeStateShape } from "../types/MatchRuntimeStateType";
import { PlayerRole, type PlayerRole as PlayerRoleName } from "../types/PlayerRoleType";
import { DirectionName, type DirectionName as DirectionNameValue } from "../types/DirectionType";
import { backendCityMapPayloadConvert } from "../backendPayload/BackendCityMapPayloadConverter";
import { backendMatchStateApplyToPrototypeState } from "../backendPayload/BackendMatchStatePayloadConverter";
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
import type { BackendMatchStateResponse } from "../../../common/apiType/MatchApiType";

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

function matchStateRecordGet(matchState: unknown): BackendMatchStateResponse {
  // this keeps backend state application safe when poll returns unexpected shape
  if (!matchState || typeof matchState !== "object") {
    return {};
  }

  return matchState as BackendMatchStateResponse;
}

function backendErrorMessageGet(errorObject: unknown, fallbackMessage: string): string {
  // this turns backend/client errors into readable page messages
  if (errorObject instanceof Error) {
    return errorObject.message;
  }

  return fallbackMessage;
}

function directionNameGet(value: string): DirectionNameValue {
  // this maps loose page/backend string into direction type
  if (value === DirectionName.Left) {
    return DirectionName.Left;
  }

  if (value === DirectionName.Right) {
    return DirectionName.Right;
  }

  if (value === DirectionName.Up) {
    return DirectionName.Up;
  }

  if (value === DirectionName.Down) {
    return DirectionName.Down;
  }

  return DirectionName.None;
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

  // this handles courier arrow movement through backend
  private courierMovementInputController!: CourierMovementInputController;

  // this handles saboteur hover preview
  private saboteurHoverInputController!: SaboteurHoverInputController;

  // this handles saboteur placement through backend
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

  // this stores newest backend state version known by the scene
  private knownStateVersion = 0;

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

    // this sets up local runtime state
    this.runtimeStateSetup();

    // this creates map and courier renderers
    this.rendererSetup();

    // this applies initial backend state before first draw
    this.matchStateApply(this.launchData.matchState);

    // this sets up camera bounds zoom and drag
    this.cameraSetup();

    // this sets up courier and saboteur input controllers
    this.inputControllerSetup();

    // this creates debug hud for map testing
    this.debugSetup();

    // this draws full static map and first runtime overlay
    this.cityMapRenderer.cityMapDraw();

    // this focuses camera on courier start or backend current tile
    this.cameraGameController.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);
  }

  update(): void {
    // this uses unix time because backend expiry values are unix milliseconds
    const currentTimeMs = Date.now();

    // this restores expired red signals to green
    this.trafficSignalStateStore.trafficSignalStateUpdate(currentTimeMs);

    // this removes expired active hurdles
    this.activeHurdleStateStore.activeHurdleStateUpdate(currentTimeMs);

    // this syncs runtime stores after expiry updates
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
    this.debugTextOverlay.debugTextUpdate(currentTimeMs);
  }

  matchStateApply(matchState: unknown): void {
    // this stores latest backend state for later requests
    this.launchData.matchState = matchState;

    const backendMatchState = matchStateRecordGet(matchState);

    if (typeof backendMatchState.stateVersion === "number") {
      this.knownStateVersion = backendMatchState.stateVersion;
    }

    // this applies backend-authoritative state into local runtime state
    backendMatchStateApplyToPrototypeState(this.cityMapGenerated, this.matchPrototypeState, backendMatchState);

    // this copies backend-applied runtime state into local stores
    this.trafficSignalStateStore.trafficSignalStateByIdSet(this.matchPrototypeState.trafficSignalStateById);
    this.activeHurdleStateStore.activeHurdleByIdSet(this.matchPrototypeState.activeHurdleById);
    this.courierTrailStateStore.courierTrailTileKeySetSet(this.matchPrototypeState.courierVisitedTileKeySet);

    // this moves Courier marker to backend-authoritative position
    this.courierRenderer?.courierMoveToTile(this.matchPrototypeState.courier.tilePoint);

    // this keeps camera and overlays aligned after backend updates
    this.cameraGameController?.cameraCourierUpdate(this.matchPrototypeState.courier.tilePoint, true);
    this.cityMapRenderer?.cityMapRuntimeLayerRedraw();
  }

  saboteurHurdleSelect(hurdleType: string): void {
    // this lets page cards update selected Phaser hurdle
    this.saboteurPlacementInputController?.saboteurPlacementHurdleSelect(hurdleType as never);
  }

  private backendStateAcceptedHandle(matchState: BackendMatchStateResponse): void {
    // this lets page update hud and then send state back into Phaser
    if (this.launchData.onStateAccepted) {
      this.launchData.onStateAccepted(matchState);
      return;
    }

    // this fallback keeps scene usable if page callback is missing
    this.matchStateApply(matchState);
  }

  private actionRejectedHandle(errorObject: unknown, fallbackMessage: string): void {
    // this sends backend rejection to page error box
    this.launchData.onActionRejected?.(backendErrorMessageGet(errorObject, fallbackMessage));
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
        courierMovementRequested: async (request) => {
          if (!this.launchData.matchApi || this.launchData.matchId === undefined) {
            return false;
          }

          try {
            const state = await this.launchData.matchApi.courierMove(this.launchData.matchId, {
              knownStateVersion: this.knownStateVersion,
              from: request.from,
              to: request.to,
              direction: directionNameGet(request.direction),
            });

            this.backendStateAcceptedHandle(state);

            if (state.status === 3 && state.winnerRole === PlayerRole.Courier) {
              this.launchData.onCourierDelivered?.(this.launchData.matchId);
            }

            return true;
          } catch (errorObject) {
            this.actionRejectedHandle(errorObject, "Courier movement was rejected");
            return false;
          }
        },

        courierMovementStarted: () => {
          // this keeps camera focused near courier after movement starts
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
        saboteurPlacementRequested: async (cityTile: CityTile, hurdleType, requestedDurationMs) => {
          if (!this.launchData.matchApi || this.launchData.matchId === undefined) {
            return false;
          }

          try {
            const state = await this.launchData.matchApi.saboteurHurdle(this.launchData.matchId, {
              knownStateVersion: this.knownStateVersion,
              hurdleType,
              target: {
                x: cityTile.x,
                y: cityTile.y,
              },
              requestedDurationMs,
            });

            this.backendStateAcceptedHandle(state);
            return true;
          } catch (errorObject) {
            this.actionRejectedHandle(errorObject, "Hurdle placement was rejected");
            return false;
          }
        },

        saboteurHurdleSelected: () => {
          // this redraws overlays after hurdle selection changes
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        saboteurPlacementRejected: (placementResult) => {
          // this shows local placement rejection before backend call
          this.launchData.onActionRejected?.(placementResult.message || "Hurdle placement is not valid");

          // this redraws overlays after invalid placement
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        saboteurPlacementActivated: () => {
          // this redraws overlays after backend accepted hurdle activation
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },
      }
    );
  }

  private debugSetup(): void {
    // this creates temporary debug hud for map milestone
    this.debugTextOverlay = new DebugTextOverlay(this.cityMapGenerated, this.matchPrototypeState);

    // this renders debug hud immediately
    this.debugTextOverlay.debugTextCreate(Date.now());
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