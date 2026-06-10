# TOUR ENGINE FEASIBILITY AUDIT

> Read-only audit. Produced from `.workflows/_prompts/tour-engine-feasibility-audit.md`.
> Question answered: **what can the existing vlbi-react engine actually drive from a
> standalone tour act, and at what cost?** Every capability claim cites `file:line`.
> Where static reading cannot settle a number, the smallest experiment is proposed
> instead of a guess. No source was modified.
>
> **One number to hold throughout:** the vlbi-react app runs at **N = 512**
> (`constants.js:2`), *not* the root app's 256. Every FFT/CLEAN cost below is for a
> 512×512 = 262,144-pixel grid — 4× the work of the root applet. This is the single
> biggest driver of the real-time budget.

---

## SECTION 1 — ENGINE INVENTORY

### 1.1 `uvCompute.js` — **fully pure, callable standalone today, unchanged**

Every export is a plain function over plain args with no React/DOM/singleton coupling.
Its only dependency is the `EARTH_RADIUS_KM` constant (`uvCompute.js:2`).

| Export | Lines | Pure? | What it does |
|---|---|---|---|
| `latLonToECEF(lat,lon)` | 4–12 | ✅ | station → ECEF km |
| `computeBaseline(t1,t2)` | 14–18 | ✅ | two stations → baseline vector |
| `computeSatelliteECEF(sat,ha)` | 20–32 | ✅ | orbital elements → ECEF (space VLBI) |
| `baselineToUV(b,H,decDeg)` | 34–39 | ✅ | baseline + hour angle + dec → (u,v) |
| `MIN_ELEVATION_RAD` | 41 | ✅ | 10° elevation cutoff constant |
| `computeElevation(lat,ha,dec)` | 43–48 | ✅ | source elevation at a station |
| `lerpColor` | 50–61 | ✅ | UI helper |
| `computeUVPoints(tels,opts)` | 63–125 | ✅ | full UV coverage (display-space, +N/2 offset), incl. ground-space pairs (99–122); returns `{uvPoints, stationPairs}` |
| `computeUVPointsGl(tels,opts)` | 127–179 | ✅ | same in gigawavelengths (globe overlay) |
| `computeUVFill(uvPoints,N)` | 181–190 | ✅ | % of grid cells sampled |

A standalone act can `import { … } from './uvCompute.js'` and call these **today, with no
refactor**. CONFIDENCE: HIGH (read in full).

### 1.2 `worker.js` — **classic worker, zero imports, NOT a singleton**

- It is a **classic** Worker: `'use strict'` + `self.onmessage` (`worker.js:1,392`), no
  `import` statements anywhere, all math inlined (FFT `3–69`, mask `71–84`, per-baseline
  SEFD noise `86–125`, `reconstruct` `181–390`). Because it has no imports it carries **no
  import-map dependency** — the gotcha the prompt flagged (classic worker, no module
  context) is satisfied: a tour act can instantiate it the same way the app does.
- **What it computes** inside `reconstruct` (`181–390`): primary-beam taper + forward FFT
  (`186–205`), UV mask (`208`), thermal noise (`211`), **dirty image** (`222–229`), and one
  of three deconvolutions selected by `params.method`: **MEM** (120 gradient iters,
  `234–277`), **Högbom CLEAN** (1000 iters, FFT restore beam, `279–377`), or **dirty-only**
  (`378–381`).
- **Message protocol** — in: `{type:'reconstruct', id, grayscale, uvPoints, params}`
  (`392–393`); out: `{type:'result', id, dirty, restored, uvCount, beamSigmaU, beamSigmaV,
  beamPA}` with the two result buffers **transferred** (`397–401`). `grayscale.buffer` is
  also transferred in (`useSimulation.js:206`), so repeated runs are copy-free.
- **Instantiation / ownership** — `new Worker(new URL('./worker.js', import.meta.url))`
  (`useSimulation.js:49`), classic (no `{type:'module'}`), **one worker per hook instance**,
  terminated on unmount (`useSimulation.js:70`). **Decisive evidence it is not a singleton:**
  `App.js:21–22` calls `useSimulation()` twice (`left`, `right`) for compare mode — two
  independent workers already run side by side. **A tour act can spin up its own worker with
  no contention and no refactor.**
