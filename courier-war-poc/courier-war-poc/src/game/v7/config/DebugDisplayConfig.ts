// Defines prototype debug display and debug input settings
export const debugDisplayConfig = {
  // Groups side HUD panel settings
  sidePanel: {
    // Enables right side HUD panel
    visible: true,

    // Stores HUD panel width in pixels
    widthPixels: 390,

    // Stores HUD panel top position
    topPixels: 0,

    // Stores HUD panel right position
    rightPixels: 0,

    // Stores HUD panel height css value
    heightCss: "100vh",

    // Stores HUD panel z index
    zIndex: 999999,

    // Stores HUD panel background color
    backgroundColorHex: "#650202",

    // Stores HUD panel text color
    textColorHex: "#ffffff",

    // Stores muted text color
    mutedTextColorHex: "#b1c6e3",

    // Stores good state color
    validColorHex: "#22c55e",

    // Stores bad state color
    invalidColorHex: "#ef4444",

    // Stores warning state color
    warningColorHex: "#facc15",

    // Stores panel border color
    borderColorHex: "#334155",

    // Stores panel padding in pixels
    paddingPixels: 14,

    // Stores section spacing in pixels
    sectionSpacingPixels: 12,

    // Stores font size in pixels
    fontSizePixels: 13,

    // Stores title font size in pixels
    titleFontSizePixels: 16,
  },

  // Groups debug overlay visibility settings
  overlay: {
    // Enables all zone boundary debug drawing
    zoneBoundaryVisible: true,

    // Enables Courier current zone glow drawing
    courierCurrentZoneVisible: true,

    // Enables allowed Saboteur zone glow drawing
    saboteurAllowedZoneVisible: true,

    // Enables intersection debug markers
    intersectionVisible: false,

    // Enables traffic signal debug markers
    trafficSignalVisible: true,

    // Enables hurdle candidate debug markers
    hurdleCandidateVisible: false,

    // Enables Courier visited tile debug tint
    visitedTileVisible: false,

    // Enables map validation debug markers
    validationVisible: true,
  },

  // Groups old floating text compatibility settings
  text: {
    // Enables debug text overlay
    visible: true,

    // Stores debug text x position in screen pixels
    screenX: 16,

    // Stores debug text y position in screen pixels
    screenY: 16,

    // Stores debug text font size
    fontSizePixels: 14,

    // Stores debug text color
    colorHex: "#ffffff",

    // Stores debug text background color
    backgroundColorHex: "#111827",
  },

  // Groups debug keyboard feature toggles
  keyboard: {
    // Enables Tab role toggle
    roleToggleEnabled: true,

    // Enables R map regeneration
    mapRegenerationEnabled: true,

    // Enables A asset placeholder toggle
    assetPlaceholderToggleEnabled: true,

    // Enables Z zone overlay toggle
    zoneOverlayToggleEnabled: true,

    // Enables H hurdle candidate overlay toggle
    hurdleCandidateToggleEnabled: true,

    // Enables V visited tile overlay toggle
    visitedTileToggleEnabled: true,
  },
} as const;