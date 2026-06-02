// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports tile layer values
import { CityTilePathKind, CityTileRoadClass } from "../../types/CityTileType";

// Defines detected road intersection data
export interface CityMapRoadIntersection {
  // Stores stable intersection id
  id: string;

  // Stores intersection tile point
  tilePoint: CoordinateTilePoint;

  // Stores connected road classes around this intersection
  roadClassList: CityTileRoadClass[];

  // Stores total road connection degree
  roadConnectionDegree: number;

  // Stores whether horizontal road connection exists
  horizontalConnection: boolean;

  // Stores whether vertical road connection exists
  verticalConnection: boolean;
}

// Detects sensible road intersections for traffic signal planning
export class CityMapRoadIntersectionDetector {
  // Detects all valid road intersections
  cityMapRoadIntersectionListDetect(cityMapGenerated: CityMapGenerated): CityMapRoadIntersection[] {
    // Creates detected intersection list
    const intersectionList: CityMapRoadIntersection[] = [];

    // Loops through tile rows
    for (const tileRow of cityMapGenerated.tileRows) {
      // Loops through tiles
      for (const cityTile of tileRow) {
        // Stores current tile point
        const tilePoint = {
          // Stores tile x coordinate
          x: cityTile.x,

          // Stores tile y coordinate
          y: cityTile.y,
        };

        // Checks whether tile is valid intersection candidate
        const intersectionCandidate = this.cityMapTrafficSignalIntersectionCandidateCheck(
          cityMapGenerated,
          tilePoint
        );

        // Skips non candidate tiles
        if (!intersectionCandidate) {
          // Continues to next tile
          continue;
        }

        // Stores stable intersection id
        const intersectionId = `intersection-${intersectionList.length}`;

        // Creates detected intersection
        const intersection: CityMapRoadIntersection = {
          // Stores intersection id
          id: intersectionId,

          // Stores intersection tile point
          tilePoint,

          // Stores connected road class list
          roadClassList: this.cityMapRoadConnectedClassListGet(cityMapGenerated, tilePoint),

          // Stores road connection degree
          roadConnectionDegree: this.cityMapRoadConnectionDegreeGet(cityMapGenerated, tilePoint),

          // Stores horizontal connection flag
          horizontalConnection: this.cityMapRoadHorizontalConnectionCheck(cityMapGenerated, tilePoint),

          // Stores vertical connection flag
          verticalConnection: this.cityMapRoadVerticalConnectionCheck(cityMapGenerated, tilePoint),
        };

        // Stores intersection id on generated tile
        cityTile.intersectionId = intersectionId;

        // Adds intersection to list
        intersectionList.push(intersection);
      }
    }

    // Returns detected intersections
    return intersectionList;
  }

