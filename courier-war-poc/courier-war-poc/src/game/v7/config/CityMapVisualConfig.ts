// Defines editable visual colors and drawing values for the city map
export const cityMapVisualConfig = {

    // Groups isometric tile geometry values
    tile: {
      // Stores tile diamond width in pixels
      widthPixels: 32,
  
      // Stores tile diamond height in pixels
      heightPixels: 16,
  
      // Stores world x origin where tile 0,0 starts
      originWorldX: 900,
  
      // Stores world y origin where tile 0,0 starts
      originWorldY: 60,
    },
    
  // Groups base terrain colors in hex string format
  terrain: {
    // Stores building tile color
    buildingColorHex: "#341268",

    // Stores plain land tile color
    landColorHex: "#0b64e0",

    // Stores park tile color
    parkColorHex: "#0cc14e",

    // Stores water tile color
    waterColorHex: "#21cfff",
  },

  // Groups road and path colors in hex string format
  road: {
    // Stores local road color
    localRoadColorHex: "#d6d3a3",

    // Stores district road color
    districtRoadColorHex: "#e8e8b5",

    // Stores avenue road color
    avenueRoadColorHex: "#fff7b3",

    // Stores bridge path color
    bridgeColorHex: "#e48c10",

    // Stores tunnel path subtle hint color
    tunnelColorHex: "#a855f7",

    // Stores shortcut path subtle hint color
    shortcutColorHex: "#c52274",
  },

  // Groups generated feature colors in hex string format
  feature: {
    // Stores green traffic signal color
    trafficSignalGreenColorHex: "#7cc522",

    // Stores red traffic signal color
    trafficSignalRedColorHex: "#ef4444",

    // Stores tunnel entrance hint color
    tunnelEntranceColorHex: "#7f26d7",

    // Stores shortcut entrance hint color
    shortcutEntranceColorHex: "#86efac",

    // Stores bridge entrance hint color
      bridgeEntranceColorHex: "#fde68a",
    
      // Stores Courier start marker color
      startMarkerColorHex: "#22c55e",
  
      // Stores delivery marker color
      deliveryMarkerColorHex: "#ff007b",
  
      // Stores start and delivery marker outline color
      markerOutlineColorHex: "#ffffff",
  },

  // Groups Courier visual colors in hex string format
  courier: {
    // Stores Courier body color
    bodyColorHex: "#00ffee",

    // Stores Courier outline color used for visibility above assets
    outlineColorHex: "#1616ce",
  },

  // Groups Saboteur hurdle visual colors in hex string format
  hurdle: {
    // Stores active hurdle outline color
    activeOutlineColorHex: "#facc15",

    // Stores road block placeholder color
    roadBlockColorHex: "#991b1b",

    // Stores construction placeholder color
    constructionWorkColorHex: "#f97316",

    // Stores traffic jam placeholder color
    trafficJamColorHex: "#fb7185",

    // Stores closed gate placeholder color
    closedGateColorHex: "#7c3aed",

    // Stores wrong direction sign placeholder color
    wrongDirectionSignColorHex: "#f59e0b",

    // Stores broken road placeholder color
    brokenRoadColorHex: "#78350f",

    // Stores moving barrier placeholder color
    movingBarrierColorHex: "#dc2626",

    // Stores security checkpoint placeholder color
    securityCheckpointColorHex: "#2563eb",
  },

  // Groups tile overlay colors in hex string format
  overlay: {
    // Stores current Courier zone tint color
    courierZoneCurrentColorHex: "#38bdf8",

    // Stores allowed Saboteur zone tint color
    saboteurZoneAllowedColorHex: "#a3e635",

    // Stores valid hover outline color
    hoverValidColorHex: "#22c55e",

    // Stores invalid hover outline color
    hoverInvalidColorHex: "#ef4444",

    // Stores selected tile outline color
    selectedTileColorHex: "#facc15",

    // Stores visited tile tint color
    visitedTileColorHex: "#f1145e",

    // Stores default tile border color
    tileBorderColorHex: "#ffffff",
  },

  // Groups drawing alpha values
  alpha: {
    // Stores base tile fill alpha
    tileFill: 1,

    // Stores tile border alpha
    tileBorder: 0.1,

    // Stores current Courier zone overlay alpha
    courierZoneCurrent: 0.12,

    // Stores allowed Saboteur zone overlay alpha
    saboteurZoneAllowed: 0.08,

    // Stores hover overlay alpha
    hover: 0.35,

    // Stores selected tile overlay alpha
    selected: 0.45,

    // Stores visited tile overlay alpha
    visited: 1,

    // Stores active hurdle overlay alpha
    activeHurdle: 0.55,
  },

  // Groups stroke widths used by overlays and outlines
  line: {
    // Stores base tile border width
    tileBorderWidth: 1,

    // Stores hover tile outline width
    hoverOutlineWidth: 2,

    // Stores selected tile outline width
    selectedOutlineWidth: 2,

    // Stores Courier outline width
    courierOutlineWidth: 3,

    // Stores active hurdle outline width
    hurdleOutlineWidth: 3,

    // Stores zone boundary line width
    zoneBoundaryWidth: 2,
  },

  // Groups depth values so important gameplay objects stay visible
  depth: {
    // Stores base tile drawing depth offset
    tileBase: 0,

    // Stores terrain drawing depth offset
    terrain: 1,

    // Stores road drawing depth offset
    road: 2,

    // Stores feature drawing depth offset
    feature: 20,

    // Stores asset drawing depth offset
    asset: 40,

    // Stores active hurdle overlay depth
    activeHurdleOverlay: 800000,

    // Stores hover and selected tile overlay depth
    tileInteractionOverlay: 850000,

    // Stores zone overlay depth
    zoneOverlay: 820000,

    // Stores Courier outline depth
    courierOutline: 900000,

    // Stores Courier body depth
    courierBody: 900001,

    // Stores debug overlay depth
    debugOverlay: 950000,
  },
} as const;