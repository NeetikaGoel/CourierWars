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
    // Draws building terrain
    if (cityTile.terrainType === CityTileTerrainType.Building) {
      // Draws building tile
      this.tileTerrainBuildingDraw(cityTile);

      // Ends terrain drawing
      return;
    }

    // Draws land terrain
    if (cityTile.terrainType === CityTileTerrainType.Land) {
      // Draws land tile
      this.tileTerrainLandDraw(cityTile);

      // Ends terrain drawing
      return;
    }

    // Draws park terrain
    if (cityTile.terrainType === CityTileTerrainType.Park) {
      // Draws park tile
      this.tileTerrainParkDraw(cityTile);

      // Ends terrain drawing
      return;
    }

    // Draws water terrain
    if (cityTile.terrainType === CityTileTerrainType.Water) {
      // Draws water tile
      this.tileTerrainWaterDraw(cityTile);

      // Ends terrain drawing
      return;
    }

    // Draws fallback land tile
    this.tileTerrainLandDraw(cityTile);
  }

  // Draws building terrain tile
  tileTerrainBuildingDraw(cityTile: CityTile): void {
    // Draws building colored diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.terrain.buildingColorHex
    );
  }

  // Draws land terrain tile
  tileTerrainLandDraw(cityTile: CityTile): void {
    // Draws land colored diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.terrain.landColorHex
    );
  }

  // Draws park terrain tile
  tileTerrainParkDraw(cityTile: CityTile): void {
    // Draws park colored diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.terrain.parkColorHex
    );
  }

  // Draws water terrain tile
  tileTerrainWaterDraw(cityTile: CityTile): void {
    // Draws water colored diamond
    this.tileBaseRenderer.tileDiamondDraw(
      {
        // Stores tile x coordinate
        x: cityTile.x,

        // Stores tile y coordinate
        y: cityTile.y,
      },
      cityMapVisualConfig.terrain.waterColorHex
    );
  }
}