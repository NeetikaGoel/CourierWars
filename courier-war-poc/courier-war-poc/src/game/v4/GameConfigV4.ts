
// Values that can be tuned for gameplay, visuals, camera, UI, and map generation.

export const GAME_CONFIG = {
  canvas: {
    parentElementId: "app",
    backgroundColor: "#101827",
  },

  map: {
    width: 256,
    height: 256,

    tileWidth: 24,
    tileHeight: 12,

    originX: 3100,
    originY: 24,
  },

  camera: {
    startZoom: 0.18,
    minZoom: 0.08,
    maxZoom: 1.8,
    zoomStep: 0.08,

    // When pressing C, camera centers on Courier.
    courierFollowDurationMs: 350,

    // World bounds extra padding.
    worldPadding: 1200,

    // Mouse drag movement.
    dragSpeedMultiplier: 1,
  },

  movement: {
    baseMoveDurationMs: 70,

    // These make speed differences actually visible.
    movementCost: {
      building: 999,
      road: 1,
      start: 1,
      delivery: 1,
      trafficLight: 3.5,
      construction: 4,
      bridge: 0.85,
      tunnel: 0.8,
      shortcut: 0.65,
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

  courier: {
    radius: 4,
    color: 0xff0000,
    depth: 500000,
  },

  colors: {
    building: 0x1f2937,
    road: 0x64748b,
    start: 0x22c55e,
    delivery: 0xfacc15,
    trafficLight: 0xef4444,
    construction: 0xf97316,
    bridge: 0x38bdf8,
    tunnel: 0x8b5cf6,
    shortcut: 0x16a34a,
    park: 0x14532d,
    water: 0x0284c7,

    roadBlockCandidate: 0xdc2626,
    trafficJamCandidate: 0xf59e0b,
    closedGateCandidate: 0x7c3aed,
    wrongDirectionCandidate: 0xec4899,
    brokenRoadCandidate: 0x78350f,
    movingBarrierCandidate: 0xf43f5e,
    checkpointCandidate: 0x0ea5e9,

    tileBorder: 0xffffff,
    uiText: "#ffffff",
    uiBackground: "#000000",
    winBackground: "#16a34a",
  },

  alpha: {
    walkableTile: 1,
    blockedTile: 0.78,
    tileBorder: 0.08,
    marker: 0.95,
  },

  line: {
    tileBorderWidth: 1,
  },

  marker: {
    radius: 3,
    depthOffset: 10000,
  },

  ui: {
    instructionX: 24,
    instructionY: 24,
    winX: 24,
    winY: 72,

    instructionFontSize: "14px",
    winFontSize: "24px",

    paddingX: 10,
    paddingY: 6,

    depth: 900000,
  },

  assets: {
    useTileImages: false,

    basePath: "assets/tiles/",

    keys: {
      road: "road",
      building: "building",
      start: "start",
      delivery: "delivery",
      trafficLight: "traffic-light",
      construction: "construction",
      bridge: "bridge",
      tunnel: "tunnel",
      shortcut: "shortcut",
      park: "park",
      water: "water",
      courier: "courier",
    },

    files: {
      road: "road.png",
      building: "building.png",
      start: "start.png",
      delivery: "delivery.png",
      trafficLight: "traffic-light.png",
      construction: "construction.png",
      bridge: "bridge.png",
      tunnel: "tunnel.png",
      shortcut: "shortcut.png",
      park: "park.png",
      water: "water.png",
      courier: "courier.png",
    },
  },

  cityGeneration: {
    startPoint: {
      x: 4,
      y: 4,
    },

    deliveryPoint: {
      x: 250,
      y: 250,
    },

    // Main city road grid. Bigger interval = fewer roads.
    verticalRoadSpacing: 14,
    horizontalRoadSpacing: 13,

    firstVerticalRoadX: 8,
    firstHorizontalRoadY: 8,

    // Makes city feel less symmetrical.
    roadJitterEvery: 3,
    roadJitterAmount: 2,

    // Counts/variety.
    trafficLightCount: 45,
    constructionZoneCount: 18,
    roadBlockCandidateCount: 12,
    trafficJamCandidateCount: 12,
    closedGateCandidateCount: 9,
    wrongDirectionCandidateCount: 9,
    brokenRoadCandidateCount: 9,
    movingBarrierCandidateCount: 9,
    securityCheckpointCandidateCount: 9,

    parkCount: 10,
    lakeCount: 7,
    bridgeCount: 7,
    tunnelCount: 7,
    shortcutCount: 5,

    parkMinSize: 6,
    parkMaxSize: 13,
    lakeMinSize: 5,
    lakeMaxSize: 12,

    constructionMinLength: 5,
    constructionMaxLength: 11,

    bridgeLength: 9,
    tunnelLength: 12,
    shortcutLength: 22,

    connectorRoadCount: 160,
    routeCount: 12,
  },
} as const;