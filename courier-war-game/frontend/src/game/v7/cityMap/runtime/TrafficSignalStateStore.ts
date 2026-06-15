// Imports generated traffic signal and runtime signal types
import {
  TrafficSignalStateName,
  type TrafficSignalGenerated,
  type TrafficSignalRuntimeState,
  type TrafficSignalRuntimeStateByIdMap,
} from "../../types/TrafficSignalType";

// Stores and updates runtime state for traffic signals
export class TrafficSignalStateStore {
  // Stores traffic signal runtime state by signal id
  private trafficSignalStateById: TrafficSignalRuntimeStateByIdMap = {};

  // Creates optional initialized traffic signal state store
  constructor(trafficSignalList: TrafficSignalGenerated[] = []) {
    // Initializes traffic signals when list is provided
    this.trafficSignalStateInitialize(trafficSignalList);
  }

  // Initializes all traffic signals as green
  trafficSignalStateInitialize(trafficSignalList: TrafficSignalGenerated[]): void {
    // Clears previous traffic signal states
    this.trafficSignalStateById = {};

    // Loops through generated traffic signals
    for (const trafficSignal of trafficSignalList) {
      // Creates green runtime state
      this.trafficSignalStateById[trafficSignal.id] = {
        // Stores linked signal id
        signalId: trafficSignal.id,

        // Stores default green state
        stateName: TrafficSignalStateName.Green,

        // Stores no red expiry time
        redUntilMs: null,

        // Stores false because Saboteur has not activated this signal
        activatedBySaboteur: false,
      };
    }
  }

  // Gets traffic signal state by id
  trafficSignalStateGet(signalId: string): TrafficSignalRuntimeState | undefined {
    // Returns state for requested signal id
    return this.trafficSignalStateById[signalId];
  }

  // Gets all traffic signal states by id
  trafficSignalStateByIdGet(): TrafficSignalRuntimeStateByIdMap {
    // Returns runtime state lookup
    return this.trafficSignalStateById;
  }

  // Checks whether traffic signal is currently red
  trafficSignalRedCheck(signalId: string): boolean {
    // Stores traffic signal state
    const trafficSignalState = this.trafficSignalStateGet(signalId);

    // Returns false when signal state is missing
    if (!trafficSignalState) {
      // Returns false for unknown signal
      return false;
    }

    // Returns whether state is red
    return trafficSignalState.stateName === TrafficSignalStateName.Red;
  }

  // Activates red state for a traffic signal
  trafficSignalRedActivate(
    signalId: string,
    currentTimeMs: number,
    durationMs: number
  ): void {
    // Stores traffic signal state
    const trafficSignalState = this.trafficSignalStateGet(signalId);

    // Stops when signal state is missing
    if (!trafficSignalState) {
      // Throws clear error for invalid signal activation
      throw new Error(`Traffic signal ${signalId} is missing`);
    }

    // Sets signal state to red
    trafficSignalState.stateName = TrafficSignalStateName.Red;

    // Stores red expiry timestamp
    trafficSignalState.redUntilMs = currentTimeMs + durationMs;

    // Marks signal as activated by Saboteur
    trafficSignalState.activatedBySaboteur = true;
  }

  // Updates all traffic signals and restores expired red lights to green
  trafficSignalStateUpdate(currentTimeMs: number): void {
    // Loops through traffic signal states
    for (const trafficSignalState of Object.values(this.trafficSignalStateById)) {
      // Skips signals that are not red
      if (trafficSignalState.stateName !== TrafficSignalStateName.Red) {
        // Continues to next signal
        continue;
      }

      // Skips signals without expiry time
      if (trafficSignalState.redUntilMs === null) {
        // Continues to next signal
        continue;
      }

      // Restores green when red duration expired
      if (currentTimeMs >= trafficSignalState.redUntilMs) {
        // Restores signal to green
        this.trafficSignalGreenRestore(trafficSignalState.signalId);
      }
    }
  }

  // Restores one signal to green
  trafficSignalGreenRestore(signalId: string): void {
    // Stores traffic signal state
    const trafficSignalState = this.trafficSignalStateGet(signalId);

    // Stops when signal state is missing
    if (!trafficSignalState) {
      // Returns because unknown signal cannot be restored
      return;
    }

    // Sets signal state to green
    trafficSignalState.stateName = TrafficSignalStateName.Green;

    // Clears red expiry time
    trafficSignalState.redUntilMs = null;

    // Clears Saboteur activation flag
    trafficSignalState.activatedBySaboteur = false;
  }

  // Clears all signal states
  trafficSignalStateClear(): void {
    // Resets state lookup to empty object
    this.trafficSignalStateById = {};
  }
}