/**
 * mapController.js
 * Flat 2D world map (equirectangular projection) for interactive telescope placement.
 * Uses Canvas 2D API only — zero external dependencies.
 *
 * Projection:
 *   x = (lon + 180) / 360 * width
 *   y = (90 - lat) / 180 * height
 *
 * NOTE: removeTelescope must remain a function declaration (not const/let) so it is
 * hoisted and reachable from any callback without ordering issues.
 */

const TELESCOPE_COLORS = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b',
    '#cc5de8', '#20c997', '#f06595', '#74c0fc', '#a9e34b',
];

const PRESET_TELESCOPES = [
    { name: 'ALMA',     lat: -23.029, lon:  -67.755 },
    { name: 'IRAM 30m', lat:  37.066, lon:   -3.392 },
    { name: 'SMA',      lat:  19.824, lon: -155.478 },
    { name: 'SPT',      lat: -89.991, lon:  -44.650 },
    { name: 'JCMT',     lat:  19.822, lon: -155.477 },
    { name: 'LMT',      lat:  18.986, lon:  -97.315 },
];

const MAP_HEIGHT  = 280;   // canvas pixel height
const DOT_RADIUS  = 6;     // telescope dot radius (px)
const HIT_RADIUS  = 14;    // click/hover detection radius (px)

let mapCanvas        = null;
let earthImg         = null;
let telescopes       = [];
let nextId           = 0;
let hoveredId        = null;
let onChangeCallback = null;
let onRejectCallback = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialize the flat world map inside the element with the given ID.
 * @param {string} divId
 * @param {function} onChange  - called with [{lat, lon, name, color}] on every change
 * @param {function} [onReject] - called (no args) when a click is rejected (ocean click)
 */
function initGlobe(divId, onChange, onReject) {
    onChangeCallback = onChange;
    onRejectCallback = onReject || null;

    const container = document.getElementById(divId);
    mapCanvas = document.createElement('canvas');
    mapCanvas.style.display = 'block';
    mapCanvas.style.width   = '100%';
    mapCanvas.style.cursor  = 'crosshair';
    container.appendChild(mapCanvas);

    _resizeCanvas();

    // Resize observer keeps canvas crisp when the panel resizes
    if (window.ResizeObserver) {
        new ResizeObserver(_resizeCanvas).observe(container);
    } else {
        window.addEventListener('resize', _resizeCanvas);
    }

    // Load Blue Marble texture; fall back to a drawn grid if it fails
    earthImg = new Image();
    earthImg.onload  = _render;
    earthImg.onerror = _render;
    earthImg.src = 'https://unpkg.com/globe.gl/example/img/earth-blue-marble.jpg';

    mapCanvas.addEventListener('click',      _onClick);
    mapCanvas.addEventListener('mousemove',  _onHover);
    mapCanvas.addEventListener('mouseleave', _onLeave);

    _render();
}

/**
 * Add a telescope at the given lat/lon.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [name]
 */
function addTelescope(lat, lon, name) {
    const id    = nextId++;
    const label = name || 'Telescope';
    const color = TELESCOPE_COLORS[id % TELESCOPE_COLORS.length];
    telescopes.push({ id, lat, lon, name: label, color });
    _render();
    if (onChangeCallback) onChangeCallback(getTelescopes());
}

/**
 * Remove the telescope with the given ID.
 * Declared as function declaration for hoisting.
 * @param {number} id
 */
function removeTelescope(id) {
    const idx = telescopes.findIndex(t => t.id === id);
    if (idx === -1) return;
    telescopes.splice(idx, 1);
    if (hoveredId === id) hoveredId = null;
    _render();
    if (onChangeCallback) onChangeCallback(getTelescopes());
}

/** Load the EHT preset array. */
function loadPresets() {
    clearTelescopes();
    PRESET_TELESCOPES.forEach(({ name, lat, lon }) => addTelescope(lat, lon, name));
}

/** Remove all telescopes. */
function clearTelescopes() {
    telescopes = [];
    hoveredId  = null;
    _render();
    if (onChangeCallback) onChangeCallback([]);
}

/**
 * Return the current telescope list (without internal ID).
 * @returns {Array<{lat, lon, name, color}>}
 */
function getTelescopes() {
    return telescopes.map(({ lat, lon, name, color }) => ({ lat, lon, name, color }));
}

// ── Internal helpers ──────────────────────────────────────────────────────────

// _isLand(lat, lon) is provided by landMask.js (loaded before this script).
// Returns true if the coordinate is on land; used in _onClick to reject ocean clicks.

