// ResolutionBudget — the corrected teaching panel for the Custom-image regime
// (CUSTOM-SOURCE-PHYSICS.md). Explains the true limit: detail lives at high spatial
// frequencies, which only long baselines measure — AND the optimum: enlarging the image
// adds resolution elements but dilutes coverage (occupancy ∝ 1/FOV²), so each array has
// a sweet spot. Every number is computed live from the engine; nothing is a literal.
// Rendered only for Custom sources — astrophysical targets (the ring) never see it.
import { html, useMemo } from './core.js';
import { IMAGE_SIZE, EHT2017_SWEETSPOT_FOV_UAS } from './constants.js';

const ARRAY_LADDER = ['EHT 2017', 'EHT 2022', 'ngEHT Phase 1'];

// Floor a μas field to a friendly 50-μas step and format (μas / mas). Floored (not
// rounded) so a "reduce below X" threshold is conservative — X never overstates the
// aliasing onset, so staying under it is always safe.
function fmtFovRounded(uas) {
  const r = Math.floor(uas / 50) * 50;
  return r >= 1000 ? (r / 1000) + ' mas' : r + ' μas';
}

export function ResolutionBudget({
  selectedTarget, controls, beamFwhm, uvPoints, telescopes = [],
  selectedArrayPreset, onArrayPresetChange, onLoadArray,
  bhexAdded, onToggleBHEX,
}) {
  // BHEX honesty (CUSTOM-SOURCE-PHYSICS.md "BHEX CONTRIBUTION", 2026-07-16). BHEX's ~30 Gλ
  // baselines land near/over the N=512 grid's Nyquist edge at large custom fields: above
  // ~1,760 μas they wrap (alias) in worker.buildMask, so "BHEX on" silently omits part of
  // its coverage. Detect aliasing from the SAME pixel coords buildMask sees (a sample past
  // ±N/2 on either axis wraps); ground baselines never reach that radius at these scales,
  // so any over-Nyquist sample is BHEX. The onset field is derived live (radius ∝ FOV),
  // never a literal. Counts feed the "long baselines ≠ dense coverage" lesson.
  const bhexInfo = useMemo(() => {
    if (!bhexAdded || !uvPoints || uvPoints.length === 0) return null;
    const half = IMAGE_SIZE / 2;
    let maxAxis = 0, aliasedCount = 0;
    for (const p of uvPoints) {
      const au = Math.abs(p.u - half), av = Math.abs(p.v - half);
      const m = au > av ? au : av;
      if (m > maxAxis) maxAxis = m;
      if (Math.round(au) > half || Math.round(av) > half) aliasedCount++;
    }
    const nGround = telescopes.filter(t => t.visible !== false && t.type !== 'space').length;
    return {
      aliased: aliasedCount > 0,
      groundBaselines: (nGround * (nGround - 1)) / 2,
      bhexBaselines: nGround,   // each ground station × the one BHEX satellite
      onsetFov: maxAxis > 0 ? (controls.fovMuas * half) / maxAxis : null,
    };
  }, [bhexAdded, uvPoints, telescopes, controls.fovMuas]);
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
        ≈ ${EHT2017_SWEETSPOT_FOV_UAS} μas for EHT 2017); enlarge past it and striping
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
      ${bhexInfo && bhexInfo.aliased ? html`
        <p className="res-budget-note res-budget-note-warn" role="note">
          At this image size, BHEX's longest baselines reach past the reconstruction grid and
          fold back — its space coverage is only <strong>partly represented</strong> here.
          Reduce the image size below
          about <strong>${bhexInfo.onsetFov ? fmtFovRounded(bhexInfo.onsetFov) : '—'}</strong> to
          include BHEX fully.
        </p>` : null}
      ${bhexInfo && !bhexInfo.aliased ? html`
        <p className="res-budget-note" role="note">
          BHEX adds <strong>${bhexInfo.bhexBaselines}</strong> very long space baselines to the
          array's <strong>${bhexInfo.groundBaselines}</strong> ground baselines — that
          extends <strong>resolution</strong> (a sharper beam), not coverage density. Where the
          ground array already resolves your image at this size, the extra reach refines the
          result more than it transforms it; its largest gains are at small image sizes and on
          the finest detail.
        </p>` : null}
    </div>`;
}
