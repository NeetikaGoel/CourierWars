// Imports visual configuration for terrain colors
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports generated city tile type
import type { CityTile } from "../../types/CityMapType";

// Imports tile terrain values
import { CityTileTerrainType } from "../../types/CityTileType";

// Imports base tile renderer
import { TileBaseRenderer } from "./TileBaseRenderer";

// Draws terrain layer for city tiles
export class TileTerrainRenderer {
  // Stores base tile renderer
  private readonly tileBaseRenderer: TileBaseRenderer;

  // Creates terrain renderer
  constructor(tileBaseRenderer: TileBaseRenderer) {
    // Stores base tile renderer reference
    this.tileBaseRenderer = tileBaseRenderer;
  }

  // Draws terrain for one city tile
  tileTerrainDraw(cityTile: CityTile): void {
    if (cityTile.terrainType === CityTileTerrainType.Building) {
      this.tileTerrainBuildingDraw(cityTile);
      return;
    }

    if (cityTile.terrainType === CityTileTerrainType.Land) {
      this.tileTerrainLandDraw(cityTile);
      return;
    }

    if (cityTile.terrainType === CityTileTerrainType.Park) {
      this.tileTerrainParkDraw(cityTile);
      return;
    }

    if (cityTile.terrainType === CityTileTerrainType.Water) {
      this.tileTerrainWaterDraw(cityTile);
      return;
    }

    this.tileTerrainLandDraw(cityTile);
  }

  // Draws building terrain tile
  tileTerrainBuildingDraw(cityTile: CityTile): void {
    const colorHex = (cityTile.x + cityTile.y) % 5 === 0
      ? cityMapVisualConfig.terrain.buildingAltColorHex
      : cityMapVisualConfig.terrain.buildingColorHex;

    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      colorHex
    );
  }

  // Draws land terrain tile
  tileTerrainLandDraw(cityTile: CityTile): void {
    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      cityMapVisualConfig.terrain.landColorHex
    );
  }

  // Draws park terrain tile
  tileTerrainParkDraw(cityTile: CityTile): void {
    const colorHex = (cityTile.x + cityTile.y) % 3 === 0
      ? cityMapVisualConfig.terrain.parkAltColorHex
      : cityMapVisualConfig.terrain.parkColorHex;

    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      colorHex
    );

    if ((cityTile.x + cityTile.y) % 4 === 0) {
      this.tileBaseRenderer.tileDiamondFillOnlyDraw(
        {
          x: cityTile.x,
          y: cityTile.y,
        },
        "#69d789",
        0.16
      );
    }
  }

  // Draws water terrain tile
  tileTerrainWaterDraw(cityTile: CityTile): void {
    const colorHex = (cityTile.x + cityTile.y) % 2 === 0
      ? cityMapVisualConfig.terrain.waterColorHex
      : cityMapVisualConfig.terrain.waterAltColorHex;

    this.tileBaseRenderer.tileDiamondDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      colorHex
    );

    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      {
        x: cityTile.x,
        y: cityTile.y,
      },
      "#9cf2ff",
      0.12
    );

    if ((cityTile.x + cityTile.y) % 3 === 0) {
      this.tileBaseRenderer.tileDiamondOutlineDraw(
        {
          x: cityTile.x,
          y: cityTile.y,
        },
        "#b8f7ff",
        0.24,
        1
      );
    }
  }
}