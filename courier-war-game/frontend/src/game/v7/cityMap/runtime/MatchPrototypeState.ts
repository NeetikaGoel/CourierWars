// Imports Saboteur hurdle configuration for initial energy values
import { saboteurHurdleConfig } from "../../config/SaboteurHurdleConfig";

// Imports tile key converter for initial Courier trail setup
import { cityTileKeyFromPointGet } from "../../utility/CityTileKeyConverter";

// Imports generated city map type
import type { CityMapGenerated } from "../../types/CityMapType";

// Imports direction names for Courier runtime direction
import { DirectionName } from "../../types/DirectionType";

// Imports player role values
import { PlayerRole, type PlayerRole as PlayerRoleName } from "../../types/PlayerRoleType";

// Imports traffic signal state values and runtime state map type
import {
  TrafficSignalStateName,
  type TrafficSignalRuntimeStateByIdMap,
} from "../../types/TrafficSignalType";

// Imports Saboteur hurdle values
import { SaboteurHurdleType } from "../../types/SaboteurHurdleType";

// Imports match prototype state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Creates and owns the local prototype match state
export class MatchPrototypeState {
  // Stores the current match prototype state object
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // Creates initial prototype match state from generated map data
  constructor(
    cityMapGenerated: CityMapGenerated,
    playerRoleInitial: PlayerRoleName = PlayerRole.Courier
  ) {
    // Stores start tile from generated map
    const startTile = cityMapGenerated.tileRows[cityMapGenerated.startTilePoint.y][cityMapGenerated.startTilePoint.x];

    // Stores traffic signal runtime state map
    const trafficSignalStateById = this.matchPrototypeTrafficSignalStateByIdCreate(cityMapGenerated);

    // Creates the initial prototype state
    this.matchPrototypeState = {
      // Stores current prototype player role
      playerRole: playerRoleInitial,

      // Stores generated map seed
      mapSeed: cityMapGenerated.metadata.seed,

      // Stores match start time
      matchStartedAtMs: Date.now(),

      // Stores Courier runtime state
      courier: {
        // Stores Courier start tile point
        tilePoint: {
          // Stores start tile x coordinate
          x: cityMapGenerated.startTilePoint.x,

          // Stores start tile y coordinate
          y: cityMapGenerated.startTilePoint.y,
        },

        // Stores initial Courier direction
        directionName: DirectionName.None,

        // Stores current Courier zone id
        zoneIdCurrent: startTile.zoneId,

        // Stores previous Courier zone id
        zoneIdPrevious: null,

        // Stores starting Courier lives
        livesCurrent: 3,
      },

      // Stores Saboteur runtime state
      saboteur: {
        // Stores default selected hurdle type for prototype testing
        hurdleTypeSelected: SaboteurHurdleType.RedTrafficLight,

        // Stores current Saboteur energy
        energyCurrent: saboteurHurdleConfig.energy.valueStart,

        // Stores maximum Saboteur energy
        energyMax: saboteurHurdleConfig.energy.valueMax,

        // Stores empty hurdle cooldown lookup
        hurdleCooldownUntilMsByType: {},
      },

      // Stores traffic signal runtime state by id
      trafficSignalStateById,

      // Stores active hurdle runtime state by id
      activeHurdleById: {},

      // Stores visited tile key set with start tile already visited
      courierVisitedTileKeySet: new Set<string>([
        cityTileKeyFromPointGet(cityMapGenerated.startTilePoint),
      ]),

      // Stores tile hover and selection state
      tileInteraction: {
        // Stores no hovered tile at match start
        tilePointHovered: null,

        // Stores no selected tile at match start
        tilePointSelected: null,

        // Stores no hover placement result at match start
        hoverPlacementResult: null,
      },
    };
  }

  // Gets mutable prototype state object
  matchPrototypeStateGet(): MatchPrototypeStateShape {
    // Returns the current prototype state
    return this.matchPrototypeState;
  }

  // Sets current prototype player role
  matchPrototypePlayerRoleSet(playerRole: PlayerRoleName): void {
    // Updates current role
    this.matchPrototypeState.playerRole = playerRole;
  }

  // Sets Courier tile point and updates previous zone when zone changes
  matchPrototypeCourierTilePointSet(
    tileX: number,
    tileY: number,
    zoneIdCurrent: string
  ): void {
    // Stores previous Courier zone id
    const zoneIdPrevious = this.matchPrototypeState.courier.zoneIdCurrent;

    // Updates Courier tile point
    this.matchPrototypeState.courier.tilePoint = {
      // Stores new tile x coordinate
      x: tileX,

      // Stores new tile y coordinate
      y: tileY,
    };

    // Updates previous zone only when zone changed
    if (zoneIdPrevious !== zoneIdCurrent) {
      // Stores previous Courier zone
      this.matchPrototypeState.courier.zoneIdPrevious = zoneIdPrevious;
    }

    // Stores current Courier zone
    this.matchPrototypeState.courier.zoneIdCurrent = zoneIdCurrent;
  }

  // Sets Courier movement direction
  matchPrototypeCourierDirectionSet(directionName: DirectionName): void {
    // Updates Courier direction
    this.matchPrototypeState.courier.directionName = directionName;
  }

  // Sets current Saboteur selected hurdle
  matchPrototypeSaboteurHurdleSelectedSet(hurdleType: SaboteurHurdleType): void {
    // Updates selected hurdle type
    this.matchPrototypeState.saboteur.hurdleTypeSelected = hurdleType;
  }

  // Sets Saboteur energy value while clamping to allowed range
  matchPrototypeSaboteurEnergySet(energyValue: number): void {
    // Stores clamped energy value
    const energyValueClamped = Math.max(
      0,
      Math.min(this.matchPrototypeState.saboteur.energyMax, energyValue)
    );

    // Updates Saboteur current energy
    this.matchPrototypeState.saboteur.energyCurrent = energyValueClamped;
  }

  // Sets cooldown end time for a hurdle type
  matchPrototypeSaboteurHurdleCooldownSet(
    hurdleType: SaboteurHurdleType,
    cooldownUntilMs: number
  ): void {
    // Updates cooldown lookup for hurdle type
    this.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[hurdleType] = cooldownUntilMs;
  }

  // Creates initial traffic signal state map from generated signals
  private matchPrototypeTrafficSignalStateByIdCreate(
    cityMapGenerated: CityMapGenerated
  ): TrafficSignalRuntimeStateByIdMap {
    // Creates empty traffic signal state map
    const trafficSignalStateById: TrafficSignalRuntimeStateByIdMap = {};

    // Loops through generated traffic signals
    for (const trafficSignal of cityMapGenerated.trafficSignalList) {
      // Adds default green runtime state
      trafficSignalStateById[trafficSignal.id] = {
        // Stores linked signal id
        signalId: trafficSignal.id,

        // Stores default green signal state
        stateName: TrafficSignalStateName.Green,

        // Stores no red expiry time
        redUntilMs: null,

        // Stores false because signal was not activated by Saboteur yet
        activatedBySaboteur: false,
      };
    }

    // Returns traffic signal runtime state map
    return trafficSignalStateById;
  }
}