// Defines playable role names
export const PlayerRole = {
  // Represents the moving delivery player
  Courier: "courier",

  // Represents the map control player
  Saboteur: "saboteur",
} as const;

// Creates a string union type from PlayerRole values
export type PlayerRole = (typeof PlayerRole)[keyof typeof PlayerRole];