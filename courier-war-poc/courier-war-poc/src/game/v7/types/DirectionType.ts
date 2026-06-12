// Defines allowed direction names
export const DirectionName = {
  // Represents movement toward negative x
  Left: "left",

  // Represents movement toward positive x
  Right: "right",

  // Represents movement toward negative y
  Up: "up",

  // Represents movement toward positive y
  Down: "down",

  // Represents no active movement direction
  None: "none",
} as const;

// Creates a string union type from DirectionName values
export type DirectionName = (typeof DirectionName)[keyof typeof DirectionName];

// Defines x and y change for one tile movement
export interface DirectionDelta {
  // Stores x coordinate change
  x: number;

  // Stores y coordinate change
  y: number;
}