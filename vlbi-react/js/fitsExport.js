import { SKY_TARGETS } from './constants.js';

export function exportFITS(restoredData, N, controls, selectedTarget, beamDims) {
  // Peak finding — never use Math.max spread on Float64Array of N=512 (262144 elements)
  let peak = 0;
  for (let i = 0; i < restoredData.length; i++) {
    if (restoredData[i] > peak) peak = restoredData[i];
  }

  const pixScale_deg = (controls.fovMuas / 1e6) / 3600;  // μas → degrees
  const target = SKY_TARGETS[selectedTarget] ?? { ra: 0, dec: controls.declination };
  const beamMaj_deg = beamDims.sigmaU * 2.355 * pixScale_deg;
  const beamMin_deg = beamDims.sigmaV * 2.355 * pixScale_deg;

  function card(key, value, comment = '') {
    const v = typeof value === 'string'
      ? `'${value.padEnd(8)}'`
      : String(value).padStart(20);
    const line = `${key.padEnd(8)}= ${v} / ${comment}`;
    return line.padEnd(80).slice(0, 80);
  }

  const cards = [
    card('SIMPLE', 'T', 'conforms to FITS standard'),
    card('BITPIX', -32, '32-bit IEEE 754 float'),
    card('NAXIS', 2, 'number of axes'),
    card('NAXIS1', N, 'axis 1 length'),
    card('NAXIS2', N, 'axis 2 length'),
    card('BUNIT', 'JY/BEAM', 'brightness unit'),
    card('CTYPE1', 'RA---SIN', 'right ascension, sine projection'),
    card('CTYPE2', 'DEC--SIN', 'declination, sine projection'),
    card('CRPIX1', N / 2 + 0.5, 'reference pixel axis 1'),
    card('CRPIX2', N / 2 + 0.5, 'reference pixel axis 2'),
    card('CRVAL1', target.ra ?? 0, 'reference RA (deg)'),
    card('CRVAL2', target.dec ?? controls.declination, 'reference Dec (deg)'),
    card('CDELT1', -pixScale_deg, 'pixel scale axis 1 (neg: RA increases left)'),
    card('CDELT2', pixScale_deg, 'pixel scale axis 2'),
    card('CUNIT1', 'deg', ''),
    card('CUNIT2', 'deg', ''),
    card('FREQ', controls.frequency * 1e9, 'observing frequency (Hz)'),
    card('BMAJ', beamMaj_deg, 'beam major axis (deg)'),
    card('BMIN', beamMin_deg, 'beam minor axis (deg)'),
    card('BPA', 0.0, 'beam position angle (deg)'),
    card('OBJECT', selectedTarget, 'source name'),
    card('ORIGIN', 'VLBI Simulator', 'software'),
    ('END' + ' '.repeat(77)),
  ];

  // Pad header to 2880-byte blocks
  let headerStr = cards.join('');
  while (headerStr.length % 2880 !== 0) headerStr += ' ';

  // Float32 big-endian data, rows flipped (FITS row 0 = bottom of image)
  const dataSize = N * N * 4;
  const paddedSize = Math.ceil(dataSize / 2880) * 2880;
  const dataBuffer = new ArrayBuffer(paddedSize);
  const dv = new DataView(dataBuffer);
  for (let row = 0; row < N; row++) {
    const fitsRow = N - 1 - row;  // flip: FITS row 0 = bottom
    for (let col = 0; col < N; col++) {
      dv.setFloat32((fitsRow * N + col) * 4, restoredData[row * N + col], false);  // false = big-endian
    }
  }

  const headerBytes = new TextEncoder().encode(headerStr);
  const combined = new Uint8Array(headerBytes.length + paddedSize);
  combined.set(headerBytes, 0);
  combined.set(new Uint8Array(dataBuffer), headerBytes.length);

  const blob = new Blob([combined], { type: 'application/fits' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vlbi-${selectedTarget.replace(/[* ]/g, '_')}-reconstruction.fits`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
