/**
 * imageProcessor.js
 * Image loading, canvas I/O, UV mask construction, and the reconstruction pipeline.
 * Depends on: fft2d.js (fft2d, ifft2d), math.js (math.complex).
 */

// Fixed image size — must be a power of 2 for the Cooley-Tukey FFT.
const IMAGE_SIZE = 256;

/**
 * Load a File into an ImageData object, resized to IMAGE_SIZE × IMAGE_SIZE.
 * @param {File} file
 * @returns {Promise<ImageData>}
 */
function loadImageData(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width  = IMAGE_SIZE;
            canvas.height = IMAGE_SIZE;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
            resolve(ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE));
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => reject(new Error('Failed to decode image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Convert ImageData (RGBA) to a grayscale N×N float array using the luminance formula.
 * Output values are in [0, 255].
 * @param {ImageData} imageData
 * @returns {number[][]}
 */
function imageDataToGrayscale(imageData) {
    const N    = imageData.width;
    const data = imageData.data;
    const out  = Array.from({ length: N }, () => new Array(N).fill(0));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const idx  = (i * N + j) * 4;
            out[i][j] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        }
    }
    return out;
}

/**
 * Render ImageData (as returned by loadImageData) onto a canvas element.
 * @param {ImageData} imageData
 * @param {HTMLCanvasElement} canvas
 */
function imageDataToCanvas(imageData, canvas) {
    canvas.width  = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
}

/**
 * Render a grayscale N×N float array onto a canvas, auto-normalizing to [0, 255].
 * @param {number[][]} pixels
 * @param {HTMLCanvasElement} canvas
 */
