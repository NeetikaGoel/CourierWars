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
import { isometricTileCenterWorldPointGet } from "../iso/IsometricCoordinateCalculator";
import { cityTileKeyFromPointGet } from "../utility/CityTileKeyConverter";
import type { CoordinateTilePoint } from "../types/CoordinateType";
import { SaboteurHurdleType, type SaboteurHurdleActive } from "../types/SaboteurHurdleType";
import type { MatchSyncCourier, MatchSyncState } from "../../../common/apiType/MatchApiType";
import { FrontendMatchStatusValue } from "../../../constants/FrontendMatchStatusValue";

// the saboteur replays remote courier tiles faster when several arrive in one poll
const REMOTE_COURIER_TILE_MS_MAX = 145;
const REMOTE_COURIER_TILE_MS_MIN = 40;
const REMOTE_COURIER_CATCH_UP_MS = 450;

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

  // this is true for a local prototype scene, an online scene waits for the backend to start the match
  private courierMovementEnabled = true;

  // this stops courier input after the delivery tile was reached
  private courierDelivered = false;

  // this stores the latest backend minus local clock difference
  private serverClockOffsetMs = 0;

  // these store the newest backend states, they can arrive before init and create have run
  private latestMatchState: unknown = undefined;
  private latestFullMatchState: unknown = undefined;

  // this is the last courier step seq the saboteur has drawn
  private remoteCourierSeq = 0;

  // this stores remote courier tiles still waiting to be animated
  private remoteCourierTileQueue: CoordinateTilePoint[] = [];

  // this is true while one remote courier tile tween runs
  private remoteCourierTweenActive = false;

  constructor() {
    // this registers the scene using phaser config key
    super(phaserGameConfig.scene.key);
  }

  init(data: MatchGameSceneLaunchData): void {
    // this stores launch data for create
    this.launchData = data;

    // this makes an online courier wait for the backend active status before moving
    this.courierMovementEnabled = data.onCourierStep === undefined;
    this.courierDelivered = false;
    this.remoteCourierSeq = 0;
    this.remoteCourierTileQueue = [];
    this.remoteCourierTweenActive = false;
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

    // this applies the newest backend state, which may have arrived while the scene was booting
    // the last full state carries hurdles and the courier, a later unchanged poll only adds status and energy
    const fullState = this.latestFullMatchState ?? this.launchData.matchState;
    const newestState = this.latestMatchState;
    this.matchStateApply(fullState, this.serverClockOffsetMs);

    if (newestState && newestState !== fullState) {
      this.matchStateApply(newestState, this.serverClockOffsetMs);
    }
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
    if (
      this.matchPrototypeState.playerRole === PlayerRole.Courier &&
      this.courierMovementEnabled &&
      !this.courierDelivered
    ) {
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

  matchStateApply(matchState: unknown, serverClockOffsetMs = 0): void {
    // this keeps the latest backend state and clock offset so create can replay a state that arrived early
    this.latestMatchState = matchState;
    this.serverClockOffsetMs = serverClockOffsetMs;

    if (matchState && typeof matchState === "object" && (matchState as MatchSyncState).changed) {
      this.latestFullMatchState = matchState;
    }

    // this ignores calls that arrive before create or after shutdown
    if (!this.matchPrototypeState || !matchState || typeof matchState !== "object") {
      return;
    }

    const syncState = matchState as MatchSyncState;

    // this lets the courier move only while the backend says the match runs
    this.courierMovementEnabled = syncState.status === FrontendMatchStatusValue.Active;

    // this keeps saboteur energy current on every poll because it recovers over time
    if (typeof syncState.obstacleEnergyRemaining === "number") {
      this.matchPrototypeState.saboteur.energyCurrent = syncState.obstacleEnergyRemaining;
    }

    // this skips the rest when the backend said nothing else changed
    if (!syncState.changed) {
      return;
    }

    // this converts backend wall clock times into this scene clock
    const sceneNowMs = this.time.now;
    const serverNowMs = Date.now() + serverClockOffsetMs;
    const sceneTimeFromServerGet = (serverTimeMs: number): number => sceneNowMs + (serverTimeMs - serverNowMs);

    if (typeof syncState.energyMax === "number") {
      this.matchPrototypeState.saboteur.energyMax = syncState.energyMax;
    }

    // this makes the local placement preview use the backend energy costs
    if (syncState.hurdleRules) {
      const energyCostByType: Partial<Record<SaboteurHurdleType, number>> = {};

      for (const [hurdleType, hurdleRule] of Object.entries(syncState.hurdleRules)) {
        energyCostByType[hurdleType as SaboteurHurdleType] = hurdleRule.energyCost;
      }

      this.matchPrototypeState.saboteur.energyCostByType = energyCostByType;
    }

    if (syncState.cooldownUntilMsByType && !Array.isArray(syncState.cooldownUntilMsByType)) {
      for (const [hurdleType, cooldownUntilMs] of Object.entries(syncState.cooldownUntilMsByType)) {
        this.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[hurdleType as SaboteurHurdleType] =
          sceneTimeFromServerGet(cooldownUntilMs);
      }
    }

    if (syncState.hurdles) {
      this.hurdleStateFromServerApply(syncState, sceneTimeFromServerGet);
    }

    if (syncState.courier) {
      this.courierStateFromServerApply(syncState.courier);
    }

    // this pushes new store objects into match state and redraws overlays now
    this.runtimeStateSync();
    this.cityMapRenderer.cityMapRuntimeLayerRedraw();
  }

  saboteurHurdleSelect(hurdleType: string): void {
    // this ignores calls before create or with an unknown type
    if (!this.saboteurPlacementInputController || !Object.values(SaboteurHurdleType).includes(hurdleType as SaboteurHurdleType)) {
      return;
    }

    this.saboteurPlacementInputController.saboteurPlacementHurdleSelect(hurdleType as SaboteurHurdleType);
  }

  saboteurHurdleActivate(): void {
    if (!this.saboteurPlacementInputController || this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
      return;
    }

    this.saboteurPlacementInputController.saboteurPlacementSelectedActivate();
  }

  courierPositionReset(tileX: number, tileY: number): void {
    // this snaps the local courier back to the tile the backend accepted last
    this.courierMovementInputController?.courierMovementReset({ x: tileX, y: tileY });
    this.cityMapRenderer?.cityMapRuntimeLayerRedraw();
  }

  private hurdleStateFromServerApply(
    syncState: MatchSyncState,
    sceneTimeFromServerGet: (serverTimeMs: number) => number
  ): void {
    const activeHurdleList: SaboteurHurdleActive[] = [];
    const redUntilMsBySignalId: Record<string, number> = {};

    for (const hurdle of syncState.hurdles ?? []) {
      const startedAtMs = sceneTimeFromServerGet(hurdle.startedAtMs);
      const expiresAtMs = sceneTimeFromServerGet(hurdle.expiresAtMs);

      // this drops hurdles that already ran out while the response was travelling
      if (expiresAtMs <= this.time.now) {
        continue;
      }

      hurdle.tiles.forEach(([tileX, tileY], tileIndex) => {
        activeHurdleList.push({
          id: `${hurdle.id}-${tileIndex}`,
          hurdleType: hurdle.type as SaboteurHurdleType,
          tilePoint: { x: tileX, y: tileY },
          startedAtMs,
          expiresAtMs,
          trafficSignalId: hurdle.signalId ?? undefined,
        });
      });

      if (hurdle.type === SaboteurHurdleType.RedTrafficLight && hurdle.signalId) {
        redUntilMsBySignalId[hurdle.signalId] = expiresAtMs;
      }
    }

    this.activeHurdleStateStore.activeHurdleStateReplace(activeHurdleList);
    this.trafficSignalStateStore.trafficSignalRedReplace(redUntilMsBySignalId);
  }

  private courierStateFromServerApply(courier: MatchSyncCourier): void {
    // this keeps the lowest life count because the courier client may have just lost one locally
    this.matchPrototypeState.courier.livesCurrent = Math.min(this.matchPrototypeState.courier.livesCurrent, courier.lives);

    // the courier owns its own position, only the saboteur follows the backend
    if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
      return;
    }

    if (courier.moveSeq <= this.remoteCourierSeq) {
      return;
    }

    const newerTileList = courier.trail.filter(([, , stepSeq]) => stepSeq > this.remoteCourierSeq);
    const trailContinuous = newerTileList.length > 0 && newerTileList[0][2] === this.remoteCourierSeq + 1;

    if (trailContinuous) {
      this.remoteCourierTileQueue.push(...newerTileList.map(([tileX, tileY]) => ({ x: tileX, y: tileY })));
    } else {
      // this happens after a long gap, the saboteur just jumps to the latest tile
      this.remoteCourierTileQueue = [];
      this.tweens.killTweensOf(this.courierGameObject);
      this.remoteCourierTweenActive = false;
      this.remoteCourierTileArrive({ x: courier.x, y: courier.y });
      const worldPoint = isometricTileCenterWorldPointGet({ x: courier.x, y: courier.y });
      this.courierGameObject.x = worldPoint.x;
      this.courierGameObject.y = worldPoint.y;
    }

    this.remoteCourierSeq = courier.moveSeq;
    this.remoteCourierTweenNext();
  }

  private remoteCourierTweenNext(): void {
    if (this.remoteCourierTweenActive) {
      return;
    }

    const tilePoint = this.remoteCourierTileQueue.shift();

    if (!tilePoint) {
      return;
    }

    // this spreads the queued tiles over roughly one poll so the marker keeps moving smoothly
    const durationMs = Math.max(
      REMOTE_COURIER_TILE_MS_MIN,
      Math.min(REMOTE_COURIER_TILE_MS_MAX, REMOTE_COURIER_CATCH_UP_MS / (this.remoteCourierTileQueue.length + 1))
    );
    const worldPoint = isometricTileCenterWorldPointGet(tilePoint);

    this.remoteCourierTweenActive = true;
    this.tweens.add({
      targets: this.courierGameObject,
      x: worldPoint.x,
      y: worldPoint.y,
      duration: durationMs,
      ease: "Linear",
      onComplete: () => {
        this.remoteCourierTweenActive = false;
        this.remoteCourierTileArrive(tilePoint);
        this.remoteCourierTweenNext();
      },
    });
  }

  private remoteCourierTileArrive(tilePoint: CoordinateTilePoint): void {
    // this keeps saboteur placement rules working with where the courier really is
    const cityTile = this.cityMapGenerated.tileRows[tilePoint.y]?.[tilePoint.x];
    const courierState = this.matchPrototypeState.courier;

    courierState.tilePoint = { x: tilePoint.x, y: tilePoint.y };

    if (cityTile && cityTile.zoneId !== courierState.zoneIdCurrent) {
      courierState.zoneIdPrevious = courierState.zoneIdCurrent;
      courierState.zoneIdCurrent = cityTile.zoneId;
    }

    this.courierTrailStateStore.courierTrailTileVisitedByCoordinatesMark(tilePoint.x, tilePoint.y);
    this.matchPrototypeState.courierVisitedTileKeySet.add(cityTileKeyFromPointGet(tilePoint));
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

          // this reports the step so the backend and the saboteur see it
          this.launchData.onCourierStep?.({
            x: cityTile.x,
            y: cityTile.y,
            lives: this.matchPrototypeState.courier.livesCurrent,
          });

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
          // this stops further courier input while the backend confirms the delivery
          this.courierDelivered = true;

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
        saboteurTileSelected: (_cityTile, placementResult) => {
          // this tells the page whether Activate Hurdle will work on the picked tile
          this.launchData.onPlacementFeedback?.(
            placementResult.valid ? "Target tile selected. Press Activate Hurdle or Space." : placementResult.message ?? "Tile not allowed",
            placementResult.valid
          );
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        saboteurHurdleSelected: (hurdleType) => {
          // this keeps the page deck on the same hurdle as the keyboard
          this.launchData.onHurdleSelected?.(hurdleType);

          // this redraws overlays after hurdle selection changes
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        saboteurPlacementRejected: (placementResult) => {
          // this shows why the local rules refused the placement
          this.launchData.onPlacementFeedback?.(placementResult.message ?? "Hurdle cannot be placed there", false);

          // this redraws overlays after invalid placement
          this.cityMapRenderer.cityMapRuntimeLayerRedraw();
        },

        saboteurPlacementRequested: this.launchData.onHurdleRequested
          ? (hurdleType, tilePointList) => {
              // this sends the placement to the backend, the hurdle shows when the next state arrives
              this.launchData.onHurdleRequested?.(hurdleType, tilePointList);
              this.cityMapRenderer.cityMapRuntimeLayerRedraw();
            }
          : undefined,

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

    // this removes the dom debug panel when the scene stops so it does not outlive the match page
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.debugTextOverlay.debugTextClear());
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