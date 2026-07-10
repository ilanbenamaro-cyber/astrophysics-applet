// Tour.js — engine-real cinematic tour host. Rebuilt internals; PUBLIC CONTRACT
// PRESERVED: Tour({actIndex, onActChange, onClose, onTourAction, reducedMotion}) and the
// autoAction types App.js dispatches. Each act hosts an engine-driven canvas scene
// (tourScenes.js) over real uvCompute/worker output; numbers come from tourPhysics.js.
//
// Two venues, one build (master prompt §1.2): mode 'presenter' (Harvard talk — minimal
// text, advance on cue) | 'guided' (public site — one unified narrative per act,
// self-paced). Default guided; presenter via ?mode=presenter or the 'P' key.
//
// State leakage (G6): the rebuilt tour hosts its OWN canvases and never mutates the live
// app mid-act, so a stranger's pre-tour app state is preserved automatically on Skip/Esc.
// Only the final "Enter the simulator" beat deliberately dispatches loadEHT to hand off.
import { html, useState, useEffect, useRef } from './core.js';
import { TOUR_ACTS } from './tourActs.js';
import { getScene } from './tourScenes.js';
import { setupCanvas } from './tourScene.js';
import { LiveEquation } from './TourEquation.js';
import { MiniUVSpine } from './TourSpine.js';
import { disposeTourEarth } from './tourEarth.js';

function initialMode() {
  try {
    return new URLSearchParams(window.location.search).get('mode') === 'presenter'
      ? 'presenter' : 'guided';
  } catch (_) { return 'guided'; }
}

