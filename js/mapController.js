/**
 * mapController.js
 * Leaflet map for interactive telescope placement.
 * Telescopes are draggable markers; each update triggers the onChange callback.
 *
 * NOTE: removeTelescope must be a function declaration (not const/let) so it is
 * accessible on the global scope from Leaflet popup inline onclick handlers.
 */

// Approximate positions of real EHT array sites used as default presets.
const PRESET_TELESCOPES = [
    { name: 'ALMA',     lat: -23.029, lon:  -67.755 },
    { name: 'IRAM 30m', lat:  37.066, lon:   -3.392 },
    { name: 'SMA',      lat:  19.824, lon: -155.478 },
    { name: 'SPT',      lat: -89.991, lon:  -44.650 },
    { name: 'JCMT',     lat:  19.822, lon: -155.477 },
    { name: 'LMT',      lat:  18.986, lon:  -97.315 },
];

let map             = null;
let telescopes      = [];   // { id, lat, lon, name, marker }
let nextId          = 0;
let onChangeCallback = null;

/**
 * Initialize the Leaflet map inside the element with the given ID.
 * Clicking the map adds a new telescope at the clicked location.
 * @param {string} divId
 * @param {function} onChange - called with [{lat, lon, name}] whenever the list changes
 */
function initMap(divId, onChange) {
    onChangeCallback = onChange;

    map = L.map(divId, { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 6,
    }).addTo(map);

    map.on('click', (e) => {
        addTelescope(e.latlng.lat, e.latlng.lng, 'Custom');
    });
}

/**
 * Add a telescope marker at the given coordinates.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [name]
 */
function addTelescope(lat, lon, name) {
    const id     = nextId++;
    const label  = name || 'Telescope';
    const marker = L.marker([lat, lon], { draggable: true }).addTo(map);

    marker.bindPopup(
        `<b>${label}</b><br>${lat.toFixed(2)}°, ${lon.toFixed(2)}°` +
        `<br><button onclick="removeTelescope(${id})" style="margin-top:6px;cursor:pointer">Remove</button>`
    );

    marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const tel = telescopes.find(t => t.id === id);
        if (tel) { tel.lat = pos.lat; tel.lon = pos.lng; }
        if (onChangeCallback) onChangeCallback(getTelescopes());
    });

    telescopes.push({ id, lat, lon, name: label, marker });
    if (onChangeCallback) onChangeCallback(getTelescopes());
}

/**
 * Remove the telescope with the given ID and trigger onChange.
 * Declared as a function (not const) for global scope accessibility from popup onclick.
 * @param {number} id
 */
function removeTelescope(id) {
    const idx = telescopes.findIndex(t => t.id === id);
    if (idx === -1) return;
    map.removeLayer(telescopes[idx].marker);
    telescopes.splice(idx, 1);
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
 * Remove all telescope markers.
 */
function clearTelescopes() {
    telescopes.forEach(t => map.removeLayer(t.marker));
    telescopes = [];
    if (onChangeCallback) onChangeCallback([]);
}

/**
 * Return the current telescope positions.
 * @returns {Array<{lat: number, lon: number, name: string}>}
 */
function getTelescopes() {
    return telescopes.map(({ lat, lon, name }) => ({ lat, lon, name }));
}
