
// These will be all the fixed names used across the game!!!
// enums not available
// DAMNNNNNN
//so first of all tiles type
export const TileType = {
    Building: "building",
    Road: "road",
    Start: "start",
    Delivery: "delivery",
    TrafficLight: "trafficLight",
    Construction: "construction",
    Bridge: "bridge",
    Tunnel: "tunnel",
    Shortcut: "shortcut",
    Park: "park",
    Water: "water",
} as const;
  
export type TileType = (typeof TileType)[keyof typeof TileType];


//then saboteur friendly hurdle types 
export const HurdleType = {
  RoadBlock: "roadBlock",
  TrafficJam: "trafficJam",
  ClosedGate: "closedGate",
  WrongDirectionSign: "wrongDirectionSign",
  BrokenRoad: "brokenRoad",
  MovingBarrier: "movingBarrier",
  SecurityCheckpoint: "securityCheckpoint",
} as const;

export type HurdleType = (typeof HurdleType)[keyof typeof HurdleType];


//direction names maybe
export const DirectionName = {
    Left: "left",
    Right: "right",
    Up: "up",
    Down: "down",
  } as const;
  
  export type DirectionName = (typeof DirectionName)[keyof typeof DirectionName];