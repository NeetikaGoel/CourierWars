// Imports map camera configuration
import { mapCameraConfig } from "../../config/MapCameraConfig";

// Imports visual configuration for tile geometry
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports isometric coordinate helpers
import {
  isometricTileDiamondPointListGet,
  isometricTileCenterWorldPointGet,
} from "../../iso/IsometricCoordinateCalculator";

// Imports coordinate types used by camera calculations
import type {
  CoordinateTilePoint,
  CoordinateWorldBounds,
  CoordinateWorldPoint,
} from "../../types/CoordinateType";

// Imports city zone type
import type { CityZone } from "../../types/CityZoneType";

// Calculates zone based camera bounds and targets
export class CameraZoneViewCalculator {
  // Gets world bounds for one city zone
  cameraZoneWorldBoundsGet(cityZone: CityZone): CoordinateWorldBounds {
    // Stores padded start x coordinate
    const startX = Math.max(0, cityZone.startX - mapCameraConfig.zone.focusPaddingTiles);

    // Stores padded start y coordinate
    const startY = Math.max(0, cityZone.startY - mapCameraConfig.zone.focusPaddingTiles);

    // Stores padded end x coordinate
    const endX = cityZone.endX + mapCameraConfig.zone.focusPaddingTiles;

    // Stores padded end y coordinate
    const endY = cityZone.endY + mapCameraConfig.zone.focusPaddingTiles;

    // Returns world bounds from padded tile bounds
    return this.cameraTileBoundsWorldBoundsGet(startX, startY, endX, endY);
  }

  // Gets combined world bounds for multiple zones
  cameraZoneCombinedWorldBoundsGet(cityZoneList: CityZone[]): CoordinateWorldBounds {
    // Returns zero bounds when zone list is empty
    if (cityZoneList.length === 0) {
      // Returns empty world bounds
      return {
        // Stores world x coordinate
        x: 0,

        // Stores world y coordinate
        y: 0,

        // Stores world width
        width: 0,

        // Stores world height
        height: 0,
      };
    }

    // Stores first zone bounds as initial combined bounds
    const firstBounds = this.cameraZoneWorldBoundsGet(cityZoneList[0]);

    // Stores minimum x coordinate
    let minX = firstBounds.x;

    // Stores minimum y coordinate
    let minY = firstBounds.y;

    // Stores maximum x coordinate
    let maxX = firstBounds.x + firstBounds.width;

    // Stores maximum y coordinate
    let maxY = firstBounds.y + firstBounds.height;

    // Loops through remaining zones
    for (const cityZone of cityZoneList.slice(1)) {
      // Stores bounds for current zone
      const zoneBounds = this.cameraZoneWorldBoundsGet(cityZone);

      // Updates minimum x coordinate
      minX = Math.min(minX, zoneBounds.x);

      // Updates minimum y coordinate
      minY = Math.min(minY, zoneBounds.y);

      // Updates maximum x coordinate
      maxX = Math.max(maxX, zoneBounds.x + zoneBounds.width);

      // Updates maximum y coordinate
      maxY = Math.max(maxY, zoneBounds.y + zoneBounds.height);
    }

    // Returns combined bounds
    return {
      // Stores combined left x coordinate
      x: minX,

      // Stores combined top y coordinate
      y: minY,

      // Stores combined width
      width: maxX - minX,

      // Stores combined height
      height: maxY - minY,
    };
  }

  // Gets camera target world point for a zone
  cameraZoneCourierTargetGet(cityZone: CityZone): CoordinateWorldPoint {
    // Converts zone center tile into world point
    return isometricTileCenterWorldPointGet({
      // Stores zone center x coordinate
      x: cityZone.centerX,

      // Stores zone center y coordinate
      y: cityZone.centerY,
    });
  }

  // Gets zoom level required to show world bounds inside viewport
  cameraZoneZoomForBoundsGet(
    viewportWidthPixels: number,
    viewportHeightPixels: number,
    worldBounds: CoordinateWorldBounds
  ): number {
    // Returns configured start zoom when bounds are empty
    if (worldBounds.width <= 0 || worldBounds.height <= 0) {
      // Returns default start zoom
      return mapCameraConfig.zoom.start;
    }

    // Stores width based zoom
    const zoomFromWidth = viewportWidthPixels / worldBounds.width;

    // Stores height based zoom
    const zoomFromHeight = viewportHeightPixels / worldBounds.height;

    // Stores zoom that fits both width and height
    const zoomFit = Math.min(zoomFromWidth, zoomFromHeight);

    // Stores clamped zoom
    const zoomClamped = Math.max(
      mapCameraConfig.zoom.min,
      Math.min(mapCameraConfig.zoom.max, zoomFit)
    );

    // Returns clamped zoom
    return zoomClamped;
  }

  // Gets world bounds for full tile map size
  cameraMapWorldBoundsGet(widthTiles: number, heightTiles: number): CoordinateWorldBounds {
    // Returns world bounds from full map tile edges
    return this.cameraTileBoundsWorldBoundsGet(0, 0, widthTiles - 1, heightTiles - 1);
  }

  // Gets world bounds from tile bounds
  private cameraTileBoundsWorldBoundsGet(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): CoordinateWorldBounds {
    // Creates tile corner list
    const tilePointList: CoordinateTilePoint[] = [
      // Stores top left tile point
      { x: startX, y: startY },

      // Stores top right tile point
      { x: endX, y: startY },

      // Stores bottom left tile point
      { x: startX, y: endY },

      // Stores bottom right tile point
      { x: endX, y: endY },
    ];

    // Creates world point list
    const worldPointList: CoordinateWorldPoint[] = [];

    // Loops through tile corners
    for (const tilePoint of tilePointList) {
      // Gets diamond points for tile
      const diamondPointList = isometricTileDiamondPointListGet(tilePoint);

      // Adds diamond points to world point list
      worldPointList.push(...diamondPointList);
    }

    // Returns bounds for collected world points
    return this.cameraWorldBoundsFromPointListGet(worldPointList);
  }

  // Gets bounds from world point list
  private cameraWorldBoundsFromPointListGet(worldPointList: CoordinateWorldPoint[]): CoordinateWorldBounds {
    // Stores minimum x coordinate
    let minX = Number.POSITIVE_INFINITY;

    // Stores minimum y coordinate
    let minY = Number.POSITIVE_INFINITY;

    // Stores maximum x coordinate
    let maxX = Number.NEGATIVE_INFINITY;

    // Stores maximum y coordinate
    let maxY = Number.NEGATIVE_INFINITY;

    // Loops through world points
    for (const worldPoint of worldPointList) {
      // Updates minimum x coordinate
      minX = Math.min(minX, worldPoint.x);

      // Updates minimum y coordinate
      minY = Math.min(minY, worldPoint.y);

      // Updates maximum x coordinate
      maxX = Math.max(maxX, worldPoint.x);

      // Updates maximum y coordinate
      maxY = Math.max(maxY, worldPoint.y);
    }

    // Stores padding based on tile size
    const paddingPixels = cityMapVisualConfig.tile.widthPixels;

    // Returns padded world bounds
    return {
      // Stores left x coordinate
      x: minX - paddingPixels,

      // Stores top y coordinate
      y: minY - paddingPixels,

      // Stores padded width
      width: maxX - minX + paddingPixels * 2,

      // Stores padded height
      height: maxY - minY + paddingPixels * 2,
    };
  }
}