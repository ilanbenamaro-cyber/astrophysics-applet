/**
 * app.js
 * Main coordinator: connects the map, interferometry math, and image display.
 * Depends on: mapController.js, interferometry.js, imageProcessor.js, fft2d.js.
 */

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
        updateStatus('Upload an image to reconstruct.');
        return;
    }
    if (tels.length < 2) {
        updateStatus('Place at least 2 telescopes on the map to begin reconstruction.');
        clearReconstructed();
        return;
    }

    const decl    = parseFloat(document.getElementById('declination').value);
    const haRange = parseFloat(document.getElementById('ha-range').value);
    const N       = IMAGE_SIZE;

    const uvPoints = computeUVCoverage(tels, decl, haRange, 200, N);
    drawUVPlane(uvPoints, N, document.getElementById('uv-canvas'));
    document.getElementById('uv-count').textContent = `${uvPoints.length} samples`;

    updateStatus('Reconstructing…');

    // Defer the FFT work by one frame so the "Reconstructing…" status renders first.
    setTimeout(() => {
        try {
            const pixels = reconstructImage(currentGrayscale, uvPoints);
            grayscaleToCanvas(pixels, document.getElementById('reconstructed-canvas'));
            updateStatus(
                `Done — ${tels.length} telescopes, ${uvPoints.length} UV samples, ` +
                `declination ${decl}°, HA range ±${(haRange / 2).toFixed(0)}°`
            );
        } catch (err) {
            updateStatus(`Reconstruction failed: ${err.message}`);
        }
    }, 10);
}

/** Set the status bar text. */
function updateStatus(msg) {
    document.getElementById('status').textContent = msg;
}

/** Clear the reconstructed canvas when there are too few telescopes. */
function clearReconstructed() {
    const canvas = document.getElementById('reconstructed-canvas');
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#08081a';
    ctx.fillRect(0, 0, canvas.width || IMAGE_SIZE, canvas.height || IMAGE_SIZE);
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.getElementById('image-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateStatus('Loading image…');
    try {
        currentImageData = await loadImageData(file);
        currentGrayscale = imageDataToGrayscale(currentImageData);
        imageDataToCanvas(currentImageData, document.getElementById('original-canvas'));
        runReconstruction();
    } catch (err) {
        updateStatus(`Could not load image: ${err.message}`);
    }
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

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initMap('map', () => runReconstruction());
    updateStatus('Upload an image and place telescopes (or load EHT presets) to begin.');
});
