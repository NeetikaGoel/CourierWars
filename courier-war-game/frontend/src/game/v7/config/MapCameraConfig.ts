// Defines camera behavior for map viewing and Courier following
export const mapCameraConfig = {
  // Groups zoom configuration
  zoom: {
    // Stores initial camera zoom
    start: 0.42,

    // Stores minimum allowed camera zoom
    min: 0.32,

    // Stores maximum allowed camera zoom
    max: 1.8,

    // Stores mouse wheel zoom increment
    step: 0.07,
  },

  // Groups camera movement configuration
  movement: {
    // Stores camera pan duration for zone focus changes
    panDurationMs: 350,

    // Stores camera drag speed multiplier
    dragSpeedMultiplier: 1,

    // Stores smoothing value for automatic Courier follow
    courierFollowLerp: 0.08,

    // Stores extra world padding around map camera bounds
    worldPaddingPixels: 700,
  },

  // Groups zone based camera configuration
  zone: {
    // Enables keeping the Courier current zone visible
    courierCurrentZoneFocusEnabled: true,

    // Stores padding around focused zone in tiles
    focusPaddingTiles: 5,

    // Enables camera refocus when Courier enters a new zone
    focusOnZoneChangeEnabled: true,
  },

  // Groups manual camera control configuration
  manual: {
    // Enables mouse drag camera panning
    dragEnabled: true,

    // Enables C key debug recenter action
    centerKeyEnabled: true,

    // Enables mouse wheel zoom around pointer
    pointerZoomEnabled: true,
  },
} as const;