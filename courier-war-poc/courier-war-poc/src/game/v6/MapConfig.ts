
// Only map-generation settings will be here, can be changed to update map ofcccc

export const MAP_CONFIG =
{
  width: 100,
  height: 100,

  startPoint: {
    x: 4,
    y: 4,
  },

  deliveryPoint: {
    x: 95,
    y: 95,
   },

  safeBorder: 4,

  districtSize: 22,
  districtRoadOffsetA: 5,
  districtRoadOffsetB: 14,

  avenueSpacingA: 16,
  avenueSpacingB: 19,
  avenueSpacingC: 29,

  connectorRoadCount: 32,
scenicConnectorCount: 14,
routeCount: 7,
routeWaypointCount: 5,

parkCount: 12,
lakeCount: 8,
bridgeCount: 12,


trafficLightCount: 60,
constructionZoneCount: 28,
tunnelCount: 15,
shortcutCount: 7,

  constructionMinLength: 4,
  constructionMaxLength: 8,

  parkMinSize: 6,
  parkMaxSize: 12,
  lakeMinSize: 5,
  lakeMaxSize: 11,

  tunnelLength: 8,
  shortcutLength: 12,

  roadRingPadding: 1,

  areaGridColumns: 4,
areaGridRows: 4,

  areaCellStride: 5,

  featureGridColumns: 10,
featureGridRows: 10,
featureCellStride: 37,

  seedA: 73856093,
  seedB: 19349663,
  seedC: 83492791,

  roadSalt: 97,
  parkSalt: 193,
  lakeSalt: 389,
  trafficSalt: 313,
  constructionSalt: 419,
  tunnelSalt: 521,
  shortcutSalt: 631,
} as const;