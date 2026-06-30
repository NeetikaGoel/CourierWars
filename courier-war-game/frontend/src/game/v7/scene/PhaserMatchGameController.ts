// this file lets normal page code start and stop the Phaser match scene

import Phaser from "phaser";
import { phaserGameConfig } from "../config/PhaserGameConfig";
import { debugDisplayConfig } from "../config/DebugDisplayConfig";
import { MatchGameScene } from "./MatchGameScene";
import type { MatchGameSceneLaunchData, MatchGameSceneMatchApi } from "./SceneLaunchDataType";
import type { BackendCityMapPayload } from "../types/BackendCityMapPayloadType";
import type { BackendMatchStateResponse } from "../../../common/apiType/MatchApiType";

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

  // this stores backend gameplay api
  matchApi: MatchGameSceneMatchApi;

  // this runs when backend accepts a state from a Phaser action
  onStateAccepted?: (matchState: BackendMatchStateResponse) => void;

  // this runs when backend rejects a Phaser action
  onActionRejected?: (message: string) => void;

  // this runs when courier reaches delivery tile
  onCourierDelivered?: (matchId?: string | number) => void;
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
      matchApi: payload.matchApi,
      onStateAccepted: payload.onStateAccepted,
      onActionRejected: payload.onActionRejected,
      onCourierDelivered: payload.onCourierDelivered,
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

    // this stores scene instance so polling state can be applied later
    this.matchGameScene = this.game.scene.getScene(phaserGameConfig.scene.key) as MatchGameScene;
  }

  applyState(matchState: unknown): void {
    // this forwards backend polling state to scene
    this.matchGameScene?.matchStateApply(matchState);
  }

  selectSaboteurHurdle(hurdleType: string): void {
    // this lets page hurdle cards update Phaser selected hurdle
    this.matchGameScene?.saboteurHurdleSelect(hurdleType);
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