  // Gets road connection degree around tile
  cityMapRoadConnectionDegreeGet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint
  ): number {
    // Stores neighbor point list
    const neighborPointList = this.cityMapRoadNeighborPointListGet(tilePoint);

    // Counts traffic road neighbors
    return neighborPointList.filter((neighborPoint) => {
      // Gets neighbor tile
      const neighborTile = this.cityMapTileGet(cityMapGenerated, neighborPoint);

      // Returns whether neighbor is traffic road
      return neighborTile ? this.cityMapTrafficRoadCheck(neighborTile) : false;
    }).length;
  }

  // Checks whether tile has horizontal road connection
  cityMapRoadHorizontalConnectionCheck(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint
  ): boolean {
    // Gets left tile
    const tileLeft = this.cityMapTileGet(cityMapGenerated, {
      // Stores left x coordinate
      x: tilePoint.x - 1,

      // Stores left y coordinate
      y: tilePoint.y,
    });

    // Gets right tile
    const tileRight = this.cityMapTileGet(cityMapGenerated, {
      // Stores right x coordinate
      x: tilePoint.x + 1,

      // Stores right y coordinate
      y: tilePoint.y,
    });

    // Returns whether left or right road exists
    return Boolean(
      (tileLeft && this.cityMapTrafficRoadCheck(tileLeft)) ||
        (tileRight && this.cityMapTrafficRoadCheck(tileRight))
    );
  }

  // Checks whether tile has vertical road connection
  cityMapRoadVerticalConnectionCheck(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint
  ): boolean {
    // Gets upper tile
    const tileUp = this.cityMapTileGet(cityMapGenerated, {
      // Stores upper x coordinate
      x: tilePoint.x,

      // Stores upper y coordinate
      y: tilePoint.y - 1,
    });

    // Gets lower tile
    const tileDown = this.cityMapTileGet(cityMapGenerated, {
      // Stores lower x coordinate
      x: tilePoint.x,

      // Stores lower y coordinate
      y: tilePoint.y + 1,
    });

    // Returns whether upper or lower road exists
    return Boolean(
      (tileUp && this.cityMapTrafficRoadCheck(tileUp)) ||
        (tileDown && this.cityMapTrafficRoadCheck(tileDown))
    );
  }

  // Gets road classes connected around tile
  cityMapRoadConnectedClassListGet(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint
  ): CityTileRoadClass[] {
    // Creates road class set
    const roadClassSet = new Set<CityTileRoadClass>();

    // Stores neighbor point list
    const neighborPointList = this.cityMapRoadNeighborPointListGet(tilePoint);

    // Loops through neighbors
    for (const neighborPoint of neighborPointList) {
      // Gets neighbor tile
      const neighborTile = this.cityMapTileGet(cityMapGenerated, neighborPoint);

      // Skips non traffic road neighbor
      if (!neighborTile || !this.cityMapTrafficRoadCheck(neighborTile)) {
        // Continues to next neighbor
        continue;
      }

      // Adds neighbor road class
      roadClassSet.add(neighborTile.roadClass);
    }

    // Gets center tile
    const centerTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Adds center road class when center is traffic road
    if (centerTile && this.cityMapTrafficRoadCheck(centerTile)) {
      // Adds center road class
      roadClassSet.add(centerTile.roadClass);
    }

    // Returns unique road classes
    return [...roadClassSet];
  }

  // Checks whether tile is a dead end
  cityMapRoadDeadEndCheck(cityMapGenerated: CityMapGenerated, tilePoint: CoordinateTilePoint): boolean {
    // Returns whether road connection degree is one or less
    return this.cityMapRoadConnectionDegreeGet(cityMapGenerated, tilePoint) <= 1;
  }

  // Checks whether tile is a valid traffic signal intersection candidate
  cityMapTrafficSignalIntersectionCandidateCheck(
    cityMapGenerated: CityMapGenerated,
    tilePoint: CoordinateTilePoint
  ): boolean {
    // Gets tile at point
    const cityTile = this.cityMapTileGet(cityMapGenerated, tilePoint);

    // Rejects missing tile
    if (!cityTile) {
      // Returns false for missing tile
      return false;
    }

    // Rejects non traffic road tile
    if (!this.cityMapTrafficRoadCheck(cityTile)) {
      // Returns false for non road tile
      return false;
    }

    // Rejects start or delivery tile
    if (cityTile.start || cityTile.delivery) {
      // Returns false for important gameplay tile
      return false;
    }

    // Stores horizontal connection
    const horizontalConnection = this.cityMapRoadHorizontalConnectionCheck(cityMapGenerated, tilePoint);

    // Stores vertical connection
    const verticalConnection = this.cityMapRoadVerticalConnectionCheck(cityMapGenerated, tilePoint);

    // Rejects tile without both horizontal and vertical connection
    if (!horizontalConnection || !verticalConnection) {
      // Returns false for straight road or road end
      return false;
    }

    // Rejects dead end
    if (this.cityMapRoadDeadEndCheck(cityMapGenerated, tilePoint)) {
      // Returns false for dead end
      return false;
    }

    // Returns true for valid intersection candidate
    return true;
  }

  // Checks whether tile is normal traffic road
  private cityMapTrafficRoadCheck(cityTile: CityTile): boolean {
    // Rejects non road path
    if (cityTile.pathKind !== CityTilePathKind.Road) {
      // Returns false for bridge tunnel shortcut or empty tile
      return false;
    }

    // Rejects no road class
    if (cityTile.roadClass === CityTileRoadClass.None) {
      // Returns false for non road class
      return false;
    }

    // Rejects non walkable tile
    if (!cityTile.walkable) {
      // Returns false for blocked tile
      return false;
    }

    // Returns true for normal traffic road tile
    return true;
  }

  // Gets four neighbor points for road connection checks
  private cityMapRoadNeighborPointListGet(tilePoint: CoordinateTilePoint): CoordinateTilePoint[] {
    // Returns four directional neighbor points
    return [
      // Stores left neighbor
      { x: tilePoint.x - 1, y: tilePoint.y },

      // Stores right neighbor
      { x: tilePoint.x + 1, y: tilePoint.y },

      // Stores upper neighbor
      { x: tilePoint.x, y: tilePoint.y - 1 },

      // Stores lower neighbor
      { x: tilePoint.x, y: tilePoint.y + 1 },
    ];
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

    // Returns tile from generated rows
    return cityMapGenerated.tileRows[tilePoint.y][tilePoint.x];
  }
}