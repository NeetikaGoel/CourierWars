// Imports map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports coordinate types used by zone calculations
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports direction type used by directional zone lookup
import { DirectionName } from "../../types/DirectionType";

// Imports city map generated shape
import type { CityMapGenerated } from "../../types/CityMapType";

// Imports zone types used by camera and placement rules
import type { CityZone, CityZoneId } from "../../types/CityZoneType";

// Builds and assigns city zones for generated maps
export class CityMapZoneBuilder {
  // Builds all city zones from configured row and column counts
  cityZoneListBuild(): CityZone[] {
    // Creates zone list
    const cityZoneList: CityZone[] = [];

    // Stores configured zone column count
    const zoneColumnCount = cityMapGenerationConfig.zone.columnCount;

    // Stores configured zone row count
    const zoneRowCount = cityMapGenerationConfig.zone.rowCount;

    // Stores base zone width in tiles
    const zoneWidthTiles = Math.floor(cityMapGenerationConfig.map.widthTiles / zoneColumnCount);

    // Stores base zone height in tiles
    const zoneHeightTiles = Math.floor(cityMapGenerationConfig.map.heightTiles / zoneRowCount);

    // Loops through zone rows
    for (let zoneRowIndex = 0; zoneRowIndex < zoneRowCount; zoneRowIndex++) {
      // Loops through zone columns
      for (let zoneColumnIndex = 0; zoneColumnIndex < zoneColumnCount; zoneColumnIndex++) {
        // Stores stable zone id
        const zoneId = this.cityZoneIdFromRowColumnGet(zoneRowIndex, zoneColumnIndex);

        // Stores starting tile x coordinate
        const startX = zoneColumnIndex * zoneWidthTiles;

        // Stores starting tile y coordinate
        const startY = zoneRowIndex * zoneHeightTiles;

        // Stores ending tile x coordinate and lets last column absorb remainder tiles
        const endX =
          zoneColumnIndex === zoneColumnCount - 1
            ? cityMapGenerationConfig.map.widthTiles - 1
            : startX + zoneWidthTiles - 1;

        // Stores ending tile y coordinate and lets last row absorb remainder tiles
        const endY =
          zoneRowIndex === zoneRowCount - 1
            ? cityMapGenerationConfig.map.heightTiles - 1
            : startY + zoneHeightTiles - 1;

        // Adds zone to list
        cityZoneList.push({
          // Stores zone id
          id: zoneId,

          // Stores zone row index
          rowIndex: zoneRowIndex,

          // Stores zone column index
          columnIndex: zoneColumnIndex,

          // Stores first x tile in zone
          startX,

          // Stores first y tile in zone
          startY,

          // Stores last x tile in zone
          endX,

          // Stores last y tile in zone
          endY,

          // Stores center tile x for camera targeting
          centerX: Math.floor((startX + endX) / 2),

          // Stores center tile y for camera targeting
          centerY: Math.floor((startY + endY) / 2),

          // Stores zone bounds shape
          bounds: {
            // Stores bounds start x
            startX,

            // Stores bounds start y
            startY,

            // Stores bounds end x
            endX,

            // Stores bounds end y
            endY,
          },
        });
      }
    }

    // Returns completed zone list
    return cityZoneList;
  }

  // Assigns zone ids to every tile in the generated map
  cityTileZoneIdAssign(cityMapGenerated: CityMapGenerated, cityZoneList: CityZone[]): void {
    // Loops through each tile row
    for (const tileRow of cityMapGenerated.tileRows) {
      // Loops through each tile in row
      for (const cityTile of tileRow) {
        // Finds zone id for current tile point
        cityTile.zoneId = this.cityZoneIdFromTilePointGet({
          // Stores tile x coordinate
          x: cityTile.x,

          // Stores tile y coordinate
          y: cityTile.y,
        });
      }
    }

    // Stores generated zone list on map
    cityMapGenerated.zoneList = cityZoneList;
  }

  // Gets stable zone id from tile point using configured map zones
  cityZoneIdFromTilePointGet(tilePoint: CoordinateTilePoint): CityZoneId {
    // Stores configured zone column count
    const zoneColumnCount = cityMapGenerationConfig.zone.columnCount;

    // Stores configured zone row count
    const zoneRowCount = cityMapGenerationConfig.zone.rowCount;

    // Stores base zone width in tiles
    const zoneWidthTiles = Math.floor(cityMapGenerationConfig.map.widthTiles / zoneColumnCount);

    // Stores base zone height in tiles
    const zoneHeightTiles = Math.floor(cityMapGenerationConfig.map.heightTiles / zoneRowCount);

    // Stores clamped zone column index
    const zoneColumnIndex = Math.max(
      0,
      Math.min(zoneColumnCount - 1, Math.floor(tilePoint.x / zoneWidthTiles))
    );

    // Stores clamped zone row index
    const zoneRowIndex = Math.max(
      0,
      Math.min(zoneRowCount - 1, Math.floor(tilePoint.y / zoneHeightTiles))
    );

    // Returns zone id from row and column
    return this.cityZoneIdFromRowColumnGet(zoneRowIndex, zoneColumnIndex);
  }

