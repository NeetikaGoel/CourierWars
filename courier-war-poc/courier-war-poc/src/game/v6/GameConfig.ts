
// Now come the values that can be changed hehe, tehy r for rendering, movt, camera, UI and colors
//these are game configs given by the game designer

//bring enums first then lets move forward
import { TileType } from "./GameEnums";

//great what do we need now
export const GAME_CONFIG = {
  scene:
  {
    //now what can we name it keep it simple or mkae it worthyyyyyy
    //shut up and keep it simple
    key: "GameSceneV6",
  },

  canvas:
  {
    parentElementId: "app",
    backgroundColor: "#03114b",
  },

  map:
  {
    //tiles size and origins 
    tileWidth: 32,
    tileHeight: 16,
    originX: 900,
    originY: 60,
  },

  camera:
  {
    //my god
    //camera settings are patheticcccccccccc
    startZoom: 0.36, //no zoom when game starts that makes sense now
    minZoom: 0.36, //max how less of zoom we want - same!!!!
    maxZoom: 1.8, //max zoom hahahahahha
    zoomStep: 0.07, //how much zoom in 1 step
    panDurationMs: 350, //big value fast zoom so zoom speed
    dragSpeedMultiplier: 1, //drag speed hahahhahhaahh
    worldPadding: 700, //extra space addition so camera doesnt go out
    ease: "Power2", //smooth animation shoujld look damn cuteeee!!!!!
  },

  //okay it wasnt that hard, yk
  //i can doooo it!!!!!!!!!!!!!!!!!

  movement:
  {
    //my god no this is more pathetic now
    baseDurationMs: 120,
    costs:
    {
      //how much movt time
      [TileType.Building]: 999, //coz ofc not possible
      [TileType.Road]: 1, //hehe simple sober cute
      [TileType.Start]: 1, //hehe simple sober cute
      [TileType.Delivery]: 1, //hehe simple sober cute
      [TileType.TrafficLight]: 7, //bad traffic lights
      [TileType.Construction]: 5.5, //its there for good so okayyy little bad only
      [TileType.Bridge]: 0.9, //speeedddddd
      [TileType.Tunnel]: 0.7,  ///sppeeedddd
      [TileType.Shortcut]: 0.5, ///omg wowwwww
      [TileType.Park]: 999, //no means no
      [TileType.Water]: 999, //no means no
    },

    //what else
    //walkable also put here
    walkable:
    {
      //just true/false
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

  //colours time!!!
  colors:
  {
    [TileType.Building]: "#540f4e",
    [TileType.Road]: "#e8e8b5",
    [TileType.Start]: "#22c55e",
    [TileType.Delivery]: "#facc15",
    [TileType.TrafficLight]: "#ef4444",
    [TileType.Construction]: "#f97316",
    [TileType.Bridge]: "#6838f8",
    [TileType.Tunnel]: "#a855f7",
    [TileType.Shortcut]: "#0cb048",
    [TileType.Park]: "#15803d",
    [TileType.Water]: "#00c8ff",

    courier: "#ff0000",
    border: "#ffffff",
    uiText: "#ffffff",
    uiBackground: "#000000",
    feedbackBackground: "#111827",
    winBackground: "#16a34a",
  },

  //opacity also
  alpha:
  {
    tile: 1,
    border: 0.1,
  },

  //stroke of border
  line:
  {
    borderWidth: 1,
  },

  //how much courier hehe
  courier:
  {
    radius: 5,
    depth: 500000,
  },

  //other imp things
  ui:
  {
    //where hud text
    instructionX: 24,
    instructionY: 24,

    //where feedback text
    feedbackX: 24,
    feedbackY: 112,

    //where u won text??
    winX: 24,
    winY: 72,

    //font sizes
    instructionFontSize: "14px",
    feedbackFontSize: "18px",
    winFontSize: "24px",

    //padding
    paddingX: 10,
    paddingY: 6,

    //others 
    depth: 900000,
    hudElementId: "courier-war-hud",
    hudInset: "0",

    instructionText:
      "Courier War V6 100x100 | Arrow Keys = Move | Mouse Wheel = Zoom | Drag = Pan | C = Center Courier",

    winText: "Courier Wins! Package Delivered!!",
  },

  //what feedback text for hurdles
  feedback:
  {
    enabled: true,
    durationMs: 900,
    normalText: "",
    trafficText: "Red Traffic Light! Courier slowed ....",
    constructionText: "Construction Zone! Courier slowed ....",
    bridgeText: "Bridge Route! Slightly faster !!!!",
    tunnelText: "Tunnel Route! Faster hidden path !!!!",
    shortcutText: "Shortcut Route! Fast path !!!",
  },
} as const;