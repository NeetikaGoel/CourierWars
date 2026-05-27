
// Simple scene that uses generated map data and renderer class now
// for controlling whole game now
//will need to be refactored
//haha donee omg still big wth


//importing allll
import Phaser from "phaser";
import { GAME_CONFIG } from "./GameConfig";
import { GAME_CONSTANTS } from "./GameConstants";
import { TileType } from "./GameEnums";
import { mapTiles, findStartTile } from "./MapData";
import { MapRenderer } from "./MapRenderer";
import { isoToScreen, TILE_HEIGHT } from "./Iso";
import type { MapTile } from "./GameShapeTypes";
import { MAP_CONFIG } from "./MapConfig";


//make class, extend and now lets thinkkkkk!!!
export class GameScene extends Phaser.Scene
{
  //new class so first of all, all variables define!!

  //no first what this will do
  //1. create scene
  //2. setup camera
  //3. draw map using MapRenderer
  //4. create courier
  //5. listen to keyboard
  //6. move courier
  //7. show feedback
  //8. check win

  //! will be there coz defining later in functions na
  //stupidity at its peak
  private courier!: Phaser.GameObjects.Arc;
  private mapRenderer!: MapRenderer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private centerKey!: Phaser.Input.Keyboard.Key; //for bringing courier in centre coz why not!!!

  //simple vars to not refer to imports all time!!!
  //just put any initial value
  private courierTileX: number = GAME_CONSTANTS.math.zero;
  private courierTileY: number = GAME_CONSTANTS.math.zero;
  //where was last ptr of mouse before zoom we need
  // so it stores last mouse position when dragging camera
  private lastPointerX: number = GAME_CONSTANTS.math.zero;
  private lastPointerY: number = GAME_CONSTANTS.math.zero;

  //some cute bools!!
  private isMoving = false; //for tween animation personal space
  private isDraggingCamera = false; //to check if it's done

  //now some optional things coz not everything is important hehe!!
  //special appearances people we have here
  private feedbackElement?: HTMLDivElement;
  private hudElement?: HTMLDivElement;

  //do we need more
  //idk lets move on
  //will add if needed hahahahha

  //now constructor 
  constructor()
  {
    super(GAME_CONFIG.scene.key);
  }


  //now functions to create game scene
  //first have to make map so calling renderer class!!!
  create()
  {
    //will be same as 25x25 except calling class
    this.mapRenderer = new MapRenderer(this);
    //now setting cursor keys and center key
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.centerKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    //next we need starting toupdate courier coordinates
    const startTile = findStartTile();
    this.courierTileX = startTile.x;
    this.courierTileY = startTile.y;

    //then jsut setup camera, draw everything and put courier and add instruction
    this.setupCamera();
    this.mapRenderer.draw(mapTiles);
    this.createCourier();
    this.addInstructionText();

    //all this to be called once only
    //rest will go in others
  }

