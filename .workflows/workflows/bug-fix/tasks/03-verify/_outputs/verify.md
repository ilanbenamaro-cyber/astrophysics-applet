# Verify — Ocean Telescope Placement Fix

**BUG_REPRODUCED_AFTER_FIX:** NO
- isOnLand(20, -40) [Atlantic Ocean] → false ✓ (ocean clicks blocked)
- isOnLand(0, 20) [Africa] → true ✓ (land clicks allowed)
- isOnLand(51.5, -0.1) [London] → true ✓
- isOnLand(35.7, 139.7) [Tokyo] → true ✓

**REGRESSION_TEST:** PASS
All 6 EHT preset sites correctly classified as land:
- ALMA  (-23.0, -67.8) → true ✓
- IRAM  ( 37.1,  -3.4) → true ✓
- SMA   ( 19.8,-155.5) → true ✓
- SPT   (-90.0,  -0.1) → true ✓ (Antarctica = land)
- JCMT  ( 19.8,-155.5) → true ✓
- LMT   ( 18.9, -97.3) → true ✓

**FULL_TEST_SUITE:** PASS (no automated test runner; manual Playwright checks confirm
app loads, no JS errors, EHT presets load correctly, reconstruction runs successfully
with "Reconstruction complete — 11258 UV samples" status)

**TYPES:** PASS — plain JS, no TypeScript compilation step

**LINT:** PASS — no linter configured; diff reviewed manually, no issues

**COLLATERAL_DAMAGE:** NONE
- Globe.js diff: 1 import + 2-line if-guard, nothing else touched
- landMask.js: new file, no existing code modified
- No debug statements, no TODO/FIXME, no unrelated changes

**COMMIT_READY:** YES

**COMMIT_MESSAGE:** fix(vlbi-react): block telescope placement on ocean
