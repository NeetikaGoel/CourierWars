// Imports direction types used by movement helpers
import { DirectionName, type DirectionDelta } from "../types/DirectionType";

// Defines movement delta lookup by direction name
const directionDeltaByName: Record<DirectionName, DirectionDelta> = {
  // Stores left movement delta
  [DirectionName.Left]: {
    // Stores x decrease for left movement
    x: -1,

    // Stores y change for left movement
    y: 0,
  },

  // Stores right movement delta
  [DirectionName.Right]: {
    // Stores x increase for right movement
    x: 1,

    // Stores y change for right movement
    y: 0,
  },

  // Stores up movement delta
  [DirectionName.Up]: {
    // Stores x change for up movement
    x: 0,

    // Stores y decrease for up movement
    y: -1,
  },

  // Stores down movement delta
  [DirectionName.Down]: {
    // Stores x change for down movement
    x: 0,

    // Stores y increase for down movement
    y: 1,
  },

  // Stores no movement delta
  [DirectionName.None]: {
    // Stores x change for no movement
    x: 0,

    // Stores y change for no movement
    y: 0,
  },
};

// Defines opposite direction lookup
const directionNameOppositeByName: Record<DirectionName, DirectionName> = {
  // Stores opposite of left
  [DirectionName.Left]: DirectionName.Right,

  // Stores opposite of right
  [DirectionName.Right]: DirectionName.Left,

  // Stores opposite of up
  [DirectionName.Up]: DirectionName.Down,

  // Stores opposite of down
  [DirectionName.Down]: DirectionName.Up,

  // Stores opposite of none
  [DirectionName.None]: DirectionName.None,
};

// Gets movement delta from direction name
export function directionDeltaFromNameGet(directionName: DirectionName): DirectionDelta {
  // Stores matching direction delta
  const directionDelta = directionDeltaByName[directionName];

  // Returns a new object so callers cannot mutate shared lookup data
  return {
    // Stores x coordinate change
    x: directionDelta.x,

    // Stores y coordinate change
    y: directionDelta.y,
  };
}

// Gets direction name from x and y delta values
export function directionNameFromDeltaGet(deltaX: number, deltaY: number): DirectionName {
  // Returns left when delta matches left movement
  if (deltaX === -1 && deltaY === 0) {
    // Returns left direction name
    return DirectionName.Left;
  }

  // Returns right when delta matches right movement
  if (deltaX === 1 && deltaY === 0) {
    // Returns right direction name
    return DirectionName.Right;
  }

  // Returns up when delta matches up movement
  if (deltaX === 0 && deltaY === -1) {
    // Returns up direction name
    return DirectionName.Up;
  }

  // Returns down when delta matches down movement
  if (deltaX === 0 && deltaY === 1) {
    // Returns down direction name
    return DirectionName.Down;
  }

  // Returns none when delta does not match a movement direction
  return DirectionName.None;
}

// Gets opposite direction name
export function directionNameOppositeGet(directionName: DirectionName): DirectionName {
  // Returns opposite direction from lookup
  return directionNameOppositeByName[directionName];
}

// Checks whether a direction is an actual movement direction
export function directionNameMovementCheck(directionName: DirectionName): boolean {
  // Returns false for no movement direction
  return directionName !== DirectionName.None;
}

// Gets movement direction list without none
export function directionNameMovementListGet(): DirectionName[] {
  // Returns all movement directions used by grid movement
  return [DirectionName.Left, DirectionName.Right, DirectionName.Up, DirectionName.Down];
}