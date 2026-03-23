# Bug Fix Task 02 — Fix

## Change

**File:** `vlbi-react/js/App.js`, `handleTelescopeAdd` callback

**Before:**
```javascript
const usedNums = new Set(
  prev.map(t => parseInt(t.name.slice(1))).filter(n => !isNaN(n))
);
let displayNum = 1;
while (usedNums.has(displayNum) && displayNum <= 50) displayNum++;
```

**After:**
```javascript
// Non-T telescopes (EHT presets like ALMA, APEX) occupy the first N slots,
// so T-numbering must start above them to avoid T1 appearing alongside ALMA.
const nonTCount = prev.filter(t => isNaN(parseInt(t.name.slice(1)))).length;
const usedNums = new Set(
  prev.map(t => parseInt(t.name.slice(1))).filter(n => !isNaN(n))
);
let displayNum = nonTCount + 1;
while (usedNums.has(displayNum) && displayNum <= 50) displayNum++;
```

## What Changed

Added one line: `nonTCount` counts telescopes whose names don't parse to a
number (i.e., EHT presets). `displayNum` floor raised from 1 to `nonTCount + 1`.

## Verification

Playwright test:
1. Load page → 8 EHT presets auto-load (ALMA, APEX, SPT, JCMT, SMT, IRAM, LMT, NOEMA)
2. Click globe → new telescope appears as **T9** ✓ (was T1 before fix)
3. Header stats: 9 telescopes, 36 baselines ✓
4. Gap-fill behavior preserved: removing T9 and clicking again gives T9 ✓

## Commit

`bb679d0` — fix(vlbi-react): manual telescope T-number starts above EHT preset count
