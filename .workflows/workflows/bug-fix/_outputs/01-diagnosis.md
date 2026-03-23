# Bug Fix Task 01 — Diagnosis

## Root Cause

**File:** `vlbi-react/js/App.js`, `handleTelescopeAdd` callback (line ~90)

```javascript
const usedNums = new Set(
  prev.map(t => parseInt(t.name.slice(1))).filter(n => !isNaN(n))
);
let displayNum = 1;
while (usedNums.has(displayNum) && displayNum <= 50) displayNum++;
```

The logic parses each telescope name by slicing the first character and calling
`parseInt`. This works for T-numbered telescopes:
- `"T3".slice(1)` → `"3"` → `parseInt("3")` → `3` ✓

But EHT preset telescopes have proper names:
- `"ALMA".slice(1)` → `"LMA"` → `parseInt("LMA")` → `NaN` → filtered out
- `"APEX".slice(1)` → `"PEX"` → `NaN` → filtered out
- Same for: SPT, JCMT, SMT, IRAM, LMT, NOEMA

So when all 8 EHT presets are loaded, `usedNums` is an **empty Set**.
`displayNum` starts at 1, finds no collision, returns T1. Bug confirmed.

## Why `displayNum = 1` Is Wrong Here

The intent was "lowest unused T-number". But "unused" was only checked against
existing T-numbered telescopes, ignoring that EHT-named telescopes also occupy
slots on the map. With 8 EHT telescopes present, T1–T8 are semantically "taken"
even though they don't appear in `usedNums`.

## Fix

Add a floor: `displayNum` must start at `(count of non-T telescopes) + 1`.
Non-T telescopes are those whose names don't parse to a number — i.e., EHT presets.

```javascript
const nonTCount = prev.filter(t => isNaN(parseInt(t.name.slice(1)))).length;
const usedNums = new Set(
  prev.map(t => parseInt(t.name.slice(1))).filter(n => !isNaN(n))
);
let displayNum = nonTCount + 1;
while (usedNums.has(displayNum) && displayNum <= 50) displayNum++;
```

**Verification of fix:**
- 8 EHT + no T-telescopes: `nonTCount=8`, `usedNums={}`, `displayNum=9` → **T9** ✓
- 8 EHT + T9, T10: `nonTCount=8`, start at 9 (used), 10 (used), → **T11** ✓
- 8 EHT + T10 (gap at 9): `nonTCount=8`, start at 9 (free) → **T9** (gap-fill) ✓
- 0 EHT + T1, T2, T3: `nonTCount=0`, start at 1 (used)…→ **T4** ✓
- 0 EHT + T1, T3 (gap): `nonTCount=0`, start at 1 (used), 2 (free) → **T2** ✓

## Confidence

HIGH — root cause confirmed by direct code inspection. Single-line logic change.
No other callers of the display-number logic; `loadEHTPresets` assigns names from
`EHT_PRESETS` directly and is not affected.
