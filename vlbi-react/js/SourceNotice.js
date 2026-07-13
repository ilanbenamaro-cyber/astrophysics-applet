// SourceNotice — an honest, computed explanation shown when the loaded image is poorly
// suited to interferometric reconstruction. Every number comes from the real pipeline
// (the source's own power spectrum vs the array's sampled band); nothing is invented.
// It teaches the limit of aperture synthesis rather than reporting an error.
import { html } from './core.js';

export function SourceNotice({ suitability, onToggleInvert, inverted = false }) {
  if (!suitability || !suitability.poor) return null;
  const { dcPct, measurablePct, resElements, beamUas } = suitability;
  return html`
    <div className="source-notice" role="note">
      <div className="source-notice-title">Why this image reconstructs poorly — and it isn't a bug</div>
      <p className="source-notice-body">
        An interferometer never measures total power (the zero-spacing baseline), and it
        only samples out to its longest baseline.
        About <strong>${dcPct}%</strong> of this image is smooth, extended brightness the
        array cannot recover, and only <strong>${measurablePct}%</strong> of its power lands
        in the band of baselines this array samples. It resolves about <strong>${resElements}</strong> point${resElements === 1 ? '' : 's'} across the field
        (beam ≈ ${beamUas} μas), so finer detail is lost. This is a fundamental limit of
        aperture synthesis, not an error — real sources are bright emission on dark sky.
      </p>
      ${onToggleInvert ? html`
        <button
          className=${'btn btn-xs source-notice-invert' + (inverted ? ' is-on' : '')}
          onClick=${onToggleInvert}
          aria-pressed=${inverted}
          title="Invert brightness so dark ink becomes the emitter on dark sky"
        >${inverted ? '✓ Inverted — ink is now the emitter' : 'Invert: make the ink the emitter'}</button>
      ` : null}
    </div>`;
}
