// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports city map generation builder
import { CityMapGenerationBuilder } from "./CityMapGenerationBuilder";

// Stores current generated map for local prototype
let cityMapGeneratedCurrent: CityMapGenerated | null = null;

// Creates and stores generated city map
export function cityMapGeneratedCreate(seed: number = cityMapGenerationConfig.seed.valueDefault): CityMapGenerated {
  // Creates city map generation builder
  const cityMapGenerationBuilder = new CityMapGenerationBuilder();

  // Generates city map
  const cityMapGenerated = cityMapGenerationBuilder.cityMapGenerate(seed);

  // Stores generated map in current cache
  cityMapGeneratedCurrent = cityMapGenerated;

  // Returns generated city map
  return cityMapGenerated;
}

// Gets current generated map or creates default map
export function cityMapGeneratedGet(): CityMapGenerated {
  // Creates generated map when missing
  if (!cityMapGeneratedCurrent) {
    // Generates default city map
    cityMapGeneratedCurrent = cityMapGeneratedCreate();
  }

  // Returns current generated city map
  return cityMapGeneratedCurrent;
}

// Clears current generated map
export function cityMapGeneratedClear(): void {
  // Clears generated map cache
  cityMapGeneratedCurrent = null;
}

// Gets start tile from current generated map
export function cityMapStartTileGet(): CityTile {
  // Gets current generated map
  const cityMapGenerated = cityMapGeneratedGet();

  // Returns tile at start point
  return cityMapTileAtPointGet(cityMapGenerated, cityMapGenerated.startTilePoint);
}

// Gets delivery tile from current generated map
export function cityMapDeliveryTileGet(): CityTile {
  // Gets current generated map
  const cityMapGenerated = cityMapGeneratedGet();

  // Returns tile at delivery point
  return cityMapTileAtPointGet(cityMapGenerated, cityMapGenerated.deliveryTilePoint);
}

// Gets tile at point from generated map
export function cityMapTileAtPointGet(
  cityMapGenerated: CityMapGenerated,
  tilePoint: CoordinateTilePoint
): CityTile {
  // Checks x lower bound
  const tileXMinValid = tilePoint.x >= 0;

  // Checks y lower bound
  const tileYMinValid = tilePoint.y >= 0;

  // Checks x upper bound
  const tileXMaxValid = tilePoint.x < cityMapGenerated.widthTiles;

  // Checks y upper bound
  const tileYMaxValid = tilePoint.y < cityMapGenerated.heightTiles;

  // Throws when tile point is outside map
  if (!tileXMinValid || !tileYMinValid || !tileXMaxValid || !tileYMaxValid) {
    // Throws clear tile bounds error
    throw new Error(`Tile point ${tilePoint.x},${tilePoint.y} is outside generated city map`);
  }

  // Returns tile from generated rows
  return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
}

// Gets tile at point if inside generated map
export function cityMapTileAtPointOptionalGet(
  cityMapGenerated: CityMapGenerated,
  tilePoint: CoordinateTilePoint
): CityTile | undefined {
  // Checks x lower bound
  const tileXMinValid = tilePoint.x >= 0;

  // Checks y lower bound
  const tileYMinValid = tilePoint.y >= 0;

  // Checks x upper bound
  const tileXMaxValid = tilePoint.x < cityMapGenerated.widthTiles;

  // Checks y upper bound
  const tileYMaxValid = tilePoint.y < cityMapGenerated.heightTiles;

  // Returns undefined when tile point is outside map
  if (!tileXMinValid || !tileYMinValid || !tileXMaxValid || !tileYMaxValid) {
    // Returns missing tile
    return undefined;
  }

  // Returns tile from generated rows
  return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
}