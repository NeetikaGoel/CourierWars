// Imports asset display modes for map visual configuration
import { MapAssetDisplayMode } from "../types/MapAssetDisplayType";

// Defines asset and placeholder display configuration
export const mapAssetDisplayConfig = {
  // Groups global asset display settings
  // Groups global asset display settings
  display: {
    // Stores default visual mode for prototype rendering
    modeDefault: MapAssetDisplayMode.PlaceholderAsset as MapAssetDisplayMode,

    // Enables real image assets when files are available
    imageAssetEnabled: false as boolean,

    // Enables placeholder assets when real assets are disabled
    placeholderAssetEnabled: true as boolean,

    // Enables colored tile fallback when assets are disabled
    tileColorFallbackEnabled: true as boolean,
  },

  // Groups placeholder visibility toggles
  placeholder: {
    // Enables building placeholder drawing
    buildingEnabled: true,

    // Enables traffic signal placeholder drawing
    trafficSignalEnabled: true,

    // Enables tunnel entrance placeholder drawing
    tunnelEntranceEnabled: true,

    // Enables bridge placeholder drawing
    bridgeEnabled: true,

    // Enables shortcut entrance placeholder drawing
    shortcutEntranceEnabled: true,

    // Enables Saboteur hurdle placeholder drawing
    hurdleEnabled: true,
  },

  // Groups future image asset metadata
  asset: {
    // Stores building asset metadata
    buildingSmall: {
      // Enables this image asset when image mode is active
      enabled: true,

      // Stores Phaser texture key
      key: "building-small",

      // Stores future asset path
      path: "/assets/courier-war/city/building-small.png",

      // Stores intended image width
      widthPixels: 64,

      // Stores intended image height
      heightPixels: 96,

      // Stores horizontal anchor
      anchorX: 0.5,

      // Stores vertical anchor
      anchorY: 1,

      // Stores depth offset above tile depth
      depthOffset: 40,
    },

    // Stores traffic signal asset metadata
    trafficSignal: {
      // Enables this image asset when image mode is active
      enabled: true,

      // Stores Phaser texture key
      key: "traffic-signal",

      // Stores future asset path
      path: "/assets/courier-war/city/traffic-signal.png",

      // Stores intended image width
      widthPixels: 24,

      // Stores intended image height
      heightPixels: 48,

      // Stores horizontal anchor
      anchorX: 0.5,

      // Stores vertical anchor
      anchorY: 1,

      // Stores depth offset above tile depth
      depthOffset: 55,
    },

    // Stores tunnel entrance asset metadata
    tunnelEntrance: {
      // Enables this image asset when image mode is active
      enabled: true,

      // Stores Phaser texture key
      key: "tunnel-entrance",

      // Stores future asset path
      path: "/assets/courier-war/city/tunnel-entrance.png",

      // Stores intended image width
      widthPixels: 48,

      // Stores intended image height
      heightPixels: 48,

      // Stores horizontal anchor
      anchorX: 0.5,

      // Stores vertical anchor
      anchorY: 1,

      // Stores depth offset above tile depth
      depthOffset: 45,
    },

    // Stores bridge asset metadata
    bridge: {
      // Enables this image asset when image mode is active
      enabled: true,

      // Stores Phaser texture key
      key: "bridge",

      // Stores future asset path
      path: "/assets/courier-war/city/bridge.png",

      // Stores intended image width
      widthPixels: 64,

      // Stores intended image height
      heightPixels: 32,

      // Stores horizontal anchor
      anchorX: 0.5,

      // Stores vertical anchor
      anchorY: 0.5,

      // Stores depth offset above tile depth
      depthOffset: 25,
    },

    // Stores shortcut entrance asset metadata
    shortcutEntrance: {
      // Enables this image asset when image mode is active
      enabled: true,

      // Stores Phaser texture key
      key: "shortcut-entrance",

      // Stores future asset path
      path: "/assets/courier-war/city/shortcut-entrance.png",

      // Stores intended image width
      widthPixels: 32,

      // Stores intended image height
      heightPixels: 32,

      // Stores horizontal anchor
      anchorX: 0.5,

      // Stores vertical anchor
      anchorY: 1,

      // Stores depth offset above tile depth
      depthOffset: 35,
    },
  },
} as const;