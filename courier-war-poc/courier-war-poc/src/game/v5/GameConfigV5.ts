// GameConfigV5.ts
// Tunable values for visuals, camera, movement, map generation and feedback

export const GAME_CONFIG = {
  canvas: {
    parentElementId: "app",
    backgroundColor: "#101827",
  },

  map: {
    width: 128,
    height: 128,
    tileWidth: 32,
    tileHeight: 16,
    originX: 2050,
    originY: 32,
  },

  camera: {
    startZoom: 0.34,
    minZoom: 0.16,
    maxZoom: 1.7,
    zoomStep: 0.07,
    courierFollowDurationMs: 350,
    worldPadding: 700,
    dragSpeedMultiplier: 1,
  },

  movement: {
    baseMoveDurationMs: 120,

    movementCost: {
      building: 999,
      road: 1,
      start: 1,
      delivery: 1,
      trafficLight: 7,
      construction: 5.5,
      bridge: 0.9,
      tunnel: 0.82,
      shortcut: 0.68,
      park: 999,
      water: 999,
    },

    walkable: {
      building: false,
      road: true,
      start: true,
      delivery: true,
      trafficLight: true,
      construction: true,
      bridge: true,
      tunnel: true,
      shortcut: true,
      park: false,
      water: false,
    },
  },

  tileFeedback: {
    enabled: true,
    messageDurationMs: 900,
    trafficLightText: "Red Traffic Light! Courier slowed",
    constructionText: "Construction Zone! Movement slowed",
    bridgeText: "Bridge Route! Slightly faster",
    tunnelText: "Tunnel Route! Faster hidden path",
    shortcutText: "Shortcut Route! Fast path",
    normalText: "",
  },

  courier: {
    radius: 5,
    color: 0xff0000,
    depth: 500000,
  },

  colors: {
    building: 0x1f2937,
    buildingAltA: 0x273449,
    buildingAltB: 0x111827,

    road: 0x64748b,
    roadAltA: 0x708399,
    roadAltB: 0x56677a,

    start: 0x22c55e,
    delivery: 0xfacc15,

    trafficLight: 0xef4444,
    construction: 0xf97316,
    bridge: 0x38bdf8,
    tunnel: 0x8b5cf6,
    shortcut: 0x16a34a,
    park: 0x14532d,
    parkAltA: 0x166534,
    parkAltB: 0x064e3b,
    water: 0x0284c7,
    waterAltA: 0x0369a1,
    waterAltB: 0x075985,

    roadBlockCandidate: 0x2563eb,
    trafficJamCandidate: 0xf59e0b,
    closedGateCandidate: 0x7c3aed,
    wrongDirectionCandidate: 0xec4899,
    brokenRoadCandidate: 0x78350f,
    movingBarrierCandidate: 0x14b8a6,
    checkpointCandidate: 0x0ea5e9,

    tileBorder: 0xffffff,
    uiText: "#ffffff",
    uiBackground: "#000000",
    winBackground: "#16a34a",
    feedbackBackground: "#111827",
  },

  alpha: {
    walkableTile: 1,
    blockedTile: 0.82,
    tileBorder: 0.1,
    marker: 0.65,
  },

  line: {
    tileBorderWidth: 1,
  },

  marker: {
    showHurdleMarkers: false,
    radius: 3,
    depthOffset: 10000,
  },

  ui: {
    instructionX: 24,
    instructionY: 24,
    winX: 24,
    winY: 72,
    feedbackX: 24,
    feedbackY: 112,

    instructionFontSize: "14px",
    winFontSize: "24px",
    feedbackFontSize: "18px",
    fontFamily: "ui-monospace, Consolas, monospace",

    paddingX: 10,
    paddingY: 6,

    depth: 900000,
    hudElementId: "courier-war-hud",
    hudInset: "0",

    instructionText:
      "Courier War V5 | 128x128 City | Arrow Keys = Move | Mouse Wheel = Zoom to Mouse | Drag = Pan | C = Center Courier",

    winText: "Courier Wins! Package Delivered!",
  },

  assets: {
    useTileImages: false,
    useRoadTileImage: true,

    basePath: "assets/tiles/",

    keys: {
      road: ["road-1", "road-2", "road-3", "road-4"],
      building: ["building-1", "building-2", "building-3", "building-4", "building-5"],
      park: ["park-1", "park-2", "park-3", "park-4"],
      water: ["water-1", "water-2", "water-3", "water-4"],
      bridge: ["bridge-1", "bridge-2", "bridge-3"],
      tunnel: ["tunnel-1", "tunnel-2", "tunnel-3"],
      shortcut: ["shortcut-1", "shortcut-2", "shortcut-3"],
      trafficLight: ["traffic-light-1", "traffic-light-2", "traffic-light-3"],
      construction: ["construction-1", "construction-2", "construction-3"],

      start: "start",
      delivery: "delivery",
      courier: "courier",
    },

    files: {
      road: ["roads/road-1.png", "roads/road-2.png", "roads/road-3.png", "roads/road-4.png"],
      building: [
        "buildings/building-1.png",
        "buildings/building-2.png",
        "buildings/building-3.png",
        "buildings/building-4.png",
        "buildings/building-5.png",
      ],
      park: ["parks/park-1.png", "parks/park-2.png", "parks/park-3.png", "parks/park-4.png"],
      water: ["water/water-1.png", "water/water-2.png", "water/water-3.png", "water/water-4.png"],
      bridge: ["bridges/bridge-1.png", "bridges/bridge-2.png", "bridges/bridge-3.png"],
      tunnel: ["tunnels/tunnel-1.png", "tunnels/tunnel-2.png", "tunnels/tunnel-3.png"],
      shortcut: ["shortcuts/shortcut-1.png", "shortcuts/shortcut-2.png", "shortcuts/shortcut-3.png"],
      trafficLight: ["traffic/traffic-light-1.png", "traffic/traffic-light-2.png", "traffic/traffic-light-3.png"],
      construction: [
        "construction/construction-1.png",
        "construction/construction-2.png",
        "construction/construction-3.png",
      ],

      start: "markers/start.png",
      delivery: "markers/delivery.png",
      courier: "",
    },

    render: {
      roadImageKey: "road-1",
      roadImagePath: "assets/tiles/roads/road-1.png",
      roadImageCropX: 218,
      roadImageCropY: 164,
      roadImageCropWidth: 44,
      roadImageCropHeight: 28,
      roadImageDisplayWidth: 32,
      roadImageDisplayHeight: 32,
      roadImageDepthOffset: 4,
      roadImageOriginX: 0.5,
      roadImageOriginY: 0.5,
      roadImageVerticalAngle: 90,

      flatOriginX: 0.5,
      flatOriginY: 0.5,
      objectOriginX: 0.5,
      objectOriginY: 0.82,
      markerOriginX: 0.5,
      markerOriginY: 0.8,

      flatOffsetY: 0,
      objectOffsetY: 6,
      markerOffsetY: 4,
      courierOffsetY: -6,

      flatDepthOffset: 0,
      objectDepthOffset: 64,
      markerDepthOffset: 96,

      flatScale: 1,
      buildingScale: 1,
      parkScale: 1,
      objectScale: 1,
      markerScale: 1,
      courierScale: 0.8,

      waterTint: 0x38bdf8,
      bridgeTint: 0xbfdbfe,
      shortcutTint: 0x86efac,
      trafficTint: 0xfff7ed,
      constructionTint: 0xffedd5,
    },
  },

  cityGeneration: {
    startPoint: {
      x: 4,
      y: 4,
    },

    deliveryPoint: {
      x: 123,
      y: 123,
    },

    safeBorder: 4,

    districtSize: 22,
    districtRoadOffsetA: 5,
    districtRoadOffsetB: 14,

    avenueSpacingA: 16,
    avenueSpacingB: 19,
    avenueSpacingC: 29,

    connectorRoadCount: 46,
    scenicConnectorCount: 20,
    routeCount: 8,
    routeWaypointCount: 5,

    trafficLightCount: 46,
    constructionZoneCount: 20,

    roadBlockCandidateCount: 12,
    trafficJamCandidateCount: 12,
    closedGateCandidateCount: 8,
    wrongDirectionCandidateCount: 8,
    brokenRoadCandidateCount: 8,
    movingBarrierCandidateCount: 8,
    securityCheckpointCandidateCount: 8,

    parkCount: 10,
    lakeCount: 7,
    bridgeCount: 7,
    tunnelCount: 10,
    shortcutCount: 8,

    parkMinSize: 6,
    parkMaxSize: 12,
    lakeMinSize: 5,
    lakeMaxSize: 11,

    constructionMinLength: 4,
    constructionMaxLength: 8,

    bridgeLength: 8,
    tunnelLength: 8,
    shortcutLength: 12,

    roadRingPadding: 1,

    seedMultiplierA: 73856093,
    seedMultiplierB: 19349663,
    seedMultiplierC: 83492791,

    roadPointSpreadSalt: 97,
    trafficSpreadSalt: 313,
    constructionSpreadSalt: 419,
    hurdleSpreadSalt: 211,

    horizontalDirectionModulo: 2,
    threeWayModulo: 3,

    routeDisplayOffset: 1,
    areaStepOffset: 1,

    areaGridColumns: 4,
    areaGridRows: 4,
    areaCellStride: 5,

    featureGridColumns: 8,
    featureGridRows: 8,
    featureCellStride: 17,
  },
} as const;
