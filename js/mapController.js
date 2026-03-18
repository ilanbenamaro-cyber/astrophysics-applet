/**
 * mapController.js
 * Globe.gl 3D Earth for interactive telescope placement.
 * Click globe surface to add a telescope; click an existing point to remove it.
 *
 * NOTE: removeTelescope must remain a function declaration (not const/let) so it is
 * hoisted and callable from Globe.gl's onPointClick callback without ordering issues.
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

let globe            = null;
let telescopes       = [];   // { id, lat, lon, name, color }
let nextId           = 0;
let onChangeCallback = null;

/**
 * Initialize the Globe.gl 3D Earth inside the element with the given ID.
 * @param {string} divId
 * @param {function} onChange - called with [{lat, lon, name, color}] on every change
 */
function initGlobe(divId, onChange) {
    onChangeCallback = onChange;
    const el = document.getElementById(divId);

    globe = Globe()(el)
        .globeImageUrl('https://unpkg.com/globe.gl/example/img/earth-blue-marble.jpg')
        .backgroundColor('#08081a')
        .pointsData(telescopes)
        .pointLat(d => d.lat)
        .pointLng(d => d.lon)
        .pointColor(d => d.color)
        .pointRadius(0.6)
        .pointAltitude(0.01)
        .pointLabel(d => `<b>${d.name}</b><br>${d.lat.toFixed(2)}°, ${d.lon.toFixed(2)}°`)
        .onGlobeClick(({ lat, lng }) => addTelescope(lat, lng, 'Custom'))
        .onPointClick(point => removeTelescope(point.id));
}

/**
 * Add a telescope at the given coordinates with an auto-assigned color.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [name]
 */
function addTelescope(lat, lon, name) {
    const id    = nextId++;
    const label = name || 'Telescope';
    const color = TELESCOPE_COLORS[id % TELESCOPE_COLORS.length];
    telescopes.push({ id, lat, lon, name: label, color });
    _refreshGlobe();
    if (onChangeCallback) onChangeCallback(getTelescopes());
}

/**
 * Remove the telescope with the given ID.
 * Declared as a function declaration (not const) for hoisting.
 * @param {number} id
 */
function removeTelescope(id) {
    const idx = telescopes.findIndex(t => t.id === id);
    if (idx === -1) return;
    telescopes.splice(idx, 1);
    _refreshGlobe();
    if (onChangeCallback) onChangeCallback(getTelescopes());
}

/**
 * Replace current telescope set with the EHT preset locations.
 */
function loadPresets() {
    clearTelescopes();
    PRESET_TELESCOPES.forEach(({ name, lat, lon }) => addTelescope(lat, lon, name));
}

/**
 * Remove all telescopes from the globe.
 */
function clearTelescopes() {
    telescopes = [];
    _refreshGlobe();
    if (onChangeCallback) onChangeCallback([]);
}

/**
 * Return the current telescope positions (without internal marker references).
 * @returns {Array<{lat: number, lon: number, name: string, color: string}>}
 */
function getTelescopes() {
    return telescopes.map(({ lat, lon, name, color }) => ({ lat, lon, name, color }));
}

/** Push current telescope array to Globe.gl to trigger re-render. */
function _refreshGlobe() {
    if (globe) globe.pointsData([...telescopes]);
}
