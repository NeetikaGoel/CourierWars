// Defines Phaser level settings for the Courier War V8 manual city map prototype
export const phaserGameConfig = {
  // Groups scene related Phaser settings
  scene: {
    // Stores the Phaser scene key used when registering the V8 prototype scene
    key: "ManualMapPrototypeScene",
  },

  // Groups canvas related Phaser settings
  canvas: {
    // Stores the html element id where Phaser will mount the game canvas
    parentElementId: "app",

    // Stores fallback canvas width used when window size is unavailable
    widthPixelsDefault: 1280,

    // Stores fallback canvas height used when window size is unavailable
    heightPixelsDefault: 720,

    // Tells main.ts to use current browser window size for the canvas
    windowSizeEnabled: true,

    // Stores the canvas background color
    backgroundColorHex: "#03114b",
  },

  // Groups Phaser renderer related settings
  renderer: {
    // Stores renderer mode as a string so this config does not need to import Phaser
    type: "auto",
  },
} as const;