- `gaussConvolve` (`worker.js:141–178`) is defined but not referenced by `reconstruct` —
  dead within the worker; noted, not a blocker.
- **Latency: cannot be settled by reading.** See Section 2 for the experiment.

### 1.3 Contour renderer / image pipeline — **prop-driven components; draw helpers are private**

- **`ContourMap`** (`ContourMap.js:162`) is a React component. All drawing lives in a
  `useEffect` (`171–383`) that renders to the component's **own** `canvasRef` at a fixed
  512px (`169,419`): bilinear upscale (`191`), viridis LUT (`11–27,202–213`), MAD-σ stats
  (`221–239`), adaptive contour levels by dynamic range (`251–259`), marching-squares
  contours (`263–288`), colorbar + beam ellipse (`313–371`). The draw helpers
  (`bilinearUpscale 30–50`, `marchingSquares 54–100`, `groupSegments 105–135`, `VIRIDIS`)
  are **module-private, not exported**.
- It **cannot render to an arbitrary act-supplied canvas today** — it owns its canvas. But it
  **is fully prop-driven**: `{dirtyData, restoredData, N, fovMuas, controls, beamSigmaU,
  beamSigmaV, beamPA, dynamicRange}` (`162–164`). So an act has two no-refactor options: (a)
  **mount `<ContourMap …/>`** and feed it engine output (accepts its header/colorbar chrome),
  or (b) extract the draw routine (small) to draw onto the act's canvas.
- **`ImageCanvas`** (`ImageCanvas.js:42`) — simpler hot-colormap renderer; `renderImageData`
  (`6–40`) is a private pure `(data,N,ctx)→void`. Component owns its canvas (`43,66`).
  `OriginalImagePanel` (`70–94`) just hosts a supplied source canvas.
- **One render needs:** a `Float64Array` of N·N values + `N` + display params. Pure given
  the data array.

### 1.4 `useSimulation.js` — orchestration; what is trapped here

Genuinely entangled in the hook (React effects/memos), but **none of it is scientifically
novel — each is a thin wrapper over a pure module or ~30 lines of pure logic**:

| Concern | Lines | Nature | Build cost to lift out |
|---|---|---|---|
| Worker lifecycle | 48–71 | effect | trivial — act does the same `new Worker(...)` |
| Debounced reconstruct dispatch (param assembly, transferables, 100ms debounce) | 175–210 | effect | **small** — extract to pure `runReconstruction(gs,uv,params): Promise<result>` |
| `scaledGrayscale` (source-fraction crop/scale) | 130–146 | memo | small — pure fn |
| `sefdMap` / `pairSefdMap` | 149–172 | memo | small — pure fn |
| `angularRes`, `baselineStats`, `dynamicRange`, `beamFwhm` | 213–288 | memo | small — pure math, only needs `IMAGE_SIZE` |
| image loading handlers | 331–364 | callbacks | already wrap pure `presets.js` |

Nothing here forces a large refactor; the "cost" is that orchestration is expressed as React
effects, so an act either re-expresses ~30 lines or imports `useSimulation` wholesale.

### 1.5 `constants.js` — **all data, directly importable**

`IMAGE_SIZE=512` (`2`), `EARTH_RADIUS_KM` (`3`), `TELESCOPE_COLORS` (`5`), `EHT_PRESETS`
(`12`), `ARRAY_PRESETS` (EHT 2017 / 2022 / ngEHT Phase 1, `23–66`), `STATION_SEFD` (`68`),
`BHEX_PRESET` (`77`), `SKY_TARGETS` (incl. dec + shadow μas, `89`), `INFO` copy (`97`).
**Everything an act needs is plain exported data — confirmed importable directly.**
Source-image inputs also exist as pure loaders in `presets.js`: `loadImagePresetAsync`
(`6–25`, loads the real `black-hole.png`) and `generatePreset` (`27–148`, synthetic
ring/jet/etc.).

