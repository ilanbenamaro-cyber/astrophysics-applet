// TourCard.js — renders one tour act: visual zone (top 68vh) + text panel (bottom).
// animPhase ('visual'|'text'|'ready') controls paragraph reveal timing.
import { html, useState, useEffect } from './core.js';
import { TourDiagram } from './TourDiagram.js';

const CHAPTER_LABELS = {
  1: 'Chapter I · The Problem',
  2: 'Chapter II · The Solution',
  3: 'Chapter III · The Frontier',
};

export function TourCard({ act, animPhase, actIndex, totalActs, onNext, onBack, onSkip, reducedMotion }) {
  // visibleCount: 0 = nothing visible, 1..N = paragraphs, N+1 = equation block
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const all = act.paragraphs.length + 1;
    if (animPhase === 'visual') { setVisibleCount(0); return; }
    if (animPhase === 'ready' || reducedMotion) { setVisibleCount(all); return; }
    // animPhase === 'text': reveal items one by one
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= all) clearInterval(iv);
    }, 800);
    return () => clearInterval(iv);
  }, [animPhase, act, reducedMotion]);

  const isLast = actIndex === totalActs - 1;
  const progressPct = totalActs > 1 ? (actIndex / (totalActs - 1)) * 100 : 100;

  const nextLabel = animPhase === 'visual' ? '...'
    : animPhase === 'text' ? 'Skip text →'
    : isLast ? 'Finish ✓'
    : 'Continue →';

  return html`
    <!-- Visual zone: full-width top 68vh, SVG fills it completely -->
    <div className="tour-visual">
      <${TourDiagram} diagramId=${act.diagramId} reducedMotion=${reducedMotion} />
    </div>

    <!-- Text panel: bottom strip, 3-column grid, never overlaps visual -->
    <div className="tour-text-panel">

      <div className="tour-chapter-badge">
        ${CHAPTER_LABELS[act.chapter] || ''}
      </div>

      <h2 className="tour-act-title">${act.title}</h2>

      <div className="tour-nav-col">
        <button className="tour-skip" onClick=${onSkip}>Skip Tour</button>
        <div className="tour-nav-buttons">
          <div className=${'tour-continue-hint' + (animPhase === 'ready' ? ' hint-visible' : '')}>
            ${isLast ? 'press → to finish' : 'press → to continue'}
          </div>
          <div style=${{ display: 'flex', gap: '8px' }}>
            <button
              className="tour-nav-btn"
              onClick=${onBack}
              disabled=${actIndex === 0 || animPhase === 'visual'}
              aria-label="Previous act">
              ←
            </button>
            <button
              className=${'tour-nav-btn' + (animPhase === 'ready' ? ' btn-primary' : '')}
              onClick=${onNext}
              disabled=${animPhase === 'visual'}
              aria-label=${nextLabel}>
              ${nextLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="tour-body">
        ${act.paragraphs.map((p, i) => html`
          <p key=${i} className=${'tour-paragraph' + (visibleCount > i ? ' p-visible' : '')}>
            ${p}
          </p>
        `)}
        ${act.equation ? html`
          <div className=${'tour-equation-block' +
            (visibleCount > act.paragraphs.length ? ' eq-visible' : '')}>
            <div className="tour-equation">${act.equation}</div>
            ${act.subtext ? html`<div className="tour-subtext">${act.subtext}</div>` : null}
          </div>
        ` : null}
      </div>

    </div>

    <!-- Progress bar: absolute at very bottom of .tour-cinematic -->
    <div className="tour-progress-track">
      <div className="tour-progress-fill" style=${{ width: progressPct + '%' }} />
    </div>
  `;
}
