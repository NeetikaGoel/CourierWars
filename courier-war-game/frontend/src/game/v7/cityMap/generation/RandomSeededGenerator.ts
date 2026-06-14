// Defines a deterministic seeded random number generator for city generation
export class RandomSeededGenerator {
  // Stores the current internal seed value
  private seedCurrent: number;

  // Creates a seeded random generator
  constructor(seedInitial: number) {
    // Stores normalized seed value so random generation remains stable
    this.seedCurrent = this.seedNormalize(seedInitial);
  }

  // Normalizes any seed into a safe unsigned integer
  private seedNormalize(seedValue: number): number {
    // Stores integer seed after removing decimal part
    const seedInteger = Math.floor(seedValue);

    // Checks whether seed is a valid finite number
    const seedValid = Number.isFinite(seedInteger);

    // Returns fallback seed when input seed is invalid
    if (!seedValid) {
      // Uses one as a safe non zero fallback seed
      return 1;
    }

    // Converts seed to unsigned 32 bit integer
    const seedUnsigned = seedInteger >>> 0;

    // Prevents zero seed from creating weak repeated output in some generators
    if (seedUnsigned === 0) {
      // Uses one as a safe non zero replacement
      return 1;
    }

    // Returns normalized unsigned seed
    return seedUnsigned;
  }

  // Gets the next random number between zero inclusive and one exclusive
  numberNext(): number {
    // Updates seed using a linear congruential generator formula
    this.seedCurrent = (1664525 * this.seedCurrent + 1013904223) >>> 0;

    // Converts unsigned 32 bit seed into a zero to one floating point number
    return this.seedCurrent / 4294967296;
  }

  // Gets an integer between min and max inclusive
  numberIntegerGet(min: number, max: number): number {
    // Stores normalized lower bound
    const valueMin = Math.ceil(Math.min(min, max));

    // Stores normalized upper bound
    const valueMax = Math.floor(Math.max(min, max));

    // Stores total possible integer count
    const valueRange = valueMax - valueMin + 1;

    // Returns random integer inside inclusive range
    return Math.floor(this.numberNext() * valueRange) + valueMin;
  }

  // Gets a floating point number between min inclusive and max exclusive
  numberFloatGet(min: number, max: number): number {
    // Stores normalized lower bound
    const valueMin = Math.min(min, max);

    // Stores normalized upper bound
    const valueMax = Math.max(min, max);

    // Stores range between min and max
    const valueRange = valueMax - valueMin;

    // Returns random floating point value inside range
    return valueMin + this.numberNext() * valueRange;
  }

  // Checks a random probability between zero and one
  booleanChanceCheck(probability: number): boolean {
    // Clamps probability to zero one range
    const probabilityClamped = Math.max(0, Math.min(1, probability));

    // Returns whether next random value falls within probability
    return this.numberNext() < probabilityClamped;
  }

  // Picks one random item from a list
  arrayItemPick<T>(itemList: T[]): T {
    // Checks that list contains at least one item
    if (itemList.length === 0) {
      // Throws clear error for invalid random pick usage
      throw new Error("Cannot pick random item from empty list");
    }

    // Stores selected random index
    const itemIndex = this.numberIntegerGet(0, itemList.length - 1);

    // Returns item at selected index
    return itemList[itemIndex];
  }

  // Returns a shuffled copy of the given list
  arrayShuffle<T>(itemList: T[]): T[] {
    // Creates a copy so original list is not changed
    const shuffledItemList = [...itemList];

    // Walks backward through the list for Fisher Yates shuffle
    for (let itemIndex = shuffledItemList.length - 1; itemIndex > 0; itemIndex--) {
      // Stores random swap index from start to current item
      const swapIndex = this.numberIntegerGet(0, itemIndex);

      // Stores current item before swap
      const itemCurrent = shuffledItemList[itemIndex];

      // Moves random item into current index
      shuffledItemList[itemIndex] = shuffledItemList[swapIndex];

      // Moves current item into random index
      shuffledItemList[swapIndex] = itemCurrent;
    }

    // Returns shuffled list copy
    return shuffledItemList;
  }
}