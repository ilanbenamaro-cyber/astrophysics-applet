// Physics Notes modal — implementation methodology and references.
import { html, useEffect } from './core.js';

export function PhysicsNotesModal({ open, onClose, fovMuas = 80 }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return html`
    <div className="modal-overlay" onClick=${onClose} role="dialog" aria-modal="true" aria-labelledby="physics-modal-title">
      <div className="modal-card" onClick=${(e) => e.stopPropagation()} style=${{ maxWidth: '640px', maxHeight: '80vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick=${onClose} aria-label="Close">×</button>
        <h3 className="modal-title" id="physics-modal-title">Implementation Notes & References</h3>

        <h4 className="modal-section-title">UV Coverage Formula</h4>
        <p className="modal-body">
          The baseline-to-UV-coordinate conversion follows Thompson, Moran & Swenson (2017),
          <em> Interferometry and Synthesis in Radio Astronomy</em>, 3rd ed., eq. 4.1:
        </p>
        <pre className="modal-code">u = (Bx·sin(H) + By·cos(H)) / λ
v = (−Bx·sin(δ)·cos(H) + By·sin(δ)·sin(H) + Bz·cos(δ)) / λ</pre>
        <p className="modal-body">
          where H is hour angle, δ is declination, and (Bx, By, Bz) are ECEF baseline components.
        </p>

        <h4 className="modal-section-title">Coordinate System</h4>
        <p className="modal-body">
          Telescope positions are converted to Earth-Centered Earth-Fixed (ECEF) coordinates
          assuming a spherical Earth (R = 6,371 km). Baseline vectors are computed as ECEF
          differences. UV coordinates are expressed in wavelengths (λ). The image FOV is
          set to ${fovMuas} μas, giving a pixel scale of λ / (FOV in radians).
          Conjugate symmetry enforced: both (u, v) and (−u, −v) are included for each sample.
        </p>

        <h4 className="modal-section-title">Image Reconstruction</h4>
        <p className="modal-body">
          <strong>Dirty image:</strong> inverse 2D FFT of the masked visibility function.<br/>
          <strong>CLEAN deconvolution:</strong> Högbom (1974) algorithm, 1000 iterations,
          loop gain γ = 0.1, stopping threshold 3 × image RMS noise (estimated from outer
          10% border). Restore beam: elliptical Gaussian fitted to dirty beam FWHM in both
          U and V axes.<br/>
          <strong>Max Entropy:</strong> entropy maximization subject to χ² ≤ 1 data-fidelity
          constraint (gradient-descent, 120 iterations).
        </p>

        <h4 className="modal-section-title">Thermal Noise</h4>
        <p className="modal-body">
          Each baseline has noise ∝ sqrt(SEFD_i × SEFD_j), where SEFD is the System Equivalent
          Flux Density in Jansky. ALMA (94 Jy) produces ~0.15× the noise of SMT (17,100 Jy)
          on shared baselines, reflecting its much larger effective collecting area as a phased
          array. SEFD values sourced from published EHT array performance specifications.
        </p>

        <h4 className="modal-section-title">EHT Station Coordinates</h4>
        <p className="modal-body">
          Station coordinates sourced from published EHT array configurations.
          Validated against Event Horizon Telescope Collaboration (2019),
          <em> ApJL</em> 875, L1.
        </p>

        <h4 className="modal-section-title">BHEX Space Telescope</h4>
        <p className="modal-body">
          BHEX (Black Hole Explorer) is a proposed NASA space VLBI mission at 26,562 km altitude,
          near-polar orbit, 12-hour period. Space baselines extend to ~27,000 km (~20 Gλ at
          230 GHz) — 3× the maximum EHT ground baseline — enabling ~6 μas resolution to probe
          the M87* photon ring. Reference: Johnson et al. (2024), arXiv:2406.12917.
        </p>

        <h4 className="modal-section-title">Acknowledgements</h4>
        <p className="modal-body">
          Physics guidance: Prof. Alejandro Cárdenas-Avendaño (Wake Forest University).
          Implementation validated against known EHT array geometry and published UV
          coverage figures.
        </p>
      </div>
    </div>
  `;
}
