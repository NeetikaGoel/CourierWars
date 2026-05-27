
// Refactor coz too long file
// what it will do now
// only exports the generated map data!!

import { MAP_CONFIG } from "./MapConfig";
import { MapGenerator } from "./MapGenerator";

export const mapWidth = MAP_CONFIG.width;
export const mapHeight = MAP_CONFIG.height;

export const mapTiles = new MapGenerator().generate();

export function findStartTile() {
  return mapTiles[MAP_CONFIG.startPoint.y][MAP_CONFIG.startPoint.x];
}

export function findDeliveryTile() {
  return mapTiles[MAP_CONFIG.deliveryPoint.y][MAP_CONFIG.deliveryPoint.x];
}