  update()
  {
    //this for handling the mouse and keyb functions!!!
    //will be run each second 60 times!!!!
    //runs each frame!!!

    //first check if c pressed then udpate na, make function
    this.handleCameraCenter();

    //animation in play, dont do anything, keep QUIETTTTT!!!!!!!!!!
    if (this.isMoving) return;

    //hehe no movt, lets see what else can happen then

    //same copy lines but update constants damnnnnn
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!))
      this.tryMove(GAME_CONSTANTS.directions.left.dx, GAME_CONSTANTS.directions.left.dy);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!))
      this.tryMove(GAME_CONSTANTS.directions.right.dx, GAME_CONSTANTS.directions.right.dy);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!))
      this.tryMove(GAME_CONSTANTS.directions.up.dx, GAME_CONSTANTS.directions.up.dy);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!))
      this.tryMove(GAME_CONSTANTS.directions.down.dx, GAME_CONSTANTS.directions.down.dy);
  }

  //now func to set up camera
  private setupCamera()
  {
    //phaser camera bring first
    const camera = this.cameras.main;
    //now we need it in center so another func to bring everyhitn in center
    //have to add this function!!!! - oki added!!
    const bounds = this.getWorldBounds();

    //zoom set as per game configs
    camera.setZoom(GAME_CONFIG.camera.startZoom);
    //dont let camera go out of loop oki
    camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    //center it on map
    this.centerCameraOnMap();

    //if mouse wheel used then zoom around pointer
    //how to do that
    //yeah thats how
    this.input.on("wheel", (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.zoomToPointer(pointer, dy);
    });

    //also to do same for dragging thing of mouse
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== GAME_CONSTANTS.phaser.leftMouseButton)
        return;

      this.isDraggingCamera = true;
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    //now if drag move
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDraggingCamera) return;

      camera.scrollX -= ((pointer.x - this.lastPointerX) / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;
      camera.scrollY -= ((pointer.y - this.lastPointerY) / camera.zoom) * GAME_CONFIG.camera.dragSpeedMultiplier;

      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.input.on("pointerup", () => (this.isDraggingCamera = false));
    this.input.on("pointerout", () => (this.isDraggingCamera = false));
  }
    
  //now to bring map in center camera ofc
  //whenever pressed c - use this func
  private centerCameraOnMap()
  {
    const centerTileX = Math.floor(MAP_CONFIG.width / GAME_CONSTANTS.math.half);
    const centerTileY = Math.floor(MAP_CONFIG.height / GAME_CONSTANTS.math.half);
  
    const centerPosition = this.mapRenderer.getTileScreenPosition(
      centerTileX,
      centerTileY
    );
  
    this.cameras.main.centerOn(centerPosition.x, centerPosition.y);
  }

  //now movt functions lets see
  //first if courier want to move ofc
  private tryMove(dx: number, dy: number)
  {
    const nextX = this.courierTileX + dx;
    const nextY = this.courierTileY + dy;

    //check it shoul dbe inside map
    //another function for it lets say
    //yeah done so now
    if (!this.isInsideMap(nextX, nextY)) return;

    //now check tile and if walkable if yes move courier
    const tile = mapTiles[nextY][nextX];

    if (!tile.walkable) return;

    this.courierTileX = nextX;
    this.courierTileY = nextY;
    //if special tile feedback also
    //how could u forget dear???
    this.showTileFeedback(tile);

    //making animation so make that cute bool true so nothing else happens
    this.isMoving = true;

    this.tweens.add({
      targets: this.courier,
      ...this.getCourierScreenPosition(),
      duration: GAME_CONFIG.movement.baseDurationMs * tile.movementCost,
      ease: GAME_CONFIG.camera.ease,
      onComplete: () => {
        this.isMoving = false;
        this.checkWin(tile);
      },
    });

    //bool willbe false till now
  }

  //this func for creating that courier circle hehe
  private createCourier()
  {
    //to get position need another func, it will be same
    //MY GOD!!!!
    const position = this.getCourierScreenPosition();

    this.courier = this.add.circle(
      position.x,
      position.y,
      GAME_CONFIG.courier.radius,
      this.hexStringToNumber(GAME_CONFIG.colors.courier)
    );

    this.courier.setDepth(GAME_CONFIG.courier.depth);
  }

  //issue with color, adding this here too, same as map renderer
  private hexStringToNumber(color: string): number
  {
    return Number(color.replace("#", "0x"));
  }
  

  //now courier screen position, just call iso one
  private getCourierScreenPosition()
  {
    const position = isoToScreen(this.courierTileX, this.courierTileY);

    return {
      x: GAME_CONFIG.map.originX + position.x,
      y: GAME_CONFIG.map.originY + position.y + TILE_HEIGHT / GAME_CONSTANTS.math.half,
    };
  }

  //now this idk
  //but is imp coz some camera issue happening damn
  //its like find earlier mouse zoom position then find new mouse zoom position and set the updated zoom hehe
  private zoomToPointer(pointer: Phaser.Input.Pointer, deltaY: number)
  {
    const camera = this.cameras.main;
    const before = camera.getWorldPoint(pointer.x, pointer.y);
    const zoom = deltaY > GAME_CONSTANTS.math.zero
      ? Math.max(GAME_CONFIG.camera.minZoom, camera.zoom - GAME_CONFIG.camera.zoomStep)
      : Math.min(GAME_CONFIG.camera.maxZoom, camera.zoom + GAME_CONFIG.camera.zoomStep);

    camera.setZoom(zoom);

    const after = camera.getWorldPoint(pointer.x, pointer.y);

    camera.scrollX += before.x - after.x;
    camera.scrollY += before.y - after.y;
  }

  //this cute func coz just bring us to center no drag headache
  private handleCameraCenter()
  {
    if (Phaser.Input.Keyboard.JustDown(this.centerKey))
    {
      this.centerCameraOnCourier();
    }
  }

  //hehe now this not cute coz now write actual function damnnnnn!!
  private centerCameraOnCourier()
  {
    const position = this.getCourierScreenPosition();
    this.cameras.main.pan(
        position.x,
        position.y,
        GAME_CONFIG.camera.panDurationMs,
        GAME_CONFIG.camera.ease
      );
  }

  //okay that shit done!!
  //now lets see what left
  //damnnnn this world bound func
  //yeah so how to do this
  //good question!!!!
  private getWorldBounds()
  {
    //need all top bottom right left first
    const top = this.mapRenderer.getTileScreenPosition(
      GAME_CONSTANTS.math.zero,
      GAME_CONSTANTS.math.zero
    );
  
    const right = this.mapRenderer.getTileScreenPosition(
      MAP_CONFIG.width,
      GAME_CONSTANTS.math.zero
    );
  
    const bottom = this.mapRenderer.getTileScreenPosition(
      MAP_CONFIG.width,
      MAP_CONFIG.height
    );
  
    const left = this.mapRenderer.getTileScreenPosition(
      GAME_CONSTANTS.math.zero,
      MAP_CONFIG.height
    );
  
    //done now???
    //whats padding
    const minX =
      Math.min(top.x, right.x, bottom.x, left.x) - GAME_CONFIG.camera.worldPadding;
  
    const maxX =
      Math.max(top.x, right.x, bottom.x, left.x) + GAME_CONFIG.camera.worldPadding;
  
    const minY =
      Math.min(top.y, right.y, bottom.y, left.y) - GAME_CONFIG.camera.worldPadding;
  
    const maxY =
      Math.max(top.y, right.y, bottom.y, left.y) + GAME_CONFIG.camera.worldPadding;
  
    //yeah yeah nice but i hate it
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  //this cute function just get the msg hehe
  private showTileFeedback(tile: MapTile)
  {
    const message = this.getFeedbackText(tile);

    if (!GAME_CONFIG.feedback.enabled || message === GAME_CONFIG.feedback.normalText) return;

    this.feedbackElement?.remove();

    this.feedbackElement = this.addHudText(
      GAME_CONFIG.ui.feedbackX,
      GAME_CONFIG.ui.feedbackY,
      message,
      GAME_CONFIG.ui.feedbackFontSize,
      GAME_CONFIG.colors.feedbackBackground
    );

    
    this.time.delayedCall(GAME_CONFIG.feedback.durationMs, () => {
      this.feedbackElement?.remove();
      this.feedbackElement = undefined;
    });
  }


  //nah this is cute, above one is pathetic!!!!
  private getFeedbackText(tile: MapTile)
  {
    if (tile.type === TileType.TrafficLight) return GAME_CONFIG.feedback.trafficText;
    if (tile.type === TileType.Construction) return GAME_CONFIG.feedback.constructionText;
    if (tile.type === TileType.Bridge) return GAME_CONFIG.feedback.bridgeText;
    if (tile.type === TileType.Tunnel) return GAME_CONFIG.feedback.tunnelText;
    if (tile.type === TileType.Shortcut) return GAME_CONFIG.feedback.shortcutText;

    return GAME_CONFIG.feedback.normalText;
  }


  //all done hurrayyyyy!!!!!!!!!!!

  //oh damn noooooo!!!!!
  //just cheking winning of courier neetika, whats so hard, everything yes
  private checkWin(tile: MapTile)
  {
    if (tile.type !== TileType.Delivery) return;

    this.addHudText(
      GAME_CONFIG.ui.winX,
      GAME_CONFIG.ui.winY,
      GAME_CONFIG.ui.winText,
      GAME_CONFIG.ui.winFontSize,
      GAME_CONFIG.colors.winBackground
    );
  }

  //now just instruction texts adding coz those red lines damnnnnn
  private addInstructionText()
  {
    this.addHudText(
      GAME_CONFIG.ui.instructionX,
      GAME_CONFIG.ui.instructionY,
      GAME_CONFIG.ui.instructionText,
      GAME_CONFIG.ui.instructionFontSize,
      GAME_CONFIG.colors.uiBackground
    );
  }


  //finalll oneeeee
  private addHudText(x: number, y: number, text: string, fontSize: string, backgroundColor: string)
  {
    const element = document.createElement("div");

    element.textContent = text;
    element.style.position = "fixed";
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.zIndex = `${GAME_CONFIG.ui.depth}`;
    element.style.color = GAME_CONFIG.colors.uiText;
    element.style.backgroundColor = backgroundColor;
    element.style.fontSize = fontSize;
    element.style.padding = `${GAME_CONFIG.ui.paddingY}px ${GAME_CONFIG.ui.paddingX}px`;
    element.style.pointerEvents = "none";

    this.getHudElement().appendChild(element);

    return element;
  }

  //did u really think that
  //these red lines will leave u so easily
  //not a chance dear
  private getHudElement()
  {
    if (this.hudElement) return this.hudElement;

    document.getElementById(GAME_CONFIG.ui.hudElementId)?.remove();

    this.hudElement = document.createElement("div");
    this.hudElement.id = GAME_CONFIG.ui.hudElementId;
    this.hudElement.style.position = "fixed";
    this.hudElement.style.inset = GAME_CONFIG.ui.hudInset;
    this.hudElement.style.pointerEvents = "none";

    document.body.appendChild(this.hudElement);

    return this.hudElement;
  }


  //cutie pie function i love you!!!!
  private isInsideMap(x: number, y: number)
  {
    return x >= GAME_CONSTANTS.math.zero && x < MAP_CONFIG.width && y >= GAME_CONSTANTS.math.zero && y < MAP_CONFIG.height;
  }
}