// Imports Phaser types used by pointer and camera conversion
import Phaser from "phaser";

// Imports isometric coordinate conversion helper
import { isometricTilePointFromWorldPointGet } from "../../iso/IsometricCoordinateCalculator";

// Imports coordinate types used by pointer resolution
import type {
  CoordinateTilePoint,
  CoordinateWorldPoint,
} from "../../types/CoordinateType";

// Imports generated map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Resolves Phaser pointer positions into city map tiles
export class PointerTileInputResolver {
  // Stores Phaser scene used for camera world point conversion
  private readonly scene: Phaser.Scene;

  // Stores generated city map used for tile lookup
  private readonly cityMapGenerated: CityMapGenerated;

  // Creates pointer tile resolver
  constructor(scene: Phaser.Scene, cityMapGenerated: CityMapGenerated) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores generated city map reference
    this.cityMapGenerated = cityMapGenerated;
  }

  // Gets world point from Phaser pointer
  pointerWorldPointGet(pointer: Phaser.Input.Pointer): CoordinateWorldPoint {
    // Stores main camera
    const camera = this.scene.cameras.main;

    // Stores pointer world point from camera transform
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);

    // Returns normalized world point shape
    return {
      // Stores world x coordinate
      x: worldPoint.x,

      // Stores world y coordinate
      y: worldPoint.y,
    };
  }

  // Gets tile point from Phaser pointer
  pointerTilePointFromPointerGet(pointer: Phaser.Input.Pointer): CoordinateTilePoint | null {
    // Stores pointer world point
    const worldPoint = this.pointerWorldPointGet(pointer);

    // Converts world point to tile point
    const tilePoint = isometricTilePointFromWorldPointGet(worldPoint);

    // Returns null when tile point is outside generated map
    if (!this.pointerTileInsideCheck(tilePoint)) {
      // Returns null for pointer outside map
      return null;
    }

    // Returns resolved tile point
    return tilePoint;
  }

  // Gets city tile from Phaser pointer
  pointerTileFromPointerGet(pointer: Phaser.Input.Pointer): CityTile | undefined {
    // Stores resolved tile point
    const tilePoint = this.pointerTilePointFromPointerGet(pointer);

    // Returns undefined when pointer does not resolve to a map tile
    if (!tilePoint) {
      // Returns missing tile
      return undefined;
    }

    // Returns city tile at resolved point
    return this.pointerTileFromPointGet(tilePoint);
  }

  // Gets city tile from world point
  pointerTileFromWorldPointGet(worldPoint: CoordinateWorldPoint): CityTile | undefined {
    // Converts world point into tile point
    const tilePoint = isometricTilePointFromWorldPointGet(worldPoint);

    // Returns undefined when tile point is outside generated map
    if (!this.pointerTileInsideCheck(tilePoint)) {
      // Returns missing tile
      return undefined;
    }

    // Returns city tile at resolved point
    return this.pointerTileFromPointGet(tilePoint);
  }

  // Gets city tile from tile point
  pointerTileFromPointGet(tilePoint: CoordinateTilePoint): CityTile | undefined {
    // Returns undefined when tile point is outside map
    if (!this.pointerTileInsideCheck(tilePoint)) {
      // Returns missing tile
      return undefined;
    }

    // Returns city tile from generated tile rows
    return this.cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }

  // Checks whether tile point is inside generated map bounds
  pointerTileInsideCheck(tilePoint: CoordinateTilePoint): boolean {
    // Checks x lower bound
    const tileXMinValid = tilePoint.x >= 0;

    // Checks y lower bound
    const tileYMinValid = tilePoint.y >= 0;

    // Checks x upper bound
    const tileXMaxValid = tilePoint.x < this.cityMapGenerated.widthTiles;

    // Checks y upper bound
    const tileYMaxValid = tilePoint.y < this.cityMapGenerated.heightTiles;

    // Returns whether all bounds are valid
    return tileXMinValid && tileYMinValid && tileXMaxValid && tileYMaxValid;
  }
}