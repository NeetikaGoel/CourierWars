// Imports Phaser for graphics layer creation
import Phaser from "phaser";

// Imports visual configuration for depth settings
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports player role values
import { PlayerRole } from "../../types/PlayerRoleType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports traffic signal state values
import { TrafficSignalStateName } from "../../types/TrafficSignalType";

// Imports tile path kind and feature kind values
import { CityTileFeatureKind, CityTilePathKind } from "../../types/CityTileType";

// Imports zone placement rules
import { zonePlacementAllowedZoneIdListGet } from "../rules/ZonePlacementRules";

// Imports base tile renderer
import { TileBaseRenderer } from "./TileBaseRenderer";

// Imports terrain renderer
import { TileTerrainRenderer } from "./TileTerrainRenderer";

// Imports road renderer
import { TileRoadRenderer } from "./TileRoadRenderer";

// Imports feature renderer
import { TileFeatureRenderer } from "./TileFeatureRenderer";

// Imports placeholder asset renderer
import { AssetPlaceholderRenderer } from "./AssetPlaceholderRenderer";

// Imports image asset renderer
// import { AssetImageRenderer } from "./AssetImageRenderer";

// Imports tile overlay renderer
import { TileOverlayRenderer } from "./TileOverlayRenderer";

// Imports zone overlay renderer
import { ZoneOverlayRenderer } from "./ZoneOverlayRenderer";

// Coordinates map static rendering and runtime overlay rendering
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

  // Stores runtime feature renderer
  private readonly tileFeatureRenderer: TileFeatureRenderer;

  // Stores placeholder asset renderer
  private readonly assetPlaceholderRenderer: AssetPlaceholderRenderer;

  // Stores image asset renderer
  // private readonly assetImageRenderer: AssetImageRenderer;

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

    // Creates static tile base renderer
    this.staticTileBaseRenderer = new TileBaseRenderer(this.staticGraphics);

    // Creates terrain renderer
    this.tileTerrainRenderer = new TileTerrainRenderer(this.staticTileBaseRenderer);

    // Creates road renderer
    this.tileRoadRenderer = new TileRoadRenderer(this.staticTileBaseRenderer);

    // Creates feature renderer on runtime layer
    this.tileFeatureRenderer = new TileFeatureRenderer(this.runtimeGraphics);

    // Creates placeholder renderer on runtime layer
    this.assetPlaceholderRenderer = new AssetPlaceholderRenderer(this.runtimeGraphics);

    // Creates image asset renderer
    // this.assetImageRenderer = new AssetImageRenderer(this.scene);

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
        // Draws bridge placeholder
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
      // Draws feature markers
      this.tileFeatureRenderer.tileFeatureDraw(cityTile, this.matchPrototypeState);

      // Draws traffic signal placeholder when tile has signal
      if (cityTile.featureKindList.includes(CityTileFeatureKind.TrafficSignal) && cityTile.trafficSignalId) {
        // Stores signal runtime state
        const trafficSignalState = this.matchPrototypeState.trafficSignalStateById[cityTile.trafficSignalId];

        // Stores whether signal is red
        const signalRed = trafficSignalState?.stateName === TrafficSignalStateName.Red;

        // Draws traffic signal placeholder
        this.assetPlaceholderRenderer.assetPlaceholderTrafficSignalDraw(cityTile, signalRed);
      }

      // Draws tunnel entrance placeholder
      if (cityTile.tunnelEntrance) {
        // Draws tunnel entrance placeholder
        this.assetPlaceholderRenderer.assetPlaceholderTunnelEntranceDraw(cityTile);
      }

      // Draws shortcut entrance placeholder
      if (cityTile.shortcutEntrance) {
        // Draws shortcut placeholder
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

    // Draws Saboteur allowed zone overlay only in Saboteur mode
    if (this.matchPrototypeState.playerRole === PlayerRole.Saboteur) {
      // Stores allowed zone ids
      const allowedZoneIdList = zonePlacementAllowedZoneIdListGet({
        // Stores city zone list
        cityZoneList: this.cityMapGenerated.zoneList,

        // Stores Courier current zone id
        courierZoneIdCurrent: this.matchPrototypeState.courier.zoneIdCurrent,

        // Stores Courier previous zone id
        courierZoneIdPrevious: this.matchPrototypeState.courier.zoneIdPrevious,

        // Stores Courier direction name
        courierDirectionName: this.matchPrototypeState.courier.directionName,
      });

      // Stores allowed zone objects
      const allowedZoneList = this.cityMapGenerated.zoneList.filter((cityZone) =>
        allowedZoneIdList.includes(cityZone.id)
      );

      // Draws allowed Saboteur zone overlays
      this.zoneOverlayRenderer.zoneOverlaySaboteurAllowedDraw(allowedZoneList);
    }
  }

  // Gets flat tile list
  private cityMapTileListGet(): CityTile[] {
    // Returns flattened tile rows
    return this.cityMapGenerated.tileRows.flat();
  }
}