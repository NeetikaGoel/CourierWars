// Defines all designer editable city map generation settings!!!
export const cityMapGenerationConfig = 
{
  // Groups deterministic generation seed settings
  seed: 
  {
    // Stores the default seed used by the local prototype
    valueDefault: 20260531,
    // Stores how many times generation may retry before accepting failure
    retryCountMax: 8,
  },

  // Groups base city map size settings
  map: 
  {
    widthTiles: 96, // Stores total map width in tiles
    heightTiles: 96,  // Stores total map height in tiles
    safeBorderTiles: 4, // Stores border padding where major generated features should not start
  },

  // Groups macro zone settings here!!
  zone: 
  {
    columnCount: 3, // Stores no. of zone cols across the map
    rowCount: 3, // Stores no. of zone rows across the map
  },

  // Groups road network generation settings
  road: 
  {
    // Groups local road settings
    local: 
    {
      widthTiles: 1, // Stores local road width in tiles
      label: "localRoad", // Stores local road movement and generation category name
      spacingTilesMin: 7, // Stores minimum local road spacing inside a zone
      spacingTilesMax: 12, // Stores maximum local road spacing inside a zone
      branchCountPerZoneTarget: 4, // Stores target no. of local road branches per zone
    },
      
    district: 
    {
      widthTiles: 2, // Stores district road width in tiles
      label: "districtRoad", // Stores district road movement and generation category name
      spacingTilesMin: 12, // Stores minimum district road spacing inside a zone
      spacingTilesMax: 18, // Stores maximum district road spacing inside a zone
      roadCountPerZoneTarget: 3, // Stores target no. of district roads per zone
    },


    // Groups avenue road settings
    avenue: {
      // Stores avenue road width in tiles
      widthTiles: 3,

      // Stores avenue road movement and generation category name
      label: "avenueRoad",

      // Stores minimum spacing between generated avenues
      spacingTilesMin: 24,

      // Stores maximum spacing between generated avenues
      spacingTilesMax: 32,

      // Stores target vertical avenue count across the whole city
      verticalCountTarget: 3,

      // Stores target horizontal avenue count across the whole city
      horizontalCountTarget: 3,
    },
  },

  // Groups park generation settings
  park: {
    // Stores minimum no. of parks to place
    countMin: 6,

    // Stores maximum no. of parks to place
    countMax: 10,

    // Stores minimum park width in tiles
    widthTilesMin: 6,

    // Stores maximum park width in tiles
    widthTilesMax: 13,

    // Stores minimum park height in tiles
    heightTilesMin: 5,

    // Stores maximum park height in tiles
    heightTilesMax: 12,

    // Stores whether larger parks may receive surrounding roads
    ringRoadAllowed: true,
  },

  // Groups lake generation settings
  lake: {
    // Stores minimum no. of lakes to place
    countMin: 3,

    // Stores maximum no. of lakes to place
    countMax: 9,

    // Stores minimum lake width in tiles to avoid thin strips
    widthTilesMin: 8,

    // Stores maximum lake width in tiles
    widthTilesMax: 17,

    // Stores minimum lake height in tiles to avoid one tile lakes
    heightTilesMin: 6,

    // Stores maximum lake height in tiles
    heightTilesMax: 13,

    // Stores whether larger lakes may receive surrounding roads
    ringRoadAllowed: true,
  },

  // Groups bridge generation settings
  bridge: {
    // Stores minimum no. of bridges to generate
    countMin: 3,

    // Stores maximum no. of bridges to generate
    countMax: 6,

    // Stores minimum bridge length in water tiles
    lengthTilesMin: 5,

    // Stores maximum bridge length in water tiles
    lengthTilesMax: 16,
  },

  // Groups tunnel generation settings
  tunnel: {
    // Stores minimum no. of tunnels to generate
    countMin: 4,

    // Stores maximum no. of tunnels to generate
    countMax: 8,

    // Stores minimum tunnel length in tiles
    lengthTilesMin: 5,

    // Stores maximum tunnel length in tiles
    lengthTilesMax: 13,

    // Stores minimum useful distance between tunnel endpoints
    endpointDistanceTilesMin: 8,
  },

  // Groups shortcut generation settings
  shortcut: {
    // Stores minimum no. of shortcuts to generate
    countMin: 5,

    // Stores maximum no. of shortcuts to generate
    countMax: 9,

    // Stores minimum shortcut length in tiles
    lengthTilesMin: 5,

    // Stores maximum shortcut length in tiles
    lengthTilesMax: 12,

    // Stores minimum useful distance saved before accepting a shortcut
    distanceSavingTilesMin: 4,
  },

  // Groups traffic signal placement settings
  trafficSignal: {
    // Stores target traffic signal count before validation removes invalid signals
    countTarget: 42,

    // Stores minimum tile distance between two traffic signals
    distanceTilesMin: 7,

    // Stores whether avenue to avenue intersections must get traffic signals
    avenueAvenueSignalRequired: true,

    // Stores chance for avenue to district intersections to get signals
    avenueDistrictSignalChance: 0.75,

    // Stores chance for district to district intersections to get signals
    districtDistrictSignalChance: 0.45,

    // Stores chance for local only intersections to get signals
    localOnlySignalChance: 0,
  },

  // Groups start and delivery placement settings
  startDelivery: {
    // Stores preferred zone id for Courier start placement
    startZoneIdPreferred: "zone-0",

    // Stores preferred zone id for delivery placement
    deliveryZoneIdPreferred: "zone-8",

    // Stores maximum search radius when preferred tile is not walkable
    validRoadSearchRadiusTilesMax: 20,
  },
} as const;