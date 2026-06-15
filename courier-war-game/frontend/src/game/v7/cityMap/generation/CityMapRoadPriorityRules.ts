// Imports road class values used by priority checks
import { CityTileRoadClass } from "../../types/CityTileType";

// Defines road priority lookup from lowest to highest
const cityMapRoadClassPriorityByClass: Record<CityTileRoadClass, number> = {
  // Stores priority for no road
  [CityTileRoadClass.None]: 0,

  // Stores priority for local roads
  [CityTileRoadClass.LocalRoad]: 1,

  // Stores priority for district roads
  [CityTileRoadClass.DistrictRoad]: 2,

  // Stores priority for avenue roads
  [CityTileRoadClass.AvenueRoad]: 3,
};

// Gets numeric priority for a road class
export function cityMapRoadClassPriorityGet(roadClass: CityTileRoadClass): number {
  // Returns priority value for the road class
  return cityMapRoadClassPriorityByClass[roadClass];
}

// Checks whether a candidate road class can replace an existing road class
export function cityMapRoadClassReplaceCheck(
  roadClassExisting: CityTileRoadClass,
  roadClassCandidate: CityTileRoadClass
): boolean {
  // Stores existing road priority
  const roadPriorityExisting = cityMapRoadClassPriorityGet(roadClassExisting);

  // Stores candidate road priority
  const roadPriorityCandidate = cityMapRoadClassPriorityGet(roadClassCandidate);

  // Rejects candidate when it is not a road
  if (roadClassCandidate === CityTileRoadClass.None) {
    // Returns false because no road should not replace a real road
    return false;
  }

  // Allows replacement only when candidate is same or higher priority
  return roadPriorityCandidate >= roadPriorityExisting;
}

// Gets higher priority road class from two road classes
export function cityMapRoadClassHigherGet(
  roadClassA: CityTileRoadClass,
  roadClassB: CityTileRoadClass
): CityTileRoadClass {
  // Stores priority for first road class
  const roadPriorityA = cityMapRoadClassPriorityGet(roadClassA);

  // Stores priority for second road class
  const roadPriorityB = cityMapRoadClassPriorityGet(roadClassB);

  // Returns first road class when it has greater or equal priority
  if (roadPriorityA >= roadPriorityB) {
    // Returns first road class
    return roadClassA;
  }

  // Returns second road class when it has greater priority
  return roadClassB;
}

// Checks whether first road class has higher priority than second road class
export function cityMapRoadClassHigherCheck(
  roadClassA: CityTileRoadClass,
  roadClassB: CityTileRoadClass
): boolean {
  // Stores priority for first road class
  const roadPriorityA = cityMapRoadClassPriorityGet(roadClassA);

  // Stores priority for second road class
  const roadPriorityB = cityMapRoadClassPriorityGet(roadClassB);

  // Returns whether first road priority is greater
  return roadPriorityA > roadPriorityB;
}

// Checks whether first road class has same or higher priority than second road class
export function cityMapRoadClassSameOrHigherCheck(
  roadClassA: CityTileRoadClass,
  roadClassB: CityTileRoadClass
): boolean {
  // Stores priority for first road class
  const roadPriorityA = cityMapRoadClassPriorityGet(roadClassA);

  // Stores priority for second road class
  const roadPriorityB = cityMapRoadClassPriorityGet(roadClassB);

  // Returns whether first road priority is same or greater
  return roadPriorityA >= roadPriorityB;
}