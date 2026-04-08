// TourCard — bottom-anchored tour card: progress dots, diagram, text, KaTeX math, terms, nav.
import { html, useState, useEffect } from './core.js';
import { TourDiagram } from './TourDiagram.js';

export function TourCard({ act, actIndex, totalActs, onNext, onBack, onSkip, reducedMotion }) {
  const [katexHtml, setKatexHtml] = useState('');

  // Render KaTeX
  useEffect(() => {
    if (!act.mathLatex) { setKatexHtml(''); return; }
    if (!window.katex) {
      // Fallback: show raw LaTeX in a code block
      setKatexHtml('<code style="color:#C4A555;font-size:0.9em">' + act.mathLatex.replace(/</g, '&lt;') + '</code>');
      return;
    }
    try {
      const rendered = window.katex.renderToString(act.mathLatex, {
        throwOnError: false,
        displayMode: true,
      });
      setKatexHtml(rendered);
    } catch {
      setKatexHtml('<code style="color:#C4A555">' + act.mathLatex.replace(/</g, '&lt;') + '</code>');
    }
  }, [act.mathLatex]);

  const isFirst = actIndex === 0;
  const isLast = actIndex === totalActs - 1;

  // Progress dots
  const dots = Array.from({ length: totalActs }, (_, i) => {
    let cls = 'tour-dot';
    if (i === actIndex) cls += ' tour-dot--active';
    else if (i < actIndex) cls += ' tour-dot--done';
    return html`<span key=${i} className=${cls} aria-hidden="true"></span>`;
  });

  // Terms grid
  const termItems = act.terms.map((t, i) => html`
    <div key=${i} className="tour-term">
      <span className="tour-term-sym">${t.sym}</span>
      <span className="tour-term-desc">${t.desc}</span>
    </div>
  `);

  return html`
    <div
      className="tour-card"
      role="dialog"
      aria-modal="true"
      aria-label=${'Tour act ' + (actIndex + 1) + ': ' + act.title}
    >
      <div className="tour-card-left">
        <div className="tour-progress" role="tablist" aria-label="Tour progress">
          ${dots}
        </div>

        <h2 className="tour-title">${act.title}</h2>

        <p className="tour-text">${act.text}</p>

        ${act.userHint ? html`
          <p className="tour-hint">💡 ${act.userHint}</p>
        ` : null}

        ${act.mathLatex ? html`
          <div className="tour-math-section">
            <div
              id="tour-math-display"
              className="tour-math-display"
              dangerouslySetInnerHTML=${{ __html: katexHtml }}
            ></div>
          </div>
        ` : null}

        ${act.terms.length > 0 ? html`
          <div className="tour-terms-grid" aria-label="Term definitions">
            ${termItems}
          </div>
        ` : null}

        <div className="tour-nav">
          <button
            className="tour-btn tour-btn--back"
            onClick=${onBack}
            disabled=${isFirst}
            aria-label="Previous act"
          >← Back</button>

          <button
            className="tour-btn tour-btn--skip"
            onClick=${onSkip}
            aria-label="Exit tour"
          >✕ Skip tour</button>

          <button
            className="tour-btn tour-btn--next"
            onClick=${onNext}
            aria-label=${isLast ? 'Finish tour' : 'Next act'}
          >${isLast ? 'Finish ✓' : 'Next →'}</button>
        </div>
      </div>

      <div className="tour-card-right">
        <${TourDiagram} diagramAct=${act.diagramAct} reducedMotion=${reducedMotion} />
      </div>
    </div>
  `;
}
