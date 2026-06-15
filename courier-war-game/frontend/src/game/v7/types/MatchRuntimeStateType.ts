// Imports tile point shape for runtime positions
import type { CoordinateTilePoint } from "./CoordinateType";

// Imports direction name used by Courier state
import type { DirectionName } from "./DirectionType";

// Imports player role type used by prototype state
import type { PlayerRole } from "./PlayerRoleType";

// Imports zone id type used by Courier zone state
import type { CityZoneId } from "./CityZoneType";

// Imports traffic signal runtime state map
import type { TrafficSignalRuntimeStateByIdMap } from "./TrafficSignalType";

// Imports active hurdle and selected hurdle types
import type {
  SaboteurHurdleActive,
  SaboteurHurdlePlacementResult,
  SaboteurHurdleType,
} from "./SaboteurHurdleType";

// Defines Courier runtime state
export interface CourierRuntimeState {
  // Stores current Courier tile point
  tilePoint: CoordinateTilePoint;

  // Stores current Courier movement direction
  directionName: DirectionName;

  // Stores current Courier zone id
  zoneIdCurrent: CityZoneId;

  // Stores previous Courier zone id
  zoneIdPrevious: CityZoneId | null;

  // Stores current Courier lives count
  livesCurrent: number;
}

// Defines Saboteur runtime state
export interface SaboteurRuntimeState {
  // Stores currently selected Saboteur hurdle type
  hurdleTypeSelected: SaboteurHurdleType;

  // Stores current Saboteur energy
  energyCurrent: number;

  // Stores maximum Saboteur energy
  energyMax: number;

  // Stores cooldown end time by hurdle type
  hurdleCooldownUntilMsByType: Partial<Record<SaboteurHurdleType, number>>;
}

// Defines tile interaction runtime state
export interface TileInteractionRuntimeState {
  // Stores currently hovered tile point
  tilePointHovered: CoordinateTilePoint | null;

  // Stores currently selected tile point
  tilePointSelected: CoordinateTilePoint | null;

  // Stores placement result for currently hovered tile
  hoverPlacementResult: SaboteurHurdlePlacementResult | null;
}

// Defines active hurdle lookup map
export type ActiveHurdleByIdMap = Record<string, SaboteurHurdleActive>;

// Defines local prototype match state shape
export interface MatchPrototypeStateShape {
  // Stores current prototype player role
  playerRole: PlayerRole;

  // Stores seed used for generated map
  mapSeed: number;

  // Stores match start timestamp in milliseconds
  matchStartedAtMs: number;

  // Stores Courier runtime state
  courier: CourierRuntimeState;

  // Stores Saboteur runtime state
  saboteur: SaboteurRuntimeState;

  // Stores traffic signal runtime state by signal id
  trafficSignalStateById: TrafficSignalRuntimeStateByIdMap;

  // Stores active hurdle runtime state by hurdle id
  activeHurdleById: ActiveHurdleByIdMap;

  // Stores tile keys visited by Courier
  courierVisitedTileKeySet: Set<string>;

  // Stores hover and selection state
  tileInteraction: TileInteractionRuntimeState;
}