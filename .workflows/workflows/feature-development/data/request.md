## What To Build
Implement the CLEAN deconvolution algorithm in the image reconstruction pipeline.
The audit confirmed the infrastructure is already in place — computeDirtyBeam,
the UV mask, and ifft2d are all ready. CLEAN plugs in as a post-processing step.

## What CLEAN Does
1. Takes the dirty image and dirty beam (PSF)
2. Iteratively finds the peak residual in the dirty image
3. Subtracts a scaled dirty beam at that peak location
4. Accumulates clean components
5. Restores with a Gaussian restore beam (typically 1/3 the resolution of the dirty beam)
6. Final output = clean components convolved with Gaussian + residuals

## Acceptance Criteria
- [ ] CLEAN algorithm implemented as a post-processing step after ifft2d
- [ ] Gain parameter: 0.1 (standard)
- [ ] Iterations: 1000 max or until peak < threshold (5% of initial peak)
- [ ] Gaussian restore beam width: automatically calculated from dirty beam
- [ ] UI label updated from "reconstructed" to accurately reflect CLEAN output
- [ ] CLEAN output is visibly sharper/cleaner than dirty image on a test case
- [ ] Dirty image still displayed separately for comparison
- [ ] Playwright verifies the reconstruction runs without errors

## Context / Constraints
- Infrastructure already exists: computeDirtyBeam(), applyUVMask(), ifft2d()
- Add CLEAN in imageProcessor.js as a new function: cleanDeconvolve(dirtyImage, dirtyBeam, options)
- Call it from the main reconstruction pipeline after the dirty image is produced
- The CLEAN option button already exists in the UI — wire it to actually run CLEAN
- Do not change the UV coverage calculation or any other pipeline steps

## Out Of Scope
- No changes to telescope controls
- No changes to UV coverage visualization
- No UI layout changes
