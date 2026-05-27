//V6 FINAL MAP

Same as in v5 but now my code!!!!!


//So code as per map config must be configurable and there should be map generation indep of map layout logic

MapConfig.ts        = map generation settings
MapGenerator.ts     = only generates 2D MapTile array
MapData.ts          = exports generated map
MapRenderer.ts      = only draws map from array
GameScene.ts        = simple movement/camera/game scene


So new files structure::

GameEnums.ts. == for saving all types in an enum datatype
GameShapeTypes.ts == this will be for saving shape types now like diff shapes r there okayy
GameConstants.ts
GameConfig.ts
MapConfig.ts
Iso.ts
MapGenerator.ts
MapData.ts
MapRenderer.ts
GameScene.ts
main.ts



MapConfig
    ↓
MapGenerator generates MapTile[][] //GPT DEAR
    ↓
MapData exports mapTiles
    ↓
GameScene passes mapTiles to MapRenderer
    ↓
MapRenderer draws only from data hehe



now it might work perfectly!!!