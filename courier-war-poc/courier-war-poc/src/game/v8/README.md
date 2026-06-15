# Courier War V8 Manual Map POC

V8 is a deterministic manual city-map experiment.

It does not use the V7 random map generation pipeline. Instead, `manualMap/ManualCityMap.ts` defines a fixed 96 x 96 city blueprint with:

- 3 x 3 gameplay zones
- major avenues
- district roads
- local neighborhood roads
- lakes and canals
- parks and plazas
- bridges over water
- tunnels through building blocks
- slower shortcut alleys
- traffic signals only on planned intersections
- start and delivery markers
- Saboteur hurdle candidates

The output shape is still `CityMapGenerated`, so the existing V7 Phaser renderer, camera, movement, signal, hurdle, and debug systems can render and test it.

This is useful as a proof-of-concept for a curated map that can later be serialized, cached, and served by the backend without relying on random generation.
