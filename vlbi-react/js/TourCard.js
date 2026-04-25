// TourCard.js — full-screen slide: header (dots + label + skip) + body (diagram | content) + footer.
import { html } from './core.js';
import { TourDiagram } from './TourDiagram.js';

export function TourCard({ act, actIndex, totalActs, onNext, onBack, onSkip, onJump, reducedMotion }) {
  return html`
    <div className="tour-header">
      <div className="tour-progress">
        ${Array.from({ length: totalActs }, (_, i) => html`
          <button
            key=${i}
            className=${'tour-dot' + (i < actIndex ? ' done' : i === actIndex ? ' active' : '')}
            onClick=${() => onJump(i)}
            aria-label=${'Go to act ' + (i + 1)}
          />
        `)}
      </div>
      <span className="tour-act-label">Act ${actIndex + 1} of ${totalActs}</span>
      <button className="tour-skip-btn" onClick=${onSkip}>Skip Tour</button>
    </div>

    <div className="tour-body">
      <div className="tour-diagram">
        <${TourDiagram} diagramId=${act.diagramId} reducedMotion=${reducedMotion} />
      </div>
      <div className="tour-content">
        <div className="tour-title">${act.title}</div>
        ${act.paragraphs.map((p, i) => html`<p key=${i} className="tour-text">${p}</p>`)}
        ${act.hint ? html`<div className="tour-hint">💡 ${act.hint}</div>` : null}
      </div>
    </div>

    <div className="tour-footer">
      <button className="btn btn-ghost" onClick=${onBack} disabled=${actIndex === 0}>← Back</button>
      <button className="btn btn-primary" onClick=${onNext}>
        ${actIndex === totalActs - 1 ? 'Finish ✓' : 'Next →'}
      </button>
    </div>
  `;
}
