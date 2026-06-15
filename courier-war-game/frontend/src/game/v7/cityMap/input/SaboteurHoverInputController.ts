// Imports Phaser types used by pointer hover
import Phaser from "phaser";

// Imports generated city map type
import type { CityMapGenerated } from "../../types/CityMapType";

// Imports player role values
import { PlayerRole } from "../../types/PlayerRoleType";

// Imports match runtime state shape
import type { MatchPrototypeStateShape } from "../../types/MatchRuntimeStateType";

// Imports placement result type
import type { SaboteurHurdlePlacementResult } from "../../types/SaboteurHurdleType";

// Imports Saboteur placement rule
import { saboteurPlacementCheck } from "../rules/SaboteurPlacementRules";

// Imports pointer tile resolver
import { PointerTileInputResolver } from "./PointerTileInputResolver";

// Handles Saboteur hover validation and hover state
export class SaboteurHoverInputController {
  // Stores Phaser scene reference
  private readonly scene: Phaser.Scene;

  // Stores generated city map
  private readonly cityMapGenerated: CityMapGenerated;

  // Stores mutable prototype match state
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // Stores pointer tile resolver
  private readonly pointerTileInputResolver: PointerTileInputResolver;

  // Creates Saboteur hover input controller
  constructor(
    scene: Phaser.Scene,
    cityMapGenerated: CityMapGenerated,
    matchPrototypeState: MatchPrototypeStateShape,
    pointerTileInputResolver: PointerTileInputResolver
  ) {
    // Stores Phaser scene reference
    this.scene = scene;

    // Stores generated city map reference
    this.cityMapGenerated = cityMapGenerated;

    // Stores prototype match state reference
    this.matchPrototypeState = matchPrototypeState;

    // Stores pointer tile resolver reference
    this.pointerTileInputResolver = pointerTileInputResolver;
  }

  // Updates Saboteur hover state from active pointer
  saboteurHoverUpdate(pointer: Phaser.Input.Pointer = this.scene.input.activePointer): void {
    // Clears hover when current prototype role is not Saboteur
    if (this.matchPrototypeState.playerRole !== PlayerRole.Saboteur) {
      // Clears hover state
      this.saboteurHoverClear();

      // Ends hover update
      return;
    }

    // Gets tile under pointer
    const cityTile = this.pointerTileInputResolver.pointerTileFromPointerGet(pointer);

    // Clears hover when pointer is outside map
    if (!cityTile) {
      // Clears hover state
      this.saboteurHoverClear();

      // Ends hover update
      return;
    }

    // Updates hovered tile point
    this.matchPrototypeState.tileInteraction.tilePointHovered = {
      // Stores hovered tile x coordinate
      x: cityTile.x,

      // Stores hovered tile y coordinate
      y: cityTile.y,
    };

    // Validates placement for current hovered tile
    const placementResult = saboteurPlacementCheck({
      // Stores generated city map
      cityMapGenerated: this.cityMapGenerated,

      // Stores generated zone list
      cityZoneList: this.cityMapGenerated.zoneList,

      // Stores hovered city tile
      cityTile,

      // Stores selected hurdle type
      hurdleType: this.matchPrototypeState.saboteur.hurdleTypeSelected,

      // Stores current match runtime state
      matchPrototypeState: this.matchPrototypeState,

      // Stores current scene time
      currentTimeMs: this.scene.time.now,
    });

    // Stores hover placement result
    this.matchPrototypeState.tileInteraction.hoverPlacementResult = placementResult;
  }

  // Clears Saboteur hover state
  saboteurHoverClear(): void {
    // Clears hovered tile point
    this.matchPrototypeState.tileInteraction.tilePointHovered = null;

    // Clears hover placement result
    this.matchPrototypeState.tileInteraction.hoverPlacementResult = null;
  }

  // Gets current hover placement result
  saboteurHoverPlacementResultGet(): SaboteurHurdlePlacementResult | null {
    // Returns hover placement result from match state
    return this.matchPrototypeState.tileInteraction.hoverPlacementResult;
  }
}