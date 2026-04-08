'use strict';

function fft1d(data, n, inverse) {
  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let tr = data[2*i], ti = data[2*i+1];
      data[2*i]   = data[2*j]; data[2*i+1] = data[2*j+1];
      data[2*j]   = tr;        data[2*j+1] = ti;
    }
  }
  // Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = data[2*(i+k)],         uIm = data[2*(i+k)+1];
        const vRe = data[2*(i+k+len/2)],   vIm = data[2*(i+k+len/2)+1];
        const tmpRe = curRe*vRe - curIm*vIm;
        const tmpIm = curRe*vIm + curIm*vRe;
        data[2*(i+k)]         = uRe + tmpRe;
        data[2*(i+k)+1]       = uIm + tmpIm;
        data[2*(i+k+len/2)]   = uRe - tmpRe;
        data[2*(i+k+len/2)+1] = uIm - tmpIm;
        const nextRe = curRe*wRe - curIm*wIm;
        const nextIm = curRe*wIm + curIm*wRe;
        curRe = nextRe; curIm = nextIm;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < 2*n; i++) data[i] /= n;
  }
}

function fft2d(data, N, inverse) {
  const row = new Float64Array(2*N);
  // Row FFTs
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      row[2*c]   = data[2*(r*N+c)];
      row[2*c+1] = data[2*(r*N+c)+1];
    }
    fft1d(row, N, inverse);
    for (let c = 0; c < N; c++) {
      data[2*(r*N+c)]   = row[2*c];
      data[2*(r*N+c)+1] = row[2*c+1];
    }
  }
  const col = new Float64Array(2*N);
  // Column FFTs
  for (let c = 0; c < N; c++) {
    for (let r = 0; r < N; r++) {
      col[2*r]   = data[2*(r*N+c)];
      col[2*r+1] = data[2*(r*N+c)+1];
    }
    fft1d(col, N, inverse);
    for (let r = 0; r < N; r++) {
      data[2*(r*N+c)]   = col[2*r];
      data[2*(r*N+c)+1] = col[2*r+1];
    }
  }
}

function buildMask(uvPoints, N) {
  // uvPoints arrive with display-space offset (+N/2) applied in computeUVPoints.
  // Strip that offset to recover centered FFT-bin coordinates before modulo mapping.
  const mask = new Uint8Array(N * N);
  const half = N / 2;
  for (const pt of uvPoints) {
    const cu = pt.u - half; // centered: can be negative
    const cv = pt.v - half;
    const iu = (Math.round(cu) % N + N) % N;
    const iv = (Math.round(cv) % N + N) % N;
    mask[iv * N + iu] = 1;
  }
  return mask;
}

function addNoise(data, mask, N, amplitude) {
  if (amplitude <= 0) return;
  // Compute RMS of sampled visibilities
  let sumSq = 0, cnt = 0;
  for (let i = 0; i < N*N; i++) {
    if (mask[i]) {
      const re = data[2*i], im = data[2*i+1];
      sumSq += re*re + im*im;
      cnt++;
    }
  }
  const rms = cnt > 0 ? Math.sqrt(sumSq / cnt) : 1;
  const sigma = amplitude * rms;
  // Box-Muller Gaussian noise on sampled visibilities
  for (let i = 0; i < N*N; i++) {
    if (mask[i]) {
      let u1, u2;
      do { u1 = Math.random(); } while (u1 === 0);
      u2 = Math.random();
      const z0 = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
      const z1 = Math.sqrt(-2*Math.log(u1)) * Math.sin(2*Math.PI*u2);
      data[2*i]   += z0 * sigma;
      data[2*i+1] += z1 * sigma;
    }
  }
}

function gaussConvolve(img, N, sigma) {
  const radius = Math.ceil(3*sigma);
  const size = 2*radius+1;
  const kernel = new Float64Array(size);
  let ksum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-x*x / (2*sigma*sigma));
    ksum += kernel[i];
  }
  for (let i = 0; i < size; i++) kernel[i] /= ksum;

  const tmp = new Float64Array(N*N);
  // Horizontal pass with wrap-around
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let v = 0;
      for (let k = 0; k < size; k++) {
        const cc = ((c + k - radius) % N + N) % N;
        v += img[r*N+cc] * kernel[k];
      }
      tmp[r*N+c] = v;
    }
  }
  const out = new Float64Array(N*N);
  // Vertical pass with wrap-around
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let v = 0;
      for (let k = 0; k < size; k++) {
        const rr = ((r + k - radius) % N + N) % N;
        v += tmp[rr*N+c] * kernel[k];
      }
      out[r*N+c] = v;
    }
  }
  return out;
}


