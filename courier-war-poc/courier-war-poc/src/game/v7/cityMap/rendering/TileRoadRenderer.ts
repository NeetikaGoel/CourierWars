// Imports visual configuration for road colors
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports generated city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports tile layer values
import { CityTilePathKind, CityTileRoadClass } from "../../types/CityTileType";

// Imports base tile renderer
import { TileBaseRenderer } from "./TileBaseRenderer";

// Draws roads bridges tunnels and shortcuts
export class TileRoadRenderer {
  // Stores base tile renderer
  private readonly tileBaseRenderer: TileBaseRenderer;

  // Creates road renderer
  constructor(tileBaseRenderer: TileBaseRenderer) {
    // Stores base tile renderer reference
    this.tileBaseRenderer = tileBaseRenderer;
  }

  // Draws road or path layer for one tile
  tileRoadDraw(cityTile: CityTile): void {
    // Skips empty path tiles
    if (cityTile.pathKind === CityTilePathKind.None) {
      // Ends road drawing
      return;
    }

    // Draws bridge tile
    if (cityTile.pathKind === CityTilePathKind.Bridge) {
      // Draws bridge path
      this.tileRoadBridgeDraw(cityTile);

      // Ends road drawing
      return;
    }

    // Draws tunnel tile
    if (cityTile.pathKind === CityTilePathKind.Tunnel) {
      // Draws tunnel path
      this.tileRoadTunnelDraw(cityTile);

      // Ends road drawing
      return;
    }

    // Draws shortcut tile
    if (cityTile.pathKind === CityTilePathKind.Shortcut) {
      // Draws shortcut path
      this.tileRoadShortcutDraw(cityTile);

      // Ends road drawing
      return;
    }

    // Draws local road
    if (cityTile.roadClass === CityTileRoadClass.LocalRoad) {
      // Draws local road tile
      this.tileRoadLocalDraw(cityTile);

      // Ends road drawing
      return;
    }

    // Draws district road
    if (cityTile.roadClass === CityTileRoadClass.DistrictRoad) {
      // Draws district road tile
      this.tileRoadDistrictDraw(cityTile);

      // Ends road drawing
      return;
    }

    // Draws avenue road
    if (cityTile.roadClass === CityTileRoadClass.AvenueRoad) {
      // Draws avenue road tile
      this.tileRoadAvenueDraw(cityTile);

      // Ends road drawing
      return;
    }
  }

  // Draws local road tile
  tileRoadLocalDraw(cityTile: CityTile): void {
    // Draws local road diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.road.localRoadColorHex
    );
  }

  // Draws district road tile
  tileRoadDistrictDraw(cityTile: CityTile): void {
    // Draws district road diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.road.districtRoadColorHex
    );
  }

  // Draws avenue road tile
  tileRoadAvenueDraw(cityTile: CityTile): void {
    // Draws avenue road diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.road.avenueRoadColorHex
    );
  }

  // Draws bridge tile over water
  tileRoadBridgeDraw(cityTile: CityTile): void {
    // Draws bridge diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.road.bridgeColorHex
    );
  }

  // Draws subtle tunnel tile
  tileRoadTunnelDraw(cityTile: CityTile): void {
    // Draws tunnel diamond with subtle alpha
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.road.tunnelColorHex,
      0.65
    );
  }

  // Draws subtle shortcut tile
  tileRoadShortcutDraw(cityTile: CityTile): void {
    // Draws shortcut diamond with subtle alpha
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.road.shortcutColorHex,
      0.55
    );
  }
}