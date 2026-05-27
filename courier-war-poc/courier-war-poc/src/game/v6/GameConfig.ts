
// Now come the values that can be changed hehe, tehy r for rendering, movt, camera, UI and colors

import { TileType } from "./GameEnums";

export const GAME_CONFIG = {
  scene: {
    key: "GameSceneV6",
  },

  canvas: {
    parentElementId: "app",
    backgroundColor: "#03114b",
  },

  map: {
    tileWidth: 32,
    tileHeight: 16,
    originX: 900,
    originY: 60,
  },

  camera: {
    startZoom: 0.36,
    minZoom: 0.16,
    maxZoom: 1.8,
    zoomStep: 0.07,
    panDurationMs: 350,
    dragSpeedMultiplier: 1,
    worldPadding: 700,
    ease: "Power2",
  },

  movement: {
    baseDurationMs: 120,
    costs: {
      [TileType.Building]: 999,
      [TileType.Road]: 1,
      [TileType.Start]: 1,
      [TileType.Delivery]: 1,
      [TileType.TrafficLight]: 7,
      [TileType.Construction]: 5.5,
      [TileType.Bridge]: 0.9,
      [TileType.Tunnel]: 0.82,
      [TileType.Shortcut]: 0.68,
      [TileType.Park]: 999,
      [TileType.Water]: 999,
    },
    walkable: {
      [TileType.Building]: false,
      [TileType.Road]: true,
      [TileType.Start]: true,
      [TileType.Delivery]: true,
      [TileType.TrafficLight]: true,
      [TileType.Construction]: true,
      [TileType.Bridge]: true,
      [TileType.Tunnel]: true,
      [TileType.Shortcut]: true,
      [TileType.Park]: false,
      [TileType.Water]: false,
    },
  },

  colors: {
    [TileType.Building]: 0x0f172a,
    [TileType.Road]: 0x475569,
    [TileType.Start]: 0x22c55e,
    [TileType.Delivery]: 0xfacc15,
    [TileType.TrafficLight]: 0xef4444,
    [TileType.Construction]: 0xf97316,
    [TileType.Bridge]: 0x38bdf8,
    [TileType.Tunnel]: 0xa855f7,
    [TileType.Shortcut]: 0x16a34a,
    [TileType.Park]: 0x15803d,
    [TileType.Water]: 0x0284c7,

    courier: 0xff0000,
    border: 0xffffff,
    uiText: "#ffffff",
    uiBackground: "#000000",
    feedbackBackground: "#111827",
    winBackground: "#16a34a",
  },

  alpha: {
    tile: 1,
    border: 0.1,
  },

  line: {
    borderWidth: 1,
  },

  courier: {
    radius: 5,
    depth: 500000,
  },

  ui: {
    instructionX: 24,
    instructionY: 24,
    feedbackX: 24,
    feedbackY: 112,
    winX: 24,
    winY: 72,

    instructionFontSize: "14px",
    feedbackFontSize: "18px",
    winFontSize: "24px",

    paddingX: 10,
    paddingY: 6,

    depth: 900000,
    hudElementId: "courier-war-hud",
    hudInset: "0",

    instructionText:
      "Courier War V6 | Arrow Keys = Move | Mouse Wheel = Zoom | Drag = Pan | C = Center Courier",

    winText: "Courier Wins! Package Delivered!",
  },

  feedback: {
    enabled: true,
    durationMs: 900,
    normalText: "",
    trafficText: "Red Traffic Light! Courier slowed",
    constructionText: "Construction Zone! Courier slowed",
    bridgeText: "Bridge Route! Slightly faster",
    tunnelText: "Tunnel Route! Faster hidden path",
    shortcutText: "Shortcut Route! Fast path",
  },
} as const;