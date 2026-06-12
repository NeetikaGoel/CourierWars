// Imports Saboteur hurdle configuration
import { saboteurHurdleConfig } from "../../config/SaboteurHurdleConfig";

// Imports distance helper
import { cityTileDistanceTooCloseCheck } from "../../utility/CityTileDistanceCalculator";

// Imports tile key helper
import { cityTileKeyFromCoordinatesGet } from "../../utility/CityTileKeyConverter";

// Imports city map and tile types
import type { CityMapGenerated, CityTile } from "../../types/CityMapType";

// Imports zone type
import type { CityZone } from "../../types/CityZoneType";

// Imports match runtime state type
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports Saboteur hurdle types and result shapes
import {
  SaboteurHurdlePlacementFailureReason,
  SaboteurHurdleType,
  type SaboteurHurdlePlacementResult,
} from "../../types/SaboteurHurdleType";

// Imports hurdle support rules
import { hurdleSupportTileCheck } from "./HurdleSupportRules";

// Imports traffic signal activation rule
import { trafficSignalRedActivationCheck } from "./TrafficSignalRules";

// Imports zone placement rules
import {
  zonePlacementAllowedZoneIdListGet,
  zonePlacementTileZoneAllowedCheck,
} from "./ZonePlacementRules";

// Defines context for Saboteur placement validation
export interface SaboteurPlacementCheckContext {
  // Stores generated city map
  cityMapGenerated: CityMapGenerated;

  // Stores all generated zones
  cityZoneList: CityZone[];

  // Stores target city tile
  cityTile: CityTile | undefined;

  // Stores selected hurdle type
  hurdleType: SaboteurHurdleType;

  // Stores current match runtime state
  matchPrototypeState: MatchPrototypeStateShape;

  // Stores current game time in milliseconds
  currentTimeMs: number;
}

// Validates whether Saboteur can place selected hurdle on target tile
export function saboteurPlacementCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target city tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    // Returns missing tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Rejects start or delivery tile
  const startDeliveryResult = saboteurPlacementStartDeliveryCheck(cityTile);

  // Returns failure when start or delivery check failed
  if (!startDeliveryResult.valid) {
    // Returns start or delivery failure result
    return startDeliveryResult;
  }

  // Rejects tile too close to Courier
  const distanceResult = saboteurPlacementCourierDistanceCheck(context);

  // Returns failure when distance check failed
  if (!distanceResult.valid) {
    // Returns distance failure result
    return distanceResult;
  }

  // Rejects visited tile in Courier current zone before generic current zone reason
  const visitedTileResult = saboteurPlacementVisitedTileCheck(context);

  // Returns failure when visited tile rule failed
  if (!visitedTileResult.valid) {
    // Returns visited tile failure result
    return visitedTileResult;
  }

  // Rejects tile in Courier current zone
  const currentZoneResult = saboteurPlacementCourierCurrentZoneCheck(context);

  // Returns failure when current zone check failed
  if (!currentZoneResult.valid) {
    // Returns current zone failure result
    return currentZoneResult;
  }

  // Rejects tile when zone is not allowed
  const zoneResult = saboteurPlacementTileZoneCheck(context);

  // Returns failure when zone check failed
  if (!zoneResult.valid) {
    // Returns zone failure result
    return zoneResult;
  }

  // Rejects tile when it does not support selected hurdle
  const supportResult = saboteurPlacementHurdleSupportCheck(context);

  // Returns failure when hurdle support check failed
  if (!supportResult.valid) {
    // Returns support failure result
    return supportResult;
  }

  // Rejects red traffic light activation when signal state is invalid
  if (context.hurdleType === SaboteurHurdleType.RedTrafficLight) {
    // Stores traffic signal activation result
    const trafficSignalResult = trafficSignalRedActivationCheck({
      // Stores target tile
      cityTile,

      // Stores current match runtime state
      matchPrototypeState: context.matchPrototypeState,
    });

    // Returns traffic signal failure when activation is invalid
    if (!trafficSignalResult.valid) {
      // Returns traffic signal failure result
      return trafficSignalResult;
    }
  }

  // Rejects conflicting active hurdle
  const activeHurdleResult = saboteurPlacementActiveHurdleCheck(context);

  // Returns failure when active hurdle check failed
  if (!activeHurdleResult.valid) {
    // Returns active hurdle failure result
    return activeHurdleResult;
  }

  // Rejects insufficient energy
  const energyResult = saboteurPlacementEnergyCheck(context);

  // Returns failure when energy check failed
  if (!energyResult.valid) {
    // Returns energy failure result
    return energyResult;
  }

  // Rejects active cooldown
  const cooldownResult = saboteurPlacementCooldownCheck(context);

  // Returns failure when cooldown check failed
  if (!cooldownResult.valid) {
    // Returns cooldown failure result
    return cooldownResult;
  }

  // Returns valid result
  return {
    // Stores valid result
    valid: true,

    // Stores debug message
    message: "Saboteur placement is valid",
  };
}

