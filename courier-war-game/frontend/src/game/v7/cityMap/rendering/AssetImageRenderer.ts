// Imports Phaser for scene and image object creation
import Phaser from "phaser";

// Imports asset display mode and definition type
import { MapAssetDisplayMode } from "../../types/MapAssetDisplayType";

// Imports asset display configuration
import { mapAssetDisplayConfig } from "../../config/MapAssetDisplayConfig";

// Imports isometric center helper
import { isometricTileCenterWorldPointGet, isometricTileDepthBaseGet } from "../../iso/IsometricCoordinateCalculator";

// Imports city tile type
import type { CityTile } from "../../types/CityMapType";

// Defines asset config shape used by current config object
interface AssetImageRendererConfigShape {
  // Stores whether asset is enabled
  enabled: boolean;

  // Stores Phaser texture key
  key: string;

  // Stores image path
  path: string;

  // Stores image width in pixels
  widthPixels: number;

  // Stores image height in pixels
  heightPixels: number;

  // Stores horizontal anchor value
  anchorX: number;

  // Stores vertical anchor value
  anchorY: number;

  // Stores depth offset
  depthOffset: number;
}

// Draws real image assets when image mode is enabled and texture is loaded
export class AssetImageRenderer {
  // Stores Phaser scene reference
  private readonly scene: Phaser.Scene;

  // Creates asset image renderer
  constructor(scene: Phaser.Scene) {
    // Stores Phaser scene reference
    this.scene = scene;
  }

  // Checks whether real image rendering mode is enabled
  assetImageRenderingEnabledCheck(): boolean {
    // Returns false when image assets are disabled
    if (!mapAssetDisplayConfig.display.imageAssetEnabled) {
      // Returns false for disabled image assets
      return false;
    }

    // Returns whether default display mode uses image assets
    return mapAssetDisplayConfig.display.modeDefault === MapAssetDisplayMode.ImageAsset;
  }

  // Draws image asset on tile when possible
  assetImageDraw(
    cityTile: CityTile,
    assetConfig: AssetImageRendererConfigShape
  ): Phaser.GameObjects.Image | null {
    // Stops when image rendering is disabled
    if (!this.assetImageRenderingEnabledCheck()) {
      // Returns null because image assets are not active
      return null;
    }

    // Stops when asset config is disabled
    if (!assetConfig.enabled) {
      // Returns null because specific asset is disabled
      return null;
    }

    // Stops when image texture is not loaded
    if (!this.assetImageLoadedCheck(assetConfig.key)) {
      // Returns null because texture is missing
      return null;
    }

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet({ x: cityTile.x, y: cityTile.y });

    // Creates image game object
    const image = this.scene.add.image(tileCenter.x, tileCenter.y, assetConfig.key);

    // Applies configured display size
    image.setDisplaySize(assetConfig.widthPixels, assetConfig.heightPixels);

    // Applies configured origin
    image.setOrigin(assetConfig.anchorX, assetConfig.anchorY);

    // Applies depth
    image.setDepth(this.assetImageDepthGet(cityTile, assetConfig));

    // Returns created image
    return image;
  }

  // Checks whether texture key is loaded in Phaser
  assetImageLoadedCheck(assetKey: string): boolean {
    // Returns whether texture exists in Phaser texture manager
    return this.scene.textures.exists(assetKey);
  }

  // Gets image depth for tile asset
  assetImageDepthGet(cityTile: CityTile, assetConfig: AssetImageRendererConfigShape): number {
    // Stores base depth from tile point
    const depthBase = isometricTileDepthBaseGet({ x: cityTile.x, y: cityTile.y });

    // Returns final asset depth
    return depthBase + assetConfig.depthOffset;
  }
}