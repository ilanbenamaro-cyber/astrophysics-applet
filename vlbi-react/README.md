# VLBI Interferometry Simulator (React Edition)

Simulates Very Long Baseline Interferometry (VLBI) image reconstruction from a sparse array of radio telescopes — the same technique used by the Event Horizon Telescope to image the M87* black hole in 2019.

## How to Run

Open `index.html` directly in a modern browser (Chrome 89+, Firefox 120+, Safari 16.4+). No build step or server required. Requires an internet connection to load CDN dependencies (React, Three.js, fonts).

```bash
open vlbi-react/index.html   # macOS
# or drag the file into your browser
```

## What the App Does

1. **Place telescopes** on the interactive 3D globe (click to add, sidebar to remove).
2. **UV coverage** updates in real time as Earth's rotation sweeps each baseline through Fourier space.
3. **Reconstruction** runs in a Web Worker: 2D FFT → sparse UV sampling → noise injection → IFFT (dirty image) → Wiener filter or Högbom CLEAN (restored image).
4. **Adjust parameters**: observing frequency, declination, synthesis duration, thermal noise, reconstruction method.

## Scientific References

- Thompson, A. R., Moran, J. M., & Swenson, G. W. (2017). *Interferometry and Synthesis in Radio Astronomy* (3rd ed.). Springer. — UV projection geometry (Chapter 4), CLEAN algorithm (Chapter 11).
- Högbom, J. A. (1974). Aperture synthesis with a non-regular distribution of interferometer baselines. *A&AS*, 15, 417. — Original CLEAN paper.
- Event Horizon Telescope Collaboration (2019). First M87 Event Horizon Telescope Results. *ApJ Letters*, 875, L1–L6. — Real-world application.

## Key Constants

| Parameter | Value | Note |
|---|---|---|
| Image size | 256 × 256 px | Must be a power of 2 for FFT |
| Earth radius | 6 371 km | ECEF baseline computation |
| Reference frequency | 230 GHz | EHT observing frequency |
| Max telescopes | 12 | UI limit |
