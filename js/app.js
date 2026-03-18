/**
 * app.js
 * Main coordinator: connects the globe, interferometry math, and image display.
 * Depends on: mapController.js, interferometry.js, imageProcessor.js, sampleImages.js,
 *             infoModal.js, fft2d.js.
 */

const EHT_WAVELENGTH_MM = 1.3;   // EHT observing wavelength used for angular resolution

let currentImageData    = null;
let currentGrayscale    = null;
let reconstructionTimer = null;

/**
 * Debounced entry point for reconstruction — cancels any pending run before scheduling
 * a new one. Prevents batched telescope updates (e.g. loadPresets) from queuing multiple
 * simultaneous FFT jobs.
 */
function runReconstruction() {
    clearTimeout(reconstructionTimer);
    reconstructionTimer = setTimeout(_reconstruct, 50);
}

function _reconstruct() {
    const tels = getTelescopes();

    if (!currentGrayscale) {
        updateStatus('Upload an image or choose a sample to reconstruct.');
        return;
    }
    if (tels.length < 2) {
        updateStatus('Place at least 2 telescopes on the globe to begin reconstruction.');
        clearReconstructed();
        updateBaselineTable(tels);
        return;
    }

    const decl    = parseFloat(document.getElementById('declination').value);
    const haRange = parseFloat(document.getElementById('ha-range').value);
    const N       = IMAGE_SIZE;

    const uvPoints = computeUVCoverage(tels, decl, haRange, 200, N);
    drawUVPlane(uvPoints, N, document.getElementById('uv-canvas'));

    const fill = computeUVFill(uvPoints, N);
    document.getElementById('uv-count').textContent = `${uvPoints.length} samples · ${fill}% fill`;

    updateBaselineTable(tels);
    updateStatus('Reconstructing…');

    // Defer FFT work by one frame so "Reconstructing…" renders first
    setTimeout(() => {
        try {
            const pixels = reconstructImage(currentGrayscale, uvPoints);
            grayscaleToCanvas(pixels, document.getElementById('reconstructed-canvas'));

            const beam = computeDirtyBeam(uvPoints, N);
            grayscaleToCanvas(beam, document.getElementById('dirty-beam-canvas'));

            const resolutionStr = _angularResolution(tels);
            updateStatus(
                `Done — ${tels.length} telescopes, ${uvPoints.length} UV samples, ` +
                `UV fill ${fill}%, decl ${decl}°, HA ±${(haRange / 2).toFixed(0)}°` +
                (resolutionStr ? ` · ${resolutionStr}` : '')
            );
        } catch (err) {
            updateStatus(`Reconstruction failed: ${err.message}`);
        }
    }, 10);
}

/**
 * Compute the angular resolution estimate from the longest baseline.
 * Uses θ ≈ λ/B at the EHT wavelength. Returns a display string or ''.
 * @param {Array<{lat: number, lon: number}>} tels
 * @returns {string}
 */
function _angularResolution(tels) {
    if (tels.length < 2) return '';
    let maxKm = 0;
    for (let i = 0; i < tels.length; i++) {
        for (let j = i + 1; j < tels.length; j++) {
            const { bx, by, bz } = computeBaseline(tels[i], tels[j]);
            const km = Math.sqrt(bx * bx + by * by + bz * bz);
            if (km > maxKm) maxKm = km;
        }
    }
    if (maxKm === 0) return '';
    // θ_µas = (λ_m / B_m) × 206265 × 1e6
    // λ = EHT_WAVELENGTH_MM × 1e-3 m, B_m = maxKm × 1e3 m
    const thetaMicroarcsec = (EHT_WAVELENGTH_MM * 1e-3 / (maxKm * 1e3)) * 206265 * 1e6;
    return `θ ≈ ${thetaMicroarcsec.toFixed(0)} µas @ ${EHT_WAVELENGTH_MM} mm`;
}

/** Set the status bar text. */
function updateStatus(msg) {
    document.getElementById('status').textContent = msg;
}

