// Imports Phaser graphics type
import Phaser from "phaser";

// Imports visual configuration for feature colors
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports Phaser color converter
import { phaserColorNumberFromHexGet } from "../../utility/PhaserColorConverter";

// Imports isometric center helper
import { isometricTileCenterWorldPointGet } from "../../iso/IsometricCoordinateCalculator";

// Imports generated city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports tile feature values
import { CityTileFeatureKind } from "../../types/CityTileType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports traffic signal state values
import { TrafficSignalStateName } from "../../types/TrafficSignalType";

// Draws tile features such as start delivery traffic signals and route entrances
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
    if (cityTile.start) {
      this.tileFeatureStartDraw(cityTile);
    }

    if (cityTile.delivery) {
      this.tileFeatureDeliveryDraw(cityTile);
    }

    if (cityTile.featureKindList.includes(CityTileFeatureKind.TrafficSignal)) {
      this.tileFeatureTrafficSignalDraw(cityTile, matchPrototypeState);
    }

    if (cityTile.featureKindList.includes(CityTileFeatureKind.TunnelEntrance)) {
      this.tileFeatureTunnelEntranceDraw(cityTile);
    }

    if (cityTile.featureKindList.includes(CityTileFeatureKind.ShortcutEntrance)) {
      this.tileFeatureShortcutEntranceDraw(cityTile);
    }

    if (cityTile.featureKindList.includes(CityTileFeatureKind.BridgeEntrance)) {
      this.tileFeatureBridgeEntranceDraw(cityTile);
    }
  }

  // Draws Courier start marker
  tileFeatureStartDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({
      x: cityTile.x,
      y: cityTile.y,
    });

    const startColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.startMarkerColorHex);
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    this.graphics.fillStyle(startColorNumber, 0.22);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 8, 15);

    this.graphics.lineStyle(3, outlineColorNumber, 0.95);
    this.graphics.fillStyle(startColorNumber, 1);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 10, 8);
    this.graphics.strokeCircle(tileCenter.x, tileCenter.y - 10, 8);

    this.graphics.lineStyle(2, startColorNumber, 0.9);
    this.graphics.lineBetween(tileCenter.x, tileCenter.y - 1, tileCenter.x, tileCenter.y + 9);
  }

  // Draws delivery marker
  tileFeatureDeliveryDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({
      x: cityTile.x,
      y: cityTile.y,
    });

    const deliveryColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.deliveryMarkerColorHex);
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    this.graphics.fillStyle(deliveryColorNumber, 0.2);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 7, 16);

    this.graphics.fillStyle(deliveryColorNumber, 1);
    this.graphics.fillTriangle(
      tileCenter.x - 7,
      tileCenter.y - 22,
      tileCenter.x + 11,
      tileCenter.y - 15,
      tileCenter.x - 7,
      tileCenter.y - 8
    );

    this.graphics.lineStyle(2, outlineColorNumber, 0.95);
    this.graphics.strokeTriangle(
      tileCenter.x - 7,
      tileCenter.y - 22,
      tileCenter.x + 11,
      tileCenter.y - 15,
      tileCenter.x - 7,
      tileCenter.y - 8
    );

    this.graphics.lineStyle(3, outlineColorNumber, 0.9);
    this.graphics.lineBetween(tileCenter.x - 7, tileCenter.y - 22, tileCenter.x - 7, tileCenter.y + 8);
  }

  // Draws traffic signal using green or red runtime state
  tileFeatureTrafficSignalDraw(cityTile: CityTile, matchPrototypeState: MatchPrototypeStateShape): void {
    if (!cityTile.trafficSignalId) {
      return;
    }

    const trafficSignalState = matchPrototypeState.trafficSignalStateById[cityTile.trafficSignalId];
    const signalRed = trafficSignalState?.stateName === TrafficSignalStateName.Red;

    const signalColorHex = signalRed
      ? cityMapVisualConfig.feature.trafficSignalRedColorHex
      : cityMapVisualConfig.feature.trafficSignalGreenColorHex;

    const signalColorNumber = phaserColorNumberFromHexGet(signalColorHex);
    const poleColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.trafficSignalPoleColorHex);

    const tileCenter = isometricTileCenterWorldPointGet({
      x: cityTile.x,
      y: cityTile.y,
    });

    this.graphics.fillStyle(signalColorNumber, 0.18);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 11, 10);

    this.graphics.lineStyle(2, poleColorNumber, 0.82);
    this.graphics.lineBetween(tileCenter.x + 4, tileCenter.y - 5, tileCenter.x + 4, tileCenter.y + 5);

    this.graphics.fillStyle(signalColorNumber, 1);
    this.graphics.fillRoundedRect(tileCenter.x - 1, tileCenter.y - 20, 10, 15, 3);

    this.graphics.lineStyle(1, poleColorNumber, 0.9);
    this.graphics.strokeRoundedRect(tileCenter.x - 1, tileCenter.y - 20, 10, 15, 3);

    this.graphics.fillStyle(0x061016, 0.9);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 16, 2);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 12, 2);
    this.graphics.fillCircle(tileCenter.x + 4, tileCenter.y - 8, 2);

    this.graphics.fillStyle(signalColorNumber, 1);
    this.graphics.fillCircle(tileCenter.x + 4, signalRed ? tileCenter.y - 16 : tileCenter.y - 8, 2.4);
  }

  // Draws tunnel entrance hint
  tileFeatureTunnelEntranceDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });
    const tunnelColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.tunnelEntranceColorHex);

    this.graphics.fillStyle(tunnelColorNumber, 0.18);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 4, 12);

    this.graphics.lineStyle(3, tunnelColorNumber, 0.95);
    this.graphics.strokeRoundedRect(tileCenter.x - 8, tileCenter.y - 13, 16, 13, 7);

    this.graphics.lineStyle(2, tunnelColorNumber, 0.55);
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y - 1, tileCenter.x + 8, tileCenter.y - 1);
  }

  // Draws shortcut entrance hint
  tileFeatureShortcutEntranceDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });
    const shortcutColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.shortcutEntranceColorHex);

    this.graphics.fillStyle(shortcutColorNumber, 0.2);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 3, 10);

    this.graphics.fillStyle(shortcutColorNumber, 0.95);
    this.graphics.fillTriangle(
      tileCenter.x,
      tileCenter.y - 10,
      tileCenter.x - 7,
      tileCenter.y + 4,
      tileCenter.x + 7,
      tileCenter.y + 4
    );

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
  tileFeatureBridgeEntranceDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });
    const bridgeColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.bridgeEntranceColorHex);

    this.graphics.lineStyle(3, bridgeColorNumber, 0.95);
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y - 4, tileCenter.x + 8, tileCenter.y - 4);
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y + 4, tileCenter.x + 8, tileCenter.y + 4);

    this.graphics.fillStyle(bridgeColorNumber, 0.28);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y, 8);
  }
}