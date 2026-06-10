// TourEquation.js — live KaTeX equation block with variable bindings.
// KaTeX is loaded globally in index.html (CDN). If it fails to load, we fall back to the
// plain tex string so the tour never blocks (gate G7). Bound values come from
// tourPhysics.js via the act schema (never hardcoded).
import { html, useRef, useEffect } from './core.js';

export function LiveEquation({ tex, values, visible }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.katex && typeof window.katex.render === 'function') {
      try {
        window.katex.render(tex, el, { throwOnError: false, displayMode: true });
        return;
      } catch (_) { /* fall through to plain text */ }
    }
    el.textContent = tex;   // graceful fallback — no layout block
  }, [tex]);

  return html`
    <div className=${'tour-equation-block' + (visible ? ' eq-visible' : '')}>
      <div className="tour-equation-katex" ref=${ref}></div>
      <div className="tour-equation-values">
        ${(values || []).map(([k, v], i) => html`
          <div key=${i} className="tour-eqval">
            <span className="tour-eqval-k">${k}</span>
            <span className="tour-eqval-v">${v}</span>
          </div>
        `)}
      </div>
    </div>
  `;
}
