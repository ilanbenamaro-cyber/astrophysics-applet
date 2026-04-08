## What Is Broken
The land mask check in vlbi-react/js/landMask.js is too aggressive — it is blocking
telescope placement in valid land areas across the globe, making placement glitchy
and unreliable. The 360×180 1-degree resolution bitmap is too coarse for accurate
land detection, incorrectly classifying many coastal and inland land pixels as ocean.

## Expected Behavior
Telescopes should place smoothly on any land area worldwide. Only deep ocean clicks
should be blocked. Edge cases like islands, coastal areas, and peninsulas should all
work correctly.

## How To Reproduce
1. Load the app at http://localhost:8765/vlbi-react/index.html
2. Try clicking various land areas — many valid land clicks are blocked
3. Glitchy behavior especially noticeable on smaller landmasses and coastlines

## Root Cause Hypothesis
The precomputed 1-degree land mask bitmap has insufficient resolution. A 1-degree
cell is approximately 111km — too coarse to correctly classify coastal regions,
islands, and peninsulas. The better approach is one of:

OPTION A — Higher resolution land polygon check using a GeoJSON dataset
  Use a TopoJSON/GeoJSON world countries file (already common in web mapping)
  Check if a point falls inside any country polygon using ray casting
  Accurate to ~1km, works for all islands and coastlines

OPTION B — Relaxed threshold with buffer zone
  Keep the bitmap but treat any pixel within 2-3 degrees of a land pixel as land
  Fast, simple, eliminates coastal false negatives
  Still blocks clicks in the middle of the Pacific/Atlantic/Indian oceans

OPTION C — Remove land restriction entirely, use visual feedback instead
  Allow placement anywhere but show a warning icon on telescopes placed in ocean
  Let scientists decide — some telescopes are on islands or ships

## Recommended Fix
Option A — GeoJSON polygon check. It is the most accurate and future-proof.
The file can be loaded from a CDN (unpkg or jsdelivr), small ~120kb file.
Use the point-in-polygon algorithm against world country boundaries.

## What I've Already Tried
The 360×180 bitmap approach — too coarse, causes glitchy behavior on land.

## Environment
vlbi-react version at http://localhost:8765/vlbi-react/index.html
