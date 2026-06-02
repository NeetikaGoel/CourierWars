// Imports tile key converter for tile based hurdle lookup
import { cityTileKeyFromPointGet } from "../../utility/CityTileKeyConverter";

// Imports tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports active hurdle and activation request types
import {
  SaboteurHurdleType,
  type SaboteurHurdleActivationRequest,
  type SaboteurHurdleActive,
} from "../../types/SaboteurHurdleType";

// Imports active hurdle map type
import type { ActiveHurdleByIdMap } from "../../types/MatchRuntimeStateType";

// Stores and updates runtime active hurdles
export class ActiveHurdleStateStore {
  // Stores active hurdle lookup by id
  private activeHurdleById: ActiveHurdleByIdMap = {};

  // Stores incrementing number for unique hurdle ids
  private activeHurdleIdCounter = 0;

  // Activates a new hurdle and returns created runtime hurdle
  activeHurdleActivate(
    activationRequest: SaboteurHurdleActivationRequest,
    durationMs: number,
    trafficSignalId?: string
  ): SaboteurHurdleActive {
    // Stores active hurdle id
    const activeHurdleId = `active-hurdle-${this.activeHurdleIdCounter}`;

    // Increments id counter for next activation
    this.activeHurdleIdCounter += 1;

    // Stores active hurdle object
    const activeHurdle: SaboteurHurdleActive = {
      // Stores unique active hurdle id
      id: activeHurdleId,

      // Stores hurdle type
      hurdleType: activationRequest.hurdleType,

      // Stores target tile point
      tilePoint: {
        // Stores target x coordinate
        x: activationRequest.tilePoint.x,

        // Stores target y coordinate
        y: activationRequest.tilePoint.y,
      },

      // Stores activation start time
      startedAtMs: activationRequest.currentTimeMs,

      // Stores activation expiry time
      expiresAtMs: activationRequest.currentTimeMs + durationMs,

      // Stores linked traffic signal id when provided
      trafficSignalId,
    };

    // Saves active hurdle in lookup
    this.activeHurdleById[activeHurdle.id] = activeHurdle;

    // Returns created active hurdle
    return activeHurdle;
  }

  // Expires one active hurdle by id
  activeHurdleExpire(activeHurdleId: string): void {
    // Removes active hurdle from lookup
    delete this.activeHurdleById[activeHurdleId];
  }

  // Updates active hurdles and removes expired ones
  activeHurdleStateUpdate(currentTimeMs: number): void {
    // Loops through active hurdles
    for (const activeHurdle of Object.values(this.activeHurdleById)) {
      // Removes active hurdle when duration has expired
      if (currentTimeMs >= activeHurdle.expiresAtMs) {
        // Expires active hurdle
        this.activeHurdleExpire(activeHurdle.id);
      }
    }
  }

  // Gets active hurdle lookup
  activeHurdleByIdGet(): ActiveHurdleByIdMap {
    // Returns active hurdle lookup
    return this.activeHurdleById;
  }

  // Gets active hurdles on one tile
  activeHurdleListForTileGet(tilePoint: CoordinateTilePoint): SaboteurHurdleActive[] {
    // Stores target tile key
    const tileKey = cityTileKeyFromPointGet(tilePoint);

    // Returns active hurdles matching target tile
    return Object.values(this.activeHurdleById).filter((activeHurdle) => {
      // Stores active hurdle tile key
      const activeHurdleTileKey = cityTileKeyFromPointGet(activeHurdle.tilePoint);

      // Returns whether active hurdle is on requested tile
      return activeHurdleTileKey === tileKey;
    });
  }

  // Checks whether tile has any active hurdle
  activeHurdleTileActiveCheck(tilePoint: CoordinateTilePoint): boolean {
    // Returns whether active hurdle list has at least one item
    return this.activeHurdleListForTileGet(tilePoint).length > 0;
  }

  // Checks whether tile has a blocking active hurdle
  activeHurdleBlockingCheck(tilePoint: CoordinateTilePoint): boolean {
    // Stores active hurdles for tile
    const activeHurdleList = this.activeHurdleListForTileGet(tilePoint);

    // Returns whether any active hurdle blocks movement
    return activeHurdleList.some((activeHurdle) => {
      // Checks road block
      if (activeHurdle.hurdleType === SaboteurHurdleType.RoadBlock) {
        // Returns true for road block
        return true;
      }

      // Checks closed gate
      if (activeHurdle.hurdleType === SaboteurHurdleType.ClosedGate) {
        // Returns true for closed gate
        return true;
      }

      // Checks broken road
      if (activeHurdle.hurdleType === SaboteurHurdleType.BrokenRoad) {
        // Returns true for broken road
        return true;
      }

      // Returns false for non blocking hurdle
      return false;
    });
  }

  // Checks whether tile has a slowing active hurdle
  activeHurdleSlowingCheck(tilePoint: CoordinateTilePoint): boolean {
    // Stores active hurdles for tile
    const activeHurdleList = this.activeHurdleListForTileGet(tilePoint);

    // Returns whether any active hurdle slows movement
    return activeHurdleList.some((activeHurdle) => {
      // Checks construction work
      if (activeHurdle.hurdleType === SaboteurHurdleType.ConstructionWork) {
        // Returns true for construction work
        return true;
      }

      // Checks traffic jam
      if (activeHurdle.hurdleType === SaboteurHurdleType.TrafficJam) {
        // Returns true for traffic jam
        return true;
      }

      // Checks security checkpoint
      if (activeHurdle.hurdleType === SaboteurHurdleType.SecurityCheckpoint) {
        // Returns true for security checkpoint
        return true;
      }

      // Returns false for non slowing hurdle
      return false;
    });
  }

  // Checks whether tile has moving barrier hazard
  activeHurdleMovingBarrierCheck(tilePoint: CoordinateTilePoint): boolean {
    // Stores active hurdles for tile
    const activeHurdleList = this.activeHurdleListForTileGet(tilePoint);

    // Returns whether moving barrier exists on tile
    return activeHurdleList.some(
      (activeHurdle) => activeHurdle.hurdleType === SaboteurHurdleType.MovingBarrier
    );
  }

  // Clears all active hurdles
  activeHurdleStateClear(): void {
    // Resets active hurdle lookup
    this.activeHurdleById = {};

    // Resets id counter
    this.activeHurdleIdCounter = 0;
  }
}