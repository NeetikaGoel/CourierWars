// Imports Phaser game engine
import Phaser from "phaser";

// Imports Phaser level config for Courier War V8 manual city map
import { phaserGameConfig } from "./game/v8/config/PhaserGameConfig";

// Imports debug display config for side panel width
import { debugDisplayConfig } from "./game/v8/config/DebugDisplayConfig";

// Imports Courier War V8 manual map prototype scene
import { ManualMapScene } from "./game/v8/scene/ManualMapScene";

// Stores side panel width
const sidePanelWidthPixels = debugDisplayConfig.sidePanel.visible
  ? debugDisplayConfig.sidePanel.widthPixels
  : 0;

// Stores game canvas width
const gameCanvasWidth = phaserGameConfig.canvas.windowSizeEnabled
  ? Math.max(640, window.innerWidth - sidePanelWidthPixels)
  : phaserGameConfig.canvas.widthPixelsDefault;

// Stores game canvas height
const gameCanvasHeight = phaserGameConfig.canvas.windowSizeEnabled
  ? window.innerHeight
  : phaserGameConfig.canvas.heightPixelsDefault;

// Defines Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  // Uses WebGL when available and Canvas otherwise
  type: Phaser.AUTO,

  // Stores canvas width
  width: gameCanvasWidth,

  // Stores canvas height
  height: gameCanvasHeight,

  // Stores canvas background color
  backgroundColor: phaserGameConfig.canvas.backgroundColorHex,

  // Stores parent HTML element id
  parent: phaserGameConfig.canvas.parentElementId,

  // Registers Courier War V8 manual map prototype scene
  scene: [ManualMapScene],
};

// Starts Phaser game
new Phaser.Game(config);

// Starts Courier War V5

// import Phaser from "phaser";
// import { GAME_CONFIG } from "./game/v6/GameConfig";
// import { GameScene } from "./game/v6/GameScene";


// const config: Phaser.Types.Core.GameConfig =
// {
//   type: Phaser.AUTO,
//   width: window.innerWidth,
//   height: window.innerHeight,
//   backgroundColor: GAME_CONFIG.canvas.backgroundColor,
//   parent: GAME_CONFIG.canvas.parentElementId,
//   scene: [GameScene],
// };

// new Phaser.Game(config);

// import Phaser from "phaser";  //importing game engine
// import { GameSceneV3 } from "./game/GameSceneV3"; //importing file

// //now loading hte game configs as per phaser
// const config: Phaser.Types.Core.GameConfig = {
//   type: Phaser.AUTO, //Use WebGL if available or Otherwise use Canvas!! 
//   //game canvas size!!!
//   width: window.innerWidth, //1350
//   height: window.innerHeight,  //750
//   backgroundColor: "#2b0962",
//   parent: "app",  //This tells Phaser to put the game inside an HTML element with id -- <div id="app"></div>
//   scene: [GameSceneV3], //This tells Phaser which scenes exist!!!
//   //scene: [LandingScene, HomeScene, GameScene, ResultScene] final one
// };

// new Phaser.Game(config);

// //This starts the game!!

// // It creates the canvas, starts Phaser, loads the scene and calls:
// // constructor()
// // create()
// // update()
// // from the scene.
