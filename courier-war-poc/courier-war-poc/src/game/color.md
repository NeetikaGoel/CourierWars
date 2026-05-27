| Tile Type     | Phaser Color Code | Hex       | Real Color Name                  | Meaning in Game               |
| ------------- | ----------------- | --------- | -------------------------------- | ----------------------------- |
| Building      | `0x1f2937`        | `#1F2937` | Dark Slate Blue / Dark Gray Blue | Buildings / blocked city area |
| Road          | `0x64748b`        | `#64748B` | Slate Gray                       | Normal roads                  |
| Start         | `0x22c55e`        | `#22C55E` | Bright Green / Emerald Green     | Courier spawn/start point     |
| Delivery      | `0xfacc15`        | `#FACC15` | Golden Yellow                    | Delivery destination          |
| Traffic Light | `0xef4444`        | `#EF4444` | Traffic Red / Signal Red         | Traffic signal zone           |
| Construction  | `0xf97316`        | `#F97316` | Orange                           | Construction / slow road      |
| Bridge        | `0x38bdf8`        | `#38BDF8` | Sky Blue                         | Bridge path                   |
| Tunnel        | `0x8b5cf6`        | `#8B5CF6` | Purple / Violet                  | Tunnel path                   |
| Shortcut      | `0x16a34a`        | `#16A34A` | Dark Green                       | Hidden shortcut route         |
| Park          | `0x14532d`        | `#14532D` | Forest Green                     | Park / greenery               |
| Water         | `0x0284c7`        | `#0284C7` | Ocean Blue                       | River / water body            |
| Courier       | `0xff0000`        | `#FF0000` | Pure Red                         | Courier player                |
| Tile Border   | `0xffffff`        | `#FFFFFF` | White                            | Tile outline                  |
| Background    | `0x2b0962`        | `#2B0962` | Deep Purple                      | Game background               |



Phaser - game engine for browser games


It can::

1. draw maps and characters
2. move objects with keyboard/mouse
3. add animations, collisions, timers, sounds, camera, etc.


Use 48x24 for flat isometric tiles and 48x72 for tall objects.

Asset	File names	Size
Roads	road-1.png, road-2.png, road-3.png, road-4.png	48x24
Buildings	building-1.png, building-2.png, building-3.png, building-4.png, building-5.png	48x72
Parks	park-1.png, park-2.png, park-3.png, park-4.png	48x24
Water	water-1.png, water-2.png, water-3.png, water-4.png	48x24
Bridge	bridge-1.png, bridge-2.png, bridge-3.png	48x24
Tunnel	tunnel-1.png, tunnel-2.png, tunnel-3.png	48x72
Shortcut	shortcut-1.png, shortcut-2.png, shortcut-3.png	48x24
Traffic light	traffic-light-1.png, traffic-light-2.png, traffic-light-3.png	48x72
Construction	construction-1.png, construction-2.png, construction-3.png	48x48
Start	start.png	48x24
Delivery	delivery.png	48x24
Courier	courier.png	48x72
Hurdle markers later	roadblock.png, traffic-jam.png, closed-gate.png, wrong-sign.png, broken-road.png, moving-barrier.png, checkpoint.png	48x48