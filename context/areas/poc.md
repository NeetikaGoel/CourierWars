# POC (prototypes)
Paths relative to `courier-war-poc/courier-war-poc/`. This is a frontend-only Vite and Phaser sandbox with no backend.

- `src/game/v1` through `v8` are successive prototypes. V7 is the one that was ported into `courier-war-game/frontend/src/game/v7` and, for generation, into the PHP backend. V8 (`config`, `input`, `manualMap`, `rendering`, `rules`, `scene`, `README.md`) is newer experimentation that hasn't been ported yet.
- `src/game/color.md` has palette notes, and `todo.md` holds open items.
- `public/` and `src/assets/tiles/` hold third-party asset packs (KayKit City Builder, Kenney isometric landscape and tiles). Their licenses are inside each pack.

Use this for reference only. Make game changes in `courier-war-game/`, unless the task is explicitly about the POC.
