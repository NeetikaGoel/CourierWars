
// Refactor coz too long file
// what it will do now
// only exports the generated map data!!


//we will need map files here tehn config and generator 
import { MAP_CONFIG } from "./MapConfig";
import { MapGenerator } from "./MapGenerator"; //class that actually creates the full 2D array of tiles!!!!

//first generate the map ofc use map generator
export const mapTiles = new MapGenerator().generate();

//now just refactored functions to return start and end delivery tile coordinates on maptiles array
export function findStartTile()
{
  return mapTiles[MAP_CONFIG.startPoint.y][MAP_CONFIG.startPoint.x];
}

export function findDeliveryTile()
{
  return mapTiles[MAP_CONFIG.deliveryPoint.y][MAP_CONFIG.deliveryPoint.x];
}