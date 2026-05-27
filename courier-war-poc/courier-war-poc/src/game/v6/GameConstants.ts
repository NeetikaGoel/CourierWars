
// So now these are values that wont change whatever u do (MAYBE)!!!
//first of all no direction change will happen so bring it here
import { DirectionName } from "./GameEnums";

export const GAME_CONSTANTS = 
{
  //lets say 1st we have directions
  directions: 
  {
    [DirectionName.Left]: { dx: -1, dy: 0 },
    [DirectionName.Right]: { dx: 1, dy: 0 },
    [DirectionName.Up]: { dx: 0, dy: -1 },
    [DirectionName.Down]: { dx: 0, dy: 1 },
  },

  //some math numbers just so it doesn't come under category of magic nums
  math: 
  {
    half: 2,
    zero: 0,
    one: 1,
    negativeOne: -1,
  },

  phaser: 
  {
    leftMouseButton: 0, //its a number for that left click of mouse in phaser - 0 hehe
  },
} as const;