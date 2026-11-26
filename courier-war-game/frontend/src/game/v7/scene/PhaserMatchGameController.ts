// this file lets normal page code start and stop the Phaser match scene

import Phaser from "phaser";
import { phaserGameConfig } from "../config/PhaserGameConfig";
import { debugDisplayConfig } from "../config/DebugDisplayConfig";
import { MatchGameScene } from "./MatchGameScene";
import type { MatchGameSceneLaunchData } from "./SceneLaunchDataType";
import type { BackendCityMapPayload } from "../types/BackendCityMapPayloadType";

export interface PhaserMatchGameControllerStartPayload {
  // this is the html element where Phaser canvas should mount
  container: HTMLElement;

  // this is the page hud element kept for later use
  hud: HTMLElement;

  // this stores match id for future actions
  matchId: number | string;

  // this stores backend map payload
  mapPayload: unknown;

  // this stores initial backend match state
  matchState: unknown;

  // this runs when courier reaches delivery tile
  onCourierDelivered?: (matchId?: string | number) => void;

  // this runs after each courier tile step in an online match
  onCourierStep?: (step: { x: number; y: number; lives: number }) => void;

  // this runs when the saboteur confirms a hurdle placement in an online match
  onHurdleRequested?: (hurdleType: string, tilePointList: { x: number; y: number }[]) => void;

  // this runs when the saboteur selects a hurdle on the keyboard
  onHurdleSelected?: (hurdleType: string) => void;

  // this runs with feedback about a tile pick or a refused placement
  onPlacementFeedback?: (message: string, valid: boolean) => void;
}

export class PhaserMatchGameController {
  // this stores the Phaser game instance
  private game: Phaser.Game | null = null;

  // this stores the active match scene instance
  private matchGameScene: MatchGameScene | null = null;

  start(payload: PhaserMatchGameControllerStartPayload): void {
    // this clears any previous game before starting a new one
    this.stop();

    // this makes sure Phaser parent id matches config
    payload.container.id = phaserGameConfig.canvas.parentElementId;

    // this calculates debug side panel width only when debug panel is visible
    const debugSidePanelWidthPixels = debugDisplayConfig.sidePanel.visible
      ? debugDisplayConfig.sidePanel.widthPixels
      : 0;

    // this uses container width first and falls back to window width
    const canvasWidth = phaserGameConfig.canvas.windowSizeEnabled
      ? Math.max(640, payload.container.clientWidth || window.innerWidth - debugSidePanelWidthPixels)
      : phaserGameConfig.canvas.widthPixelsDefault;

    // this uses container height first and falls back to window height
    const canvasHeight = phaserGameConfig.canvas.windowSizeEnabled
      ? Math.max(480, payload.container.clientHeight || window.innerHeight)
      : phaserGameConfig.canvas.heightPixelsDefault;

    // this prepares scene launch data
    const sceneLaunchData: MatchGameSceneLaunchData = {
      mapPayload: payload.mapPayload as BackendCityMapPayload,
      matchId: payload.matchId,
      matchState: payload.matchState,
      assignedRole: this.assignedRoleFromMatchStateGet(payload.matchState),
      onCourierDelivered: payload.onCourierDelivered,
      onCourierStep: payload.onCourierStep,
      onHurdleRequested: payload.onHurdleRequested,
      onHurdleSelected: payload.onHurdleSelected,
      onPlacementFeedback: payload.onPlacementFeedback,
    };

    // this creates Phaser game without auto starting a scene
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: phaserGameConfig.canvas.backgroundColorHex,
      parent: phaserGameConfig.canvas.parentElementId,
      scene: [],
    });

    // this adds and starts match scene with backend map payload
    this.game.scene.add(phaserGameConfig.scene.key, MatchGameScene, true, sceneLaunchData);

    // the scene instance does not exist until Phaser boots on the next frame, sceneGet looks it up lazily
    this.matchGameScene = null;
  }

  private sceneGet(): MatchGameScene | null {
    if (!this.matchGameScene && this.game) {
      this.matchGameScene = (this.game.scene.getScene(phaserGameConfig.scene.key) as MatchGameScene | null) ?? null;
    }

    return this.matchGameScene;
  }

  applyState(matchState: unknown, serverClockOffsetMs = 0): void {
    // this forwards backend polling state to scene
    this.sceneGet()?.matchStateApply(matchState, serverClockOffsetMs);
  }

  hurdleSelect(hurdleType: string): void {
    // this selects a hurdle from the page deck
    this.sceneGet()?.saboteurHurdleSelect(hurdleType);
  }

  hurdleActivate(): void {
    // this places the selected hurdle on the selected tile from the Activate Hurdle button
    this.sceneGet()?.saboteurHurdleActivate();
  }

  courierPositionReset(tileX: number, tileY: number): void {
    // this snaps the courier back after the backend rejected a step
    this.sceneGet()?.courierPositionReset(tileX, tileY);
  }

  stop(): void {
    // this destroys existing Phaser game when page unmounts
    if (this.game) {
      this.game.destroy(true);
    }

    // this clears references after destroy
    this.game = null;
    this.matchGameScene = null;
  }

  private assignedRoleFromMatchStateGet(matchState: unknown): string | undefined {
    // this handles missing match state safely
    if (!matchState || typeof matchState !== "object") {
      return undefined;
    }

    // this reads assignedRole from loose backend state
    const stateRecord = matchState as Record<string, unknown>;

    // this returns role only when it is a string
    return typeof stateRecord.assignedRole === "string" ? stateRecord.assignedRole : undefined;
  }
}