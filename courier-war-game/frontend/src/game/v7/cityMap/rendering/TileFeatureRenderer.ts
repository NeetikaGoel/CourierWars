// Imports Phaser graphics type
import Phaser from "phaser";

// Imports visual configuration for feature colors
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports feature renderer geometry configuration
import { tileFeatureRenderConfig } from "../../config/TileFeatureRenderConfig";

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

    const config = tileFeatureRenderConfig.startMarker;
    const startColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.startMarkerColorHex);
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    this.graphics.fillStyle(startColorNumber, config.glowAlpha);
    this.graphics.fillCircle(
      tileCenter.x,
      tileCenter.y + config.glowYOffsetPixels,
      config.glowRadiusPixels
    );

    this.graphics.lineStyle(config.coreOutlineWidthPixels, outlineColorNumber, config.coreOutlineAlpha);
    this.graphics.fillStyle(startColorNumber, config.coreAlpha);
    this.graphics.fillCircle(
      tileCenter.x,
      tileCenter.y + config.coreYOffsetPixels,
      config.coreRadiusPixels
    );
    this.graphics.strokeCircle(
      tileCenter.x,
      tileCenter.y + config.coreYOffsetPixels,
      config.coreRadiusPixels
    );

    this.graphics.lineStyle(config.stemLineWidthPixels, startColorNumber, config.stemAlpha);
    this.graphics.lineBetween(
      tileCenter.x,
      tileCenter.y + config.stemStartYOffsetPixels,
      tileCenter.x,
      tileCenter.y + config.stemEndYOffsetPixels
    );
  }

  // Draws delivery marker
  tileFeatureDeliveryDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({
      x: cityTile.x,
      y: cityTile.y,
    });

    const config = tileFeatureRenderConfig.deliveryMarker;
    const deliveryColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.deliveryMarkerColorHex);
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.markerOutlineColorHex);

    this.graphics.fillStyle(deliveryColorNumber, config.glowAlpha);
    this.graphics.fillCircle(
      tileCenter.x,
      tileCenter.y + config.glowYOffsetPixels,
      config.glowRadiusPixels
    );

    this.graphics.fillStyle(deliveryColorNumber, config.flagAlpha);
    this.graphics.fillTriangle(
      tileCenter.x + config.flagPointA.xOffsetPixels,
      tileCenter.y + config.flagPointA.yOffsetPixels,
      tileCenter.x + config.flagPointB.xOffsetPixels,
      tileCenter.y + config.flagPointB.yOffsetPixels,
      tileCenter.x + config.flagPointC.xOffsetPixels,
      tileCenter.y + config.flagPointC.yOffsetPixels
    );

    this.graphics.lineStyle(config.flagOutlineWidthPixels, outlineColorNumber, config.flagOutlineAlpha);
    this.graphics.strokeTriangle(
      tileCenter.x + config.flagPointA.xOffsetPixels,
      tileCenter.y + config.flagPointA.yOffsetPixels,
      tileCenter.x + config.flagPointB.xOffsetPixels,
      tileCenter.y + config.flagPointB.yOffsetPixels,
      tileCenter.x + config.flagPointC.xOffsetPixels,
      tileCenter.y + config.flagPointC.yOffsetPixels
    );

    this.graphics.lineStyle(config.poleLineWidthPixels, outlineColorNumber, config.poleAlpha);
    this.graphics.lineBetween(
      tileCenter.x + config.poleXOffsetPixels,
      tileCenter.y + config.poleStartYOffsetPixels,
      tileCenter.x + config.poleXOffsetPixels,
      tileCenter.y + config.poleEndYOffsetPixels
    );
  }

  // Draws traffic signal using green or red runtime state
  tileFeatureTrafficSignalDraw(cityTile: CityTile, matchPrototypeState: MatchPrototypeStateShape): void {
    if (!cityTile.trafficSignalId) {
      return;
    }

    const config = tileFeatureRenderConfig.trafficSignal;
    const trafficSignalState = matchPrototypeState.trafficSignalStateById[cityTile.trafficSignalId];
    const signalRed = trafficSignalState?.stateName === TrafficSignalStateName.Red;

    const signalColorHex = signalRed
      ? cityMapVisualConfig.feature.trafficSignalRedColorHex
      : cityMapVisualConfig.feature.trafficSignalGreenColorHex;

    const signalColorNumber = phaserColorNumberFromHexGet(signalColorHex);
    const poleColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.trafficSignalPoleColorHex);
    const lensInactiveColorNumber = phaserColorNumberFromHexGet(config.lensInactiveColorHex);

    const tileCenter = isometricTileCenterWorldPointGet({
      x: cityTile.x,
      y: cityTile.y,
    });

    const signalX = tileCenter.x + config.xOffsetPixels;

    this.graphics.fillStyle(signalColorNumber, config.glowAlpha);
    this.graphics.fillCircle(
      signalX,
      tileCenter.y + config.glowYOffsetPixels,
      config.glowRadiusPixels
    );

    this.graphics.lineStyle(config.poleLineWidthPixels, poleColorNumber, config.poleAlpha);
    this.graphics.lineBetween(
      signalX,
      tileCenter.y + config.poleTopYOffsetPixels,
      signalX,
      tileCenter.y + config.poleBottomYOffsetPixels
    );

    this.graphics.fillStyle(signalColorNumber, config.bodyAlpha);
    this.graphics.fillRoundedRect(
      tileCenter.x + config.bodyXOffsetPixels,
      tileCenter.y + config.bodyYOffsetPixels,
      config.bodyWidthPixels,
      config.bodyHeightPixels,
      config.bodyRadiusPixels
    );

    this.graphics.lineStyle(config.bodyOutlineWidthPixels, poleColorNumber, config.bodyOutlineAlpha);
    this.graphics.strokeRoundedRect(
      tileCenter.x + config.bodyXOffsetPixels,
      tileCenter.y + config.bodyYOffsetPixels,
      config.bodyWidthPixels,
      config.bodyHeightPixels,
      config.bodyRadiusPixels
    );

    this.graphics.fillStyle(lensInactiveColorNumber, config.lensInactiveAlpha);

    config.lensYOffsetListPixels.forEach((lensYOffsetPixels) => {
      this.graphics.fillCircle(signalX, tileCenter.y + lensYOffsetPixels, config.lensRadiusPixels);
    });

    const activeLensIndex = signalRed ? config.redLensIndex : config.greenLensIndex;
    const activeLensYOffsetPixels = config.lensYOffsetListPixels[activeLensIndex];

    this.graphics.fillStyle(signalColorNumber, config.bodyAlpha);
    this.graphics.fillCircle(
      signalX,
      tileCenter.y + activeLensYOffsetPixels,
      config.activeLensRadiusPixels
    );
  }

  // Draws tunnel entrance hint
  tileFeatureTunnelEntranceDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });
    const config = tileFeatureRenderConfig.tunnelEntrance;
    const tunnelColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.tunnelEntranceColorHex);

    this.graphics.fillStyle(tunnelColorNumber, config.glowAlpha);
    this.graphics.fillCircle(
      tileCenter.x,
      tileCenter.y + config.glowYOffsetPixels,
      config.glowRadiusPixels
    );

    this.graphics.lineStyle(config.archLineWidthPixels, tunnelColorNumber, config.archAlpha);
    this.graphics.strokeRoundedRect(
      tileCenter.x + config.archXOffsetPixels,
      tileCenter.y + config.archYOffsetPixels,
      config.archWidthPixels,
      config.archHeightPixels,
      config.archRadiusPixels
    );

    this.graphics.lineStyle(config.baseLineWidthPixels, tunnelColorNumber, config.baseLineAlpha);
    this.graphics.lineBetween(
      tileCenter.x + config.baseLineLeftXOffsetPixels,
      tileCenter.y + config.baseLineYOffsetPixels,
      tileCenter.x + config.baseLineRightXOffsetPixels,
      tileCenter.y + config.baseLineYOffsetPixels
    );
  }

  // Draws shortcut entrance hint
  tileFeatureShortcutEntranceDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });
    const config = tileFeatureRenderConfig.shortcutEntrance;
    const shortcutColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.shortcutEntranceColorHex);
    const outlineColorNumber = phaserColorNumberFromHexGet(config.outlineColorHex);

    this.graphics.fillStyle(shortcutColorNumber, config.glowAlpha);
    this.graphics.fillCircle(
      tileCenter.x,
      tileCenter.y + config.glowYOffsetPixels,
      config.glowRadiusPixels
    );

    this.graphics.fillStyle(shortcutColorNumber, config.triangleAlpha);
    this.graphics.fillTriangle(
      tileCenter.x + config.trianglePointA.xOffsetPixels,
      tileCenter.y + config.trianglePointA.yOffsetPixels,
      tileCenter.x + config.trianglePointB.xOffsetPixels,
      tileCenter.y + config.trianglePointB.yOffsetPixels,
      tileCenter.x + config.trianglePointC.xOffsetPixels,
      tileCenter.y + config.trianglePointC.yOffsetPixels
    );

    this.graphics.lineStyle(config.outlineLineWidthPixels, outlineColorNumber, config.outlineAlpha);
    this.graphics.strokeTriangle(
      tileCenter.x + config.trianglePointA.xOffsetPixels,
      tileCenter.y + config.trianglePointA.yOffsetPixels,
      tileCenter.x + config.trianglePointB.xOffsetPixels,
      tileCenter.y + config.trianglePointB.yOffsetPixels,
      tileCenter.x + config.trianglePointC.xOffsetPixels,
      tileCenter.y + config.trianglePointC.yOffsetPixels
    );
  }

  // Draws bridge entrance hint
  tileFeatureBridgeEntranceDraw(cityTile: CityTile): void {
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });
    const config = tileFeatureRenderConfig.bridgeEntrance;
    const bridgeColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.bridgeEntranceColorHex);

    this.graphics.lineStyle(config.lineWidthPixels, bridgeColorNumber, config.lineAlpha);
    this.graphics.lineBetween(
      tileCenter.x + config.lineLeftXOffsetPixels,
      tileCenter.y + config.topLineYOffsetPixels,
      tileCenter.x + config.lineRightXOffsetPixels,
      tileCenter.y + config.topLineYOffsetPixels
    );
    this.graphics.lineBetween(
      tileCenter.x + config.lineLeftXOffsetPixels,
      tileCenter.y + config.bottomLineYOffsetPixels,
      tileCenter.x + config.lineRightXOffsetPixels,
      tileCenter.y + config.bottomLineYOffsetPixels
    );

    this.graphics.fillStyle(bridgeColorNumber, config.glowAlpha);
    this.graphics.fillCircle(tileCenter.x, tileCenter.y, config.glowRadiusPixels);
  }
}