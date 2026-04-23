// Citation modal — generates BibTeX and APA citations from current simulation state.
import { html, useState, useEffect } from './core.js';

export function CitationModal({ open, onClose, telescopes, controls, selectedArrayPreset, bhexAdded }) {
  const [bibtexCopied, setBibtexCopied] = useState(false);
  const [apaCopied, setApaCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const year = new Date().getFullYear();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const n = telescopes.length;
  const freq = controls.frequency;
  const dec = controls.declination;
  const dur = controls.duration;
  const method = controls.method === 'clean' ? 'CLEAN'
    : controls.method === 'mem' ? 'Max Entropy'
    : 'Dirty';

  const arrayNote = selectedArrayPreset ? ` Array: ${selectedArrayPreset}.` : '';
  const bhexNote = bhexAdded ? ' Includes BHEX space telescope (Johnson et al. 2024, arXiv:2406.12917).' : '';
  const ngEHTNote = selectedArrayPreset === 'ngEHT Phase 1'
    ? ' ngEHT reference: Doeleman et al. (2023), arXiv:2306.08787.' : '';

  const bibtex =
`@misc{vlbi_simulator_${year},
  author    = {Amaro, Ilan Benjamin},
  title     = {VLBI Interferometry Simulator},
  year      = {${year}},
  url       = {https://ilanbenamaro-cyber.github.io/astrophysics-applet/vlbi-react/},
  note      = {Simulation parameters: ${n} telescope${n !== 1 ? 's' : ''}, ${freq} GHz,
               ${dec}° declination, ${dur}h duration, ${method} reconstruction.${arrayNote}${bhexNote}${ngEHTNote}
               Guidance: Prof. Alejandro Cárdenas-Avendaño (Wake Forest University).}
}`;

  const apa =
`Amaro, I. B. (${year}). VLBI Interferometry Simulator [Web application]. ` +
`Retrieved ${date} from https://ilanbenamaro-cyber.github.io/astrophysics-applet/vlbi-react/`;

  function copyText(text, setCopied) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return html`
    <div className="modal-overlay" onClick=${onClose} role="dialog" aria-modal="true" aria-labelledby="citation-modal-title">
      <div className="modal-card" onClick=${(e) => e.stopPropagation()} style=${{ maxWidth: '600px' }}>
        <button className="modal-close" onClick=${onClose} aria-label="Close">×</button>
        <h3 className="modal-title" id="citation-modal-title">Cite This Simulation</h3>

        <h4 className="modal-section-title">BibTeX</h4>
        <pre className="modal-code" style=${{ fontSize: '0.72rem', userSelect: 'all' }}>${bibtex}</pre>
        <button
          className="btn btn-ghost"
          style=${{ marginBottom: '1.25rem' }}
          onClick=${() => copyText(bibtex, setBibtexCopied)}
          aria-label="Copy BibTeX citation"
        >${bibtexCopied ? '✓ Copied!' : 'Copy BibTeX'}</button>

        <h4 className="modal-section-title">APA</h4>
        <pre className="modal-code" style=${{ fontSize: '0.72rem', userSelect: 'all', whiteSpace: 'pre-wrap' }}>${apa}</pre>
        <button
          className="btn btn-ghost"
          onClick=${() => copyText(apa, setApaCopied)}
          aria-label="Copy APA citation"
        >${apaCopied ? '✓ Copied!' : 'Copy APA'}</button>
      </div>
    </div>
  `;
}