function _resizeCanvas() {
    if (!mapCanvas) return;
    const w = mapCanvas.parentElement
        ? (mapCanvas.parentElement.clientWidth || 400)
        : 400;
    if (mapCanvas.width !== w || mapCanvas.height !== MAP_HEIGHT) {
        mapCanvas.width  = w;
        mapCanvas.height = MAP_HEIGHT;
        _render();
    }
}

/** Equirectangular: lat/lon → canvas pixel. */
function _project(lat, lon) {
    const x = (lon + 180) / 360 * mapCanvas.width;
    const y = (90 - lat) / 180 * mapCanvas.height;
    return { x, y };
}

/** Equirectangular: canvas pixel → lat/lon. */
function _unproject(x, y) {
    const lon = (x / mapCanvas.width)  * 360 - 180;
    const lat = 90 - (y / mapCanvas.height) * 180;
    return { lat, lon };
}

/** Return the id of the first telescope within HIT_RADIUS of (x, y), or null. */
function _hitTest(x, y) {
    for (let i = telescopes.length - 1; i >= 0; i--) {
        const { x: tx, y: ty } = _project(telescopes[i].lat, telescopes[i].lon);
        if (Math.hypot(x - tx, y - ty) < HIT_RADIUS) return telescopes[i].id;
    }
    return null;
}

function _canvasCoords(e) {
    const rect   = mapCanvas.getBoundingClientRect();
    const scaleX = mapCanvas.width  / rect.width;
    const scaleY = mapCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top)  * scaleY,
    };
}

function _onClick(e) {
    const { x, y } = _canvasCoords(e);
    const hit = _hitTest(x, y);
    if (hit !== null) {
        removeTelescope(hit);
    } else {
        const { lat, lon } = _unproject(x, y);
        if (!_isLand(lat, lon)) {
            if (onRejectCallback) onRejectCallback();
            return;
        }
        addTelescope(lat, lon, 'Custom');
    }
}

function _onHover(e) {
    const { x, y } = _canvasCoords(e);
    const hit = _hitTest(x, y);
    if (hit !== hoveredId) {
        hoveredId = hit;
        mapCanvas.style.cursor = hit !== null ? 'pointer' : 'crosshair';
        _render();
    }
}

function _onLeave() {
    if (hoveredId !== null) {
        hoveredId = null;
        mapCanvas.style.cursor = 'crosshair';
        _render();
    }
}

/** Draw the map: background → telescopes → hover tooltip. */
function _render() {
    if (!mapCanvas) return;
    const ctx = mapCanvas.getContext('2d');
    const W = mapCanvas.width;
    const H = mapCanvas.height;

    // ── Background ──────────────────────────────────────────────
    if (earthImg && earthImg.complete && earthImg.naturalWidth > 0) {
        ctx.drawImage(earthImg, 0, 0, W, H);
        // Dark overlay for contrast
        ctx.fillStyle = 'rgba(0, 0, 24, 0.28)';
        ctx.fillRect(0, 0, W, H);
    } else {
        // Fallback: dark ocean + subtle lat/lon grid
        ctx.fillStyle = '#05101e';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(0, 80, 180, 0.18)';
        ctx.lineWidth = 0.5;
        for (let lat = -60; lat <= 60; lat += 30) {
            const y = (90 - lat) / 180 * H;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        for (let lon = -150; lon <= 150; lon += 60) {
            const x = (lon + 180) / 360 * W;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
    }

    // ── Telescope dots ──────────────────────────────────────────
    for (const t of telescopes) {
        const { x, y } = _project(t.lat, t.lon);
        const active   = t.id === hoveredId;
        const r        = active ? DOT_RADIUS + 2 : DOT_RADIUS;

        // Soft glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
        grd.addColorStop(0, t.color + '66');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Filled dot
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.6)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.font      = active ? 'bold 11px system-ui' : '11px system-ui';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur  = 3;
        ctx.fillText(t.name, x + r + 4, y + 4);
        ctx.shadowBlur  = 0;
    }

    // ── Hover tooltip ───────────────────────────────────────────
    if (hoveredId !== null) {
        const t = telescopes.find(tel => tel.id === hoveredId);
        if (t) {
            const { x, y } = _project(t.lat, t.lon);
            const text  = `${t.name} — click to remove`;
            ctx.font    = '11px system-ui';
            const tw    = ctx.measureText(text).width;
            const pad   = 7;
            const bw    = tw + pad * 2;
            const bh    = 22;
            const bx    = Math.max(2, Math.min(x - bw / 2, W - bw - 2));
            const by    = Math.max(2, y - DOT_RADIUS - bh - 6);
            ctx.fillStyle = 'rgba(0,0,0,0.82)';
            ctx.beginPath();
            ctx.rect(bx, by, bw, bh);
            ctx.fill();
            ctx.fillStyle = '#e0e0ff';
            ctx.fillText(text, bx + pad, by + bh - 6);
        }
    }
}
