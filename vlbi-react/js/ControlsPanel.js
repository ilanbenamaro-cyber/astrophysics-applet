import { html, useState, useEffect } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';

export function ControlsPanel({ controls, onChange, onOpenInfo }) {
  // Local text state for FOV input so the user can type freely before committing
  const [fovText, setFovText] = useState(String(controls.fovMuas));
  useEffect(() => { setFovText(String(controls.fovMuas)); }, [controls.fovMuas]);

  function commitFov() {
    const parsed = parseFloat(fovText);
    const clamped = isNaN(parsed) ? controls.fovMuas : Math.min(2000, Math.max(10, parsed));
    onChange('fovMuas', clamped);
    setFovText(String(clamped));
  }

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
    <div className="control-row">
      <div className="control-label">
        IMAGE FOV
        <${InfoTooltip} infoKey="fov" onOpen=${onOpenInfo} />
        <span className="val" style=${{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="text"
            inputMode="numeric"
            value=${fovText}
            style=${{
              width: '60px', textAlign: 'right',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', borderRadius: '4px',
              padding: '3px 6px', fontSize: 'var(--fs-sm)',
              fontFamily: 'var(--font-mono)',
            }}
            onInput=${(e) => setFovText(e.target.value)}
            onBlur=${commitFov}
            onKeyDown=${(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
            aria-label="Image field of view in microarcseconds"
          />
          <span style=${{ fontSize: 'var(--fs-sm)', textTransform: 'none' }}>μas</span>
        </span>
      </div>
    </div>

    <div className="control-row">
      <div className="control-label">
        SOURCE SIZE
        <${InfoTooltip} infoKey="sourceSize" onOpen=${onOpenInfo} />
        <span className="val">${Math.round(controls.sourceFraction * controls.fovMuas)} <span style=${{ fontSize: 'var(--fs-sm)', textTransform: 'none' }}>μas</span></span>
      </div>
      <input
        type="range"
        min="0.05"
        max="1.0"
        step="0.01"
        value=${controls.sourceFraction}
        onInput=${(e) => onChange('sourceFraction', parseFloat(e.target.value))}
        aria-label="Source angular size"
      />
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
