// Imports Phaser graphics type
import Phaser from "phaser";

// Imports V8 visual configuration for feature colors
import { cityMapVisualConfig } from "../config/CityMapVisualConfig";

// Imports Phaser color converter
import { phaserColorNumberFromHexGet } from "../../v7/utility/PhaserColorConverter";

// Imports isometric center helper
import { isometricTileCenterWorldPointGet } from "../../v7/iso/IsometricCoordinateCalculator";

// Imports generated city tile type
import type { CityTile } from "../../v7/types/CityMapType";

// Imports tile feature values
import { CityTileFeatureKind } from "../../v7/types/CityTileType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../v7/types/MatchRuntimeStateType";

// Imports traffic signal state values
import { TrafficSignalStateName } from "../../v7/types/TrafficSignalType";

// Draws V8 tile features such as start delivery traffic signals and route entrances
export class TileFeatureRenderer {
  // Stores Phaser graphics object
  private readonly graphics: Phaser.GameObjects.Graphics;

  // Creates tile feature renderer
  constructor(graphics: Phaser.GameObjects.Graphics) {
    // Stores graphics reference
    this.graphics = graphics;
  }

  // Draws all features for one city tile
  tileFeatureDraw(cityTile: CityTile, matchPrototypeState: MatchPrototypeStateShape): void {
    // Draws start marker
    if (cityTile.start) {
      this.tileFeatureStartDraw(cityTile);
    }

    // Draws delivery marker
    if (cityTile.delivery) {
      this.tileFeatureDeliveryDraw(cityTile);
    }

    // Draws traffic signal
    if (cityTile.featureKindList.includes(CityTileFeatureKind.TrafficSignal)) {
      this.tileFeatureTrafficSignalDraw(cityTile, matchPrototypeState);
    }

    // Draws tunnel entrance
    if (cityTile.featureKindList.includes(CityTileFeatureKind.TunnelEntrance)) {
      this.tileFeatureTunnelEntranceDraw(cityTile);
    }

    // Draws shortcut entrance
    if (cityTile.featureKindList.includes(CityTileFeatureKind.ShortcutEntrance)) {
      this.tileFeatureShortcutEntranceDraw(cityTile);
    }

    // Draws bridge entrance
    if (cityTile.featureKindList.includes(CityTileFeatureKind.BridgeEntrance)) {
      this.tileFeatureBridgeEntranceDraw(cityTile);
    }
  }

