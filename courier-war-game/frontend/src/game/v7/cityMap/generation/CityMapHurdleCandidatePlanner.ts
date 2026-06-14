// Imports generated city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports Saboteur hurdle type values
import { SaboteurHurdleType } from "../../types/SaboteurHurdleType";

// Imports tile layer values
import {
  CityTilePathKind,
  CityTileRoadClass,
  CityTileTerrainType,
} from "../../types/CityTileType";

// Marks valid Saboteur hurdle candidates on generated tiles
export class CityMapHurdleCandidatePlanner {
  // Generates all hurdle candidates
  cityMapHurdleCandidateListGenerate(cityMapGenerated: CityMapGenerated): void {
    // Loops through tile rows
    for (const tileRow of cityMapGenerated.tileRows) {
      // Loops through tiles
      for (const cityTile of tileRow) {
        // Clears existing candidates
        cityTile.hurdleCandidateList = [];

        // Adds red traffic light candidate
        this.cityMapRedTrafficLightCandidateAdd(cityTile);

        // Adds road block candidate
        this.cityMapRoadBlockCandidateAdd(cityTile);

        // Adds construction work candidate
        this.cityMapConstructionWorkCandidateAdd(cityTile);

        // Adds traffic jam candidate
        this.cityMapTrafficJamCandidateAdd(cityTile);

        // Adds closed gate candidate
        this.cityMapClosedGateCandidateAdd(cityTile);

        // Adds wrong direction sign candidate
        this.cityMapWrongDirectionSignCandidateAdd(cityTile);

        // Adds broken road candidate
        this.cityMapBrokenRoadCandidateAdd(cityTile);

        // Adds moving barrier candidate
        this.cityMapMovingBarrierCandidateAdd(cityTile);

        // Adds security checkpoint candidate
        this.cityMapSecurityCheckpointCandidateAdd(cityTile);
      }
    }
  }

  // Adds red traffic light candidate when tile has signal
  cityMapRedTrafficLightCandidateAdd(cityTile: CityTile): void {
    // Requires traffic signal id
    if (!cityTile.trafficSignalId) {
      // Ends candidate add
      return;
    }

    // Adds red traffic light candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.RedTrafficLight);
  }

  // Adds road block candidate when valid
  cityMapRoadBlockCandidateAdd(cityTile: CityTile): void {
    // Rejects invalid general road hurdle tile
    if (!this.cityMapGeneralRoadHurdleTileCheck(cityTile)) {
      // Ends candidate add
      return;
    }

    // Adds road block candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.RoadBlock);
  }

  // Adds construction work candidate when valid
  cityMapConstructionWorkCandidateAdd(cityTile: CityTile): void {
    // Rejects start or delivery
    if (cityTile.start || cityTile.delivery) {
      // Ends candidate add
      return;
    }

    // Rejects traffic signal tile
    if (cityTile.trafficSignalId) {
      // Ends candidate add
      return;
    }

    // Requires normal road path
    if (cityTile.pathKind !== CityTilePathKind.Road) {
      // Ends candidate add
      return;
    }

    // Requires district or avenue road
    const supportedRoad =
      cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
      cityTile.roadClass === CityTileRoadClass.AvenueRoad;

    // Rejects unsupported road class
    if (!supportedRoad) {
      // Ends candidate add
      return;
    }

    // Rejects water park or building terrain
    if (
      cityTile.terrainType === CityTileTerrainType.Water ||
      cityTile.terrainType === CityTileTerrainType.Park ||
      cityTile.terrainType === CityTileTerrainType.Building
    ) {
      // Ends candidate add
      return;
    }

    // Adds construction work candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.ConstructionWork);
  }

  // Adds traffic jam candidate when valid
  cityMapTrafficJamCandidateAdd(cityTile: CityTile): void {
    // Rejects invalid general road hurdle tile
    if (!this.cityMapGeneralRoadHurdleTileCheck(cityTile)) {
      // Ends candidate add
      return;
    }

    // Requires district or avenue road
    const supportedRoad =
      cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
      cityTile.roadClass === CityTileRoadClass.AvenueRoad;

    // Rejects unsupported road
    if (!supportedRoad) {
      // Ends candidate add
      return;
    }

    // Adds traffic jam candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.TrafficJam);
  }

