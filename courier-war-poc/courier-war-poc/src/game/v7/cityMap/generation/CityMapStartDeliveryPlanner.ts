// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports tile path kind
import { CityTilePathKind } from "../../types/CityTileType";

// Places Courier start and delivery tiles
export class CityMapStartDeliveryPlanner {
  // Places start and delivery on valid normal road tiles
  cityMapStartDeliveryPlace(cityMapGenerated: CityMapGenerated): void {
    // Finds start tile point near preferred start zone
    const startTilePoint = this.cityMapStartTileFind(cityMapGenerated);

    // Finds delivery tile point near preferred delivery zone
    const deliveryTilePoint = this.cityMapDeliveryTileFind(cityMapGenerated, startTilePoint);

    // Sets start tile flag
    this.cityMapStartTileSet(cityMapGenerated, startTilePoint);

    // Sets delivery tile flag
    this.cityMapDeliveryTileSet(cityMapGenerated, deliveryTilePoint);

    // Stores start tile point on generated map
    cityMapGenerated.startTilePoint = startTilePoint;

    // Stores delivery tile point on generated map
    cityMapGenerated.deliveryTilePoint = deliveryTilePoint;
  }

  // Finds start tile near preferred start zone
  cityMapStartTileFind(cityMapGenerated: CityMapGenerated): CoordinateTilePoint {
    // Finds preferred start zone from generated zone list
    const startZone = cityMapGenerated.zoneList.find(
      (cityZone) => cityZone.id === cityMapGenerationConfig.startDelivery.startZoneIdPreferred
    );

    // Stores preferred tile point from zone center or safe border fallback
    const preferredTilePoint = startZone
      ? {
          // Stores preferred x coordinate
          x: startZone.centerX,

          // Stores preferred y coordinate
          y: startZone.centerY,
        }
      : {
          // Stores fallback x coordinate
          x: cityMapGenerationConfig.map.safeBorderTiles,

          // Stores fallback y coordinate
          y: cityMapGenerationConfig.map.safeBorderTiles,
        };

    // Returns nearest valid start tile
    return this.cityMapNearestValidRoadTileFind(cityMapGenerated, preferredTilePoint);
  }

  // Finds delivery tile near preferred delivery zone
  cityMapDeliveryTileFind(
    cityMapGenerated: CityMapGenerated,
    startTilePoint: CoordinateTilePoint
  ): CoordinateTilePoint {
    // Finds preferred delivery zone from generated zone list
    const deliveryZone = cityMapGenerated.zoneList.find(
      (cityZone) => cityZone.id === cityMapGenerationConfig.startDelivery.deliveryZoneIdPreferred
    );

    // Stores preferred tile point from zone center or bottom right fallback
    const preferredTilePoint = deliveryZone
      ? {
          // Stores preferred x coordinate
          x: deliveryZone.centerX,

          // Stores preferred y coordinate
          y: deliveryZone.centerY,
        }
      : {
          // Stores fallback x coordinate
          x: cityMapGenerated.widthTiles - cityMapGenerationConfig.map.safeBorderTiles - 1,

          // Stores fallback y coordinate
          y: cityMapGenerated.heightTiles - cityMapGenerationConfig.map.safeBorderTiles - 1,
        };

    // Returns nearest valid delivery tile away from start tile
    return this.cityMapNearestValidRoadTileFind(cityMapGenerated, preferredTilePoint, startTilePoint);
  }

  // Finds nearest valid road tile around preferred point
  cityMapNearestValidRoadTileFind(
    cityMapGenerated: CityMapGenerated,
    preferredTilePoint: CoordinateTilePoint,
    tilePointAvoid?: CoordinateTilePoint
  ): CoordinateTilePoint {
    // Stores maximum search radius
    const radiusMax = cityMapGenerationConfig.startDelivery.validRoadSearchRadiusTilesMax;

    // Searches outward by increasing radius
    for (let radius = 0; radius <= radiusMax; radius++) {
      // Loops through x offsets
      for (let offsetX = -radius; offsetX <= radius; offsetX++) {
        // Loops through y offsets
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
          // Stores candidate tile point
          const candidatePoint = {
            // Stores candidate x coordinate
            x: preferredTilePoint.x + offsetX,

            // Stores candidate y coordinate
            y: preferredTilePoint.y + offsetY,
          };

          // Skips avoided point when provided
          if (
            tilePointAvoid &&
            candidatePoint.x === tilePointAvoid.x &&
            candidatePoint.y === tilePointAvoid.y
          ) {
            // Continues to next candidate
            continue;
          }

          // Gets candidate city tile
          const cityTile = this.cityMapTileGet(cityMapGenerated, candidatePoint);

          // Skips missing tile
          if (!cityTile) {
            // Continues to next candidate
            continue;
          }

          // Returns candidate when tile is valid
          if (this.cityMapStartDeliveryTileValidCheck(cityTile)) {
            // Returns valid candidate tile point
            return candidatePoint;
          }
        }
      }
    }

    // Throws when no valid start or delivery tile can be found
    throw new Error("Unable to find valid start or delivery tile");
  }

  // Sets start flag on selected tile
  cityMapStartTileSet(cityMapGenerated: CityMapGenerated, tilePoint: CoordinateTilePoint): void {
    // Gets tile at selected point
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Throws when start tile is missing
    if (!cityTile) {
      // Throws clear start tile error
      throw new Error("Start tile point is outside city map");
    }

    // Sets start flag
    cityTile.start = true;

    // Clears delivery flag
    cityTile.delivery = false;
  }

  // Sets delivery flag on selected tile
  cityMapDeliveryTileSet(cityMapGenerated: CityMapGenerated, tilePoint: CoordinateTilePoint): void {
    // Gets tile at selected point
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Throws when delivery tile is missing
    if (!cityTile) {
      // Throws clear delivery tile error
      throw new Error("Delivery tile point is outside city map");
    }

    // Sets delivery flag
    cityTile.delivery = true;

    // Clears start flag
    cityTile.start = false;
  }

  // Checks whether tile is valid for start or delivery
  private cityMapStartDeliveryTileValidCheck(cityTile: CityTile): boolean {
    // Rejects non walkable tile
    if (!cityTile.walkable) {
      // Returns false for blocked tile
      return false;
    }

    // Rejects non normal road path
    if (cityTile.pathKind !== CityTilePathKind.Road) {
      // Returns false because start and delivery should be on visible roads
      return false;
    }

    // Rejects traffic signal tile
    if (cityTile.trafficSignalId) {
      // Returns false because start and delivery should not be on signals
      return false;
    }

    // Rejects tunnel entrance tile
    if (cityTile.tunnelEntrance) {
      // Returns false because start and delivery should not sit on tunnel entrance
      return false;
    }

    // Rejects shortcut entrance tile
    if (cityTile.shortcutEntrance) {
      // Returns false because start and delivery should not sit on shortcut entrance
      return false;
    }

    // Rejects bridge entrance tile
    if (cityTile.bridgeEntrance) {
      // Returns false because start and delivery should not sit on bridge entrance
      return false;
    }

    // Returns true when tile is valid
    return true;
  }

  // Gets tile from generated map
  private cityMapTileGet(
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

    // Returns undefined when point is outside map
    if (!tileXMinValid || !tileYMinValid || !tileXMaxValid || !tileYMaxValid) {
      // Returns missing tile
      return undefined;
    }

    // Returns tile from generated rows
    return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }
}