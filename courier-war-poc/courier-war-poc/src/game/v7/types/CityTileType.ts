// Defines base terrain types for city tiles
export const CityTileTerrainType = {
  // Represents non walkable building ground unless a tunnel exists
  Building: "building",

  // Represents neutral land used before specific terrain is applied
  Land: "land",

  // Represents non walkable park area
  Park: "park",

  // Represents water area that requires a bridge to cross
  Water: "water",
} as const;

// Creates a string union type from terrain values
export type CityTileTerrainType = (typeof CityTileTerrainType)[keyof typeof CityTileTerrainType];

// Defines road class values used for movement and city planning
export const CityTileRoadClass = {
  // Represents no road on the tile
  None: "none",

  // Represents one tile wide smaller road
  LocalRoad: "localRoad",

  // Represents two tile wide medium road
  DistrictRoad: "districtRoad",

  // Represents three tile wide major road
  AvenueRoad: "avenueRoad",
} as const;

// Creates a string union type from road class values
export type CityTileRoadClass = (typeof CityTileRoadClass)[keyof typeof CityTileRoadClass];

// Defines path kind values layered on top of terrain
export const CityTilePathKind = {
  // Represents no usable path on the tile
  None: "none",

  // Represents normal road path
  Road: "road",

  // Represents bridge path over water
  Bridge: "bridge",

  // Represents tunnel path through building terrain
  Tunnel: "tunnel",

  // Represents subtle shortcut path
  Shortcut: "shortcut",
} as const;

// Creates a string union type from path kind values
export type CityTilePathKind = (typeof CityTilePathKind)[keyof typeof CityTilePathKind];

// Defines generated feature kinds placed on top of paths
export const CityTileFeatureKind = {
  // Represents no special generated feature
  None: "none",

  // Represents a traffic signal feature
  TrafficSignal: "trafficSignal",

  // Represents visible tunnel entry feature
  TunnelEntrance: "tunnelEntrance",

  // Represents visible shortcut entry feature
  ShortcutEntrance: "shortcutEntrance",

  // Represents visible bridge entry feature
  BridgeEntrance: "bridgeEntrance",
} as const;

// Creates a string union type from feature kind values
export type CityTileFeatureKind = (typeof CityTileFeatureKind)[keyof typeof CityTileFeatureKind];

// Defines road orientation values used by generation helpers
export const CityTileRoadOrientation = {
  // Represents horizontal road direction
  Horizontal: "horizontal",

  // Represents vertical road direction
  Vertical: "vertical",
} as const;

// Creates a string union type from road orientation values
export type CityTileRoadOrientation = (typeof CityTileRoadOrientation)[keyof typeof CityTileRoadOrientation];