  // Adds closed gate candidate when valid
  cityMapClosedGateCandidateAdd(cityTile: CityTile): void {
    // Stores whether tile is a gate style entrance
    const gateEntrance = cityTile.tunnelEntrance || cityTile.shortcutEntrance || cityTile.bridgeEntrance;

    // Rejects non entrance tile
    if (!gateEntrance) {
      // Ends candidate add
      return;
    }

    // Rejects start or delivery
    if (cityTile.start || cityTile.delivery) {
      // Ends candidate add
      return;
    }

    // Adds closed gate candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.ClosedGate);
  }

  // Adds wrong direction sign candidate when valid
  cityMapWrongDirectionSignCandidateAdd(cityTile: CityTile): void {
    // Stores whether tile is intersection
    const intersectionTile = Boolean(cityTile.intersectionId);

    // Stores whether tile is hidden route entrance
    const hiddenRouteEntrance = cityTile.tunnelEntrance || cityTile.shortcutEntrance;

    // Rejects tile that is not useful for route confusion
    if (!intersectionTile && !hiddenRouteEntrance) {
      // Ends candidate add
      return;
    }

    // Rejects start or delivery
    if (cityTile.start || cityTile.delivery) {
      // Ends candidate add
      return;
    }

    // Adds wrong direction sign candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.WrongDirectionSign);
  }

  // Adds broken road candidate when valid
  cityMapBrokenRoadCandidateAdd(cityTile: CityTile): void {
    // Rejects invalid general road hurdle tile
    if (!this.cityMapGeneralRoadHurdleTileCheck(cityTile)) {
      // Ends candidate add
      return;
    }

    // Adds broken road candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.BrokenRoad);
  }

  // Adds moving barrier candidate when valid
  cityMapMovingBarrierCandidateAdd(cityTile: CityTile): void {
    // Rejects invalid general road hurdle tile
    if (!this.cityMapGeneralRoadHurdleTileCheck(cityTile)) {
      // Ends candidate add
      return;
    }

    // Requires district or avenue road
    const supportedRoad =
      cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
      cityTile.roadClass === CityTileRoadClass.AvenueRoad;

    // Rejects unsupported road
    if (!supportedRoad) {
      // Ends candidate add
      return;
    }

    // Adds moving barrier candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.MovingBarrier);
  }

  // Adds security checkpoint candidate when valid
  cityMapSecurityCheckpointCandidateAdd(cityTile: CityTile): void {
    // Rejects invalid general road hurdle tile
    if (!this.cityMapGeneralRoadHurdleTileCheck(cityTile)) {
      // Ends candidate add
      return;
    }

    // Requires district or avenue road
    const supportedRoad =
      cityTile.roadClass === CityTileRoadClass.DistrictRoad ||
      cityTile.roadClass === CityTileRoadClass.AvenueRoad;

    // Rejects unsupported road
    if (!supportedRoad) {
      // Ends candidate add
      return;
    }

    // Adds security checkpoint candidate
    this.cityTileHurdleCandidateAdd(cityTile, SaboteurHurdleType.SecurityCheckpoint);
  }

  // Checks whether tile supports common road hurdles
  private cityMapGeneralRoadHurdleTileCheck(cityTile: CityTile): boolean {
    // Rejects start or delivery
    if (cityTile.start || cityTile.delivery) {
      // Returns false for important gameplay tile
      return false;
    }

    // Rejects non walkable tile
    if (!cityTile.walkable) {
      // Returns false for blocked tile
      return false;
    }

    // Rejects water without bridge
    if (cityTile.terrainType === CityTileTerrainType.Water && cityTile.pathKind !== CityTilePathKind.Bridge) {
      // Returns false for unsupported water tile
      return false;
    }

    // Rejects park tile
    if (cityTile.terrainType === CityTileTerrainType.Park) {
      // Returns false for park tile
      return false;
    }

    // Rejects building tile
    if (cityTile.terrainType === CityTileTerrainType.Building) {
      // Returns false for building tile
      return false;
    }

    // Requires normal road path
    if (cityTile.pathKind !== CityTilePathKind.Road) {
      // Returns false for tunnel shortcut bridge or empty tile
      return false;
    }

    // Rejects no road class
    if (cityTile.roadClass === CityTileRoadClass.None) {
      // Returns false for non road tile
      return false;
    }

    // Returns true for valid road hurdle tile
    return true;
  }

  // Adds hurdle candidate when missing
  private cityTileHurdleCandidateAdd(cityTile: CityTile, hurdleType: SaboteurHurdleType): void {
    // Checks whether candidate already exists
    const candidateExists = cityTile.hurdleCandidateList.includes(hurdleType);

    // Adds candidate when missing
    if (!candidateExists) {
      // Pushes hurdle type
      cityTile.hurdleCandidateList.push(hurdleType);
    }
  }
}