  // Gets zone object by zone id
  cityZoneFromIdGet(cityZoneList: CityZone[], cityZoneId: CityZoneId): CityZone | undefined {
    // Returns first zone matching requested id
    return cityZoneList.find((cityZone) => cityZone.id === cityZoneId);
  }

  // Gets all adjacent zone ids around the given zone including diagonal zones
  cityZoneAdjacentIdListGet(cityZoneList: CityZone[], cityZoneId: CityZoneId): CityZoneId[] {
    // Stores source zone
    const cityZoneSource = this.cityZoneFromIdGet(cityZoneList, cityZoneId);

    // Returns empty list when source zone is missing
    if (!cityZoneSource) {
      // Returns no adjacent zones for missing zone
      return [];
    }

    // Returns zones touching source zone but not source zone itself
    return cityZoneList
      .filter((cityZoneCandidate) => {
        // Stores absolute row distance from source zone
        const rowDistance = Math.abs(cityZoneCandidate.rowIndex - cityZoneSource.rowIndex);

        // Stores absolute column distance from source zone
        const columnDistance = Math.abs(cityZoneCandidate.columnIndex - cityZoneSource.columnIndex);

        // Stores whether candidate is the source zone
        const sourceSame = cityZoneCandidate.id === cityZoneSource.id;

        // Returns true when candidate touches source zone
        return !sourceSame && rowDistance <= 1 && columnDistance <= 1;
      })
      .map((cityZoneCandidate) => cityZoneCandidate.id);
  }

  // Gets zone ids in the movement direction from the source zone
  cityZoneDirectionalIdListGet(
    cityZoneList: CityZone[],
    cityZoneId: CityZoneId,
    directionName: DirectionName
  ): CityZoneId[] {
    // Stores source zone
    const cityZoneSource = this.cityZoneFromIdGet(cityZoneList, cityZoneId);

    // Returns empty list when source zone is missing
    if (!cityZoneSource) {
      // Returns no directional zones for missing zone
      return [];
    }

    // Returns empty list when direction is none
    if (directionName === DirectionName.None) {
      // Returns no directional future zones when Courier has no direction
      return [];
    }

    // Stores candidate zone list
    const cityZoneCandidateList = cityZoneList.filter((cityZoneCandidate) => {
      // Returns right side zones when Courier moves right
      if (directionName === DirectionName.Right) {
        // Checks candidate column is directly to the right
        return cityZoneCandidate.columnIndex === cityZoneSource.columnIndex + 1;
      }

      // Returns left side zones when Courier moves left
      if (directionName === DirectionName.Left) {
        // Checks candidate column is directly to the left
        return cityZoneCandidate.columnIndex === cityZoneSource.columnIndex - 1;
      }

      // Returns lower row zones when Courier moves down
      if (directionName === DirectionName.Down) {
        // Checks candidate row is directly below
        return cityZoneCandidate.rowIndex === cityZoneSource.rowIndex + 1;
      }

      // Returns upper row zones when Courier moves up
      if (directionName === DirectionName.Up) {
        // Checks candidate row is directly above
        return cityZoneCandidate.rowIndex === cityZoneSource.rowIndex - 1;
      }

      // Rejects fallback candidate
      return false;
    });

    // Returns directional zone ids
    return cityZoneCandidateList.map((cityZoneCandidate) => cityZoneCandidate.id);
  }

  // Checks whether tile point is inside a zone
  cityZoneTilePointInsideCheck(cityZone: CityZone, tilePoint: CoordinateTilePoint): boolean {
    // Checks x coordinate is inside zone bounds
    const tileXInside = tilePoint.x >= cityZone.startX && tilePoint.x <= cityZone.endX;

    // Checks y coordinate is inside zone bounds
    const tileYInside = tilePoint.y >= cityZone.startY && tilePoint.y <= cityZone.endY;

    // Returns true when both coordinates are inside
    return tileXInside && tileYInside;
  }

  // Gets stable zone id from row and column index
  private cityZoneIdFromRowColumnGet(rowIndex: number, columnIndex: number): CityZoneId {
    // Stores configured zone column count
    const zoneColumnCount = cityMapGenerationConfig.zone.columnCount;

    // Stores linear zone index
    const zoneIndex = rowIndex * zoneColumnCount + columnIndex;

    // Returns stable zone id
    return `zone-${zoneIndex}`;
  }
}