// Checks whether tile is too close to Courier
export function saboteurPlacementCourierDistanceCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target city tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    // Returns missing tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Stores target tile point
  const targetTilePoint = {
    // Stores target x coordinate
    x: cityTile.x,

    // Stores target y coordinate
    y: cityTile.y,
  };

  // Stores whether target tile is too close to Courier
  const tileTooClose = cityTileDistanceTooCloseCheck(
    context.matchPrototypeState.courier.tilePoint,
    targetTilePoint,
    saboteurHurdleConfig.placement.minimumDistanceFromCourierTiles
  );

  // Rejects tile when too close
  if (tileTooClose) {
    // Returns too close failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileTooCloseToCourier,
      "Tile is too close to Courier"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Checks whether tile is in Courier current zone
export function saboteurPlacementCourierCurrentZoneCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target city tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    // Returns missing tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Checks whether current zone placement is disabled
  const currentZonePlacementDisabled = saboteurHurdleConfig.placement.courierCurrentZonePlacementDisabled;

  // Returns valid when current zone rule is disabled
  if (!currentZonePlacementDisabled) {
    // Returns valid result
    return saboteurPlacementResultValidCreate();
  }

  // Rejects tile in Courier current zone
  if (cityTile.zoneId === context.matchPrototypeState.courier.zoneIdCurrent) {
    // Returns current zone failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileInCourierCurrentZone,
      "Tile is in Courier current zone"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Checks visited tile placement rule
export function saboteurPlacementVisitedTileCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target city tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    // Returns missing tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Stores tile key
  const tileKey = cityTileKeyFromCoordinatesGet(cityTile.x, cityTile.y);

  // Stores whether tile was visited by Courier
  const tileVisited = context.matchPrototypeState.courierVisitedTileKeySet.has(tileKey);

  // Returns valid when tile was not visited
  if (!tileVisited) {
    // Returns valid result
    return saboteurPlacementResultValidCreate();
  }

  // Rejects visited tile when it is in Courier current zone
  if (cityTile.zoneId === context.matchPrototypeState.courier.zoneIdCurrent) {
    // Returns visited current zone failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileVisitedInCourierCurrentZone,
      "Visited tile is in Courier current zone"
    );
  }

  // Returns valid when visited tile in different zone is allowed
  if (saboteurHurdleConfig.placement.visitedTileDifferentZonePlacementAllowed) {
    // Returns valid result
    return saboteurPlacementResultValidCreate();
  }

  // Rejects visited tile when different zone visited placement is disabled
  return saboteurPlacementResultInvalidCreate(
    SaboteurHurdlePlacementFailureReason.TileZoneNotAllowed,
    "Visited tile placement is disabled"
  );
}

