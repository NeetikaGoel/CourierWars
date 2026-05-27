
// Values that should NOT usually change during normal game tuning.
// These are constants, not gameplay-balancing config.

export const GAME_CONSTANTS = {
  directions: {
    left: {
      dx: -1,
      dy: 0,
    },
    right: {
      dx: 1,
      dy: 0,
    },
    up: {
      dx: 0,
      dy: -1,
    },
    down: {
      dx: 0,
      dy: 1,
    },
  },

  tileMath: {
    halfDivisor: 2,
  },

  mapGeneration: {
    firstIndex: 0,
    borderThickness: 1,
    routeStartIndex: 0,
    routeNextOffset: 1,
    signNegative: -1,
    signPositive: 1,
    signZero: 0,
  },

  phaser: {
    fullOpacity: 1,
    defaultPointerButton: 0,
  },
} as const;