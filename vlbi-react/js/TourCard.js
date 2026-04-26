// TourCard.js — renders one tour act: hero SVG background + text overlay + navigation.
// animPhase ('visual'|'text'|'ready') controls paragraph reveal timing.
import { html, useState, useEffect } from './core.js';
import { TourDiagram } from './TourDiagram.js';

const CHAPTER_LABELS = {
  1: 'Chapter I · The Problem',
  2: 'Chapter II · The Solution',
  3: 'Chapter III · The Frontier',
};

export function TourCard({ act, animPhase, actIndex, totalActs, onNext, onBack, onSkip, onJump, reducedMotion }) {
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

  // Text overlay position: Act 6 (real EHT image) has image on left, text pushed right
  const textOverlayClass = act.diagramId === 6
    ? 'tour-text-overlay text-right'
    : 'tour-text-overlay';

  const nextLabel = isLast
    ? 'Finish ✓'
    : animPhase === 'text' ? 'Skip →' : 'Continue →';

  return html`
    <!-- Hero SVG: full-viewport background -->
    <div className="tour-hero">
      <${TourDiagram} diagramId=${act.diagramId} reducedMotion=${reducedMotion} />
    </div>

    <!-- Text overlay: chapter badge, title, paragraphs, equation -->
    <div className=${textOverlayClass}>
      <div className=${'tour-chapter-badge ch-' + act.chapter}>
        ${CHAPTER_LABELS[act.chapter] || ''}
      </div>
      <h2 className="tour-act-title">${act.title}</h2>

      ${act.paragraphs.map((p, i) => html`
        <p key=${i} className=${'tour-paragraph' + (visibleCount > i ? ' p-visible' : '')}>
          ${p}
        </p>
      `)}

      ${act.equation ? html`
        <div className=${'tour-equation-block' + (visibleCount > act.paragraphs.length ? ' eq-visible' : '')}>
          <div className="tour-equation">${act.equation}</div>
          ${act.subtext ? html`<div className="tour-subtext">${act.subtext}</div>` : null}
        </div>
      ` : null}
    </div>

    <!-- Continue hint (pulses in ready phase) -->
    <div className=${'tour-continue-hint' + (animPhase === 'ready' ? ' hint-visible' : '')}>
      Press → to ${isLast ? 'finish' : 'continue'}
    </div>

    <!-- Skip button (top-right) -->
    <button className="tour-skip" onClick=${onSkip}>Skip Tour</button>

    <!-- Navigation arrows -->
    <button
      className="tour-nav-prev"
      onClick=${onBack}
      disabled=${actIndex === 0 || animPhase === 'visual'}
      aria-label="Previous act"
    >‹</button>

    <button
      className=${'tour-nav-next' + (animPhase === 'ready' ? ' nav-ready' : '')}
      onClick=${onNext}
      disabled=${animPhase === 'visual'}
      aria-label=${nextLabel}
    >›</button>

    <!-- Progress bar (bottom edge) -->
    <div className="tour-progress-track">
      <div className="tour-progress-fill" style=${{ width: progressPct + '%' }} />
    </div>
  `;
}