### ENGINE SURFACE TABLE

| Capability | Where it lives | Pure / Entangled | Callable standalone today? | Single-run cost |
|---|---|---|---|---|
| Station→ECEF, baseline, elevation | `uvCompute.js:4–48` | Pure | **Yes** | µs |
| Compute UV track for a baseline over a transit | `uvCompute.js:34–39, 63–125` | Pure | **Yes** | sub-ms (200 steps/pair) |
| Full EHT UV coverage (+ ground-space) | `uvCompute.js:63–125` | Pure | **Yes** | ~ms (≈11k pts, 8 stns) |
| Satellite (BHEX) ECEF → UV | `uvCompute.js:20–32, 99–122` | Pure | **Yes** (physics caveat §3) | sub-ms |
| Resolution / baseline scalars (θ=λ/B, Gλ, co-visible B_max) | `tourPhysics.js:23–79,100–181` | Pure (imports engine) | **Yes — already used by tour** | µs |
| Dirty image from a UV sampling | `worker.js:181–229` | Pure compute, in worker | **Yes** (own worker) | est. tens of ms — **measure** |
| CLEAN a dirty image (Högbom 1000 iter) | `worker.js:279–377` | Pure compute, in worker | **Yes** (own worker) | est. 100s ms–~2 s — **measure** |
| MEM deconvolution (120 iter) | `worker.js:234–277` | Pure compute, in worker | **Yes** (own worker) | est. ~1–4 s — **measure** |
| Render contour map (viridis + contours + beam) | `ContourMap.js:162–383` | Entangled (own canvas) | Mount as-is **yes**; arbitrary canvas **with small refactor** | on-input (per data change) |
| Render hot-colormap image | `ImageCanvas.js:6–40` | Private pure fn in component | Mount **yes**; arbitrary canvas **with small extract** | <ms |
| Source image (real photo / synthetic) | `presets.js:6–148` | Pure-ish (canvas) | **Yes** | <ms |
| Derived metrics (dyn-range, beam FWHM, ang-res) | `useSimulation.js:213–288` | Entangled (memos) | **With small extract** | µs |

---

## SECTION 2 — REAL-TIME BUDGET

> **MEASURED 2026-06-10 (Phase 0 timing gate).** Via `simCore.runReconstruction` in
> Chromium on the dev machine (Apple Silicon, `navigator.hardwareConcurrency=10`), EHT
> 2017 + `../assets/black-hole.png` at **N=512**, declination 12.391°, 12 h, 230 GHz.
> Each reconstruction time **includes** per-call worker spawn + buffer transfer (the
> tour acts' usage pattern; the live app's persistent worker is slightly faster). UV
> coverage = 7,298 points, 0.0103 % grid fill.
>
> | Capability | Measured (dev) | Class | Interaction decision |
> |---|---|---|---|
> | `computeUVPoints` (full EHT coverage) | **0.5 ms** (median/5) | **LIVE-60FPS** | recompute every frame freely |
> | Dirty image | **41 ms** | **LIVE-ON-INPUT** | recompute on slider release |
> | **CLEAN (Högbom)** | **97.5 ms** | **LIVE-ON-INPUT** | **≤300 ms ⇒ both presenter AND guided recompute live** (decision rule, master prompt §0.5) |
> | MEM (120 iter) | **2350 ms** | **PRECOMPUTE / on-input+spinner** | presenter: precompute or avoid; guided: on-input with the app's spinner |
>
> **Act C architecture (resolved):** the default method is **CLEAN at ~98 ms**, which is
> under the 300 ms threshold, so **Act C recomputes live in both modes** — no precomputed
> playback needed for the headline path. MEM (2.35 s) is offered in guided mode only,
> on-input with the existing spinner (`useSimulation.js:187–208`); presenter never runs
> live MEM. The never-stall fallback (G5) still applies as a safety net.
>
> **Still required before the talk:** re-run this gate on the actual **projector-class
> laptop** (CPU-bound JS — single-thread clock dominates, GPU irrelevant). If CLEAN there
> exceeds 300 ms, flip presenter-mode Act C to precomputed playback of cached real frames.
> ⚠ HUMAN TODO — measure on talk hardware.

