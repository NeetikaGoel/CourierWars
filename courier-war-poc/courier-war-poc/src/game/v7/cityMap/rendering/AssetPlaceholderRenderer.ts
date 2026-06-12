// Imports Phaser graphics type
import Phaser from "phaser";

// Imports asset display configuration
import { mapAssetDisplayConfig } from "../../config/MapAssetDisplayConfig";

// Imports visual configuration
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports color converter
import { phaserColorNumberFromHexGet } from "../../utility/PhaserColorConverter";

// Imports isometric center helper
import { isometricTileCenterWorldPointGet } from "../../iso/IsometricCoordinateCalculator";

// Imports generated city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports terrain type
import { CityTileTerrainType } from "../../types/CityTileType";

// Imports active hurdle type
import { SaboteurHurdleType, type SaboteurHurdleActive } from "../../types/SaboteurHurdleType";

// Draws temporary placeholder assets using Phaser graphics
export class AssetPlaceholderRenderer {
  // Stores Phaser graphics object
  private readonly graphics: Phaser.GameObjects.Graphics;

  // Creates placeholder asset renderer
  constructor(graphics: Phaser.GameObjects.Graphics) {
    // Stores graphics reference
    this.graphics = graphics;
  }

  // Draws building placeholder when enabled
  assetPlaceholderBuildingDraw(cityTile: CityTile): void {
    // Stops when placeholder assets are disabled
    if (!mapAssetDisplayConfig.placeholder.buildingEnabled) {
      // Ends building placeholder draw
      return;
    }

    // Stops when tile is not building terrain
    if (cityTile.terrainType !== CityTileTerrainType.Building) {
      // Ends building placeholder draw
      return;
    }

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores building color
    const buildingColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.terrain.buildingColorHex);

    // Sets fill style for small building placeholder
    this.graphics.fillStyle(buildingColorNumber, 0.55);

