
// Thsi will have all ts shapes taht are getting used by the V6 map system!!

import { TileType, HurdleType } from "./GameEnums";

//1st we have a point - add its coordinate dear
export interface Point {
  x: number;
  y: number;
}

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
  color: number;
  walkable: boolean;
  movementCost: number;
  routeIds: string[];
  hurdleCandidates: HurdleType[];
}

export type GameMap = MapTile[][];