The original op-count estimates (now superseded by the measurements above) are retained
below for provenance. One real-world anchor predicted these well: **the live app already
ships the worker as an interactive, on-input experience** — 100 ms debounce + a
"Computing reconstruction…" spinner (`useSimulation.js:187–189,208`).

| Capability | Class (estimate) | Basis |
|---|---|---|
| UV-track points, elevation, baseline geometry | LIVE-60FPS | pure JS loops, ≈7–11k points (`uvCompute.js:84,105`) — **confirmed 0.5 ms** |
| Dirty image (1 fwd + 1 inv FFT2D) | LIVE-ON-INPUT | 2× FFT2D of 512² — **confirmed 41 ms** |
| CLEAN (Högbom) | est. 100s ms–~2 s | 1000 iters × O(N²) (`worker.js:306–328`), early-stops at 3σ — **confirmed 97.5 ms** (stops well before 1000 on this source) |
| MEM (120 iter × 2 FFT2D) | est. ~1–4 s | `worker.js:248–276` — **confirmed 2.35 s** |
| Contour / image render | LIVE-ON-INPUT | `useEffect` on data change (`ContourMap.js`/`simRender.drawContour`) |

**Projector reality:** 1080p/4K canvases scale by CSS (`width:100%`), so resolution is not
the risk — only a slow-CPU CLEAN would be, and at 98 ms (dev) there is comfortable headroom.

---

## SECTION 3 — THE EIGHT CONCEPTS AS REAL INSTRUMENTS

**Critical context:** the tour is *already half-real*. `tourPhysics.js` imports the engine's
own geometry (`latLonToECEF, computeElevation, MIN_ELEVATION_RAD`, `tourPhysics.js:12`) and
derives **every displayed number** from the same constants/formulas as the tool — including
re-using the live elevation filter so the tour excludes SPT for M87* exactly as the app does
(`tourPhysics.js:49–79,128–181`). So **all scalar/geometric truth is already engine-real by
construction.** What is *not* yet real is the **visuals**: `TourDiagram.js` is 1597 lines of
hand-drawn `requestAnimationFrame` scenes (`drawDish`, `drawEarth`, `drawPlanet`, …,
`TourDiagram.js:195,392,416`) that **never call `computeUVPoints` or the worker**. The
existing acts also already *puppet the live tool* via `autoActions` dispatched in
`App.js:58–80` (e.g. `loadEHT`, `addTelescope`, `setMethod`, Tour.js:23,39,84). The rebuild's
job is to replace the *drawn* layer with *computed* layers — the data plumbing already exists.

| # | Concept | Real version | Engine path | Interaction | Standalone? | Dual-venue | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Resolution problem (θ=λ/D) | real θ numbers + a real single-dish-vs-array PSF (mask→IFFT) | `tourPhysics` scalars; optional `worker` PSF | 60fps (scalars) / on-input (PSF) | Yes | one build | **TRULY REAL** |
| 2 | The baseline / visibility | one pair → the actual (u,v) sample it measures + the matching Fourier component of a real source | `baselineToUV` (`34`), `computeUVPoints` 1 pair | 60fps | Yes | one build | **TRULY REAL** |
| 3 | Earth-rotation synthesis | live u,v ellipse from real station ECEF as the source transits | `computeUVPoints`/incremental `baselineToUV` over H | **60fps** | Yes (flagship) | one build (scrub HA vs drag slider) | **TRULY REAL** |
| 4 | The EHT array | real coords, real co-visible B_max, real cumulative coverage | `ARRAY_PRESETS`, `maxBaselineKmVisible`, `computeUVPoints` | 60fps | Yes | one build | **TRULY REAL** |
| 5 | Deconvolution / CLEAN | real dirty image from real sparse u,v of a real source, actually CLEANed (not a crossfade) | `computeUVPoints`→`worker` dirty+clean→`ContourMap` | dirty on-input; **CLEAN: precompute (talk) / on-input (site)** | Yes | **TENSION** — see below | **TRULY REAL core / HYBRID convergence anim** |
| 6 | First Light | the actual M87 photograph, presented impeccably — optionally paired with the simulator's *own* reconstruction of the same source | `presets.loadImagePresetAsync('black-hole.png')`; optional `worker` reconstruct | static / precompute | Yes | one build | **ILLUSTRATION-BOUND (it is a photo) → HYBRID if paired with a real reconstruction** |
| 7 | BHEX / space VLBI | real ground-satellite u,v from orbital elements | `computeSatelliteECEF` (`20`), `computeUVPoints` space branch (`99–122`) | 60fps | Yes (caveat) | one build | **TRULY REAL coverage geometry / HYBRID overall** — BHEX baseline physics is flagged *pending Marrone/Alejandro sign-off* (`tourPhysics.js:122–126`); present coverage as real, label the baseline "characteristic," do **not** ship a clean equality |
| 8 | The simulator | hand off to / embed the live tool itself | the whole app | it *is* the instrument | it is the app | one build | **TRULY REAL** |