// Checks whether tile zone is allowed
export function saboteurPlacementTileZoneCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target city tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    // Returns missing tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Stores allowed zone id list
  const allowedZoneIdList = zonePlacementAllowedZoneIdListGet({
    // Stores city zone list
    cityZoneList: context.cityZoneList,

    // Stores Courier current zone id
    courierZoneIdCurrent: context.matchPrototypeState.courier.zoneIdCurrent,

    // Stores Courier previous zone id
    courierZoneIdPrevious: context.matchPrototypeState.courier.zoneIdPrevious,

    // Stores Courier direction
    courierDirectionName: context.matchPrototypeState.courier.directionName,
  });

  // Stores whether tile zone is allowed
  const tileZoneAllowed = zonePlacementTileZoneAllowedCheck(cityTile, allowedZoneIdList);

  // Rejects tile when zone is not allowed
  if (!tileZoneAllowed) {
    // Returns zone not allowed failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileZoneNotAllowed,
      "Tile zone is not allowed for Saboteur placement"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Checks start and delivery rule
export function saboteurPlacementStartDeliveryCheck(
  cityTile: CityTile
): SaboteurHurdlePlacementResult {
  // Rejects start tile
  if (cityTile.start) {
    // Returns start tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileIsStart,
      "Cannot place hurdle on start tile"
    );
  }

  // Rejects delivery tile
  if (cityTile.delivery) {
    // Returns delivery tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileIsDelivery,
      "Cannot place hurdle on delivery tile"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Checks selected hurdle support
export function saboteurPlacementHurdleSupportCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores whether tile supports hurdle
  const tileSupportsHurdle = hurdleSupportTileCheck(context.cityTile, context.hurdleType);

  // Rejects unsupported hurdle tile
  if (!tileSupportsHurdle) {
    // Returns unsupported hurdle failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileDoesNotSupportHurdle,
      "Tile does not support selected hurdle"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Checks whether tile already has active conflicting hurdle
export function saboteurPlacementActiveHurdleCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores target city tile
  const cityTile = context.cityTile;

  // Rejects missing tile
  if (!cityTile) {
    // Returns missing tile failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileMissing,
      "Tile is missing"
    );
  }

  // Stores target tile key
  const tileKey = cityTileKeyFromCoordinatesGet(cityTile.x, cityTile.y);

  // Stores whether active hurdle already exists on tile
  const activeHurdleExists = Object.values(context.matchPrototypeState.activeHurdleById).some((activeHurdle) => {
    // Stores active hurdle tile key
    const activeHurdleTileKey = cityTileKeyFromCoordinatesGet(
      activeHurdle.tilePoint.x,
      activeHurdle.tilePoint.y
    );

    // Returns whether active hurdle is on target tile
    return activeHurdleTileKey === tileKey;
  });

  // Rejects tile with active hurdle
  if (activeHurdleExists) {
    // Returns active hurdle failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.TileHasActiveHurdle,
      "Tile already has an active hurdle"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Checks Saboteur energy
export function saboteurPlacementEnergyCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores hurdle config
  const hurdleConfig = saboteurHurdleConfig.hurdle[context.hurdleType];

  // Stores required energy cost
  const energyCost = hurdleConfig.energyCost;

  // Rejects when energy is insufficient
  if (context.matchPrototypeState.saboteur.energyCurrent < energyCost) {
    // Returns energy failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.SaboteurEnergyInsufficient,
      "Saboteur energy is insufficient"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Checks Saboteur hurdle cooldown
export function saboteurPlacementCooldownCheck(
  context: SaboteurPlacementCheckContext
): SaboteurHurdlePlacementResult {
  // Stores cooldown end time for selected hurdle
  const cooldownUntilMs = context.matchPrototypeState.saboteur.hurdleCooldownUntilMsByType[context.hurdleType];

  // Returns valid when cooldown is missing
  if (cooldownUntilMs === undefined) {
    // Returns valid result
    return saboteurPlacementResultValidCreate();
  }

  // Rejects when current time is before cooldown end
  if (context.currentTimeMs < cooldownUntilMs) {
    // Returns cooldown failure
    return saboteurPlacementResultInvalidCreate(
      SaboteurHurdlePlacementFailureReason.SaboteurHurdleCooldownActive,
      "Saboteur hurdle cooldown is active"
    );
  }

  // Returns valid result
  return saboteurPlacementResultValidCreate();
}

// Creates valid placement result
function saboteurPlacementResultValidCreate(): SaboteurHurdlePlacementResult {
  // Returns valid placement result
  return {
    // Stores valid flag
    valid: true,
  };
}

// Creates invalid placement result
function saboteurPlacementResultInvalidCreate(
  failureReason: SaboteurHurdlePlacementFailureReason,
  message: string
): SaboteurHurdlePlacementResult {
  // Returns invalid placement result
  return {
    // Stores invalid flag
    valid: false,

    // Stores failure reason
    failureReason,

    // Stores debug message
    message,
  };
}