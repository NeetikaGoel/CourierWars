
// 36x36 generated city map!!

// Tile types used by the city!
export type TileType =
  | "building"
  | "road"
  | "start"
  | "delivery"
  | "trafficLight"
  | "construction"
  | "bridge"
  | "tunnel"
  | "shortcut"
  | "park"
  | "water";

// One tile object!
export interface MapTile
{
  x: number;
  y: number;
  type: TileType;
  walkable: boolean;
  movementCost: number;
}

//hehe 36x36 now
export const mapWidth = 36;
export const mapHeight = 36;

// Main city map array
export const mapTiles: MapTile[][] = createCityMap();

// Creating city:
// - roads in a grid
// - buildings inside blocks
// - traffic lights at intersections
// - construction zones
// - tunnels
// - bridges
// - shortcuts
// - start and delivery points
function createCityMap(): MapTile[][]
{
  const map: MapTile[][] = [];

  for (let y = 0; y < mapHeight; y++)
  {
    const row: MapTile[] = [];

    for (let x = 0; x < mapWidth; x++)
    {
      let type: TileType = "building";

      // Roads every 5 tiles create city blocks
      const isVerticalRoad = x % 5===2;
      const isHorizontalRoad = y % 5===2;

      if (isVerticalRoad || isHorizontalRoad)
      {
        type = "road";
      }

      // Outer border as buildings, so player cannot leave city
      if (x===0 || y===0 || x===mapWidth - 1 || y===mapHeight - 1)
      {
        type = "building";
      }

      row.push(createTile(x, y, type));
    }

    map.push(row);
  }

  // Adding wider main roads
  AddingRoadLine(map, "horizontal", 17);
  AddingRoadLine(map, "vertical", 18);

  // Adding start and delivery!!
  setTile(map, 2, 2, "start");
  setTile(map, 33, 33, "delivery");

  // Adding traffic lights at important intersections!!
  const trafficLights =
  [
    [7, 2], [12, 2], [17, 2], [22, 2], [27, 2],
    [2, 7], [17, 7], [32, 7],
    [7, 12], [12, 12], [22, 12], [27, 12],
    [2, 17], [7, 17], [12, 17], [17, 17], [22, 17], [27, 17], [32, 17],
    [7, 22], [17, 22], [27, 22],
    [12, 27], [22, 27], [32, 27],
    [17, 32], [27, 32],
  ];

  for (const [x, y] of trafficLights)
  {
    setTile(map, x, y, "trafficLight");
  }

  // Addinging construction zones on roads!
  const constructionTiles = [
    [12, 7], [12, 8], [12, 9],
    [22, 17], [23, 17], [24, 17],
    [7, 27], [8, 27], [9, 27],
    [27, 12], [27, 13], [27, 14],
  ];

  for (const [x, y] of constructionTiles)
  {
    setTile(map, x, y, "construction");
  }

  // Adding bridge route
  for (let x = 14; x <= 22; x++)
  {
    setTile(map, x, 32, "bridge");
  }

  // Adding tunnel route
  for (let y = 4; y <= 12; y++)
  {
    setTile(map, 32, y, "tunnel");
  }

  // Adding hidden shortcut diagonal-ish path
  const shortcuts = [
    [5, 30], [6, 29], [7, 28], [8, 27], [9, 26],
    [10, 25], [11, 24], [12, 23], [13, 22],
  ];

  for (const [x, y] of shortcuts)
  {
    setTile(map, x, y, "shortcut");
  }

  // Adding parks too hehe
  fillArea(map, 4, 4, 6, 6, "park");
  fillArea(map, 24, 24, 26, 26, "park");

  // Adding water river visual area
  // Bridges cross near this area
  fillArea(map, 14, 30, 22, 31, "water");

  // Re-apply bridge over water
  for (let x = 14; x <= 22; x++) {
    setTile(map, x, 32, "bridge");
  }

  return map;
}

// Creates one tile with correct walkable and movement cost
function createTile(x: number, y: number, type: TileType): MapTile
{
  return {
    x,
    y,
    type,
    walkable: isWalkable(type),
    movementCost: getMovementCost(type),
  };
}

// Updates tile type safely
function setTile(map: MapTile[][], x: number, y: number, type: TileType)
{
  if (y < 0 || y >= mapHeight || x < 0 || x >= mapWidth)
  {
    return;
  }

  map[y][x] = createTile(x, y, type);
}

// Adding full road line
function AddingRoadLine(
  map: MapTile[][],
  direction: "horizontal" | "vertical",
  index: number
)
{
  if (direction==="horizontal")
  {
    for (let x = 1; x < mapWidth - 1; x++)
    {
      setTile(map, x, index, "road");
    }
  }

  if (direction==="vertical")
  {
    for (let y = 1; y < mapHeight - 1; y++)
    {
      setTile(map, index, y, "road");
    }
  }
}

// Fills rectangular area
function fillArea(
  map: MapTile[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  type: TileType
)
{
  for (let y = startY; y <= endY; y++)
  {
    for (let x = startX; x <= endX; x++)
    {
      setTile(map, x, y, type);
    }
  }
}

// Which tiles Courier can walk on
function isWalkable(type: TileType): boolean
{
  return (
    type==="road" ||
    type==="start" ||
    type==="delivery" ||
    type==="trafficLight" ||
    type==="construction" ||
    type==="bridge" ||
    type==="tunnel" ||
    type==="shortcut"
  );
}

// Movement speed cost
// Higher = slower
// Lower = faster
function getMovementCost(type: TileType): number
{
  if (type==="construction") return 22;
  if (type==="trafficLight") return 16;
  if (type==="shortcut") return 0.75;
  if (type==="tunnel") return 0.85;
  if (type==="bridge") return 0.9;
  return 1;
}

// Finding Courier start tile automatically
export function findStartTile(): MapTile
{
  for (const row of mapTiles)
  {
    for (const tile of row)
    {
      if (tile.type==="start")
      {
        return tile;
      }
    }
  }
  //not found error
  throw new Error("Start tile not found!!");
}