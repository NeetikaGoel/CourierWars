// Defines Courier movement timings and movement cost values
export const courierMovementConfig = {
  // Groups base movement timing settings
  timing: {
    // Stores base duration for moving across one normal district road tile
    baseMoveDurationMs: 120,

    // Stores how long Courier stops at an active red traffic signal
    redTrafficSignalStopMs: 4000,

    // Stores how long movement input waits before checking next held direction
    heldDirectionPollMs: 16,
  },

  // Groups base movement cost values by path and road type
  cost: {
    // Stores movement cost for local road tiles
    localRoad: 1.15,

    // Stores movement cost for district road tiles
    districtRoad: 1,

    // Stores movement cost for avenue road tiles
    avenueRoad: 0.85,

    // Stores movement cost for bridge tiles
    bridge: 0.9,

    // Stores movement cost for tunnel tiles
    tunnel: 0.8,

    // Stores movement cost for shortcut tiles
    shortcut: 1.35,
  },

  // Groups runtime movement multipliers caused by active hurdles
  multiplier: {
    // Stores movement multiplier for active construction work
    constructionWork: 2.5,

    // Stores movement multiplier for active traffic jam
    trafficJam: 2,

    // Stores movement multiplier for active security checkpoint approach
    securityCheckpoint: 1.5,
  },

  // Groups continuous keyboard movement settings
  input: {
    // Enables movement by holding an arrow key instead of repeated tapping
    heldArrowMovementEnabled: true,

    // Allows new direction to apply after current tile movement completes
    queuedDirectionChangeEnabled: true,
  },
} as const;