  // Draws Courier start marker
  private tileFeatureStartDraw(cityTile: CityTile): void {
    // Stores tile center
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores colors
    const startColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.startMarkerColorHex);
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    // Draws soft start glow
    this.graphics.fillStyle(startColorNumber, 0.22);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 8, 15);

    // Draws start marker body
    this.graphics.lineStyle(3, outlineColorNumber, 0.95);
    this.graphics.fillStyle(startColorNumber, 1);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 10, 8);
    this.graphics.strokeCircle(tileCenter.x, tileCenter.y - 10, 8);

    // Draws marker stem
    this.graphics.lineStyle(2, startColorNumber, 0.9);
    this.graphics.lineBetween(tileCenter.x, tileCenter.y - 1, tileCenter.x, tileCenter.y + 9);
  }

  // Draws delivery marker
  private tileFeatureDeliveryDraw(cityTile: CityTile): void {
    // Stores tile center
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores colors
    const deliveryColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.deliveryMarkerColorHex);
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    // Draws delivery glow
    this.graphics.fillStyle(deliveryColorNumber, 0.2);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 7, 16);

    // Draws flag
    this.graphics.fillStyle(deliveryColorNumber, 1);
    this.graphics.fillTriangle(
      tileCenter.x - 7,
      tileCenter.y - 22,
      tileCenter.x + 11,
      tileCenter.y - 15,
      tileCenter.x - 7,
      tileCenter.y - 8
    );

    // Draws flag outline
    this.graphics.lineStyle(2, outlineColorNumber, 0.95);
    this.graphics.strokeTriangle(
      tileCenter.x - 7,
      tileCenter.y - 22,
      tileCenter.x + 11,
      tileCenter.y - 15,
      tileCenter.x - 7,
      tileCenter.y - 8
    );

    // Draws flag pole
    this.graphics.lineStyle(3, outlineColorNumber, 0.9);
    this.graphics.lineBetween(tileCenter.x - 7, tileCenter.y - 22, tileCenter.x - 7, tileCenter.y + 8);
  }

  // Draws traffic signal using green or red runtime state
  private tileFeatureTrafficSignalDraw(cityTile: CityTile, matchPrototypeState: MatchPrototypeStateShape): void {
    // Stops when tile has no signal id
    if (!cityTile.trafficSignalId) {
      return;
    }

    // Stores traffic signal runtime state
    const trafficSignalState = matchPrototypeState.trafficSignalStateById[cityTile.trafficSignalId];

    // Stores whether signal is red
    const signalRed = trafficSignalState?.stateName === TrafficSignalStateName.Red;

    // Stores signal color
    const signalColorHex = signalRed
      ? cityMapVisualConfig.feature.trafficSignalRedColorHex
      : cityMapVisualConfig.feature.trafficSignalGreenColorHex;

    // Stores signal color number
    const signalColorNumber = phaserColorNumberFromHexGet(signalColorHex);

    // Stores pole color number
    const poleColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.trafficSignalPoleColorHex);

    // Stores tile center
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Draws signal glow
    this.graphics.fillStyle(signalColorNumber, 0.18);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 11, 10);

    // Draws signal pole
    this.graphics.lineStyle(2, poleColorNumber, 0.82);
    this.graphics.lineBetween(tileCenter.x + 4, tileCenter.y - 5, tileCenter.x + 4, tileCenter.y + 5);

    // Draws signal body
    this.graphics.fillStyle(signalColorNumber, 1);
    this.graphics.fillRoundedRect(tileCenter.x - 1, tileCenter.y - 20, 10, 15, 3);

    // Draws signal body outline
    this.graphics.lineStyle(1, poleColorNumber, 0.9);
    this.graphics.strokeRoundedRect(tileCenter.x - 1, tileCenter.y - 20, 10, 15, 3);

    // Draws three dark lenses
    this.graphics.fillStyle(0x061016, 0.9);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 16, 2);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 12, 2);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 8, 2);

    // Draws active lens
    this.graphics.fillStyle(signalColorNumber, 1);
    this.graphics.fillCircle(tileCenter.x + 4, signalRed ? tileCenter.y - 16 : tileCenter.y - 8, 2.4);
  }

  // Draws tunnel entrance hint
  private tileFeatureTunnelEntranceDraw(cityTile: CityTile): void {
    // Stores tile center
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores tunnel color
    const tunnelColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.tunnelEntranceColorHex);

    // Draws tunnel glow
    this.graphics.fillStyle(tunnelColorNumber, 0.18);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 4, 12);

    // Draws tunnel arch
    this.graphics.lineStyle(3, tunnelColorNumber, 0.95);
    this.graphics.strokeRoundedRect(tileCenter.x - 8, tileCenter.y - 13, 16, 13, 7);

    // Draws tunnel floor line
    this.graphics.lineStyle(2, tunnelColorNumber, 0.55);
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y - 1, tileCenter.x + 8, tileCenter.y - 1);
  }

  // Draws shortcut entrance hint
  private tileFeatureShortcutEntranceDraw(cityTile: CityTile): void {
    // Stores tile center
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores shortcut color
    const shortcutColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.shortcutEntranceColorHex);

    // Draws shortcut glow
    this.graphics.fillStyle(shortcutColorNumber, 0.2);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 3, 10);

    // Draws shortcut marker
    this.graphics.fillStyle(shortcutColorNumber, 0.95);
    this.graphics.fillTriangle(
      tileCenter.x,
      tileCenter.y - 10,
      tileCenter.x - 7,
      tileCenter.y + 4,
      tileCenter.x + 7,
      tileCenter.y + 4
    );

    // Draws shortcut marker outline
    this.graphics.lineStyle(1, phaserColorNumberFromHexGet("#ffffff"), 0.75);
    this.graphics.strokeTriangle(
      tileCenter.x,
      tileCenter.y - 10,
      tileCenter.x - 7,
      tileCenter.y + 4,
      tileCenter.x + 7,
      tileCenter.y + 4
    );
  }

  // Draws bridge entrance hint
  private tileFeatureBridgeEntranceDraw(cityTile: CityTile): void {
    // Stores tile center
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores bridge color
    const bridgeColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.bridgeEntranceColorHex);

    // Draws bridge rails
    this.graphics.lineStyle(3, bridgeColorNumber, 0.95);
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y - 4, tileCenter.x + 8, tileCenter.y - 4);
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y + 4, tileCenter.x + 8, tileCenter.y + 4);

    // Draws bridge entrance glow
    this.graphics.fillStyle(bridgeColorNumber, 0.28);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y, 8);
  }
}
