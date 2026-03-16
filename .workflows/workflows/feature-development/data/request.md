## What To Build
A JavaScript web applet that simulates radio telescope interferometry image reconstruction. Users upload an image, place virtual telescopes on an Earth map, and the app reconstructs the image using Fourier transforms — simulating how real radio telescope arrays like the Event Horizon Telescope work.

## Acceptance Criteria
- User can upload any image
- User can select/place telescope locations on an interactive Earth map
- App computes the UV-plane (Fourier sampling) based on telescope baselines
- App applies inverse Fourier transform to reconstruct the image from sparse samples
- Reconstructed image is displayed alongside the original for comparison
- UI is clean and interactive

## Context / Constraints
- Pure JavaScript (no backend required)
- Use established JS libraries where appropriate (e.g. math.js for FFT, Leaflet or similar for map)
- UI must be intuitive for non-technical users
- This is a tnslation/reimplementation of Fourier transform logic originally in Wolfram Mathematica

## Out Of Scope
- No user accounts or data persistence
- No real telescope data feeds
- Backend server not required for v1
