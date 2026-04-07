## What Is Broken
Users can place telescopes in the ocean. Telescopes should only be placeable on land. The map click handler adds a telescope at any clicked coordinate regardless of whether it is land or water.

## Expected Behavior
Clicking on ocean/water should do nothing or show a brief message. Only land coordinates should accept telescope placement.

## How To Reproduce
1. Click anywhere on the ocean on the globe
2. A telescope is placed in the water

## Environment
Development. Browser app, globe rendered with Globe.gl or similar.

## What I've Already Tried
Nothing yet.
