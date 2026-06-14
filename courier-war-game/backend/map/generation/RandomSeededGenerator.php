<?php
declare(strict_types=1);

//this class gives deterministic random values from one seed
class RandomSeededGenerator
{
  private int $_seedCurrent;

  public function __construct(int $seedInitial)
  {
    $this->_seedCurrent = $this->seedNormalize($seedInitial);
  }

  //this keeps seed safe and non zero
  private function seedNormalize(int $seedValue): int
  {
    $seedUnsigned = $seedValue & 0xffffffff;

    if ($seedUnsigned === 0) {
      return 1;
    }

    return $seedUnsigned;
  }

  //this returns random float from zero inclusive to one exclusive
  public function numberNext(): float
  {
    $this->_seedCurrent = (int)((1664525 * $this->_seedCurrent + 1013904223) & 0xffffffff);

    return $this->_seedCurrent / 4294967296;
  }

  //this returns random integer between min and max inclusive
  public function numberIntegerGet(int $min, int $max): int
  {
    $valueMin = min($min, $max);
    $valueMax = max($min, $max);
    $valueRange = $valueMax - $valueMin + 1;

    return (int)floor($this->numberNext() * $valueRange) + $valueMin;
  }

  //this returns random float between min inclusive and max exclusive
  public function numberFloatGet(float $min, float $max): float
  {
    $valueMin = min($min, $max);
    $valueMax = max($min, $max);

    return $valueMin + $this->numberNext() * ($valueMax - $valueMin);
  }

  //this checks whether random chance passes
  public function booleanChanceCheck(float $probability): bool
  {
    $probabilityClamped = max(0, min(1, $probability));

    return $this->numberNext() < $probabilityClamped;
  }

  //this picks one random item from a list
  public function arrayItemPick(array $itemList)
  {
    if (count($itemList) === 0) {
      throw new RuntimeException('cannot pick random item from empty list');
    }

    $itemIndex = $this->numberIntegerGet(0, count($itemList) - 1);

    return $itemList[$itemIndex];
  }

  //this returns shuffled copy of a list
  public function arrayShuffle(array $itemList): array
  {
    $shuffledItemList = array_values($itemList);

    for ($itemIndex = count($shuffledItemList) - 1; $itemIndex > 0; $itemIndex--) {
      $swapIndex = $this->numberIntegerGet(0, $itemIndex);

      $itemCurrent = $shuffledItemList[$itemIndex];
      $shuffledItemList[$itemIndex] = $shuffledItemList[$swapIndex];
      $shuffledItemList[$swapIndex] = $itemCurrent;
    }

    return $shuffledItemList;
  }
}
