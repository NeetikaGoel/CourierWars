// Phaser scene for rendering and movement

import Phaser from "phaser"; //so importing phaser game engine first

//Phaser is an open-source HTML5 game framework used primarily for building 2D games that run in web browsers! It is written in JavaScript and supports development in both JavaScript and TypeScript!!

//then import files needed
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from "./Iso";
import { mapTiles, mapWidth, mapHeight } from "./MapData";

//now making a class as gamescene -- this will create the game scene!!!
export class GameScene extends Phaser.Scene {
  //GameScene is a Phaser scene!
  // It gets Phaser scene features like add, input, tweens, update, etc.

  //keeping all vars pvt so no other class can use it 
  //! coz assigning it later!! 
  private courier!: Phaser.GameObjects.Sprite; //declares a class variable named courier with red dot heheeee!!!
  private courierTileX = 1;  //from where the courier will start x coordinate
  private courierTileY = 1;  //from where the courier will start y coordinate
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;  //to store the keyb arrow keys 

  //map to screen but to give margin
  private originX = 500; 
  private originY = 200;

  //runs when scene is created- later cna run by - this.scene.start("GameScene");
  constructor()
  {
    super("GameScene");
  }

  //now Phaser lifecycle method!! runs only once okiii!!!
  create()
  {
    //now we need to use for::
    // creating map
    // creating player
    // creating keyboard input
    // creating UI
    this.cursors = this.input.keyboard!.createCursorKeys(); //creating arrow key controls here
    //why !- keyb does exist !!! TS non-null assertion!!

    this.drawMap(); //draws the isometric map tiles
    this.createCourier(); //creates the red courier circle

    // Order matters!

    // Draw map first, Courier after!

    // Because Courier should appear above the map!!!
  }

  //will run continuously!! 60 times per sec
  update()
  {
    //will be used for movt, collision check, timer/input check, animations too
    
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!))
    {
      // Did the player just press left arrow?
      // JustDown means it triggers once per key press!!!
      // If used normal isDown, it would trigger every frame while held down!!
      this.tryMoveCourier(-1, 0); //go left ofc
    }

    //now same for all other directions right??
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!))
    {
      this.tryMoveCourier(1, 0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!))
    {
      this.tryMoveCourier(0, -1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!))
    {
      this.tryMoveCourier(0, 1);
    }

    //this is grid movement, not screen movement!!!!!
    //Becoz the map is isometric, pressing right may visually move diagonally
  }

  //now pvt func to draw each map tile we need for this
  private drawMap()
  {
    for (let y = 0; y < mapHeight; y++)
    {
      //loop rows
      for (let x = 0; x < mapWidth; x++)
      {
        //loop cols
        //now get tile data then calculate its screen position
        //after correct it with origin one
        const tile = mapTiles[y][x];
        const pos = isoToScreen(x, y);

        const screenX = this.originX + pos.x;
        const screenY = this.originY + pos.y;

        //lets choose colours!!!
        let color = 0x607d8b;

        if (tile.type === "start")
        {
          color = 0x4caf50;
        }
        
        else if (tile.type === "delivery")
        {
          color = 0xffc107;
        }
        
        else if (tile.type === "blocked")
        {
          color = 0x333333;
        }

        this.drawDiamond(screenX, screenY, color); //draws one isometric diamond tile at that position!

        //now writing coordinate label though we can remove too hehehehheh
        this.add
          .text(screenX - 12, screenY - 8, `${x},${y}`, {
            fontSize: "12px",
            color: "#ffffff",
          })
          .setDepth(10);
      }
    }
  }

  //now the func for drawing diamond tile
  //draws 1 diamond tile
  private drawDiamond(x: number, y: number, color: number)
  {
    const graphics = this.add.graphics(); //creates a Phaser graphics object!
    //it lets draw shapes manually!!

    graphics.fillStyle(color, 1); //1 is opacity (full visible), color for filling
    graphics.lineStyle(2, 0xffffff, 0.6); //border line white okii, then 0.6 again opacity 

    graphics.beginPath();
    graphics.moveTo(x, y); //from start
    graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2); //to top
    graphics.lineTo(x, y + TILE_HEIGHT); //to right
    graphics.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2); //to bottom
    graphics.closePath(); //connect to start

    graphics.fillPath(); //fill it
    graphics.strokePath();
  }

  //now func for creating courier obj
  private createCourier()
  {
    //get its position first ofc
    const pos = this.getCourierScreenPosition();
    //add circle for it now - no sprite
    this.courier = this.add.sprite(pos.x, pos.y, "courier"); //14 is radius, then color
    this.courier.setDepth(100);
  }

  //now func to move courier- change coordinates ofc
  private tryMoveCourier(dx: number, dy: number)
  {
    const nextX = this.courierTileX + dx;
    const nextY = this.courierTileY + dy;

    //first check if valid or not
    if (nextX < 0 || nextX >= mapWidth || nextY < 0 || nextY >= mapHeight)
    {
      return;
    }

    //if valid ofc
    const nextTile = mapTiles[nextY][nextX];

    //check walkableness!!
    if (!nextTile.walkable)
    {
      return;
    }

    //then right update it!!
    this.courierTileX = nextX;
    this.courierTileY = nextY;

    //now new position for its screen
    const pos = this.getCourierScreenPosition();

    //for animation of it smooth one
    this.tweens.add({
      targets: this.courier,
      x: pos.x,
      y: pos.y,
      duration: 150,
      ease: "Power2",
    });
  }

  //now which location courier at on screen from tile one
  private getCourierScreenPosition()
  {
    const pos = isoToScreen(this.courierTileX, this.courierTileY);

    return {
      x: this.originX + pos.x,
      y: this.originY + pos.y + TILE_HEIGHT / 2,
    };
  }
}