// Imports city map generation configuration
import { cityMapGenerationConfig } from "../../config/CityMapGenerationConfig";

// Imports Courier movement configuration for road movement costs
import { courierMovementConfig } from "../../config/CourierMovementConfig";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and city tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports tile layer values
import {
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../types/CityTileType";

// Imports seeded random generator type
import type { RandomSeededGenerator } from "./RandomSeededGenerator";

// Imports road priority rule helper
import { cityMapRoadClassReplaceCheck } from "./CityMapRoadPriorityRules";

// Defines road drawing orientation values
const CityMapRoadDrawOrientation = {
  // Represents road segment moving horizontally
  Horizontal: "horizontal",

  // Represents road segment moving vertically
  Vertical: "vertical",
} as const;

// Creates road drawing orientation union type
type CityMapRoadDrawOrientation =
  (typeof CityMapRoadDrawOrientation)[keyof typeof CityMapRoadDrawOrientation];

// Generates planned roads for the city map
export class CityMapRoadNetworkGenerator {
  // Generates complete road network for the city map
  cityMapRoadNetworkGenerate(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): void {
    // Draws major avenue roads first because they have highest priority
    this.cityMapAvenueRoadsDraw(cityMapGenerated, randomSeededGenerator);

    // Draws district roads after avenues
    this.cityMapDistrictRoadsDraw(cityMapGenerated, randomSeededGenerator);

    // Draws local roads after district roads
    this.cityMapLocalRoadsDraw(cityMapGenerated, randomSeededGenerator);

    // Ensures a connected main corridor exists from upper city to lower city
    this.cityMapImportantCorridorEnsure(cityMapGenerated);
  }

  // Draws major avenue roads across the whole city
  cityMapAvenueRoadsDraw(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): void {
    // Stores safe border tile count
    const safeBorderTiles = cityMapGenerationConfig.map.safeBorderTiles;

    // Stores maximum usable x coordinate
    const tileXMax = cityMapGenerated.widthTiles - safeBorderTiles - 1;

    // Stores maximum usable y coordinate
    const tileYMax = cityMapGenerated.heightTiles - safeBorderTiles - 1;

    // Stores target vertical avenue count
    const avenueVerticalCount = cityMapGenerationConfig.road.avenue.verticalCountTarget;

    // Stores target horizontal avenue count
    const avenueHorizontalCount = cityMapGenerationConfig.road.avenue.horizontalCountTarget;

    // Stores avenue road width
    const avenueWidthTiles = cityMapGenerationConfig.road.avenue.widthTiles;

    // Draws vertical avenues
    for (let avenueIndex = 1; avenueIndex <= avenueVerticalCount; avenueIndex++) {
      // Stores evenly distributed base x coordinate
      const tileXBase = Math.floor(
        (cityMapGenerated.widthTiles * avenueIndex) / (avenueVerticalCount + 1)
      );

      // Stores small seeded offset to avoid perfect grid appearance
      const tileXOffset = randomSeededGenerator.numberIntegerGet(-2, 2);

      // Stores final clamped x coordinate
      const tileX = this.cityMapNumberClamp(tileXBase + tileXOffset, safeBorderTiles, tileXMax);

      // Draws one vertical avenue
      this.cityMapRoadLineDraw(
        cityMapGenerated,
        {
          // Stores start x coordinate
          x: tileX,

          // Stores start y coordinate
          y: safeBorderTiles,
        },
        {
          // Stores end x coordinate
          x: tileX,

          // Stores end y coordinate
          y: tileYMax,
        },
        CityTileRoadClass.AvenueRoad,
        avenueWidthTiles,
        `avenue-vertical-${avenueIndex}`
      );
    }

    // Draws horizontal avenues
    for (let avenueIndex = 1; avenueIndex <= avenueHorizontalCount; avenueIndex++) {
      // Stores evenly distributed base y coordinate
      const tileYBase = Math.floor(
        (cityMapGenerated.heightTiles * avenueIndex) / (avenueHorizontalCount + 1)
      );

      // Stores small seeded offset to avoid perfect grid appearance
      const tileYOffset = randomSeededGenerator.numberIntegerGet(-2, 2);

      // Stores final clamped y coordinate
      const tileY = this.cityMapNumberClamp(tileYBase + tileYOffset, safeBorderTiles, tileYMax);

      // Draws one horizontal avenue
      this.cityMapRoadLineDraw(
        cityMapGenerated,
        {
          // Stores start x coordinate
          x: safeBorderTiles,

          // Stores start y coordinate
          y: tileY,
        },
        {
          // Stores end x coordinate
          x: tileXMax,

          // Stores end y coordinate
          y: tileY,
        },
        CityTileRoadClass.AvenueRoad,
        avenueWidthTiles,
        `avenue-horizontal-${avenueIndex}`
      );
    }
  }

  // Draws medium district roads inside each zone
  cityMapDistrictRoadsDraw(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): void {
    // Stores district road width
    const districtRoadWidthTiles = cityMapGenerationConfig.road.district.widthTiles;

    // Loops through generated zones
    for (const cityZone of cityMapGenerated.zoneList) {
      // Stores target district road count per zone
      const districtRoadCount = cityMapGenerationConfig.road.district.roadCountPerZoneTarget;

      // Draws district road pairs inside the zone
      for (let districtRoadIndex = 0; districtRoadIndex < districtRoadCount; districtRoadIndex++) {
        // Stores horizontal district road y coordinate
        const horizontalY = randomSeededGenerator.numberIntegerGet(
          cityZone.startY + 5,
          cityZone.endY - 5
        );

        // Stores vertical district road x coordinate
        const verticalX = randomSeededGenerator.numberIntegerGet(
          cityZone.startX + 5,
          cityZone.endX - 5
        );

        // Draws horizontal district road inside zone
        this.cityMapRoadLineDraw(
          cityMapGenerated,
          {
            // Stores start x coordinate
            x: cityZone.startX + 2,

            // Stores start y coordinate
            y: horizontalY,
          },
          {
            // Stores end x coordinate
            x: cityZone.endX - 2,

            // Stores end y coordinate
            y: horizontalY,
          },
          CityTileRoadClass.DistrictRoad,
          districtRoadWidthTiles,
          `district-zone-${cityZone.id}-horizontal-${districtRoadIndex}`
        );

        // Draws vertical district road inside zone
        this.cityMapRoadLineDraw(
          cityMapGenerated,
          {
            // Stores start x coordinate
            x: verticalX,

            // Stores start y coordinate
            y: cityZone.startY + 2,
          },
          {
            // Stores end x coordinate
            x: verticalX,

            // Stores end y coordinate
            y: cityZone.endY - 2,
          },
          CityTileRoadClass.DistrictRoad,
          districtRoadWidthTiles,
          `district-zone-${cityZone.id}-vertical-${districtRoadIndex}`
        );
      }
    }
  }

  // Draws smaller local roads inside each zone
  cityMapLocalRoadsDraw(
    cityMapGenerated: CityMapGenerated,
    randomSeededGenerator: RandomSeededGenerator
  ): void {
    // Stores local road width
    const localRoadWidthTiles = cityMapGenerationConfig.road.local.widthTiles;

    // Loops through generated zones
    for (const cityZone of cityMapGenerated.zoneList) {
      // Stores local branch count per zone
      const localBranchCount = cityMapGenerationConfig.road.local.branchCountPerZoneTarget;

      // Draws local branches
      for (let localRoadIndex = 0; localRoadIndex < localBranchCount; localRoadIndex++) {
        // Stores whether local branch is horizontal
        const horizontalBranch = randomSeededGenerator.booleanChanceCheck(0.5);

        // Stores branch start point
        const startPoint = {
          // Stores start x coordinate
          x: randomSeededGenerator.numberIntegerGet(cityZone.startX + 4, cityZone.endX - 4),

          // Stores start y coordinate
          y: randomSeededGenerator.numberIntegerGet(cityZone.startY + 4, cityZone.endY - 4),
        };

        // Stores branch length
        const branchLengthTiles = randomSeededGenerator.numberIntegerGet(7, 16);

        // Stores branch end point
        const endPoint = horizontalBranch
          ? {
              // Stores end x coordinate
              x: this.cityMapNumberClamp(
                startPoint.x + branchLengthTiles,
                cityZone.startX + 2,
                cityZone.endX - 2
              ),

              // Stores end y coordinate
              y: startPoint.y,
            }
          : {
              // Stores end x coordinate
              x: startPoint.x,

              // Stores end y coordinate
              y: this.cityMapNumberClamp(
                startPoint.y + branchLengthTiles,
                cityZone.startY + 2,
                cityZone.endY - 2
              ),
            };

        // Draws local road branch
        this.cityMapRoadLineDraw(
          cityMapGenerated,
          startPoint,
          endPoint,
          CityTileRoadClass.LocalRoad,
          localRoadWidthTiles,
          `local-zone-${cityZone.id}-${localRoadIndex}`
        );
      }
    }
  }

  // Draws a Manhattan road line with configured road width
  cityMapRoadLineDraw(
    cityMapGenerated: CityMapGenerated,
    startPoint: CoordinateTilePoint,
    endPoint: CoordinateTilePoint,
    roadClass: CityTileRoadClass,
    roadWidthTiles: number,
    routeId: string
  ): void {
    // Stores current x coordinate
    let currentX = startPoint.x;

    // Stores current y coordinate
    let currentY = startPoint.y;

    // Draws horizontal part first
    while (currentX !== endPoint.x) {
      // Sets horizontal road width area at current point
      this.cityMapRoadTileAreaSet(
        cityMapGenerated,
        {
          // Stores current x coordinate
          x: currentX,

          // Stores current y coordinate
          y: currentY,
        },
        roadClass,
        roadWidthTiles,
        CityMapRoadDrawOrientation.Horizontal,
        routeId
      );

      // Moves current x toward target x
      currentX += this.cityMapStepGet(currentX, endPoint.x);
    }

    // Draws vertical part second
    while (currentY !== endPoint.y) {
      // Sets vertical road width area at current point
      this.cityMapRoadTileAreaSet(
        cityMapGenerated,
        {
          // Stores current x coordinate
          x: currentX,

          // Stores current y coordinate
          y: currentY,
        },
        roadClass,
        roadWidthTiles,
        CityMapRoadDrawOrientation.Vertical,
        routeId
      );

      // Moves current y toward target y
      currentY += this.cityMapStepGet(currentY, endPoint.y);
    }

    // Sets final tile using square corner coverage
    this.cityMapRoadCornerTileAreaSet(
      cityMapGenerated,
      {
        // Stores final x coordinate
        x: currentX,

        // Stores final y coordinate
        y: currentY,
      },
      roadClass,
      roadWidthTiles,
      routeId
    );
  }

  // Ensures one important connected corridor exists
  cityMapImportantCorridorEnsure(cityMapGenerated: CityMapGenerated): void {
    // Stores safe border count
    const safeBorderTiles = cityMapGenerationConfig.map.safeBorderTiles;

    // Stores map midpoint x coordinate
    const midpointX = Math.floor(cityMapGenerated.widthTiles / 2);

    // Stores map midpoint y coordinate
    const midpointY = Math.floor(cityMapGenerated.heightTiles / 2);

    // Stores corridor end x coordinate
    const endX = cityMapGenerated.widthTiles - safeBorderTiles - 1;

    // Stores corridor end y coordinate
    const endY = cityMapGenerated.heightTiles - safeBorderTiles - 1;

    // Draws first corridor segment
    this.cityMapRoadLineDraw(
      cityMapGenerated,
      {
        // Stores start x coordinate
        x: safeBorderTiles,

        // Stores start y coordinate
        y: safeBorderTiles,
      },
      {
        // Stores end x coordinate
        x: midpointX,

        // Stores end y coordinate
        y: safeBorderTiles,
      },
      CityTileRoadClass.DistrictRoad,
      cityMapGenerationConfig.road.district.widthTiles,
      "important-corridor-a"
    );

    // Draws second corridor segment
    this.cityMapRoadLineDraw(
      cityMapGenerated,
      {
        // Stores start x coordinate
        x: midpointX,

        // Stores start y coordinate
        y: safeBorderTiles,
      },
      {
        // Stores end x coordinate
        x: midpointX,

        // Stores end y coordinate
        y: midpointY,
      },
      CityTileRoadClass.DistrictRoad,
      cityMapGenerationConfig.road.district.widthTiles,
      "important-corridor-b"
    );

    // Draws third corridor segment
    this.cityMapRoadLineDraw(
      cityMapGenerated,
      {
        // Stores start x coordinate
        x: midpointX,

        // Stores start y coordinate
        y: midpointY,
      },
      {
        // Stores end x coordinate
        x: endX,

        // Stores end y coordinate
        y: midpointY,
      },
      CityTileRoadClass.DistrictRoad,
      cityMapGenerationConfig.road.district.widthTiles,
      "important-corridor-c"
    );

    // Draws final corridor segment
    this.cityMapRoadLineDraw(
      cityMapGenerated,
      {
        // Stores start x coordinate
        x: endX,

        // Stores start y coordinate
        y: midpointY,
      },
      {
        // Stores end x coordinate
        x: endX,

        // Stores end y coordinate
        y: endY,
      },
      CityTileRoadClass.DistrictRoad,
      cityMapGenerationConfig.road.district.widthTiles,
      "important-corridor-d"
    );
  }

  // Sets road tiles around a center point according to road orientation and width
  private cityMapRoadTileAreaSet(
    cityMapGenerated: CityMapGenerated,
    centerPoint: CoordinateTilePoint,
    roadClass: CityTileRoadClass,
    roadWidthTiles: number,
    roadOrientation: CityMapRoadDrawOrientation,
    routeId: string
  ): void {
    // Stores offset list for road width
    const roadOffsetList = this.cityMapRoadWidthOffsetListGet(roadWidthTiles);

    // Loops through road offsets
    for (const roadOffset of roadOffsetList) {
      // Stores tile point for horizontal road width
      const horizontalTilePoint = {
        // Stores x coordinate unchanged for horizontal width
        x: centerPoint.x,

        // Stores y coordinate offset for horizontal width
        y: centerPoint.y + roadOffset,
      };

      // Stores tile point for vertical road width
      const verticalTilePoint = {
        // Stores x coordinate offset for vertical width
        x: centerPoint.x + roadOffset,

        // Stores y coordinate unchanged for vertical width
        y: centerPoint.y,
      };

      // Sets horizontal road width tile
      if (roadOrientation === CityMapRoadDrawOrientation.Horizontal) {
        // Sets road tile at horizontal width point
        this.cityMapRoadTileSet(cityMapGenerated, horizontalTilePoint, roadClass, routeId);
      }

      // Sets vertical road width tile
      if (roadOrientation === CityMapRoadDrawOrientation.Vertical) {
        // Sets road tile at vertical width point
        this.cityMapRoadTileSet(cityMapGenerated, verticalTilePoint, roadClass, routeId);
      }
    }
  }

  // Sets wider corner coverage where road direction changes
  private cityMapRoadCornerTileAreaSet(
    cityMapGenerated: CityMapGenerated,
    centerPoint: CoordinateTilePoint,
    roadClass: CityTileRoadClass,
    roadWidthTiles: number,
    routeId: string
  ): void {
    // Stores offset list for road width
    const roadOffsetList = this.cityMapRoadWidthOffsetListGet(roadWidthTiles);

    // Loops through x offsets
    for (const offsetX of roadOffsetList) {
      // Loops through y offsets
      for (const offsetY of roadOffsetList) {
        // Sets corner road tile
        this.cityMapRoadTileSet(
          cityMapGenerated,
          {
            // Stores corner x coordinate
            x: centerPoint.x + offsetX,

            // Stores corner y coordinate
            y: centerPoint.y + offsetY,
          },
          roadClass,
          routeId
        );
      }
    }
  }

  // Gets road width offsets with exact tile count
  private cityMapRoadWidthOffsetListGet(roadWidthTiles: number): number[] {
    // Stores safe integer road width
    const roadWidthTilesSafe = Math.max(1, Math.floor(roadWidthTiles));

    // Stores starting offset for odd and even road widths
    const offsetStart = roadWidthTilesSafe % 2 === 0 ? 0 : -Math.floor(roadWidthTilesSafe / 2);

    // Creates offset list
    const offsetList: number[] = [];

    // Builds offset list
    for (let offsetIndex = 0; offsetIndex < roadWidthTilesSafe; offsetIndex++) {
      // Adds offset value
      offsetList.push(offsetStart + offsetIndex);
    }

    // Returns width offset list
    return offsetList;
  }

  // Sets one tile as road while respecting road priority
  cityMapRoadTileSet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint,
    roadClass: CityTileRoadClass,
    routeId: string
  ): void {
    // Gets target city tile
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Stops when tile is outside map
    if (!cityTile) {
      // Ends road tile placement
      return;
    }

    // Adds route id even if tile cannot be replaced
    this.cityTileRouteIdAdd(cityTile, routeId);

    // Stops when lower priority road tries to replace higher priority road
    if (!cityMapRoadClassReplaceCheck(cityTile.roadClass, roadClass)) {
      // Ends without downgrading existing road
      return;
    }

    // Stops when tile is water
    if (cityTile.terrainType === CityTileTerrainType.Water) {
      // Ends because roads cannot directly overwrite water
      return;
    }

    // Stops when tile is park
    if (cityTile.terrainType === CityTileTerrainType.Park) {
      // Ends because roads should not cut through parks
      return;
    }

    // Converts terrain to land for surface road
    cityTile.terrainType = CityTileTerrainType.Land;

    // Sets road class
    cityTile.roadClass = roadClass;

    // Sets normal road path
    cityTile.pathKind = CityTilePathKind.Road;

    // Marks tile walkable
    cityTile.walkable = true;

    // Sets base movement cost
    cityTile.baseMovementCost = this.cityMapRoadMovementCostGet(roadClass);
  }

  // Gets movement cost for a road class
  private cityMapRoadMovementCostGet(roadClass: CityTileRoadClass): number {
    // Returns local road movement cost
    if (roadClass === CityTileRoadClass.LocalRoad) {
      // Returns configured local road cost
      return courierMovementConfig.cost.localRoad;
    }

    // Returns district road movement cost
    if (roadClass === CityTileRoadClass.DistrictRoad) {
      // Returns configured district road cost
      return courierMovementConfig.cost.districtRoad;
    }

    // Returns avenue road movement cost
    if (roadClass === CityTileRoadClass.AvenueRoad) {
      // Returns configured avenue road cost
      return courierMovementConfig.cost.avenueRoad;
    }

    // Returns blocked movement cost for no road
    return Number.POSITIVE_INFINITY;
  }

  // Adds route id to tile when missing
  private cityTileRouteIdAdd(cityTile: CityTile, routeId: string): void {
    // Checks whether route id already exists
    const routeIdExists = cityTile.routeIdList.includes(routeId);

    // Adds route id when missing
    if (!routeIdExists) {
      // Pushes route id into route list
      cityTile.routeIdList.push(routeId);
    }
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

    // Returns undefined when outside map
    if (!tileXMinValid || !tileYMinValid || !tileXMaxValid || !tileYMaxValid) {
      // Returns missing tile
      return undefined;
    }

    // Returns tile from generated map rows
    return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }

  // Gets step direction from current value toward target value
  private cityMapStepGet(currentValue: number, targetValue: number): number {
    // Returns positive step
    if (currentValue < targetValue) {
      // Returns one
      return 1;
    }

    // Returns negative step
    if (currentValue > targetValue) {
      // Returns negative one
      return -1;
    }

    // Returns zero when values match
    return 0;
  }

  // Clamps number into min max range
  private cityMapNumberClamp(value: number, valueMin: number, valueMax: number): number {
    // Returns clamped value
    return Math.max(valueMin, Math.min(valueMax, value));
  }
}