function reconstruct(grayscale, uvPoints, params) {
  const { N, noise, method, dishDiameter = 25, frequency = 230 } = params;

  // 1. Build complex array from grayscale, applying primary-beam Gaussian taper.
  //    FWHM ∝ λ/D: larger dish or higher frequency → narrower beam → tighter taper.
  //    sigma_px = N/2 * (25/dishDiameter) * (230/frequency) * 1.5 (calibrated constant)
  const sigmaPx = (N / 2) * (25 / dishDiameter) * (230 / frequency) * 1.5;
  const twoSig2 = 2 * sigmaPx * sigmaPx;
  const vis = new Float64Array(2*N*N);
  const cx = N / 2, cy = N / 2;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const dr = r - cy, dc = c - cx;
      const taper = Math.exp(-(dr*dr + dc*dc) / twoSig2);
      vis[2*(r*N+c)]   = grayscale[r*N+c] * taper;
      vis[2*(r*N+c)+1] = 0;
    }
  }

  // 2. Forward FFT
  fft2d(vis, N, false);

  // 3. Build mask and apply (zero unsampled frequencies)
  const mask = buildMask(uvPoints, N);

  // 4. Add noise before masking application (noise on sampled vis)
  addNoise(vis, mask, N, noise);

  // Apply mask
  const masked = new Float64Array(2*N*N);
  for (let i = 0; i < N*N; i++) {
    if (mask[i]) {
      masked[2*i]   = vis[2*i];
      masked[2*i+1] = vis[2*i+1];
    }
  }

  // 5. Dirty image: IFFT of masked
  const dirtyVis = masked.slice();
  fft2d(dirtyVis, N, true);

  const dirtyImg = new Float64Array(N*N);
  for (let i = 0; i < N*N; i++) {
    dirtyImg[i] = dirtyVis[2*i];
  }

  let restoredImg;

  if (method === 'mem') {
    // Maximum Entropy Method (120 gradient-descent iterations)
    const MEM_ITER = 120;
    const ALPHA    = 0.01;   // entropy regularization weight
    const EPS      = 1e-8;   // positivity floor

    // Flat prior: mean absolute value of dirty image
    let absSum = 0;
    for (let i = 0; i < N*N; i++) absSum += Math.abs(dirtyImg[i]);
    const m0 = Math.max(absSum / (N*N), EPS);

    const E = new Float64Array(N*N);
    for (let i = 0; i < N*N; i++) E[i] = Math.max(dirtyImg[i], EPS);

    for (let iter = 0; iter < MEM_ITER; iter++) {
      // 1. V_est = FFT(E) masked to sampled points
      const eC = new Float64Array(2*N*N);
      for (let i = 0; i < N*N; i++) { eC[2*i] = E[i]; eC[2*i+1] = 0; }
      fft2d(eC, N, false);
      // 2. Residual visibilities at sampled points only
      const resVis = new Float64Array(2*N*N);
      for (let i = 0; i < N*N; i++) {
        if (mask[i]) {
          resVis[2*i]   = masked[2*i]   - eC[2*i];
          resVis[2*i+1] = masked[2*i+1] - eC[2*i+1];
        }
      }
      // 3. Chi-squared gradient: -2 * IFFT(residual_vis) [real part]
      fft2d(resVis, N, true);
      // 4+5. Total gradient = chi2_grad + entropy_grad; find max |grad| for step
      let maxAbsGrad = 0;
      const totalGrad = new Float64Array(N*N);
      for (let i = 0; i < N*N; i++) {
        const chi2g    = -2 * resVis[2*i];
        const entropg  = -ALPHA * (1 + Math.log(Math.max(E[i], EPS) / m0));
        totalGrad[i]   = chi2g + entropg;
        const ag = Math.abs(totalGrad[i]);
        if (ag > maxAbsGrad) maxAbsGrad = ag;
      }
      // 6+7. Adaptive step; update + clamp
      const step = maxAbsGrad > 0 ? 0.5 / maxAbsGrad : 0;
      for (let i = 0; i < N*N; i++) E[i] = Math.max(E[i] - step * totalGrad[i], EPS);
    }
    restoredImg = E;

  } else if (method === 'clean') {
    // Högbom CLEAN — 1000 iterations, FWHM-based restore beam, FFT convolution
    const ITERATIONS = 1000;
    const GAIN = 0.1;

    // PSF: IFFT of mask (ones where sampled)
    const psfVis = new Float64Array(2*N*N);
    for (let i = 0; i < N*N; i++) {
      psfVis[2*i]   = mask[i] ? 1 : 0;
      psfVis[2*i+1] = 0;
    }
    fft2d(psfVis, N, true);
    const psf = new Float64Array(N*N);
    for (let i = 0; i < N*N; i++) psf[i] = psfVis[2*i];
    // Normalize PSF
    let psfPeak = 0;
    for (let i = 0; i < N*N; i++) if (psf[i] > psfPeak) psfPeak = psf[i];
    if (psfPeak > 0) for (let i = 0; i < N*N; i++) psf[i] /= psfPeak;

    const residual = dirtyImg.slice();
    const model = new Float64Array(N*N);

    // Find peak amplitude for threshold
    let initPeak = 0;
    for (let i = 0; i < N*N; i++) {
      const a = Math.abs(residual[i]);
      if (a > initPeak) initPeak = a;
    }
    const stopLevel = 0.05 * initPeak;

    for (let iter = 0; iter < ITERATIONS; iter++) {
      // Find peak in residual
      let peakVal = 0, peakIdx = 0;
      for (let i = 0; i < N*N; i++) {
        const a = Math.abs(residual[i]);
        if (a > peakVal) { peakVal = a; peakIdx = i; }
      }
      if (peakVal < stopLevel) break;

      const pr = Math.floor(peakIdx / N);
      const pc = peakIdx % N;
      const comp = GAIN * residual[peakIdx];
      model[peakIdx] += comp;

      // Subtract shifted PSF from residual
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const psfR = ((r - pr) % N + N) % N;
          const psfC = ((c - pc) % N + N) % N;
          residual[r*N+c] -= comp * psf[psfR*N+psfC];
        }
      }
    }

    // Estimate restore-beam sigma from dirty-beam FWHM
    // PSF peak is at index 0 by IFFT convention; walk row 0 until below half-maximum.
    const halfMaxVal = psf[0] / 2;
    let halfWidth = 2;
    for (let j = 1; j < N / 2; j++) {
      if (psf[j] <= halfMaxVal) { halfWidth = j; break; }
    }
    const sigma = Math.max(1.5, halfWidth / 2.355);

    // Build Gaussian restore beam centered at [0][0] (periodic/IFFT convention)
    const gaussC = new Float64Array(2*N*N);
    for (let i = 0; i < N; i++) {
      const di = Math.min(i, N - i);
      for (let j = 0; j < N; j++) {
        const dj = Math.min(j, N - j);
        gaussC[2*(i*N+j)] = Math.exp(-(di*di + dj*dj) / (2 * sigma * sigma));
      }
    }
    fft2d(gaussC, N, false);

    // Build model complex array and forward FFT
    const modelC = new Float64Array(2*N*N);
    for (let i = 0; i < N*N; i++) modelC[2*i] = model[i];
    fft2d(modelC, N, false);

    // Multiply (convolution theorem)
    for (let i = 0; i < N*N; i++) {
      const re = modelC[2*i] * gaussC[2*i]   - modelC[2*i+1] * gaussC[2*i+1];
      const im = modelC[2*i] * gaussC[2*i+1] + modelC[2*i+1] * gaussC[2*i];
      modelC[2*i]   = re;
      modelC[2*i+1] = im;
    }
    fft2d(modelC, N, true);

    // Extract real part and add residuals
    restoredImg = new Float64Array(N*N);
    for (let i = 0; i < N*N; i++) restoredImg[i] = modelC[2*i] + residual[i];

  } else {
    // 'dirty' only
    restoredImg = dirtyImg.slice();
  }

  return { dirty: dirtyImg, restored: restoredImg };
}

self.onmessage = function(e) {
  const { type, id, grayscale, uvPoints, params } = e.data;
  if (type !== 'reconstruct') return;
  try {
    const { dirty, restored } = reconstruct(grayscale, uvPoints, params);
    self.postMessage(
      { type: 'result', id, dirty, restored, uvCount: uvPoints.length },
      [dirty.buffer, restored.buffer]
    );
  } catch(err) {
    self.postMessage({ type: 'error', id, message: err.message });
  }
};
