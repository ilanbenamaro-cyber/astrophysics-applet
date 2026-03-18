/**
 * interferometry.js
 * Computes UV-plane coverage from telescope geographic positions.
 *
 * Physics model:
 *   - Each pair of telescopes forms a baseline vector (ECEF km).
 *   - As Earth rotates, each baseline traces an arc in the UV-plane (Fourier space of sky).
 *   - UV coordinates are normalized so Earth's diameter maps to the image's Nyquist frequency.
 *
 * Standard radio astronomy UV formula (Thompson, Moran & Swenson):
 *   u = sin(H)·Bx + cos(H)·By
 *   v = −sin(δ)·cos(H)·Bx + sin(δ)·sin(H)·By + cos(δ)·Bz
 * where H = hour angle, δ = source declination, (Bx,By,Bz) = baseline in ECEF km.
 */

/**
 * Linear interpolation between two hex color strings at parameter t ∈ [0,1].
 * @param {string} hex1 - e.g. '#ff6b6b'
 * @param {string} hex2
 * @param {number} t
 * @returns {string} blended hex color
 */
function _lerpColor(hex1, hex2, t) {
    const parse = h => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
    ];
    const [r1, g1, b1] = parse(hex1);
    const [r2, g2, b2] = parse(hex2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Convert geographic coordinates to ECEF (km).
 * @param {number} latDeg - latitude in degrees
 * @param {number} lonDeg - longitude in degrees
 * @returns {{x: number, y: number, z: number}}
 */
function latLonToECEF(latDeg, lonDeg) {
    const lat = latDeg * Math.PI / 180;
    const lon = lonDeg * Math.PI / 180;
    return {
        x: EARTH_RADIUS_KM * Math.cos(lat) * Math.cos(lon),
        y: EARTH_RADIUS_KM * Math.cos(lat) * Math.sin(lon),
        z: EARTH_RADIUS_KM * Math.sin(lat),
    };
}

/**
 * Compute the baseline vector (ECEF km) between two telescopes.
 * @param {{lat: number, lon: number}} tel1
 * @param {{lat: number, lon: number}} tel2
 * @returns {{bx: number, by: number, bz: number}}
 */
function computeBaseline(tel1, tel2) {
    const p1 = latLonToECEF(tel1.lat, tel1.lon);
    const p2 = latLonToECEF(tel2.lat, tel2.lon);
    return { bx: p2.x - p1.x, by: p2.y - p1.y, bz: p2.z - p1.z };
}

/**
 * Convert a baseline vector to (u, v) coordinates at a given hour angle and declination.
 * Result is in km (same units as the baseline).
 * @param {{bx: number, by: number, bz: number}} baseline
 * @param {number} hourAngle - in radians
 * @param {number} declinationDeg - source declination in degrees
 * @returns {{u: number, v: number}}
 */
function baselineToUV(baseline, hourAngle, declinationDeg) {
    const { bx, by, bz } = baseline;
    const H = hourAngle;
    const d = declinationDeg * Math.PI / 180;
    const u = Math.sin(H) * bx + Math.cos(H) * by;
    const v = -Math.sin(d) * Math.cos(H) * bx
             + Math.sin(d) * Math.sin(H) * by
             + Math.cos(d) * bz;
    return { u, v };
}

/**
 * Compute all UV sample points for a telescope array over an observation window.
 *
 * Both (u,v) and (-u,-v) are included to maintain conjugate symmetry of the FFT,
 * which is required for the reconstructed image to be real-valued.
 *
 * UV coordinates are normalized to image pixel space:
 *   pixel = round(km × (N/2) / (2 × R_earth))
 * so the maximum possible baseline (Earth diameter) spans ±N/2 pixels.
 *
 * @param {Array<{lat: number, lon: number}>} telescopes
 * @param {number} declinationDeg - source declination
 * @param {number} hourAngleRangeDeg - total synthesis window (e.g. 180 = ±90°)
 * @param {number} steps - number of Earth-rotation steps within the window
 * @param {number} imageSize - N (FFT array size; UV values clipped to ±N/2)
 * @returns {Array<{u: number, v: number}>} UV samples in pixel coordinates
 */
function computeUVCoverage(telescopes, declinationDeg, hourAngleRangeDeg, steps, imageSize) {
    if (telescopes.length < 2) return [];

    const haRange = hourAngleRangeDeg * Math.PI / 180;
    const haStart = -haRange / 2;
    const haStep  = steps > 0 ? haRange / steps : 0;

    // Normalization: Earth diameter → N pixels
    const maxBaselineKm = EARTH_RADIUS_KM * 2;
    const scale = (imageSize / 2) / maxBaselineKm;

    const half = imageSize / 2;
    const points = [];

    for (let s = 0; s <= steps; s++) {
        const H = haStart + s * haStep;
        for (let i = 0; i < telescopes.length; i++) {
            for (let j = i + 1; j < telescopes.length; j++) {
                // Blend the two telescope colors at the midpoint of this baseline
                const color = _lerpColor(
                    telescopes[i].color || '#00aaff',
                    telescopes[j].color || '#00aaff',
                    0.5
                );
                const baseline = computeBaseline(telescopes[i], telescopes[j]);
                const { u, v } = baselineToUV(baseline, H, declinationDeg);
                const up = Math.round(u * scale);
                const vp = Math.round(v * scale);
                if (Math.abs(up) < half && Math.abs(vp) < half) {
                    points.push({ u: up, v: vp, color });
                    points.push({ u: -up, v: -vp, color });
                }
            }
        }
    }
    return points;
}
