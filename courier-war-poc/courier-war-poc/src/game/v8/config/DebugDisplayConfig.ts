// Defines prototype debug display settings for the V8 manual map experiment
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
    backgroundColorHex: "#06111f",

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
    borderColorHex: "#0ea5e9",

    // Stores panel padding in pixels
    paddingPixels: 14,

    // Stores section spacing in pixels
    sectionSpacingPixels: 12,

    // Stores font size in pixels
    fontSizePixels: 13,

    // Stores title font size in pixels
    titleFontSizePixels: 16,
  },
} as const;
