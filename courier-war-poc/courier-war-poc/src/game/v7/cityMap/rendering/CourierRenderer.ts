// Imports Phaser for game object creation
import Phaser from "phaser";

// Imports visual configuration
import { cityMapVisualConfig } from "../../config/CityMapVisualConfig";

// Imports Phaser color converter
import { phaserColorNumberFromHexGet } from "../../utility/PhaserColorConverter";

// Imports isometric center helper
import { isometricTileCenterWorldPointGet } from "../../iso/IsometricCoordinateCalculator";

// Imports coordinate tile point type
import type { CoordinateTilePoint } from "../../types/CoordinateType";

// Draws Courier character with always visible outline
export class CourierRenderer {
  // Stores Phaser scene reference
  private readonly scene: Phaser.Scene;

  // Stores Courier container
  private courierContainer?: Phaser.GameObjects.Container;

  // Creates Courier renderer
  constructor(scene: Phaser.Scene) {
    // Stores Phaser scene reference
    this.scene = scene;
  }

  // Creates Courier game object at tile point
  courierCreate(tilePoint: CoordinateTilePoint): Phaser.GameObjects.Container {
    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet(tilePoint);

    // Creates Courier container
    this.courierContainer = this.scene.add.container(tileCenter.x, tileCenter.y);

    // Sets Courier container depth
    this.courierContainer.setDepth(cityMapVisualConfig.depth.courierBody);

    // Draws Courier outline
    const courierOutline = this.courierOutlineDraw();

    // Draws Courier body
    const courierBody = this.courierBodyDraw();

    // Adds outline to container
    this.courierContainer.add(courierOutline);

    // Adds body to container
    this.courierContainer.add(courierBody);

    // Returns Courier container as tween target
    return this.courierContainer;
  }

  // Moves Courier container to a tile immediately
  courierMoveToTile(tilePoint: CoordinateTilePoint): void {
    // Stops when Courier container is missing
    if (!this.courierContainer) {
      // Ends Courier movement
      return;
    }

    // Stores tile center point
    const tileCenter = isometricTileCenterWorldPointGet(tilePoint);

    // Updates Courier x coordinate
    this.courierContainer.x = tileCenter.x;

    // Updates Courier y coordinate
    this.courierContainer.y = tileCenter.y;

    // Updates Courier depth
    this.courierDepthUpdate(tilePoint);
  }

  // Updates Courier depth
  courierDepthUpdate(_tilePoint: CoordinateTilePoint): void {
    // Stops when Courier container is missing
    if (!this.courierContainer) {
      // Ends depth update
      return;
    }

    // Sets Courier depth above all map assets
    this.courierContainer.setDepth(cityMapVisualConfig.depth.courierBody);
  }

  // Draws Courier outline object
  courierOutlineDraw(): Phaser.GameObjects.Arc {
    // Stores outline color number
    const outlineColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.courier.outlineColorHex);

    // Creates outline circle
    const outlineCircle = this.scene.add.circle(0, 0, 8, outlineColorNumber, 1);

    // Sets outline depth
    outlineCircle.setDepth(cityMapVisualConfig.depth.courierOutline);

    // Returns outline circle
    return outlineCircle;
  }

  // Draws Courier body object
  courierBodyDraw(): Phaser.GameObjects.Arc {
    // Stores body color number
    const bodyColorNumber = phaserColorNumberFromHexGet(cityMapVisualConfig.courier.bodyColorHex);

    // Creates body circle
    const bodyCircle = this.scene.add.circle(0, 0, 5, bodyColorNumber, 1);

    // Sets body depth
    bodyCircle.setDepth(cityMapVisualConfig.depth.courierBody);

    // Returns body circle
    return bodyCircle;
  }

  // Gets Courier container
  courierContainerGet(): Phaser.GameObjects.Container | undefined {
    // Returns current Courier container
    return this.courierContainer;
  }
}