    // Draws simple building block placeholder
    this.graphics.fillRect(tileCenter.x - 4, tileCenter.y - 14, 8, 12);
  }

  // Draws traffic signal placeholder
  assetPlaceholderTrafficSignalDraw(cityTile: CityTile, signalRed: boolean): void {
    // Stops when traffic signal placeholders are disabled
    if (!mapAssetDisplayConfig.placeholder.trafficSignalEnabled) {
      // Ends traffic signal placeholder draw
      return;
    }

    // Stores color based on signal state
    const signalColorHex = signalRed
      ? cityMapVisualConfig.feature.trafficSignalRedColorHex
      : cityMapVisualConfig.feature.trafficSignalGreenColorHex;

    // Stores signal color number
    const signalColorNumber = phaserColorNumberFromHexGet(signalColorHex);

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Sets line style for signal placeholder
    this.graphics.lineStyle(2, signalColorNumber, 1);

    // Draws signal pole placeholder
    this.graphics.lineBetween(tileCenter.x + 5, tileCenter.y - 12, tileCenter.x + 5, tileCenter.y);

    // Sets fill style for signal placeholder
    this.graphics.fillStyle(signalColorNumber, 1);

    // Draws signal light placeholder
    this.graphics.fillCircle(tileCenter.x + 5, tileCenter.y - 14, 3);
  }

  // Draws tunnel entrance placeholder
  assetPlaceholderTunnelEntranceDraw(cityTile: CityTile): void {
    // Stops when tunnel placeholders are disabled
    if (!mapAssetDisplayConfig.placeholder.tunnelEntranceEnabled) {
      // Ends tunnel placeholder draw
      return;
    }

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores tunnel color number
    const tunnelColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.tunnelEntranceColorHex);

    // Sets line style for tunnel placeholder
    this.graphics.lineStyle(2, tunnelColorNumber, 1);

    // Draws tunnel entrance placeholder
    this.graphics.strokeRoundedRect(tileCenter.x - 6, tileCenter.y - 8, 12, 10, 5);
  }

  // Draws bridge placeholder
  assetPlaceholderBridgeDraw(cityTile: CityTile): void {
    // Stops when bridge placeholders are disabled
    if (!mapAssetDisplayConfig.placeholder.bridgeEnabled) {
      // Ends bridge placeholder draw
      return;
    }

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores bridge color number
    const bridgeColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.road.bridgeColorHex);

    // Sets line style for bridge placeholder
    this.graphics.lineStyle(2, bridgeColorNumber, 0.95);

    // Draws bridge rail placeholder
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y - 3, tileCenter.x + 8, tileCenter.y - 3);

    // Draws second bridge rail placeholder
    this.graphics.lineBetween(tileCenter.x - 8, tileCenter.y + 3, tileCenter.x + 8, tileCenter.y + 3);
  }

  // Draws shortcut entrance placeholder
  assetPlaceholderShortcutDraw(cityTile: CityTile): void {
    // Stops when shortcut placeholders are disabled
    if (!mapAssetDisplayConfig.placeholder.shortcutEntranceEnabled) {
      // Ends shortcut placeholder draw
      return;
    }

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Stores shortcut color number
    const shortcutColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.feature.shortcutEntranceColorHex);

    // Sets fill style for shortcut placeholder
    this.graphics.fillStyle(shortcutColorNumber, 0.95);

    // Draws shortcut marker placeholder
    this.graphics.fillTriangle(
      tileCenter.x,
      tileCenter.y - 6,
      tileCenter.x - 5,
      tileCenter.y + 3,
      tileCenter.x + 5,
      tileCenter.y + 3
    );
  }

  // Draws active hurdle placeholder
  assetPlaceholderHurdleDraw(activeHurdle: SaboteurHurdleActive): void {
    // Stops when hurdle placeholders are disabled
    if (!mapAssetDisplayConfig.placeholder.hurdleEnabled) {
      // Ends hurdle placeholder draw
      return;
    }

    // Gets hurdle color
    const hurdleColorHex = this.assetPlaceholderHurdleColorHexGet(activeHurdle.hurdleType);

    // Stores hurdle color number
    const hurdleColorNumber = phaserColorNumberFromHexGet(hurdleColorHex);

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet(activeHurdle.tilePoint);

    // Sets fill style for hurdle placeholder
    this.graphics.fillStyle(hurdleColorNumber, 0.95);

    // Draws hurdle icon square
    this.graphics.fillRect(tileCenter.x - 5, tileCenter.y - 9, 10, 10);

    // Sets outline style
    this.graphics.lineStyle(1, phaserColorNumberFromHexGet("#ffffff"), 0.9);

    // Draws hurdle icon outline
    this.graphics.strokeRect(tileCenter.x - 5, tileCenter.y - 9, 10, 10);
  }

  // Gets placeholder color for hurdle type
  private assetPlaceholderHurdleColorHexGet(hurdleType: SaboteurHurdleType): string {
    // Returns road block color
    if (hurdleType === SaboteurHurdleType.RoadBlock) {
      // Returns road block color
      return cityMapVisualConfig.hurdle.roadBlockColorHex;
    }

    // Returns construction work color
    if (hurdleType === SaboteurHurdleType.ConstructionWork) {
      // Returns construction work color
      return cityMapVisualConfig.hurdle.constructionWorkColorHex;
    }

    // Returns traffic jam color
    if (hurdleType === SaboteurHurdleType.TrafficJam) {
      // Returns traffic jam color
      return cityMapVisualConfig.hurdle.trafficJamColorHex;
    }

    // Returns closed gate color
    if (hurdleType === SaboteurHurdleType.ClosedGate) {
      // Returns closed gate color
      return cityMapVisualConfig.hurdle.closedGateColorHex;
    }

    // Returns wrong direction sign color
    if (hurdleType === SaboteurHurdleType.WrongDirectionSign) {
      // Returns wrong direction sign color
      return cityMapVisualConfig.hurdle.wrongDirectionSignColorHex;
    }

    // Returns broken road color
    if (hurdleType === SaboteurHurdleType.BrokenRoad) {
      // Returns broken road color
      return cityMapVisualConfig.hurdle.brokenRoadColorHex;
    }

    // Returns moving barrier color
    if (hurdleType === SaboteurHurdleType.MovingBarrier) {
      // Returns moving barrier color
      return cityMapVisualConfig.hurdle.movingBarrierColorHex;
    }

    // Returns security checkpoint color
    if (hurdleType === SaboteurHurdleType.SecurityCheckpoint) {
      // Returns security checkpoint color
      return cityMapVisualConfig.hurdle.securityCheckpointColorHex;
    }

    // Returns active hurdle fallback color
    return cityMapVisualConfig.hurdle.activeOutlineColorHex;
  }
}