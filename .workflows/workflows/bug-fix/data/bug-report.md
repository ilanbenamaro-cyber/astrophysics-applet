## What Is Broken
Users can place telescopes in the ocean. Telescopes should only be placeable on land. The map click handler adds a telescope at any clicked coordinate regardless of whether it is land or water.

## Expected Behavior
Clicking on ocean/water should do nothing. Only land coordinates should accept telescope placement.

## How To Reproduce
1. Click anywhere on the ocean on the globe
2. A telescope is placed in the water

## Environment
Development. vlbi-react version at http://localhost:8765/vlbi-react/index.html

## What I've Already Tried
Nothing yet.
