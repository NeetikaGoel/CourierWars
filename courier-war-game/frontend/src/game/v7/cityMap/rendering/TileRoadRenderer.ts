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
    if (cityTile.pathKind === CityTilePathKind.None) {
      return;
    }

    if (cityTile.pathKind === CityTilePathKind.Bridge) {
      this.tileRoadBridgeDraw(cityTile);
      return;
    }

    if (cityTile.pathKind === CityTilePathKind.Tunnel) {
      this.tileRoadTunnelDraw(cityTile);
      return;
    }

    if (cityTile.pathKind === CityTilePathKind.Shortcut) {
      this.tileRoadShortcutDraw(cityTile);
      return;
    }

    if (cityTile.roadClass === CityTileRoadClass.LocalRoad) {
      this.tileRoadLocalDraw(cityTile);
      return;
    }

    if (cityTile.roadClass === CityTileRoadClass.DistrictRoad) {
      this.tileRoadDistrictDraw(cityTile);
      return;
    }

    if (cityTile.roadClass === CityTileRoadClass.AvenueRoad) {
      this.tileRoadAvenueDraw(cityTile);
    }
  }

  // Draws local road tile
  tileRoadLocalDraw(cityTile: CityTile): void {
    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.localRoadColorHex
    );

    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      "#101820",
      0.12
    );
  }

  // Draws district road tile
  tileRoadDistrictDraw(cityTile: CityTile): void {
    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.districtRoadColorHex
    );

    if ((cityTile.x + cityTile.y) % 4 === 0) {
      this.tileBaseRenderer.tileDiamondFillOnlyDraw(
        {
          x: cityTile.x,
          y: cityTile.y,
        },
        cityMapVisualConfig.road.roadMarkingColorHex,
        0.12
      );
    }
  }

  // Draws avenue road tile
  tileRoadAvenueDraw(cityTile: CityTile): void {
    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.avenueRoadColorHex
    );

    this.tileBaseRenderer.tileDiamondOutlineDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.roadMarkingColorHex,
      0.28,
      1
    );

    if ((cityTile.x + cityTile.y) % 3 === 0) {
      this.tileBaseRenderer.tileDiamondFillOnlyDraw(
        {
          x: cityTile.x,
          y: cityTile.y,
        },
        "#e9f8ff",
        0.13
      );
    }
  }

  // Draws bridge tile over water
  tileRoadBridgeDraw(cityTile: CityTile): void {
    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.bridgeColorHex
    );

    this.tileBaseRenderer.tileDiamondOutlineDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.bridgeRailColorHex,
      0.9,
      2
    );

    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      "#fff0bd",
      0.16
    );
  }

  // Draws tunnel tile through city blocks
  tileRoadTunnelDraw(cityTile: CityTile): void {
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.tunnelColorHex,
      0.78
    );

    this.tileBaseRenderer.tileDiamondOutlineDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      "#d8c6ff",
      0.72,
      2
    );

    if ((cityTile.x + cityTile.y) % 2 === 0) {
      this.tileBaseRenderer.tileDiamondFillOnlyDraw(
        {
          x: cityTile.x,
          y: cityTile.y,
        },
        "#160b2d",
        0.25
      );
    }
  }

  // Draws shortcut tile as narrow hidden path
  tileRoadShortcutDraw(cityTile: CityTile): void {
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.road.shortcutColorHex,
      0.7
    );

    this.tileBaseRenderer.tileDiamondOutlineDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      "#ffd5ef",
      0.62,
      1
    );

    if ((cityTile.x + cityTile.y) % 2 === 0) {
      this.tileBaseRenderer.tileDiamondFillOnlyDraw(
        {
          x: cityTile.x,
          y: cityTile.y,
        },
        "#ffd5ef",
        0.13
      );
    }
  }
}