
// 25x25 Courier War city map!!

// All possible tile types for now
export type TileType =
  | "empty"          // building / non-walkable empty city block
  | "road"           // normal road
  | "blocked"        // blocked road/building
  | "start"          // courier starting tile
  | "delivery"       // final delivery tile
  | "trafficLight"   // traffic signal zone
  | "construction"   // slow movement road
  | "bridge"         // bridge path
  | "tunnel"         // tunnel path
  | "shortcut";      // hidden shortcut path

// now shape of 1 tile object
export interface MapTile
{
  x: number;
  y: number;
  type: TileType;
  walkable: boolean;
  movementCost: number; // higher value = slower movt later
}

// Number codes to make maps easy write
// 0 = empty / building
// 1 = normal road
// 2 = start
// 3 = delivery
// 4 = traffic light
// 5 = construction
// 6 = bridge
// 7 = tunnel
// 8 = shortcut
// 9 = blocked
type TileCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// 25x25 city map!
// map[y][x] means row 1st col 2nd

const rawMap: TileCode[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,2,1,1,1,1,4,1,1,1,0,0,0,1,1,1,1,1,4,1,1,1,1,1,0],
  [0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,1,1,0,1,0,8,8,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,0],
  [0,1,0,1,0,1,0,8,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0],
  [0,1,0,1,1,1,0,8,1,1,5,5,1,1,1,1,0,7,7,7,0,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,0,5,0,0,0,0,0,7,0,1,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,0,1,5,1,1,1,1,1,7,0,1,1,1,0,1,0],
  [0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1,0],
  [0,1,1,1,1,1,1,0,1,1,1,0,6,6,6,0,1,1,1,1,0,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,1,0,6,0,6,0,0,0,0,1,0,0,0,1,0],
  [0,1,1,1,4,0,1,1,1,0,1,1,6,0,6,1,1,1,0,1,1,1,0,1,0],
  [0,0,0,1,0,0,0,0,1,0,0,0,6,0,6,0,0,1,0,0,0,1,0,1,0],
  [0,1,1,1,1,1,1,0,1,1,1,1,6,1,6,1,0,1,1,1,1,1,0,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,5,5,5,1,1,0],
  [0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,5,0,0,0,1,0],
  [0,7,7,1,1,1,1,1,0,1,1,1,1,1,4,1,1,0,1,1,1,1,0,1,0],
  [0,7,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0],
  [0,7,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,0],
  [0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,8,8,8,1,1,1,1,1,1,1,0,1,1,1,1,1,0],
  [0,1,0,0,0,0,0,1,8,0,0,0,0,0,0,0,0,1,0,0,0,0,0,3,0],
  [0,1,1,1,1,1,1,1,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// now have to convert no code to tile type ofc
function codeToTileType(code: TileCode): TileType
{
  if (code===0) return "empty";
  if (code===1) return "road";
  if (code===2) return "start";
  if (code===3) return "delivery";
  if (code===4) return "trafficLight";
  if (code===5) return "construction";
  if (code===6) return "bridge";
  if (code===7) return "tunnel";
  if (code===8) return "shortcut";
  return "blocked";
}

// no check wehter courier can walk on it or not check code
function isWalkable(code: TileCode): boolean
{
  return code!==0 && code!==9;
}

// now setting up the movt cost
// Normal road will be 1
// Construction is slower
// Shortcut/tunnel/bridge can be slightly faster later if needed ofc
function getMovementCost(code: TileCode): number
{
  if (code===5) return 2; //construction
  if (code===4) return 1.5; //trafficlight
  if (code===6 || code===7 || code===8) return 0.8; //shortcut/tunnel/bridge
  return 1; //otherwise ofc
}

// Final generated map tiles!!
export const mapTiles: MapTile[][] = rawMap.map((row, y) =>
  row.map((code, x) => ({
    x,
    y,
    type: codeToTileType(code),
    walkable: isWalkable(code),
    movementCost: getMovementCost(code),
  }))
);

// Map dimensions
export const mapHeight = rawMap.length;
export const mapWidth = rawMap[0].length;

// Finding start tile automatically
// No hardcoding dear like 3x3 hehe
export function findStartTile(): MapTile
{
  for (const row of mapTiles)
  {
    for (const tile of row)
    {
      if (tile.type==="start")
      {
        return tile;
      }
    }
  }
  //what if not htrow error ofc
  throw new Error("Start tile not found in map!!");
}