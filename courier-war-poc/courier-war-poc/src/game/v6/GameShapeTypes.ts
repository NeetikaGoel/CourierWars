
// Thsi will have all ts shapes taht are getting used by the V6 map system!!

import { TileType, HurdleType } from "./GameEnums";


//have to use interface here coz the feature should be same!!!
//1st we have a point - add its coordinate dear
export interface Point {
  x: number;
  y: number;
}

//hehe not it will look exactly like this
//next we have area so it will have some ht width too make area ofc
export interface Area {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

//for map tiles too put here only
//so it will have multiple things lets see
export interface MapTile {
  x: number;
  y: number;
  type: TileType;
  color: string;
  walkable: boolean;
  movementCost: number;
  routeIds: string[];
  hurdleCandidates: HurdleType[];
}

//now we need 2d array of this map tile lets say its game map so it will be 2d arr of this map tile
export type GameMap = MapTile[][];