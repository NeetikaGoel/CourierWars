
// Only map-generation settings will be here, can be changed to update map ofcccc
//now these settings can be changed anytime to udpate the map!!!!

export const MAP_CONFIG =
{
  width: 100,
  height: 100,

  startPoint:
  {
    x: 4,
    y: 4,
  },

  deliveryPoint:
  {
    x: 95,
    y: 95,
   },

  //boundary of the map 
  safeBorder: 4,

  //city is divided into blocks of around 22 x 22 tiles! Inside each district/block, we draw local roads oki
  districtSize: 22,  //size of each zone 22x22
  districtRoadOffsetA: 5,  
  districtRoadOffsetB: 14,

  //these r for large city wide roads
  avenueSpacingA: 16, //draw vertical roads every 16 tiles
  avenueSpacingB: 19, //draw horizontal roads every 19 tiles
  avenueSpacingC: 29, 

    //Different numbers make the city less perfect/symmetrical
  
  
  //add 32 extra roads between random-looking points
  connectorRoadCount: 32,
  scenicConnectorCount: 14, //add 14 extra zig-zag / irregular connector roads. These make the city look less grid-like
  routeCount: 7, //7 bigger routes there from start to delivery point
  routeWaypointCount: 5, //how many middle points each route has atleast 5 oki oki
    //Start → point 1 → point 2 → point 3 → point 4 → point 5 → Delivery
  
  
  //how many various elements
  parkCount: 12,
  lakeCount: 8,
  bridgeCount: 12,
  trafficLightCount: 60,
  constructionZoneCount: 28,
  tunnelCount: 15,
  shortcutCount: 7,

  //how much length construction now
  constructionMinLength: 4,
  constructionMaxLength: 8,

  //same for park and lake
  parkMinSize: 6,
  parkMaxSize: 12,
  lakeMinSize: 5,
  lakeMaxSize: 11,

  //same for tunnel and shortcut we need
  tunnelMinLength: 6,
  tunnelMaxLength: 10,

  shortcutMinLength: 8,
  shortcutMaxLength: 14,

    //lets see what else is there
   // when a park/lake is created, roads are drawn around it with 1 tile gap/padding
  roadRingPadding: 1,

  //divide the whole map into a 4 x 4 invisible grid for big areas like parks and lakes
  areaGridColumns: 4,
  areaGridRows: 4,
   //skip cell count
  areaCellStride: 5,

    //now to scatter better
  
  //divide the map into a 10 x 10 invisible grid for smaller features like traffic lights, tunnels, shortcuts, construction zones
  featureGridColumns: 10,
  featureGridRows: 10,
  featureCellStride: 37, //to skip how many

  //deterministic random-like nos
  seedA: 73856093,
  seedB: 19349663,
    seedC: 83492791,
  
    //will help generate positions that look random, but are always the same every time we refresh wowww damnnnn

    //Salt means: to use a diff random-looking pattern for this feature!!
    //so not shown in same place everytime
  roadSalt: 97,
  parkSalt: 193,
  lakeSalt: 389,
  trafficSalt: 313,
  constructionSalt: 419,
  tunnelSalt: 521,
  shortcutSalt: 631,
} as const;