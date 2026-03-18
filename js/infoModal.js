/**
 * infoModal.js
 * Lightweight educational info modal system.
 * showInfo(key) opens a modal with scientific context for the given topic.
 * initInfoButtons() attaches click handlers to all .info-btn elements in the DOM.
 */

const INFO_CONTENT = {
    'telescope-array': {
        title: 'VLBI — Very Long Baseline Interferometry',
        body: `
            <p>In VLBI, radio telescopes spread across Earth (or in space) observe the same source
            simultaneously. By precisely correlating their recordings, we synthesize a virtual telescope
            as large as the separation between them — called the <em>baseline</em>.</p>
            <p>The Event Horizon Telescope (EHT) links dishes from the South Pole to Spain to Hawaii,
            achieving an angular resolution of ~20 microarcseconds — enough to resolve the shadow of the
            supermassive black hole in M87, 55 million light-years away.</p>
            <p>In this simulator, each colored point is one telescope. Spread them farther apart and add
            more sites to improve resolution and UV coverage.</p>
        `,
    },
    'uv-plane': {
        title: 'The UV-Plane (Fourier Plane)',
        body: `
            <p>Every telescope pair samples one point in the UV-plane — the 2D Fourier transform of the
            sky brightness. <em>u</em> and <em>v</em> are the East–West and North–South components of
            the baseline projected onto the sky, in wavelength units.</p>
            <p>As Earth rotates during the observation, each baseline traces an elliptical arc through
            the UV-plane. Longer observations and more baselines → denser coverage → better image.</p>
            <p>Gaps in UV coverage produce artifacts and blurring in the reconstruction. The color of
            each arc encodes which telescope pair produced it.</p>
        `,
    },
    'reconstruction': {
        title: 'Image Reconstruction (Dirty Image)',
        body: `
            <p>The reconstructed image is produced by applying an inverse FFT to the sampled UV points
            only (unsampled frequencies are set to zero). This is called the <em>dirty image</em> — the
            true sky convolved with the array's point spread function (dirty beam).</p>
            <p>Real radio astronomers then apply deconvolution (CLEAN, Maximum Entropy, or deep-learning
            methods) to remove dirty beam artifacts. This simulator shows the dirty image before any
            deconvolution.</p>
            <p>Blurry/noisy output means sparse UV coverage. Load EHT presets and maximize the HA
            range to see the best reconstruction this array can achieve.</p>
        `,
    },
    'declination': {
        title: 'Source Declination',
        body: `
            <p>Declination is the celestial equivalent of latitude: 0° = equator, +90° = north
            celestial pole, −90° = south. It determines which telescopes can see the source and for
            how long.</p>
            <p>Declination also controls the <em>shape</em> of the UV arcs: at δ = ±90° the arcs are
            circles; at δ = 0° they flatten into straight lines. High-declination sources tend to have
            rounder UV coverage and better-constrained images.</p>
            <p>M87 (the first black hole imaged by the EHT) sits at δ ≈ +12°. Sgr A* is at δ ≈ −29°.</p>
        `,
    },
    'ha-range': {
        title: 'Hour Angle Range (Observation Window)',
        body: `
            <p>The hour angle (HA) measures how far a source has moved past the local meridian due to
            Earth's rotation. HA = 0h is transit (highest in sky); negative HA = rising,
            positive HA = setting.</p>
            <p>A wider HA range means a longer observation and more Earth rotation — tracing longer UV
            arcs and filling more of the UV-plane. But each telescope can only observe while the source
            is above its local horizon, limiting the practical window.</p>
            <p>The EHT typically observes each source for 4–8 hours (HA range ≈ ±30° to ±60°).</p>
        `,
    },
};

/**
 * Open an info modal for the given content key.
 * @param {string} key - key from INFO_CONTENT
 */
function showInfo(key) {
    const content = INFO_CONTENT[key];
    if (!content) return;

    const existing = document.getElementById('info-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'info-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal-header">
                <h3 id="modal-title">${content.title}</h3>
                <button class="modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">${content.body}</div>
        </div>
    `;

    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').focus();
}

/**
 * Attach click handlers to all .info-btn elements in the document.
 * Also registers a global Escape key handler to close any open modal.
 */
function initInfoButtons() {
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showInfo(btn.dataset.infoKey);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('info-modal-overlay');
            if (overlay) overlay.remove();
        }
    });
}