export function Tour({ actIndex, onActChange, onClose, onTourAction, reducedMotion }) {
  const act    = TOUR_ACTS[actIndex];
  const total  = TOUR_ACTS.length;
  const isLast = actIndex === total - 1;

  const [mode, setMode]   = useState(initialMode);
  const [phase, setPhase] = useState('visual');   // 'visual' → 'ready'
  const [computing, setComputing] = useState(false);

  const canvasRef  = useRef(null);
  const rootRef    = useRef(null);
  const bodyRef    = useRef(null);   // scrollable prose panel — reset to top per act
  const rafRef     = useRef(0);
  const dataRef    = useRef(null);
  const startRef   = useRef(0);
  const phaseTimer = useRef(null);
  const sceneRef   = useRef(null);
  const phaseRef   = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // The textured tour Earth is a module singleton shared by Acts B and E;
  // release its WebGL context when the tour itself closes.
  useEffect(() => () => disposeTourEarth(), []);

  // .tour-body is a persistent scroll container (no key) whose scrollTop carries over
  // between acts. Reset to the top on every act change so each act opens at its first
  // line — runs after the new act's DOM is committed; covers guided and presenter modes.
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [actIndex]);

  // ── Scene lifecycle: init (maybe async) → RAF draw → reveal text ──
  useEffect(() => {
    let cancelled = false;
    clearTimeout(phaseTimer.current);
    cancelAnimationFrame(rafRef.current);
    setPhase('visual');
    phaseRef.current = 'visual';
    dataRef.current = null;
    const scene = getScene(act.actId);
    sceneRef.current = scene;
    const frameBase = { mode, reducedMotion };
    const computeBacked = act.transition === 'computation-complete';
    if (computeBacked) setComputing(true);

    Promise.resolve(scene.init(act.engineState, { mode })).then((data) => {
      if (cancelled) return;
      dataRef.current = data;
      startRef.current = performance.now() / 1000;
      setComputing(false);

      if (reducedMotion) {
        const canvas = canvasRef.current;
        if (canvas) {
          const { ctx, w, h } = setupCanvas(canvas);
          scene.drawFrame(ctx, { ...frameBase, w, h, T: act.durationMs / 1000, animPhase: 'ready' }, data);
        }
        setPhase('ready');
        return;
      }

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const canvas = canvasRef.current;
        if (!canvas || !dataRef.current) return;
        const { ctx, w, h } = setupCanvas(canvas);
        const T = performance.now() / 1000 - startRef.current;
        scene.drawFrame(ctx, { ...frameBase, w, h, T, animPhase: phaseRef.current }, dataRef.current);
      };
      rafRef.current = requestAnimationFrame(loop);

      const revealMs = computeBacked ? 400
        : (mode === 'presenter' ? Math.min(act.durationMs, 4000) : act.durationMs * 0.4);
      phaseTimer.current = setTimeout(() => { if (!cancelled) setPhase('ready'); }, revealMs);
    }).catch((err) => {
      if (cancelled) return;
      setComputing(false);
      console.error('[tour] scene init failed for act', act.actId, err);
      setPhase('ready');
    });

    return () => {
      cancelled = true;
      clearTimeout(phaseTimer.current);
      cancelAnimationFrame(rafRef.current);   // RAF cleanup every act change/unmount (G9)
    };
  }, [actIndex, mode, reducedMotion]);

  // ── Navigation ──
  const advance = () => {
    if (phase === 'visual') { setPhase('ready'); return; }
    if (act.closing && isLast) {
      onTourAction({ type: 'loadEHT' });   // deliberate handoff into the live tool
      onClose();
      return;
    }
    isLast ? onClose() : onActChange(actIndex + 1);
  };
  const back = () => { if (actIndex > 0) onActChange(actIndex - 1); };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') return onClose();
      if (e.key === 'ArrowRight' || e.key === 'Enter') return advance();
      if (e.key === 'ArrowLeft') return back();
      if (e.key === 'p' || e.key === 'P') setMode(m => m === 'presenter' ? 'guided' : 'presenter');
      // Focus trap: this is an aria-modal dialog — Tab must wrap within it
      // rather than escaping into the app behind the overlay (SITE-AUDIT 3.5).
      if (e.key === 'Tab') {
        const root = rootRef.current;
        if (!root) return;
        const focusables = Array.from(root.querySelectorAll('button, [tabindex]:not([tabindex="-1"])'))
          .filter(el => !el.disabled && el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !root.contains(active))) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && (active === last || !root.contains(active))) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actIndex, phase, mode]);

  // Focus management: take focus on mount, restore the opener's focus on close.
  useEffect(() => {
    const prev = document.activeElement;
    rootRef.current?.focus();
    return () => { if (prev && prev.focus) prev.focus(); };
  }, []);

  // ── Pointer → scene (guided interactivity, e.g. Act B HA-scrub / dec-drag) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const norm = (e) => {
      const r = canvas.getBoundingClientRect();
      return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height };
    };
    const send = (type) => (e) => {
      const scene = sceneRef.current, data = dataRef.current;
      if (!scene || !scene.onPointer || !data) return;
      const { nx, ny } = norm(e);
      scene.onPointer(data, { type, nx, ny, mode, phase: phaseRef.current });
    };
    const onMove = send('move'), onDown = send('down'), onUp = send('up'), onLeave = send('leave');
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [mode]);

  const progressPct = total > 1 ? (actIndex / (total - 1)) * 100 : 100;
  const nextLabel = phase === 'visual' ? '…' : isLast ? 'Enter the simulator →' : 'Continue →';

  return html`
    <div className="tour-cinematic tour-engine" role="dialog" aria-modal="true"
         aria-label="VLBI Physics Tour" data-mode=${mode} ref=${rootRef} tabIndex=${-1}>
      <div className="tour-visual">
        <canvas ref=${canvasRef} className="tour-scene-canvas"
                aria-label=${act.title + ' — engine-driven visualization'}></canvas>
        ${computing ? html`<div className="tour-computing" aria-live="polite">
          <span className="tour-spinner"></span> Computing…
        </div>` : null}
        <button className="tour-mode-toggle" onClick=${() => setMode(m => m === 'presenter' ? 'guided' : 'presenter')}
                aria-pressed=${mode === 'presenter'}
                title="Toggle presenter / guided (P)">${mode === 'presenter' ? '◐ Presenter' : '◑ Guided'}</button>
      </div>

      <div className=${'tour-text-panel tour-engine-panel' + (mode === 'presenter' ? ' presenter' : '')}>
        <div className="tour-chapter-badge">${act.chapter}</div>
        <h2 className="tour-act-title">${act.title}</h2>

        <div className="tour-nav-col">
          <button className="tour-skip" onClick=${onClose}>Skip Tour</button>
          <div className="tour-nav-buttons">
            <div className=${'tour-continue-hint' + (phase === 'ready' ? ' hint-visible' : '')}>
              ${isLast ? 'press → to finish' : 'press → to continue'}
            </div>
            <div style=${{ display: 'flex', gap: '8px' }}>
              <button className="tour-nav-btn" onClick=${back}
                      disabled=${actIndex === 0} aria-label="Previous act">←</button>
              <button className=${'tour-nav-btn' + (phase === 'ready' ? ' btn-primary' : '')}
                      onClick=${advance} disabled=${phase === 'visual'} aria-label=${nextLabel}>
                ${nextLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="tour-body" ref=${bodyRef}>
          <div className="tour-headline">${act.headline}</div>

          ${mode === 'guided' ? act.narrative.map((p, i) => html`
            <p key=${i} className=${'tour-paragraph' + (phase === 'ready' ? ' p-visible' : '')}>${p}</p>
          `) : null}
        </div>

        <div className="tour-equation-pinned">
          <${LiveEquation} tex=${act.liveEquation.tex}
                           values=${act.liveEquation.values()}
                           visible=${phase === 'ready'} />
        </div>
      </div>

      <div className="tour-spine" aria-hidden="true">
        <${MiniUVSpine} frac=${(actIndex + (phase === 'ready' ? 1 : 0.4)) / total} />
        <span className="tour-spine-label">${act.conceptTag} · ${actIndex + 1}/${total}</span>
      </div>

      <div className="tour-progress-track">
        <div className="tour-progress-fill" style=${{ width: progressPct + '%' }} />
      </div>
    </div>
  `;
}
