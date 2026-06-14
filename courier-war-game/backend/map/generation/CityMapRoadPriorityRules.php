<?php

declare(strict_types=1);

require_once __DIR__ . '/../type/CityTileValue.php';

//this class checks road priority when one road tries to overwrite another
class CityMapRoadPriorityRules
{
  //this returns numeric road priority
  public static function cityMapRoadClassPriorityGet(string $roadClass): int
  {
    $priorityByRoadClass = [
      CityTileValue::ROAD_CLASS_NONE => 0,
      CityTileValue::ROAD_CLASS_LOCAL_ROAD => 1,
      CityTileValue::ROAD_CLASS_DISTRICT_ROAD => 2,
      CityTileValue::ROAD_CLASS_AVENUE_ROAD => 3,
    ];

    return $priorityByRoadClass[$roadClass] ?? 0;
  }

  //this checks whether candidate road can replace existing road
  public static function cityMapRoadClassReplaceCheck(string $roadClassExisting, string $roadClassCandidate): bool
  {
    if ($roadClassCandidate === CityTileValue::ROAD_CLASS_NONE) {
      return false;
    }

    return self::cityMapRoadClassPriorityGet($roadClassCandidate) >= self::cityMapRoadClassPriorityGet($roadClassExisting);
  }

  //this returns higher priority road class
  public static function cityMapRoadClassHigherGet(string $roadClassA, string $roadClassB): string
  {
    if (self::cityMapRoadClassPriorityGet($roadClassA) >= self::cityMapRoadClassPriorityGet($roadClassB)) {
      return $roadClassA;
    }

    return $roadClassB;
  }

  //this checks whether first road class is higher than second
  public static function cityMapRoadClassHigherCheck(string $roadClassA, string $roadClassB): bool
  {
    return self::cityMapRoadClassPriorityGet($roadClassA) > self::cityMapRoadClassPriorityGet($roadClassB);
  }

  //this checks whether first road class is same or higher than second
  public static function cityMapRoadClassSameOrHigherCheck(string $roadClassA, string $roadClassB): bool
  {
    return self::cityMapRoadClassPriorityGet($roadClassA) >= self::cityMapRoadClassPriorityGet($roadClassB);
  }
}
