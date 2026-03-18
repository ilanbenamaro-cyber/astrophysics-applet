/**
 * sampleImages.js
 * Procedurally generates 4 synthetic astronomical source images (256×256).
 * Exposes loadSampleImage(name) → Promise<ImageData>, mirroring loadImageData(file).
 *
 * Sources:
 *   ring     — Bright annulus (Gaussian profile on radius). Analogue of M87 accretion disk.
 *   double   — Two offset Gaussians. Analogue of binary system or AGN + jet knot.
 *   gaussian — Single smooth blob. Simplest reconstruction baseline.
 *   jet      — Bright core + elongated asymmetric structure at 30°. Realistic AGN morphology.
 */

/**
 * Generate the named synthetic astronomical image.
 * @param {string} name - 'ring' | 'double' | 'gaussian' | 'jet'
 * @returns {Promise<ImageData>}
 */
function loadSampleImage(name) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width  = IMAGE_SIZE;
        canvas.height = IMAGE_SIZE;
        const ctx = canvas.getContext('2d');

        try {
            switch (name) {
                case 'ring':     _drawRing(ctx);     break;
                case 'double':   _drawDouble(ctx);   break;
                case 'gaussian': _drawGaussian(ctx); break;
                case 'jet':      _drawJet(ctx);      break;
                default: reject(new Error(`Unknown sample image: "${name}"`)); return;
            }
            resolve(ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE));
        } catch (err) {
            reject(err);
        }
    });
}

// ── Drawing functions ─────────────────────────────────────────────────────────

/** Bright annulus — M87-like accretion disk. */
function _drawRing(ctx) {
    const N  = IMAGE_SIZE;
    const cx = N / 2, cy = N / 2;
    const R  = N * 0.28;   // ring radius in pixels
    const w  = N * 0.08;   // ring width (Gaussian sigma)
    const imgData = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const r   = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const val = Math.exp(-((r - R) ** 2) / (2 * w ** 2));
            const b   = Math.round(val * 255);
            const idx = (y * N + x) * 4;
            imgData.data[idx]     = b;
            imgData.data[idx + 1] = b;
            imgData.data[idx + 2] = b;
            imgData.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

/** Two offset Gaussians — binary system or AGN + jet knot. */
function _drawDouble(ctx) {
    const N  = IMAGE_SIZE;
    const s  = N * 0.07;   // blob sigma
    const blobs = [
        { cx: N * 0.38, cy: N / 2, amp: 1.0  },
        { cx: N * 0.62, cy: N / 2, amp: 0.65 },
    ];
    const imgData = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            let val = 0;
            for (const { cx, cy, amp } of blobs) {
                val += amp * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s ** 2));
            }
            const b   = Math.min(255, Math.round(val * 255));
            const idx = (y * N + x) * 4;
            imgData.data[idx]     = b;
            imgData.data[idx + 1] = b;
            imgData.data[idx + 2] = b;
            imgData.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

/** Single smooth Gaussian blob — simplest reconstruction baseline. */
function _drawGaussian(ctx) {
    const N  = IMAGE_SIZE;
    const cx = N / 2, cy = N / 2;
    const s  = N * 0.12;
    const imgData = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const val = Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s ** 2));
            const b   = Math.round(val * 255);
            const idx = (y * N + x) * 4;
            imgData.data[idx]     = b;
            imgData.data[idx + 1] = b;
            imgData.data[idx + 2] = b;
            imgData.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

/** Bright core + elongated asymmetric jet at 30° — realistic AGN morphology. */
function _drawJet(ctx) {
    const N   = IMAGE_SIZE;
    const cx  = N / 2, cy = N / 2;
    const ang = 30 * Math.PI / 180;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const imgData = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const dx    = x - cx, dy = y - cy;
            const along = dx * cos + dy * sin;    // along-jet axis
            const perp  = -dx * sin + dy * cos;   // perpendicular to jet
            // Compact core: circular Gaussian
            const core  = Math.exp(-((dx ** 2 + dy ** 2)) / (2 * (N * 0.06) ** 2));
            // One-sided jet: elongated along the jet direction
            const jet   = along > 0
                ? Math.exp(-(along ** 2) / (2 * (N * 0.22) ** 2) - (perp ** 2) / (2 * (N * 0.03) ** 2))
                : 0;
            const val   = Math.min(1, core + 0.5 * jet);
            const b     = Math.round(val * 255);
            const idx   = (y * N + x) * 4;
            imgData.data[idx]     = b;
            imgData.data[idx + 1] = b;
            imgData.data[idx + 2] = b;
            imgData.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}
