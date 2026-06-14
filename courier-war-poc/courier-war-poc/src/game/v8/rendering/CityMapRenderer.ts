// Imports Phaser for graphics layer creation
import Phaser from "phaser";

// Imports V8 visual configuration for depth settings
import { cityMapVisualConfig } from "../config/CityMapVisualConfig";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../v7/types/CityMapType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../v7/types/MatchRuntimeStateType";

// Imports tile path kind values
import { CityTilePathKind } from "../../v7/types/CityTileType";

// Imports base V7 tile renderer
import { TileBaseRenderer } from "../../v7/cityMap/rendering/TileBaseRenderer";

// Imports base V7 terrain renderer
import { TileTerrainRenderer } from "../../v7/cityMap/rendering/TileTerrainRenderer";

// Imports base V7 road renderer
import { TileRoadRenderer } from "../../v7/cityMap/rendering/TileRoadRenderer";

// Imports V8 feature renderer
import { TileFeatureRenderer } from "./TileFeatureRenderer";

// Imports base V7 placeholder renderer
import { AssetPlaceholderRenderer } from "../../v7/cityMap/rendering/AssetPlaceholderRenderer";

// Imports base V7 tile overlay renderer
import { TileOverlayRenderer } from "../../v7/cityMap/rendering/TileOverlayRenderer";

// Imports base V7 zone overlay renderer
import { ZoneOverlayRenderer } from "../../v7/cityMap/rendering/ZoneOverlayRenderer";

// Coordinates V8 static map and runtime overlay rendering
export class CityMapRenderer {
  // Stores Phaser scene reference
  private readonly scene: Phaser.Scene;

  // Stores generated city map reference
  private readonly cityMapGenerated: CityMapGenerated;

  // Stores mutable match runtime state
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // Stores static graphics layer
  private readonly staticGraphics: Phaser.GameObjects.Graphics;

  // Stores runtime graphics layer
  private readonly runtimeGraphics: Phaser.GameObjects.Graphics;

  // Stores static base tile renderer
  private readonly staticTileBaseRenderer: TileBaseRenderer;

  // Stores terrain renderer
  private readonly tileTerrainRenderer: TileTerrainRenderer;

  // Stores road renderer
  private readonly tileRoadRenderer: TileRoadRenderer;

  // Stores V8 runtime feature renderer
  private readonly tileFeatureRenderer: TileFeatureRenderer;

  // Stores placeholder asset renderer
  private readonly assetPlaceholderRenderer: AssetPlaceholderRenderer;

  // Stores tile overlay renderer
  private readonly tileOverlayRenderer: TileOverlayRenderer;

  // Stores zone overlay renderer
  private readonly zoneOverlayRenderer: ZoneOverlayRenderer;

  // Creates city map renderer
  constructor(
    scene: Phaser.Scene,
    cityMapGenerated: CityMapGenerated,
    matchPrototypeState: MatchPrototypeStateShape
  ) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores generated map reference
    this.cityMapGenerated = cityMapGenerated;

    // Stores match runtime state reference
    this.matchPrototypeState = matchPrototypeState;

    // Creates static graphics layer
    this.staticGraphics = this.scene.add.graphics();

    // Creates runtime graphics layer
    this.runtimeGraphics = this.scene.add.graphics();

    // Sets static graphics depth
    this.staticGraphics.setDepth(cityMapVisualConfig.depth.tileBase);

    // Sets runtime graphics depth
    this.runtimeGraphics.setDepth(cityMapVisualConfig.depth.tileInteractionOverlay);

    // Creates base V7 renderers
    this.staticTileBaseRenderer = new TileBaseRenderer(this.staticGraphics);
    this.tileTerrainRenderer = new TileTerrainRenderer(this.staticTileBaseRenderer);
    this.tileRoadRenderer = new TileRoadRenderer(this.staticTileBaseRenderer);

    // Creates V8 feature renderer
    this.tileFeatureRenderer = new TileFeatureRenderer(this.runtimeGraphics);

