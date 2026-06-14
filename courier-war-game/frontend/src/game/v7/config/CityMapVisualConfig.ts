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
    // Stores dense city block tile color
    buildingColorHex: "#2a0c12",

    // Stores neutral city ground color
    landColorHex: "#07111b",

    // Stores park tile color
    parkColorHex: "#1f7a4b",

    // Stores lake or water tile color
    waterColorHex: "#126f91",

    // Stores subtle alternate building color
    buildingAltColorHex: "#401018",

    // Stores subtle alternate park color
    parkAltColorHex: "#27945b",

    // Stores subtle alternate water color
    waterAltColorHex: "#1698bd",
  },

  // Groups road and path colors in hex string format
  road: {
    // Stores local road color
    localRoadColorHex: "#615f13",

    // Stores district road color
    districtRoadColorHex: "#7c7817",

    // Stores avenue road color
    avenueRoadColorHex: "#9c9316",

    // Stores road center mark color
    roadMarkingColorHex: "#b9ccd7",

    // Stores bridge path color
    bridgeColorHex: "#b88746",

    // Stores bridge outline color
    bridgeRailColorHex: "#f0d391",

    // Stores tunnel path subtle hint color
    tunnelColorHex: "#7e55d9",

    // Stores shortcut path subtle hint color
    shortcutColorHex: "#e0559f",
  },

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

  // Groups Courier visual colors in hex string format
  courier: {
    // Stores Courier body color
    bodyColorHex: "#20e8ff",

    // Stores Courier outline color used for visibility above assets
    outlineColorHex: "#07111f",
  },

  // Groups Saboteur hurdle visual colors in hex string format
  hurdle: {
    // Stores active hurdle outline color
    activeOutlineColorHex: "#facc15",

    // Stores road block placeholder color
    roadBlockColorHex: "#c92626",

    // Stores construction placeholder color
    constructionWorkColorHex: "#f97316",

    // Stores traffic jam placeholder color
    trafficJamColorHex: "#fb7185",

    // Stores closed gate placeholder color
    closedGateColorHex: "#8b5cf6",

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
    tileBorderColorHex: "#c6f3ff",
  },

  // Groups drawing alpha values
  alpha: {
    // Stores base tile fill alpha
    tileFill: 1,

    // Stores tile border alpha
    tileBorder: 0.12,

    // Stores current Courier zone overlay alpha
    courierZoneCurrent: 0.12,

    // Stores allowed Saboteur zone overlay alpha
    saboteurZoneAllowed: 0.08,

    // Stores hover overlay alpha
    hover: 0.35,

    // Stores selected tile overlay alpha
    selected: 0.45,

    // Stores visited tile overlay alpha
    visited: 0.78,

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

    // Stores route hint outline width
    routeHintLineWidth: 2,
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