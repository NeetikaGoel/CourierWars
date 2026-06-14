// So this file defines phaser level configs
export const phaserGameConfig =
{
  // Groups scene related Phaser settings!!
  scene: 
  {
    // Stores the Phaser scene key used when registering the prototype scene
    key: "MatchGameScene",
  },

  // Groups canvas related Phaser settings!!
  canvas: 
  {
    // storing the html element id where Phaser will mount the game canvas
    parentElementId: "phaser-game-container",

    // storing the fallback canvas width used when window size is not available
    widthPixelsDefault: 1280,

    // storing the fallback canvas height used when window size is not available
    heightPixelsDefault: 720,

    // tells main.ts to use current browser window size for the canvas
    windowSizeEnabled: true,

    // storing the canvas background color in editable hex string format!!
    backgroundColorHex: "#02070d",
  },

  // Groups Phaser renderer related settings!!
  renderer: {
    // storing renderer mode as a string so this config does not need to import Phaser
    type: "auto",
  },
} as const;