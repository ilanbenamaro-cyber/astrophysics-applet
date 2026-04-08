# Feature Request: Physics Guided Tour

## What To Build
A full physics guided tour for the VLBI interferometry simulator. 8 acts,
bottom-anchored card, hand-drawn SVG diagrams, KaTeX math with hoverable
term explanations, spotlight highlighting, hybrid user-interaction model.

## Architecture
New files to create in vlbi-react/:
- js/Tour.js           — tour state controller, act definitions, auto-actions
- js/TourCard.js       — bottom-anchored card UI (title, diagram, text, math, buttons)
- js/TourDiagram.js    — animated canvas diagrams for each act using Rough.js
- css/tour.css         — all tour styling, spotlight, card, tooltips

Add to vlbi-react/index.html:
- KaTeX CSS: https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css
- KaTeX JS:  https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js
- Rough.js:  https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js

Add to vlbi-react/js/App.js:
- "Start Tour" button in the header
- Tour state (active, currentAct) passed down to Tour component
- Tour component controls: placeTelescopes, setMethod, loadPreset

## The 8 Acts

### Act 1 — Single-Dish Resolution
SPOTLIGHT: none
AUTO-ACTION: none
DIAGRAM: Single radio dish. Two diverging lines showing resolution angle theta. Static.
PLAIN TEXT: Angular resolution is limited by dish diameter. theta approx lambda/D.
MATH: \theta \approx \frac{\lambda}{D}
TERMS: theta = Angular resolution | lambda = Wavelength | D = Dish diameter

### Act 2 — Baselines & Correlations
SPOTLIGHT: Globe
AUTO-ACTION: Clear telescopes. Place ALMA (lat=-23.029, lon=-67.755) and IRAM (lat=37.066, lon=-3.392)
DIAGRAM: Two dishes, dashed baseline "B", animated sine waves with phase offset tau.
PLAIN TEXT: Two telescopes separated by baseline B correlate their signals. The time delay tau encodes directional information.
MATH: V_{12} \sim \langle E_1(t)\, E_2(t-\tau) \rangle
TERMS: V12 = Visibility | E1,E2 = Electric fields | tau = Time delay | angle-brackets = Time average

### Act 3 — The Fourier Connection
SPOTLIGHT: UV coverage panel (right side)
AUTO-ACTION: None
DIAGRAM: Left: ellipse "I(x,y)". Arrow. Right: dot grid "UV plane".
PLAIN TEXT: Each baseline samples one point in Fourier (UV) space. The van Cittert-Zernike theorem connects visibility to the Fourier transform of the sky.
MATH: V(u,v) = \iint I(x,y)\,e^{-2\pi i(ux+vy)}\,dx\,dy
TERMS: V(u,v) = Visibility at (u,v) | I(x,y) = Sky brightness | u,v = Spatial frequencies | x,y = Sky coordinates

### Act 4 — Earth-Rotation Synthesis
SPOTLIGHT: UV coverage panel
AUTO-ACTION: Load full EHT preset
DIAGRAM: Earth circle, arc sweeping around it in a RAF animation showing UV track growth.
PLAIN TEXT: As Earth rotates, each baseline sweeps an elliptical arc in UV space. More rotation = denser coverage = sharper image. Try the Duration slider!
MATH: u = \frac{B_x \sin H + B_y \cos H}{\lambda}
TERMS: u = East-West spatial frequency | Bx,By = Baseline components | H = Hour angle | lambda = Wavelength
USER HINT: Try dragging the Duration slider in the sidebar to see UV tracks grow.

### Act 5 — The Dirty Image
SPOTLIGHT: Image reconstruction panel (right side)
AUTO-ACTION: Set method to dirty
DIAGRAM: Three rough boxes: "I_true" convolved with "B(PSF)" equals "I^D". Static.
PLAIN TEXT: Inverse-Fourier-transforming the incomplete UV data gives the dirty image — the true sky convolved with the array's point spread function (dirty beam).
MATH: I^D = I_{\text{true}} * B
TERMS: I^D = Dirty image | I_true = True sky | * = Convolution | B = Dirty beam (PSF)

### Act 6A — Max Entropy Reconstruction
SPOTLIGHT: Observation parameters sidebar section
AUTO-ACTION: Set method to mem
DIAGRAM: Concave entropy curve S(I) vs I, peak marked with dashed line. Static.
PLAIN TEXT: Maximum Entropy finds the smoothest image consistent with the data. It maximises entropy subject to matching the measured visibilities.
MATH: \max\; S(I) = -\sum_i I_i \ln\!\frac{I_i}{M_i} \quad \text{s.t.}\; \chi^2 \leq 1
TERMS: S(I) = Image entropy | Ii = Pixel brightness | Mi = Prior model | chi2 = Data fidelity

### Act 6B — CLEAN Deconvolution
SPOTLIGHT: Observation parameters sidebar section
AUTO-ACTION: Set method to clean
DIAGRAM: Three-stage RAF animation: dirty blob, subtract arrow "-gamma*B", smaller residual.
PLAIN TEXT: CLEAN iteratively finds the brightest peak, subtracts a scaled dirty beam, and accumulates clean components. The result is reconvolved with a smooth Gaussian.
MATH: r \leftarrow r - \gamma\,\hat{r}_{\max}\, B(x - x_{\max})
TERMS: r = Residual image | gamma = Loop gain | r_max = Peak amplitude | B = Dirty beam | x_max = Peak position

### Act 7 — Black Hole Imaging
SPOTLIGHT: none
AUTO-ACTION: Load EHT preset, load blackhole image, set method to clean
DIAGRAM: Three panels: UV arcs, dirty ring, CLEAN dot with subtle pulse.
PLAIN TEXT: The Event Horizon Telescope achieved 20 microarcsecond resolution, imaging M87*'s shadow at 6.5 billion light-years with 8 telescopes spanning Earth's diameter.
MATH: \theta_{\min} = \frac{\lambda}{D_\oplus} \approx 20\,\mu\text{as}
TERMS: theta_min = Minimum resolution | lambda = 1.3mm EHT wavelength | D_earth = Earth's diameter | muas = Microarcseconds

## Acceptance Criteria
- [ ] Start Tour button appears in the header
- [ ] All 8 acts display in sequence with correct content
- [ ] Each act's auto-action executes correctly
- [ ] KaTeX renders all equations without errors
- [ ] Terms grid shows correct symbols and descriptions
- [ ] Spotlight correctly highlights the specified UI element per act
- [ ] Hand-drawn Rough.js diagrams render and animate correctly in each act
- [ ] Back, Next, Skip/Finish buttons all work
- [ ] Tour can be restarted after completion
- [ ] No JS errors throughout the tour
- [ ] Playwright verifies: tour opens, advances through all 8 acts, closes

## Context / Constraints
- vlbi-react at http://localhost:8765/vlbi-react/index.html
- No backend — all client-side
- Rough.js and KaTeX loaded from CDN as global defer scripts
- Tour state lives in App.js, passed as props
- Do not break any existing simulator functionality
- Tour overlay must not interfere with simulator when tour is not active