**Net:** 6 of 8 are engine-real in their core geometry/compute (1,2,3,4,7,8) and a 7th (5) is
real at its core with only the *convergence animation* needing staging. Only "First Light" is
honestly illustration — because it genuinely is a photograph — and even that elevates to
hybrid by pairing it with the simulator's own reconstruction.

**The one dual-venue tension to flag (Act 5):** the talk wants a smooth, dramatic, guaranteed
CLEAN convergence at projector framerate → favors **precomputed playback** of real engine
output. The site wants a stranger to drag the noise/method slider and watch it re-CLEAN live →
favors **on-input recompute**. Both are "real" (both are genuine worker output); they differ
only in *when* the compute runs. This is resolvable by one build (precompute-cache + a
"recompute live" affordance), but it must be designed in, not papered over.

---

## SECTION 4 — RECOMMENDATION

### 4.1 ACT COUNT — **~5 deep real instruments, not 8 shallow ones**

The engine makes depth cheap on geometry and expensive on deconvolution, which argues for
fewer, deeper acts. The u,v story (concepts 2+3+4) is **one instrument shown at escalating
scale** — a single baseline's sample, then its rotation ellipse, then the full array's
coverage — and that escalation is where depth beats breadth. Recommended set:

- **A — Resolution.** Why one dish cannot (θ=λ/D, real numbers + single-dish vs array PSF). *(concept 1)*
- **B — The synthesized aperture.** One baseline → one Fourier sample → Earth-rotation u,v ellipse → full EHT coverage, all from real ECEF. *(merges 2+3+4 — the flagship, all LIVE-60FPS)*
- **C — From data to image.** Real dirty image on that real coverage, actually CLEANed. *(concept 5)*
- **D — First Light.** The real photograph, paired with the simulator's own reconstruction. *(concept 6, elevated)*
- **E — Beyond Earth & the instrument.** BHEX space-VLBI coverage, then hand off to the live tool. *(merges 7+8)*

The count falls out of *what can be made real*, not out of preserving today's 8 diagrams.

### 4.2 ENGINE READINESS — **refactor cost is SMALL; the hardest part is already done**

- **Callable standalone TODAY, zero refactor:** all of `uvCompute.js`, all of `constants.js`,
  `presets.js` loaders, `tourPhysics.js` derivations, and **the worker itself** (instantiate
  your own — proven safe by `App.js:21–22` running two already).
- **SMALL extractions (pure-fn lifts, no behavior change, the live app keeps using them):**
  `runReconstruction(gs,uv,params): Promise<result>` out of the dispatch effect
  (`useSimulation.js:175–210`); `scaleSource` (`130–146`); `buildSefdMap` (`149–172`);
  `computeDynamicRange`/`beamFwhm`/`angularRes` (`213–288`).
- **SMALL–MEDIUM extraction (only if acts must draw onto their own canvas):** `drawContour(ctx,
  data,opts)` from `ContourMap.js:171–383` and `drawHot(ctx,data,N)` from
  `ImageCanvas.js:6–40`. Avoidable entirely by mounting the existing components and accepting
  their chrome.
