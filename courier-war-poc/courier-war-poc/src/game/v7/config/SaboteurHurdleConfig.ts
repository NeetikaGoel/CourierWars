// Imports Saboteur hurdle names for config keys
import { SaboteurHurdleType } from "../types/SaboteurHurdleType";

// Defines Saboteur hurdle placement and balancing settings
export const saboteurHurdleConfig = {
  // Groups global Saboteur placement rules
  placement: {
    // Stores minimum allowed Manhattan distance from Courier to target tile
    minimumDistanceFromCourierTiles: 6,

    // Blocks all hurdle placement in Courier current zone
    courierCurrentZonePlacementDisabled: true,

    // Allows visited tiles in zones different from Courier current zone
    visitedTileDifferentZonePlacementAllowed: true,

    // Allows placement in previous zone when all other rules pass
    previousZonePlacementAllowed: true,
  },

  // Groups temporary prototype energy settings
  energy: {
    // Stores starting Saboteur energy for prototype testing
    valueStart: 10000,

    // Stores maximum Saboteur energy value
    valueMax: 10000,

    // Stores passive energy recovery per second
    recoveryPerSecond: 40,
  },

  // Groups per hurdle balance values
  hurdle: {
    // Stores red traffic light balance values
    [SaboteurHurdleType.RedTrafficLight]: {
      // Stores default red signal duration
      durationMsDefault: 4000,

      // Stores minimum red signal duration
      durationMsMin: 3000,

      // Stores maximum red signal duration
      durationMsMax: 6000,

      // Stores cooldown after activation
      cooldownMs: 8000,

      // Stores energy cost
      energyCost: 15,
    },

    // Stores road block balance values
    [SaboteurHurdleType.RoadBlock]: {
      // Stores default road block duration
      durationMsDefault: 5000,

      // Stores minimum road block duration
      durationMsMin: 4000,

      // Stores maximum road block duration
      durationMsMax: 7000,

      // Stores cooldown after activation
      cooldownMs: 12000,

      // Stores energy cost
      energyCost: 25,
    },

    // Stores construction work balance values
    [SaboteurHurdleType.ConstructionWork]: {
      // Stores default construction duration
      durationMsDefault: 8000,

      // Stores minimum construction duration
      durationMsMin: 6000,

      // Stores maximum construction duration
      durationMsMax: 10000,

      // Stores cooldown after activation
      cooldownMs: 15000,

      // Stores energy cost
      energyCost: 18,
    },

    // Stores traffic jam balance values
    [SaboteurHurdleType.TrafficJam]: {
      // Stores default traffic jam duration
      durationMsDefault: 6000,

      // Stores minimum traffic jam duration
      durationMsMin: 4000,

      // Stores maximum traffic jam duration
      durationMsMax: 9000,

      // Stores cooldown after activation
      cooldownMs: 10000,

      // Stores energy cost
      energyCost: 18,
    },

    // Stores closed gate balance values
    [SaboteurHurdleType.ClosedGate]: {
      // Stores default closed gate duration
      durationMsDefault: 5000,

      // Stores minimum closed gate duration
      durationMsMin: 4000,

      // Stores maximum closed gate duration
      durationMsMax: 7000,

      // Stores cooldown after activation
      cooldownMs: 12000,

      // Stores energy cost
      energyCost: 24,
    },

    // Stores wrong direction sign balance values
    [SaboteurHurdleType.WrongDirectionSign]: {
      // Stores default wrong direction sign duration
      durationMsDefault: 5000,

      // Stores minimum wrong direction sign duration
      durationMsMin: 4000,

      // Stores maximum wrong direction sign duration
      durationMsMax: 8000,

      // Stores cooldown after activation
      cooldownMs: 15000,

      // Stores energy cost
      energyCost: 16,
    },

    // Stores broken road balance values
    [SaboteurHurdleType.BrokenRoad]: {
      // Stores default broken road duration
      durationMsDefault: 6000,

      // Stores minimum broken road duration
      durationMsMin: 5000,

      // Stores maximum broken road duration
      durationMsMax: 9000,

      // Stores cooldown after activation
      cooldownMs: 15000,

      // Stores energy cost
      energyCost: 25,
    },

    // Stores moving barrier balance values
    [SaboteurHurdleType.MovingBarrier]: {
      // Stores default moving barrier duration
      durationMsDefault: 8000,

      // Stores minimum moving barrier duration
      durationMsMin: 6000,

      // Stores maximum moving barrier duration
      durationMsMax: 10000,

      // Stores cooldown after activation
      cooldownMs: 15000,

      // Stores energy cost
      energyCost: 25,
    },

    // Stores security checkpoint balance values
    [SaboteurHurdleType.SecurityCheckpoint]: {
      // Stores default security checkpoint duration
      durationMsDefault: 4000,

      // Stores minimum security checkpoint duration
      durationMsMin: 3000,

      // Stores maximum security checkpoint duration
      durationMsMax: 6000,

      // Stores cooldown after activation
      cooldownMs: 12000,

      // Stores energy cost
      energyCost: 17,
    },
  },
} as const;