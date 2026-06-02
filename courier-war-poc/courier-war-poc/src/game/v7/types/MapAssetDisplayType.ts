// Defines map asset display modes
export const MapAssetDisplayMode = {
  // Represents colored tile rendering only
  TileColorOnly: "tileColorOnly",

  // Represents Phaser shape placeholder asset rendering
  PlaceholderAsset: "placeholderAsset",

  // Represents real image asset rendering
  ImageAsset: "imageAsset",
} as const;

// Creates a string union type from asset display mode values
export type MapAssetDisplayMode = (typeof MapAssetDisplayMode)[keyof typeof MapAssetDisplayMode];

// Defines asset anchor position
export interface MapAssetAnchor {
  // Stores horizontal anchor value
  x: number;

  // Stores vertical anchor value
  y: number;
}

// Defines image asset metadata
export interface MapAssetDefinition {
  // Stores whether this asset is enabled
  enabled: boolean;

  // Stores Phaser texture key
  key: string;

  // Stores image path
  path: string;

  // Stores intended width in pixels
  widthPixels: number;

  // Stores intended height in pixels
  heightPixels: number;

  // Stores asset anchor
  anchor: MapAssetAnchor;

  // Stores depth offset above tile depth
  depthOffset: number;
}