/** Clear the reconstructed and dirty beam canvases when there are too few telescopes. */
function clearReconstructed() {
    for (const id of ['reconstructed-canvas', 'dirty-beam-canvas', 'uv-canvas']) {
        const canvas = document.getElementById(id);
        const ctx    = canvas.getContext('2d');
        ctx.fillStyle = '#08081a';
        ctx.fillRect(0, 0, canvas.width || IMAGE_SIZE, canvas.height || IMAGE_SIZE);
    }
    document.getElementById('uv-count').textContent = '';
}

/**
 * Rebuild the baseline length table from the current telescope list.
 * Populates #baseline-table tbody; hides the <details> when empty.
 * @param {Array<{lat, lon, name, color}>} tels
 */
function updateBaselineTable(tels) {
    const details = document.getElementById('baseline-details');
    const tbody   = document.querySelector('#baseline-table tbody');
    tbody.innerHTML = '';

    if (tels.length < 2) {
        details.style.display = 'none';
        return;
    }
    details.style.display = '';

    for (let i = 0; i < tels.length; i++) {
        for (let j = i + 1; j < tels.length; j++) {
            const { bx, by, bz } = computeBaseline(tels[i], tels[j]);
            const km = Math.round(Math.sqrt(bx * bx + by * by + bz * bz));
            const blendColor = _lerpColor(tels[i].color || '#888', tels[j].color || '#888', 0.5);
            const tr = document.createElement('tr');
            tr.style.borderLeft = `3px solid ${blendColor}`;
            tr.innerHTML = `
                <td><span class="tel-dot" style="background:${tels[i].color}"></span>${tels[i].name}</td>
                <td><span class="tel-dot" style="background:${tels[j].color}"></span>${tels[j].name}</td>
                <td>${km.toLocaleString()} km</td>
            `;
            tbody.appendChild(tr);
        }
    }
}

/** Export a canvas as a PNG download. */
function _exportCanvas(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    const link   = document.createElement('a');
    link.download = filename;
    link.href     = canvas.toDataURL('image/png');
    link.click();
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.getElementById('image-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateStatus('Loading image…');
    // Deactivate sample buttons
    document.querySelectorAll('.sample-btn').forEach(b => b.classList.remove('active'));
    try {
        currentImageData = await loadImageData(file);
        currentGrayscale = imageDataToGrayscale(currentImageData);
        imageDataToCanvas(currentImageData, document.getElementById('original-canvas'));
        runReconstruction();
    } catch (err) {
        updateStatus(`Could not load image: ${err.message}`);
    }
});

document.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const name = btn.dataset.sample;
        updateStatus(`Loading sample: ${name}…`);
        document.querySelectorAll('.sample-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        try {
            currentImageData = await loadSampleImage(name);
            currentGrayscale = imageDataToGrayscale(currentImageData);
            imageDataToCanvas(currentImageData, document.getElementById('original-canvas'));
            runReconstruction();
        } catch (err) {
            updateStatus(`Could not load sample: ${err.message}`);
        }
    });
});

document.getElementById('declination').addEventListener('input', () => {
    document.getElementById('declination-val').textContent =
        document.getElementById('declination').value + '°';
    runReconstruction();
});

document.getElementById('ha-range').addEventListener('input', () => {
    const val = document.getElementById('ha-range').value;
    document.getElementById('ha-range-val').textContent = `±${(val / 2).toFixed(0)}°`;
    runReconstruction();
});

document.getElementById('load-presets').addEventListener('click', () => {
    loadPresets();
});

document.getElementById('clear-telescopes').addEventListener('click', () => {
    clearTelescopes();
    updateStatus('Telescopes cleared.');
});

document.getElementById('save-uv').addEventListener('click', () => {
    _exportCanvas('uv-canvas', 'uv-coverage.png');
});

document.getElementById('save-reconstruction').addEventListener('click', () => {
    _exportCanvas('reconstructed-canvas', 'reconstruction.png');
});

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initGlobe('map', () => runReconstruction());
    initInfoButtons();
    updateStatus('Upload an image (or choose a sample) and place telescopes to begin.');
});
