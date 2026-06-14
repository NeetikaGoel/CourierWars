// Defines V8 visual colors used by V8-only feature rendering
export const cityMapVisualConfig = {
  // Groups generated feature colors in hex string format
  feature: {
    // Stores green traffic signal color
    trafficSignalGreenColorHex: "#3aff8f",

    // Stores red traffic signal color
    trafficSignalRedColorHex: "#ff4f4f",

    // Stores traffic signal pole color
    trafficSignalPoleColorHex: "#d7e5ee",

    // Stores tunnel entrance hint color
    tunnelEntranceColorHex: "#a47cff",

    // Stores shortcut entrance hint color
    shortcutEntranceColorHex: "#ff78bd",

    // Stores bridge entrance hint color
    bridgeEntranceColorHex: "#ffd277",

    // Stores Courier start marker color
    startMarkerColorHex: "#28f0a0",

    // Stores delivery marker color
    deliveryMarkerColorHex: "#ffcf43",

    // Stores start and delivery marker outline color
    markerOutlineColorHex: "#ffffff",
  },

  // Groups depth values used by V8 renderer wrapper
  depth: {
    // Stores base tile drawing depth offset
    tileBase: 0,

    // Stores hover and selected tile overlay depth
    tileInteractionOverlay: 850000,
  },
} as const;
