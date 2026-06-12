// Imports Phaser graphics type
import Phaser from "phaser";

// Imports visual configuration
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports tile key helper
import { cityTilePointFromKeyGet } from "../../utility/CityTileKeyConverter";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports placement result type
import type { SaboteurHurdlePlacementResult } from "../../types/SaboteurHurdleType";

// Imports base tile renderer
import { TileBaseRenderer } from "./TileBaseRenderer";

// Draws runtime tile overlays such as hover selected visited and active hurdle outlines
export class TileOverlayRenderer {
  // Stores generated city map reference
  private readonly cityMapGenerated: CityMapGenerated;

  // Stores base tile renderer
  private readonly tileBaseRenderer: TileBaseRenderer;

  // Creates tile overlay renderer
  constructor(cityMapGenerated: CityMapGenerated, graphics: Phaser.GameObjects.Graphics) {
    // Stores generated city map reference
    this.cityMapGenerated = cityMapGenerated;

    // Creates base tile renderer with runtime graphics
    this.tileBaseRenderer = new TileBaseRenderer(graphics);
  }

  // Draws all runtime tile overlays
  tileOverlayRuntimeDraw(matchPrototypeState: MatchPrototypeStateShape): void {
    // Draws visited tile overlays
    this.tileOverlayVisitedAllDraw(matchPrototypeState);

    // Draws active hurdle overlays
    this.tileOverlayActiveHurdleAllDraw(matchPrototypeState);

    // Draws selected tile overlay
    this.tileOverlaySelectedFromStateDraw(matchPrototypeState);

    // Draws hover overlay
    this.tileOverlayHoverFromStateDraw(matchPrototypeState);
  }

  // Draws hover overlay from match state
  tileOverlayHoverFromStateDraw(matchPrototypeState: MatchPrototypeStateShape): void {
    // Stores hovered tile point
    const tilePointHovered = matchPrototypeState.tileInteraction.tilePointHovered;

    // Stops when no hovered tile exists
    if (!tilePointHovered) {
      // Ends hover overlay draw
      return;
    }

    // Draws hover overlay
    this.tileOverlayHoverDraw(
      this.cityMapTileGet(tilePointHovered.x, tilePointHovered.y),
      matchPrototypeState.tileInteraction.hoverPlacementResult
    );
  }

  // Draws hover overlay for one tile
  tileOverlayHoverDraw(
    cityTile: CityTile | undefined,
    placementResult: SaboteurHurdlePlacementResult | null
  ): void {
    // Stops when tile is missing
    if (!cityTile) {
      // Ends hover overlay draw
      return;
    }

    // Stores whether placement is valid
    const placementValid = placementResult?.valid ?? false;

    // Stores hover color
    const hoverColorHex = placementValid
      ? cityMapVisualConfig.overlay.hoverValidColorHex
      : cityMapVisualConfig.overlay.hoverInvalidColorHex;

    // Draws hover fill
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      { x: cityTile.x, y: cityTile.y },
      hoverColorHex,
      cityMapVisualConfig.alpha.hover
    );

