// 3x3 map data

//now we need custom datatype in ts for tiletype
export type TileType =
  | "empty"
  | "road"
  | "blocked"
  | "start"
  | "delivery"
  | "trafficLight"
  | "construction"
  | "bridge"
  | "tunnel"
  | "shortcut";

//now to define shape of 1 map tile
export interface MapTile {
  x: number; //grid col location
  y: number; //grid row location
  type: TileType; //type of tile it is on map
  walkable: boolean; //can u walk on it?? 
}

//so array will be map[y][x]

//so lets say dimensions of the map is 3x3
export const mapWidth = 3;
export const mapHeight = 3;

//so now creating 2D array of tiles of the map
export const mapTiles: MapTile[][] = [
  [ //this one is for rows
    { x: 0, y: 0, type: "road", walkable: true }, //this for cols
    { x: 1, y: 0, type: "road", walkable: false },
    { x: 2, y: 0, type: "road", walkable: true },
  ],
  [
    { x: 0, y: 1, type: "road", walkable: true },
    { x: 1, y: 1, type: "start", walkable: true },
    { x: 2, y: 1, type: "road", walkable: true },
  ],
  [
    { x: 0, y: 2, type: "road", walkable: true },
    { x: 1, y: 2, type: "road", walkable: true },
    { x: 2, y: 2, type: "delivery", walkable: true },
  ],
];