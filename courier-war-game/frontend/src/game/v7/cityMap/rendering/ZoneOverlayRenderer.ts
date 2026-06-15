// Imports Phaser graphics type
import Phaser from "phaser";

// Imports visual configuration
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports city zone type
import type { CityZone } from "../../types/CityZoneType";

// Imports base tile renderer
import { TileBaseRenderer } from "./TileBaseRenderer";

// Draws current Courier zone and allowed Saboteur zone overlays
export class ZoneOverlayRenderer {
  // Stores base tile renderer
  private readonly tileBaseRenderer: TileBaseRenderer;

  // Creates zone overlay renderer
  constructor(graphics: Phaser.GameObjects.Graphics) {
    // Creates base tile renderer from graphics
    this.tileBaseRenderer = new TileBaseRenderer(graphics);
  }

  // Draws current Courier zone glow
  zoneOverlayCourierCurrentDraw(cityZone: CityZone | undefined): void {
    // Stops when zone is missing
    if (!cityZone) {
      // Ends current zone draw
      return;
    }

    // Draws zone tile fill
    this.zoneOverlayTileFillDraw(
      cityZone,
      cityMapVisualConfig.overlay.courierZoneCurrentColorHex,
      cityMapVisualConfig.alpha.courierZoneCurrent
    );

    // Draws zone boundary
    this.zoneOverlayBoundaryDraw(cityZone, cityMapVisualConfig.overlay.courierZoneCurrentColorHex);
  }

  // Draws allowed Saboteur zones
  zoneOverlaySaboteurAllowedDraw(cityZoneList: CityZone[]): void {
    // Loops through allowed zones
    for (const cityZone of cityZoneList) {
      // Draws allowed zone fill
      this.zoneOverlayTileFillDraw(
        cityZone,
        cityMapVisualConfig.overlay.saboteurZoneAllowedColorHex,
        cityMapVisualConfig.alpha.saboteurZoneAllowed
      );
    }
  }

  // Draws boundary for one zone
  zoneOverlayBoundaryDraw(cityZone: CityZone, colorHex: string): void {
    // Draws top edge tiles
    for (let tileX = cityZone.startX; tileX <= cityZone.endX; tileX++) {
      // Draws top edge outline
      this.tileBaseRenderer.tileDiamondOutlineDraw(
        { x: tileX, y: cityZone.startY },
        colorHex,
        0.9,
        cityMapVisualConfig.line.zoneBoundaryWidth
      );

      // Draws bottom edge outline
      this.tileBaseRenderer.tileDiamondOutlineDraw(
        { x: tileX, y: cityZone.endY },
        colorHex,
        0.9,
        cityMapVisualConfig.line.zoneBoundaryWidth
      );
    }

    // Draws left and right edge tiles
    for (let tileY = cityZone.startY; tileY <= cityZone.endY; tileY++) {
      // Draws left edge outline
      this.tileBaseRenderer.tileDiamondOutlineDraw(
        { x: cityZone.startX, y: tileY },
        colorHex,
        0.9,
        cityMapVisualConfig.line.zoneBoundaryWidth
      );

      // Draws right edge outline
      this.tileBaseRenderer.tileDiamondOutlineDraw(
        { x: cityZone.endX, y: tileY },
        colorHex,
        0.9,
        cityMapVisualConfig.line.zoneBoundaryWidth
      );
    }
  }

  // Draws translucent fill across all tiles in a zone
  private zoneOverlayTileFillDraw(cityZone: CityZone, colorHex: string, alpha: number): void {
    // Loops through zone y coordinates
    for (let tileY = cityZone.startY; tileY <= cityZone.endY; tileY++) {
      // Loops through zone x coordinates
      for (let tileX = cityZone.startX; tileX <= cityZone.endX; tileX++) {
        // Draws translucent zone tile
        this.tileBaseRenderer.tileDiamondFillOnlyDraw({ x: tileX, y: tileY }, colorHex, alpha);
      }
    }
  }
}