
// So now these are values that wont change whatever u do (MAYBE)!!!

import { DirectionName } from "./GameEnums";

export const GAME_CONSTANTS = 
{
  directions: 
  {
    [DirectionName.Left]: { dx: -1, dy: 0 },
    [DirectionName.Right]: { dx: 1, dy: 0 },
    [DirectionName.Up]: { dx: 0, dy: -1 },
    [DirectionName.Down]: { dx: 0, dy: 1 },
  },

  math: 
  {
    half: 2,
    zero: 0,
    one: 1,
    negativeOne: -1,
  },

  phaser: 
  {
    leftMouseButton: 0,
  },

  array: 
  {
    firstIndex: 0,
  },
} as const;