- **No large refactor exists.** The classic, import-free, non-singleton worker is the thing
  that *could* have been a multi-week decoupling job in another codebase — and here it is
  already decoupled. That is the central de-risking finding of this audit.

### 4.3 DUAL-VENUE STRATEGY — **one build, single `mode: 'presenter' | 'guided'` flag**

The engine is identical for both venues; only three things differ, all switchable by one
flag: (a) copy density, (b) advancement (advance-on-cue vs self-paced — the act framework
already advances via a state machine, `Tour.js:2`), and (c) for the **one** heavy act (C),
precomputed-convergence playback (presenter) vs live on-input recompute (guided). Per-act mode
splits only where timing forces it — i.e. Act C alone. Recommend the single flag over two
separate builds: two builds would double maintenance for what is one differing computation.

### 4.4 BUILD SHAPE (specify only — do not build)

- **Phase 0 — engine extraction + timing (small).** Lift the pure helpers in 4.2 out of
  `useSimulation`/`ContourMap`/`ImageCanvas` with no behavior change; run the Section 2 timing
  experiment to lock each act's interaction model against real numbers.
- **Phase 1 — act framework.** A host that mounts one engine-driven canvas per act, carries
  the `presenter|guided` flag, and advances on cue or self-paced. All numbers come from
  `tourPhysics.js` (extend it, don't duplicate).
- **Phase 2 — build acts in dependency order.** B (synthesized aperture) first: cheapest,
  highest payoff, pure LIVE-60FPS geometry. Then A (resolution). Then C (dirty→CLEAN) — needs
  Phase 0's `runReconstruction` and the precompute-vs-live decision from the timing
  experiment. Then D (First Light). Then E (BHEX + handoff).

### 4.5 RISKS (top 3 + 1 latent)

1. **CLEAN/MEM compute time at N=512 on projector-class hardware** breaks the "live and real"
   promise mid-talk. *Mitigate:* run the Section 2 experiment first; default the **talk** to
   precomputed convergence playback (still real engine output), reserve live recompute for the
   site. This is CPU-bound JS, so a slow presenter laptop hurts more than a weak GPU.
2. **Scope creep from 1:1-porting 8 hand-drawn diagrams** instead of building 5 deep
   instruments. *Mitigate:* commit to the 5-act merge (4.1) up front; treat `TourDiagram.js`'s
   1597 lines of art as *reference for staging*, not as code to reproduce.
3. **Talk/site tension silently optimizing one venue.** *Mitigate:* decide the single
   `mode` flag architecture (4.3) in Phase 1, not retrofitted after acts are built.
4. *(latent)* **BHEX baseline physics is unresolved** (`tourPhysics.js:122–126`, pending
   Marrone/Alejandro). *Mitigate:* Act E may present the *coverage geometry* as real
   (`computeSatelliteECEF` is genuine) but must label the baseline "characteristic," not a
   clean equality, until sign-off.

---

## BOTTOM LINE

**Yes — the "every act is a real, engine-driven instrument" vision is feasible, and it is
feasible cheaply.** The vlbi-react engine is unusually well-positioned for it: `uvCompute.js`
and `constants.js` are already pure and importable, the deconvolution worker is a classic,
import-free, **non-singleton** module that a tour act can instantiate on its own (proven by
the app already running two via `App.js:21–22`), and the tour *already* derives all of its
numbers from that engine through `tourPhysics.js` — so scientific truth is shared by
construction, not by manual sync, and the rebuild only has to replace hand-drawn visuals
(`TourDiagram.js`) with computed ones. The right shape is **~5 deep acts** (merging the u,v
trio and the BHEX+simulator pair), and the refactor cost is **SMALL** — a handful of pure-fn
extractions from `useSimulation`, plus optionally lifting the contour/image draw routines out
of their components. **The single biggest risk is CLEAN/MEM compute time at N=512 on
projector-class hardware**, which the one-paragraph Section 2 timing experiment must settle
*before* the build decides, per the deconvolution act, between live recompute and precomputed
playback. Read this first; the build prompt should be written against these numbers.