function grayscaleToCanvas(pixels, canvas) {
    const N   = pixels.length;
    canvas.width  = N;
    canvas.height = N;
    const ctx       = canvas.getContext('2d');
    const imageData = ctx.createImageData(N, N);
    const d         = imageData.data;

    let min = Infinity, max = -Infinity;
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (pixels[i][j] < min) min = pixels[i][j];
            if (pixels[i][j] > max) max = pixels[i][j];
        }
    }
    const range = max - min || 1;

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const val = Math.round(((pixels[i][j] - min) / range) * 255);
            const idx = (i * N + j) * 4;
            d[idx]     = val;
            d[idx + 1] = val;
            d[idx + 2] = val;
            d[idx + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Build an N×N boolean mask marking which FFT frequency bins are sampled.
 *
 * UV points are in centered pixel coordinates (u, v) ∈ [−N/2, N/2).
 * Array index conversion: index = ((value + N) % N + N) % N
 * This handles negative values correctly and is equivalent to an ifftShift.
 *
 * Row index ↔ v (North-South / y-frequency)
 * Col index ↔ u (East-West  / x-frequency)
 *
 * @param {Array<{u: number, v: number}>} uvPoints - centered pixel coordinates
 * @param {number} N
 * @returns {boolean[][]}
 */
function buildUVMask(uvPoints, N) {
    const mask = Array.from({ length: N }, () => new Array(N).fill(false));
    for (const { u, v } of uvPoints) {
        const row = ((Math.round(v) % N) + N) % N;
        const col = ((Math.round(u) % N) + N) % N;
        mask[row][col] = true;
    }
    return mask;
}

/**
 * Apply a UV mask to a 2D FFT array, zeroing all unsampled frequency bins.
 * @param {object[][]} fftData - N×N complex array
 * @param {boolean[][]} mask
 * @returns {object[][]} masked FFT
 */
function applyUVMask(fftData, mask) {
    const zero = math.complex(0, 0);
    return fftData.map((row, i) =>
        row.map((val, j) => mask[i][j] ? val : zero)
    );
}

/**
 * Draw UV-plane coverage with per-baseline colors on a dark canvas.
 * Each point is colored by the blended color of the telescope pair that produced it.
 * Points are grouped by color to minimize ctx.fillStyle changes.
 * @param {Array<{u: number, v: number, color: string}>} uvPoints
 * @param {number} N
 * @param {HTMLCanvasElement} canvas
 */
function drawUVPlane(uvPoints, N, canvas) {
    canvas.width  = N;
    canvas.height = N;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#08081a';
    ctx.fillRect(0, 0, N, N);

    // Axes
    ctx.strokeStyle = '#2a2a5a';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(N / 2, 0);   ctx.lineTo(N / 2, N);
    ctx.moveTo(0, N / 2);   ctx.lineTo(N, N / 2);
    ctx.stroke();

    // Group points by color to minimize fillStyle switches
    const byColor = new Map();
    for (const { u, v, color } of uvPoints) {
        const x = u + N / 2;
        const y = v + N / 2;
        if (x >= 0 && x < N && y >= 0 && y < N) {
            const key = color || '#00aaff';
            if (!byColor.has(key)) byColor.set(key, []);
            byColor.get(key).push(x, y);
        }
    }
    for (const [color, coords] of byColor) {
        ctx.fillStyle = color;
        for (let i = 0; i < coords.length; i += 2) {
            ctx.fillRect(coords[i], coords[i + 1], 1, 1);
        }
    }
}

/**
 * Compute the dirty beam (PSF) of the array by taking the IFFT of the UV mask alone.
 * The result is the point spread function — what a perfect point source would look like.
 * @param {Array<{u: number, v: number}>} uvPoints
 * @param {number} N
 * @returns {number[][]} dirty beam as a real N×N array (ready for grayscaleToCanvas)
 */
function computeDirtyBeam(uvPoints, N) {
    const mask = buildUVMask(uvPoints, N);
    const spectrum = mask.map(row =>
        row.map(v => v ? math.complex(1, 0) : math.complex(0, 0))
    );
    return ifft2d(spectrum);
}

/**
 * Compute the fraction of the independent UV half-plane that is sampled.
 * @param {Array<{u: number, v: number}>} uvPoints
 * @param {number} N
 * @returns {string} fill percentage, e.g. "4.3"
 */
function computeUVFill(uvPoints, N) {
    const mask = buildUVMask(uvPoints, N);
    let count = 0;
    for (const row of mask) for (const c of row) if (c) count++;
    return (count / (N * N / 2) * 100).toFixed(1);
}

/**
 * Full reconstruction pipeline: grayscale pixels → FFT → mask → IFFT → dirty image.
 * @param {number[][]} grayscale - N×N input
 * @param {Array<{u: number, v: number}>} uvPoints
 * @returns {number[][]} dirty image (grayscale pixels)
 */
function reconstructImage(grayscale, uvPoints) {
    const N       = grayscale.length;
    const spectrum = fft2d(grayscale);
    const mask     = buildUVMask(uvPoints, N);
    const masked   = applyUVMask(spectrum, mask);
    return ifft2d(masked);
}

/**
 * CLEAN deconvolution: iteratively subtract the PSF from the dirty image to
 * recover a sharper, less artifact-laden reconstruction.
 *
 * Algorithm (Högbom CLEAN):
 *   1. Copy dirty image to residual; init clean-component map to zero.
 *   2. Repeat up to maxIter times:
 *        a. Find the peak residual pixel (r, c).
 *        b. Stop if |peak| < threshold × initialPeak.
 *        c. Subtract gain × peak × beam (shifted to align with (r,c)) from residual.
 *        d. Accumulate gain × peak / beamPeak into components[r][c].
 *   3. Estimate restore-beam width from the dirty beam FWHM.
 *   4. Convolve clean components with a Gaussian restore beam via FFT.
 *   5. Return restored + residual.
 *
 * @param {number[][]} dirtyImage - N×N real array (output of reconstructImage)
 * @param {number[][]} dirtyBeam  - N×N real array (output of computeDirtyBeam); peak at [0][0]
 * @param {object}     [opts]
 * @param {number}     [opts.gain=0.1]      - Loop gain: fraction of peak subtracted per iteration
 * @param {number}     [opts.maxIter=1000]  - Maximum CLEAN iterations
 * @param {number}     [opts.threshold=0.05] - Stop when peak < threshold × initialPeak
 * @returns {number[][]} CLEAN-restored image (N×N real)
 */
function cleanDeconvolve(dirtyImage, dirtyBeam, opts) {
    const gain      = (opts && opts.gain      != null) ? opts.gain      : 0.1;
    const maxIter   = (opts && opts.maxIter   != null) ? opts.maxIter   : 1000;
    const threshold = (opts && opts.threshold != null) ? opts.threshold : 0.05;

    const N = dirtyImage.length;

    // --- Working copies ---
    const residual   = dirtyImage.map(row => row.slice());
    const components = Array.from({ length: N }, () => new Array(N).fill(0));

    // --- Beam peak (should be at [0][0] by IFFT convention) ---
    let beamPeak = 0;
    for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++)
            if (Math.abs(dirtyBeam[i][j]) > beamPeak) beamPeak = Math.abs(dirtyBeam[i][j]);
    if (beamPeak === 0) return dirtyImage.map(row => row.slice());

    // --- Initial peak for threshold ---
    let initPeak = 0;
    for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++)
            if (Math.abs(residual[i][j]) > initPeak) initPeak = Math.abs(residual[i][j]);
    const stopLevel = threshold * initPeak;

    // --- CLEAN loop ---
    for (let iter = 0; iter < maxIter; iter++) {
        // Find peak residual
        let peakVal = 0, peakR = 0, peakC = 0;
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (Math.abs(residual[i][j]) > Math.abs(peakVal)) {
                    peakVal = residual[i][j];
                    peakR   = i;
                    peakC   = j;
                }
            }
        }
        if (Math.abs(peakVal) < stopLevel) break;

        // Subtract scaled, shifted dirty beam from residuals
        const delta = gain * peakVal / beamPeak;
        for (let i = 0; i < N; i++) {
            const bi = ((i - peakR) % N + N) % N;
            for (let j = 0; j < N; j++) {
                const bj = ((j - peakC) % N + N) % N;
                residual[i][j] -= delta * dirtyBeam[bi][bj];
            }
        }
        components[peakR][peakC] += delta;
    }

    // --- Estimate restore-beam width from dirty-beam FWHM ---
    // Walk along row 0 from the peak at j=0 until the value drops below half-maximum.
    const halfMax = dirtyBeam[0][0] / 2;
    let halfWidth = 2; // minimum 2px half-width
    for (let j = 1; j < N / 2; j++) {
        if (dirtyBeam[0][j] <= halfMax) { halfWidth = j; break; }
    }
    // sigma for Gaussian restore beam (slightly generous for a clean visual appearance)
    const sigma = Math.max(1.5, halfWidth / 2.355);

    // --- Gaussian restore beam centered at [0][0] (IFFT/periodic convention) ---
    const gaussian = Array.from({ length: N }, (_, i) => {
        const di = Math.min(i, N - i); // shortest periodic distance
        return Array.from({ length: N }, (_, j) => {
            const dj = Math.min(j, N - j);
            return Math.exp(-(di * di + dj * dj) / (2 * sigma * sigma));
        });
    });

    // --- Convolve components with Gaussian via FFT ---
    // Convolution theorem: ifft2d(fft2d(f) .* fft2d(g)) = f ⊛ g (math.js 1/N² normalization is exact)
    const compFFT  = fft2d(components);
    const gaussFFT = fft2d(gaussian);
    const product  = compFFT.map((row, i) =>
        row.map((val, j) => math.multiply(val, gaussFFT[i][j]))
    );
    const restored = ifft2d(product);

    // --- Add residuals ---
    return restored.map((row, i) => row.map((val, j) => val + residual[i][j]));
}
