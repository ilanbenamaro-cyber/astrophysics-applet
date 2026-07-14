// ResolutionBudget — the corrected teaching panel for the Custom-image regime
// (CUSTOM-SOURCE-PHYSICS.md). Explains the true limit: detail lives at high spatial
// frequencies, which only long baselines measure — AND the optimum: enlarging the image
// adds resolution elements but dilutes coverage (occupancy ∝ 1/FOV²), so each array has
// a sweet spot. Every number is computed live from the engine; nothing is a literal.
// Rendered only for Custom sources — astrophysical targets (the ring) never see it.
import { html, useMemo } from './core.js';
import { IMAGE_SIZE, CUSTOM_DEFAULT_FOV_UAS } from './constants.js';

const ARRAY_LADDER = ['EHT 2017', 'EHT 2022', 'ngEHT Phase 1'];

export function ResolutionBudget({
  selectedTarget, controls, beamFwhm, uvPoints,
  selectedArrayPreset, onArrayPresetChange, onLoadArray,
  bhexAdded, onToggleBHEX,
}) {
  // Coverage occupancy: distinct mask cells (worker's exact quantization) over the
  // sampled u,v disk area — the honest sparsity measure that falls as the field grows.
  const occupancy = useMemo(() => {
    if (!uvPoints || uvPoints.length === 0) return null;
    const N = IMAGE_SIZE, half = N / 2;
    const cells = new Set();
    let rMax = 0;
    for (const p of uvPoints) {
      const cu = p.u - half, cv = p.v - half;
      const r = Math.hypot(cu, cv);
      if (r > rMax) rMax = r;
      cells.add((((Math.round(cu) % N) + N) % N) * N + (((Math.round(cv) % N) + N) % N));
    }
    if (rMax < 1) return null;
    return Math.min(100, (cells.size / (Math.PI * rMax * rMax)) * 100);
  }, [uvPoints]);

  if (selectedTarget !== 'Custom') return null;

  const sizeUas = controls.sourceFraction * controls.fovMuas;
  const sizeStr = sizeUas >= 1000 ? (sizeUas / 1000).toFixed(2) + ' mas' : Math.round(sizeUas) + ' μas';
  const beamMaj = beamFwhm && beamFwhm.major;
  const nRes = beamMaj ? Math.max(1, Math.round(sizeUas / beamMaj)) : null;

  return html`
    <div className="res-budget" role="note">
      <div className="res-budget-title">How much detail can this array recover?</div>
      <p className="res-budget-body">
        Fine detail lives at high spatial frequencies, and only long baselines measure
        them. Across your image this array resolves
        about <strong>${nRes ?? '—'}</strong> element${nRes === 1 ? '' : 's'} (beam
        ≈ <strong>${beamMaj ? beamMaj.toFixed(1) : '—'} μas</strong> at ${sizeStr} image
        size) — features finer than the beam are lost. The two levers
        trade against each other: enlarging the image adds elements, but the same
        baselines then cover less of the u,v plane — occupancy is
        now <strong>${occupancy != null ? occupancy.toFixed(1) : '—'}%</strong> and falls
        as 1/FOV² — so each array has a sweet spot (measured
        ≈ ${CUSTOM_DEFAULT_FOV_UAS} μas for EHT 2017); enlarge past it and striping
        returns. Adding stations or BHEX raises both at once.
      </p>
      <div className="res-budget-ladder" role="group" aria-label="Add elements — watch detail return">
        <span className="res-budget-ladder-label">Add elements — watch detail return:</span>
        ${ARRAY_LADDER.map(name => html`
          <button
            key=${name}
            className=${'btn btn-xs res-budget-step' + (selectedArrayPreset === name ? ' is-current' : '')}
            onClick=${() => { onArrayPresetChange(name); onLoadArray(name); }}
            aria-pressed=${selectedArrayPreset === name}
          >${name.replace(' Phase 1', ' Ph1')}</button>
        `)}
        <button
          className=${'btn btn-xs res-budget-step' + (bhexAdded ? ' is-current' : '')}
          onClick=${onToggleBHEX}
          aria-pressed=${bhexAdded}
          title="Toggle the BHEX space telescope"
        >${bhexAdded ? '✓ +BHEX' : '+BHEX'}</button>
      </div>
    </div>`;
}