    // Draws hover outline
    this.tileBaseRenderer.tileDiamondOutlineDraw(
      { x: cityTile.x, y: cityTile.y },
      hoverColorHex,
      1,
      cityMapVisualConfig.line.hoverOutlineWidth
    );
  }

  // Draws selected tile overlay from match state
  tileOverlaySelectedFromStateDraw(matchPrototypeState: MatchPrototypeStateShape): void {
    // Stores selected tile point
    const tilePointSelected = matchPrototypeState.tileInteraction.tilePointSelected;

    // Stops when no selected tile exists
    if (!tilePointSelected) {
      // Ends selected overlay draw
      return;
    }

    // Gets selected city tile
    const cityTile = this.cityMapTileGet(tilePointSelected.x, tilePointSelected.y);

    // Draws selected overlay
    this.tileOverlaySelectedDraw(cityTile);
  }

  // Draws selected tile overlay
  tileOverlaySelectedDraw(cityTile: CityTile | undefined): void {
    // Stops when tile is missing
    if (!cityTile) {
      // Ends selected overlay draw
      return;
    }

    // Draws selected fill
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      { x: cityTile.x, y: cityTile.y },
      cityMapVisualConfig.overlay.selectedTileColorHex,
      cityMapVisualConfig.alpha.selected
    );

    // Draws selected outline
    this.tileBaseRenderer.tileDiamondOutlineDraw(
      { x: cityTile.x, y: cityTile.y },
      cityMapVisualConfig.overlay.selectedTileColorHex,
      1,
      cityMapVisualConfig.line.selectedOutlineWidth
    );
  }

  // Draws all visited tile overlays
  tileOverlayVisitedAllDraw(matchPrototypeState: MatchPrototypeStateShape): void {
    // Loops through visited tile keys
    for (const tileKey of matchPrototypeState.courierVisitedTileKeySet) {
      // Converts tile key to tile point
      const tilePoint = cityTilePointFromKeyGet(tileKey);

      // Gets city tile
      const cityTile = this.cityMapTileGet(tilePoint.x, tilePoint.y);

      // Draws visited tile
      this.tileOverlayVisitedDraw(cityTile);
    }
  }

  // Draws one visited tile overlay
  tileOverlayVisitedDraw(cityTile: CityTile | undefined): void {
    // Stops when tile is missing
    if (!cityTile) {
      // Ends visited overlay draw
      return;
    }

    // Draws visited tile tint
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      { x: cityTile.x, y: cityTile.y },
      cityMapVisualConfig.overlay.visitedTileColorHex,
      cityMapVisualConfig.alpha.visited
    );
  }

  // Draws all active hurdle overlays
  tileOverlayActiveHurdleAllDraw(matchPrototypeState: MatchPrototypeStateShape): void {
    // Loops through active hurdles
    for (const activeHurdle of Object.values(matchPrototypeState.activeHurdleById)) {
      // Gets city tile for active hurdle
      const cityTile = this.cityMapTileGet(activeHurdle.tilePoint.x, activeHurdle.tilePoint.y);

      // Draws active hurdle overlay
      this.tileOverlayActiveHurdleDraw(cityTile);
    }
  }

  // Draws active hurdle outline
  tileOverlayActiveHurdleDraw(cityTile: CityTile | undefined): void {
    // Stops when tile is missing
    if (!cityTile) {
      // Ends active hurdle overlay draw
      return;
    }

    // Draws active hurdle fill
    this.tileBaseRenderer.tileDiamondFillOnlyDraw(
      { x: cityTile.x, y: cityTile.y },
      cityMapVisualConfig.hurdle.activeOutlineColorHex,
      cityMapVisualConfig.alpha.activeHurdle
    );

    // Draws active hurdle outline
    this.tileBaseRenderer.tileDiamondOutlineDraw(
      { x: cityTile.x, y: cityTile.y },
      cityMapVisualConfig.hurdle.activeOutlineColorHex,
      1,
      cityMapVisualConfig.line.hurdleOutlineWidth
    );
  }

  // Gets city tile from generated map
  private cityMapTileGet(tileX: number, tileY: number): CityTile | undefined {
    // Checks x lower bound
    const tileXMinValid = tileX >= 0;

    // Checks y lower bound
    const tileYMinValid = tileY >= 0;

    // Checks x upper bound
    const tileXMaxValid = tileX < this.cityMapGenerated.widthTiles;

    // Checks y upper bound
    const tileYMaxValid = tileY < this.cityMapGenerated.heightTiles;

    // Returns undefined when outside map
    if (!tileXMinValid || !tileYMinValid || !tileXMaxValid || !tileYMaxValid) {
      // Returns missing tile
      return undefined;
    }

    // Returns tile from generated rows
    return this.cityMapGenerated.tileRows[tileY][tileX];
  }
}