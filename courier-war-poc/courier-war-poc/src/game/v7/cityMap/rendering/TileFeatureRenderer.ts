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
    // Draws start marker before other small features
    if (cityTile.start) {
      // Draws start marker
      this.tileFeatureStartDraw(cityTile);
    }

    // Draws delivery marker before other small features
    if (cityTile.delivery) {
      // Draws delivery marker
      this.tileFeatureDeliveryDraw(cityTile);
    }

    // Draws traffic signal feature
    if (cityTile.featureKindList.includes(CityTileFeatureKind.TrafficSignal)) {
      // Draws traffic signal marker
      this.tileFeatureTrafficSignalDraw(cityTile, matchPrototypeState);
    }

    // Draws tunnel entrance feature
    if (cityTile.featureKindList.includes(CityTileFeatureKind.TunnelEntrance)) {
      // Draws tunnel entrance hint
      this.tileFeatureTunnelEntranceDraw(cityTile);
    }

    // Draws shortcut entrance feature
    if (cityTile.featureKindList.includes(CityTileFeatureKind.ShortcutEntrance)) {
      // Draws shortcut entrance hint
      this.tileFeatureShortcutEntranceDraw(cityTile);
    }

    // Draws bridge entrance feature
    if (cityTile.featureKindList.includes(CityTileFeatureKind.BridgeEntrance)) {
      // Draws bridge entrance hint
      this.tileFeatureBridgeEntranceDraw(cityTile);
    }
  }

  // Draws Courier start marker
  tileFeatureStartDraw(cityTile: CityTile): void {
    // Stores tile center world point
    const tileCenter = isometricTileCenterWorldPointGet({
      // Stores tile x coordinate
      x: cityTile.x,

      // Stores tile y coordinate
      y: cityTile.y,
    });

    // Stores start color number
    const startColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.startMarkerColorHex);

    // Stores marker outline color number
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    // Sets outline style
    this.graphics.lineStyle(3, outlineColorNumber, 1);

    // Sets fill style
    this.graphics.fillStyle(startColorNumber, 1);

    // Draws start marker circle
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 8, 8);

    // Draws start marker outline
    this.graphics.strokeCircle(tileCenter.x, tileCenter.y - 8, 8);

    // Sets small text marker style using graphics lines
    this.graphics.lineStyle(2, outlineColorNumber, 1);

    // Draws start marker stem
    this.graphics.lineBetween(tileCenter.x, tileCenter.y, tileCenter.x, tileCenter.y + 8);
  }

  // Draws delivery marker
  tileFeatureDeliveryDraw(cityTile: CityTile): void {
    // Stores tile center world point
    const tileCenter = isometricTileCenterWorldPointGet({
      // Stores tile x coordinate
      x: cityTile.x,

      // Stores tile y coordinate
      y: cityTile.y,
    });

    // Stores delivery color number
    const deliveryColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.deliveryMarkerColorHex);

    // Stores marker outline color number
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    // Sets fill style
    this.graphics.fillStyle(deliveryColorNumber, 1);

    // Draws delivery marker flag
    this.graphics.fillTriangle(
      tileCenter.x - 6,
      tileCenter.y - 18,
      tileCenter.x + 8,
      tileCenter.y - 12,
      tileCenter.x - 6,
      tileCenter.y - 6
    );

    // Sets outline style
    this.graphics.lineStyle(2, outlineColorNumber, 1);

    // Draws delivery marker flag outline
    this.graphics.strokeTriangle(
      tileCenter.x - 6,
      tileCenter.y - 18,
      tileCenter.x + 8,
      tileCenter.y - 12,
      tileCenter.x - 6,
      tileCenter.y - 6
    );

    // Draws delivery marker pole
    this.graphics.lineBetween(tileCenter.x - 6, tileCenter.y - 18, tileCenter.x - 6, tileCenter.y + 6);
  }

  // Draws traffic signal using green or red runtime state
  tileFeatureTrafficSignalDraw(cityTile: CityTile, matchPrototypeState: MatchPrototypeStateShape): void {
    // Stops when tile has no signal id
    if (!cityTile.trafficSignalId) {
      // Ends traffic signal draw
      return;
    }

    // Stores runtime signal state
    const trafficSignalState = matchPrototypeState.trafficSignalStateById[cityTile.trafficSignalId];

    // Stores whether signal is red
    const signalRed = trafficSignalState?.stateName === TrafficSignalStateName.Red;

    // Stores signal color
    const signalColorHex = signalRed
      ? cityMapVisualConfig.feature.trafficSignalRedColorHex
      : cityMapVisualConfig.feature.trafficSignalGreenColorHex;

    // Stores signal color number
    const signalColorNumber = phaserColorNumberFromHexGet(signalColorHex);

    // Stores tile center world point
    const tileCenter = isometricTileCenterWorldPointGet({
      // Stores tile x coordinate
      x: cityTile.x,

      // Stores tile y coordinate
      y: cityTile.y,
    });

    // Sets line style for signal pole
    this.graphics.lineStyle(2, signalColorNumber, 1);

    // Draws signal pole
    this.graphics.lineBetween(tileCenter.x, tileCenter.y - 10, tileCenter.x, tileCenter.y - 2);

    // Sets fill style for signal light
    this.graphics.fillStyle(signalColorNumber, 1);

    // Draws signal light circle
    this.graphics.fillCircle(tileCenter.x, tileCenter.y - 12, 3);
  }

  // Draws subtle tunnel entrance hint
  tileFeatureTunnelEntranceDraw(cityTile: CityTile): void {
    // Stores tile center world point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores tunnel color number
    const tunnelColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.tunnelEntranceColorHex);

    // Sets line style for tunnel arch
    this.graphics.lineStyle(2, tunnelColorNumber, 0.9);

    // Draws tunnel arch hint
    this.graphics.strokeCircle(tileCenter.x, tileCenter.y - 3, 5);
  }

  // Draws subtle shortcut entrance hint
  tileFeatureShortcutEntranceDraw(cityTile: CityTile): void {
    // Stores tile center world point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores shortcut color number
    const shortcutColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.shortcutEntranceColorHex);

    // Sets fill style for shortcut hint
    this.graphics.fillStyle(shortcutColorNumber, 0.9);

    // Draws small shortcut dot
    this.graphics.fillCircle(tileCenter.x, tileCenter.y, 3);
  }

  // Draws subtle bridge entrance hint
  tileFeatureBridgeEntranceDraw(cityTile: CityTile): void {
    // Stores tile center world point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores bridge color number
    const bridgeColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.bridgeEntranceColorHex);

    // Sets line style for bridge hint
    this.graphics.lineStyle(2, bridgeColorNumber, 0.9);

    // Draws bridge entrance marker
    this.graphics.lineBetween(tileCenter.x - 5, tileCenter.y, tileCenter.x + 5, tileCenter.y);
  }
}