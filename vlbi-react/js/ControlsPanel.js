import { html } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';

export function ControlsPanel({ controls, onChange, onOpenInfo }) {
  const sliders = [
    { key: 'declination', label: 'Declination',  min: -90,  max: 90,  step: 1,   unit: '°',   infoKey: 'declination' },
    { key: 'duration',    label: 'Duration',      min: 1,    max: 24,  step: 0.5, unit: 'h',   infoKey: 'duration'    },
    { key: 'frequency',   label: 'Frequency',     min: 1,    max: 500, step: 1,   unit: ' GHz',infoKey: 'frequency'   },
    { key: 'noise',       label: 'Noise',         min: 0,    max: 1,   step: 0.01,unit: '',     infoKey: 'noise'       },
    { key: 'dishDiameter',label: 'Dish Diameter', min: 10,   max: 100, step: 5,   unit: ' m',  infoKey: 'dish'        },
  ];

  const methods = [
    { key: 'dirty', label: 'Dirty Only'  },
    { key: 'mem',   label: 'Max Entropy' },
    { key: 'clean', label: 'CLEAN'       },
  ];

  return html`<div>
    <div className="control-label" style=${{ marginBottom: '6px' }}>
      Method <${InfoTooltip} infoKey="method" onOpen=${onOpenInfo} />
    </div>
    <div className="method-row">
      ${methods.map(m => html`
        <button
          key=${m.key}
          className=${'method-btn' + (controls.method === m.key ? ' selected' : '')}
          onClick=${() => onChange('method', m.key)}
          aria-pressed=${controls.method === m.key}
        >${m.label}</button>
      `)}
    </div>
    ${sliders.map(s => html`
      <div className="control-row" key=${s.key}>
        <div className="control-label">
          ${s.label}
          <${InfoTooltip} infoKey=${s.infoKey} onOpen=${onOpenInfo} />
          <span className="val">${controls[s.key]}${s.unit}</span>
        </div>
        <input
          type="range"
          min=${s.min}
          max=${s.max}
          step=${s.step}
          value=${controls[s.key]}
          onInput=${(e) => onChange(s.key, parseFloat(e.target.value))}
          aria-label=${s.label}
        />
      </div>
    `)}
  </div>`;
}
