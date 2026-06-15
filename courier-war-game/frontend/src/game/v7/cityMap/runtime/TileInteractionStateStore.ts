// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Imports Saboteur hurdle and placement result types
import {
  SaboteurHurdleType,
  type SaboteurHurdlePlacementResult,
} from "../../types/SaboteurHurdleType";

// Imports tile interaction runtime state shape
import type { TileInteractionRuntimeState } from "../../types/MatchRuntimeStateType";

// Stores tile hover selection and selected hurdle state
export class TileInteractionStateStore {
  // Stores current tile interaction runtime state
  private readonly tileInteractionState: TileInteractionRuntimeState = {
    // Stores no hovered tile by default
    tilePointHovered: null,

    // Stores no selected tile by default
    tilePointSelected: null,

    // Stores no hover placement result by default
    hoverPlacementResult: null,
  };

  // Stores currently selected Saboteur hurdle type
  private saboteurHurdleTypeSelected: SaboteurHurdleType = SaboteurHurdleType.RedTrafficLight;

  // Gets tile interaction state object
  tileInteractionStateGet(): TileInteractionRuntimeState {
    // Returns current interaction state
    return this.tileInteractionState;
  }

  // Sets hovered tile point
  tileInteractionHoverSet(tilePoint: CoordinateTilePoint): void {
    // Updates hovered tile point
    this.tileInteractionState.tilePointHovered = {
      // Stores hovered tile x coordinate
      x: tilePoint.x,

      // Stores hovered tile y coordinate
      y: tilePoint.y,
    };
  }

  // Clears hovered tile point and hover placement result
  tileInteractionHoverClear(): void {
    // Clears hovered tile point
    this.tileInteractionState.tilePointHovered = null;

    // Clears hover placement result
    this.tileInteractionState.hoverPlacementResult = null;
  }

  // Sets selected tile point
  tileInteractionSelectionSet(tilePoint: CoordinateTilePoint): void {
    // Updates selected tile point
    this.tileInteractionState.tilePointSelected = {
      // Stores selected tile x coordinate
      x: tilePoint.x,

      // Stores selected tile y coordinate
      y: tilePoint.y,
    };
  }

  // Clears selected tile point
  tileInteractionSelectionClear(): void {
    // Clears selected tile point
    this.tileInteractionState.tilePointSelected = null;
  }

  // Sets selected Saboteur hurdle type
  tileInteractionSelectedHurdleSet(hurdleType: SaboteurHurdleType): void {
    // Updates selected hurdle type
    this.saboteurHurdleTypeSelected = hurdleType;
  }

  // Gets selected Saboteur hurdle type
  tileInteractionSelectedHurdleGet(): SaboteurHurdleType {
    // Returns currently selected hurdle type
    return this.saboteurHurdleTypeSelected;
  }

  // Sets placement result for current hovered tile
  tileInteractionPlacementResultSet(
    placementResult: SaboteurHurdlePlacementResult | null
  ): void {
    // Updates hover placement result
    this.tileInteractionState.hoverPlacementResult = placementResult;
  }

  // Clears all tile interaction state
  tileInteractionClear(): void {
    // Clears hover state
    this.tileInteractionHoverClear();

    // Clears selected tile state
    this.tileInteractionSelectionClear();

    // Resets selected hurdle type
    this.saboteurHurdleTypeSelected = SaboteurHurdleType.RedTrafficLight;
  }
}