    // Creates placeholder renderer on runtime layer
    this.assetPlaceholderRenderer = new AssetPlaceholderRenderer(this.runtimeGraphics);

    // Creates tile overlay renderer on runtime layer
    this.tileOverlayRenderer = new TileOverlayRenderer(this.cityMapGenerated, this.runtimeGraphics);

    // Creates zone overlay renderer on runtime layer
    this.zoneOverlayRenderer = new ZoneOverlayRenderer(this.runtimeGraphics);
  }

  // Draws full static map and runtime overlays
  cityMapDraw(): void {
    // Clears static layer before drawing
    this.cityMapStaticLayerClear();

    // Loops through all city tiles
    for (const cityTile of this.cityMapTileListGet()) {
      // Draws terrain layer
      this.tileTerrainRenderer.tileTerrainDraw(cityTile);

      // Draws road and path layer
      this.tileRoadRenderer.tileRoadDraw(cityTile);

      // Draws static building placeholder
      this.assetPlaceholderRenderer.assetPlaceholderBuildingDraw(cityTile);

      // Draws static bridge placeholder for bridge path
      if (cityTile.pathKind === CityTilePathKind.Bridge) {
        this.assetPlaceholderRenderer.assetPlaceholderBridgeDraw(cityTile);
      }
    }

    // Draws runtime layer after static layer
    this.cityMapRuntimeLayerRedraw();
  }

  // Redraws runtime layer
  cityMapRuntimeLayerRedraw(): void {
    // Clears runtime layer
    this.cityMapRuntimeLayerClear();

    // Draws zone overlays
    this.cityMapZoneOverlayDraw();

    // Draws features and dynamic traffic signal states
    this.cityMapFeatureLayerDraw();

    // Draws active hurdle placeholders
    this.cityMapActiveHurdleLayerDraw();

    // Draws tile overlays
    this.tileOverlayRenderer.tileOverlayRuntimeDraw(this.matchPrototypeState);
  }

  // Clears static layer
  cityMapStaticLayerClear(): void {
    // Clears static graphics
    this.staticGraphics.clear();
  }

  // Clears runtime layer
  cityMapRuntimeLayerClear(): void {
    // Clears runtime graphics
    this.runtimeGraphics.clear();
  }

  // Draws feature layer
  private cityMapFeatureLayerDraw(): void {
    // Loops through all city tiles
    for (const cityTile of this.cityMapTileListGet()) {
      // Draws V8 feature markers including improved signal art
      this.tileFeatureRenderer.tileFeatureDraw(cityTile, this.matchPrototypeState);

      // Draws tunnel entrance placeholder
      if (cityTile.tunnelEntrance) {
        this.assetPlaceholderRenderer.assetPlaceholderTunnelEntranceDraw(cityTile);
      }

      // Draws shortcut entrance placeholder
      if (cityTile.shortcutEntrance) {
        this.assetPlaceholderRenderer.assetPlaceholderShortcutDraw(cityTile);
      }
    }
  }

  // Draws active hurdle placeholder layer
  private cityMapActiveHurdleLayerDraw(): void {
    // Loops through active hurdles
    for (const activeHurdle of Object.values(this.matchPrototypeState.activeHurdleById)) {
      // Draws active hurdle placeholder
      this.assetPlaceholderRenderer.assetPlaceholderHurdleDraw(activeHurdle);
    }
  }

  // Draws zone overlays
  private cityMapZoneOverlayDraw(): void {
    // Gets current Courier zone
    const courierCurrentZone = this.cityMapGenerated.zoneList.find(
      (cityZone) => cityZone.id === this.matchPrototypeState.courier.zoneIdCurrent
    );

    // Draws current Courier zone overlay
    this.zoneOverlayRenderer.zoneOverlayCourierCurrentDraw(courierCurrentZone);

    // V8 does not draw allowed zone overlays because prototype placement is tile driven
  }

  // Gets flat tile list
  private cityMapTileListGet(): CityTile[] {
    // Returns flattened tile rows
    return this.cityMapGenerated.tileRows.flat();
  }
}
