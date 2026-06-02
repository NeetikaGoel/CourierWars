// Imports map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports coordinate type used to create tiles
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports city map generated shapes
import type { CityMapGenerated, CityMapTileRows, CityTile } from "../../types/CityMapType";

// Imports tile layer enum like values
import {
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../types/CityTileType";

// Creates an empty city map before generation systems add roads and features
export class CityMapEmptyFactory {
  // Creates a complete empty generated map shell
  cityMapEmptyCreate(seed: number = cityMapGenerationConfig.seed.valueDefault): CityMapGenerated {
    // Creates empty tile rows with building terrain
    const tileRows = this.cityTileRowsEmptyCreate();

    // Returns generated map shell with empty feature lists
    return {
      // Stores generated map width in tiles
      widthTiles: cityMapGenerationConfig.map.widthTiles,

      // Stores generated map height in tiles
      heightTiles: cityMapGenerationConfig.map.heightTiles,

      // Stores generated tile rows
      tileRows,

      // Stores empty zone list until zone builder fills it
      zoneList: [],

      // Stores empty traffic signal list until traffic planner fills it
      trafficSignalList: [],

      // Stores temporary start tile point until start planner replaces it
      startTilePoint: {
        // Stores temporary start x coordinate
        x: 0,

        // Stores temporary start y coordinate
        y: 0,
      },

      // Stores temporary delivery tile point until delivery planner replaces it
      deliveryTilePoint: {
        // Stores temporary delivery x coordinate
        x: 0,

        // Stores temporary delivery y coordinate
        y: 0,
      },

      // Stores generation metadata
      metadata: {
        // Stores seed used for generation
        seed,

        // Stores attempt count before retry logic runs
        attemptCount: 1,

        // Stores current timestamp for generated map creation
        generatedAtMs: Date.now(),

        // Stores validation warning count before validation runs
        validationWarningCount: 0,
      },
    };
  }

  // Creates two dimensional empty tile rows
  private cityTileRowsEmptyCreate(): CityMapTileRows {
    // Creates empty row list
    const tileRows: CityMapTileRows = [];

    // Loops through map y coordinates
    for (let tileY = 0; tileY < cityMapGenerationConfig.map.heightTiles; tileY++) {
      // Creates one tile row
      const tileRow: CityTile[] = [];

      // Loops through map x coordinates
      for (let tileX = 0; tileX < cityMapGenerationConfig.map.widthTiles; tileX++) {
        // Adds empty tile to current row
        tileRow.push(
          this.cityTileEmptyCreate({
            // Stores tile x coordinate
            x: tileX,

            // Stores tile y coordinate
            y: tileY,
          })
        );
      }

      // Adds completed row to map rows
      tileRows.push(tileRow);
    }

    // Returns completed tile rows
    return tileRows;
  }

  // Creates one empty city tile
  cityTileEmptyCreate(tilePoint: CoordinateTilePoint): CityTile {
    // Returns default tile with building terrain and no road path
    return {
      // Stores tile x coordinate
      x: tilePoint.x,

      // Stores tile y coordinate
      y: tilePoint.y,

      // Stores default terrain as building
      terrainType: CityTileTerrainType.Building,

      // Stores default road class as none
      roadClass: CityTileRoadClass.None,

      // Stores default path kind as none
      pathKind: CityTilePathKind.None,

      // Stores no generated features
      featureKindList: [],

      // Stores empty zone id until zone builder assigns it
      zoneId: "",

      // Stores non walkable default state
      walkable: false,

      // Stores unreachable default movement cost
      baseMovementCost: Number.POSITIVE_INFINITY,

      // Stores no tunnel entrance by default
      tunnelEntrance: false,

      // Stores no shortcut entrance by default
      shortcutEntrance: false,

      // Stores no bridge entrance by default
      bridgeEntrance: false,

      // Stores non start tile by default
      start: false,

      // Stores non delivery tile by default
      delivery: false,

      // Stores empty route id list
      routeIdList: [],

      // Stores empty hurdle candidate list
      hurdleCandidateList: [],
    };
  }
}