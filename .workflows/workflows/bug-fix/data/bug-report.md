## What Is Broken
Three issues need fixing in vlbi-react:

1. TELESCOPE PLACEMENT STILL GLITCHY ON LAND
   Valid land areas are still being blocked. The TopoJSON polygon check is
   still too restrictive. Need a more permissive approach — only block clicks
   that are clearly deep ocean (far from any coastline). Coastal areas, islands,
   and all continental land must work reliably.

2. DEEP OCEAN PLACEMENT STILL POSSIBLE
   Some ocean clicks are still getting through the land check.
   The polygon check has gaps — needs to be more reliable for obvious ocean areas
   like middle of Pacific, Atlantic, Indian Ocean.

3. MAX ENTROPY METHOD WAS REMOVED
   The recent ControlsPanel.js change replaced the 3 method buttons
   (Dirty Only / Max Entropy / CLEAN) with a single CLEAN checkbox.
   This removed the Max Entropy reconstruction option entirely.
   Max Entropy must be restored.

   The correct UI should be:
   Keep the CLEAN checkbox (on/off toggle for CLEAN deconvolution)
   - ADD BACK a separate toggle or button for Max Entropy
   - When CLEAN is off: show dirty image OR max entropy image depending on selection
   - When CLEAN is on: apply CLEAN deconvolution to whichever base image is selected

## Root Cause Hypotheses

Issue 1 & 2: The TopoJSON 110m resolution still misses small islands and has
gaps at coastlines. Better approach: use a distance-based buffer. Any click
within 3 degrees of a known land polygon vertex passes. Only clicks more than
3 degrees from any land are blocked. This makes coastal and island placement
forgiving while still blocking the middle of the Pacific.

Issue 3: ControlsPanel.js removed the methods array and method buttons entirely.
They need to be restored alongside the CLEAN checkbox.

## Environment
vlbi-react at http://localhost:8765/vlbi-react/index.html
