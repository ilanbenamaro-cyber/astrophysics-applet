import { html, useState, useEffect } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';
import { SKY_TARGETS } from './constants.js';

export function ControlsPanel({ controls, onChange, onOpenInfo, selectedTarget = 'Custom', onTargetChange, effectiveSourceFraction }) {
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
    { key: 'declination', label: 'Declination',  min: -90,  max: 90,  step: 0.001, unit: '°',   infoKey: 'declination' },
    { key: 'duration',    label: 'Duration',      min: 1,    max: 24,  step: 0.5,   unit: 'h',   infoKey: 'duration'    },
    { key: 'frequency',   label: 'Frequency',     min: 1,    max: 500, step: 1,     unit: ' GHz',infoKey: 'frequency'   },
    { key: 'noise',       label: 'Noise',         min: 0,    max: 1,   step: 0.01,  unit: '',    infoKey: 'noise'       },
    { key: 'dishDiameter',label: 'Dish Diameter', min: 10,   max: 100, step: 5,     unit: ' m',  infoKey: 'dish'        },
  ];

  // When a named target is selected, hide the declination slider — it's set automatically
  const visibleSliders = selectedTarget !== 'Custom'
    ? sliders.filter(s => s.key !== 'declination')
    : sliders;

  const target = SKY_TARGETS[selectedTarget];

  return html`<div>
    <div className="control-row">
      <div className="control-label" style=${{ width: '100%' }}>
        Target <${InfoTooltip} infoKey="declination" onOpen=${onOpenInfo} />
      </div>
      <select
        value=${selectedTarget}
        onChange=${(e) => onTargetChange && onTargetChange(e.target.value)}
        style=${{
          width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', borderRadius: '4px',
          padding: '4px 6px', fontSize: 'var(--fs-sm)', marginBottom: '4px',
        }}
        aria-label="Sky target source"
      >
        ${Object.keys(SKY_TARGETS).map(name => html`
          <option key=${name} value=${name}>${name}</option>
        `)}
      </select>
      ${target?.description ? html`
        <div style=${{ fontSize: 'var(--fs-xs, 0.7rem)', opacity: 0.65, fontStyle: 'italic', marginBottom: '2px' }}>
          ${target.description}
        </div>
      ` : null}
      ${selectedTarget !== 'Custom' ? html`
        <div style=${{ fontSize: 'var(--fs-xs, 0.7rem)', opacity: 0.85 }}>
          Dec: ${target.dec.toFixed(3)}°
        </div>
      ` : null}
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

    ${selectedTarget === 'Custom' ? html`
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
    ` : target?.shadowUas !== null && target?.shadowUas !== undefined ? html`
      <div style=${{ fontSize: 'var(--fs-xs, 0.7rem)', opacity: 0.85, marginBottom: '4px' }}>
        Source: ${target.shadowUas} μas
        (${effectiveSourceFraction !== undefined ? (effectiveSourceFraction * 100).toFixed(1) : '—'}% of FOV)
      </div>
    ` : null}

    ${visibleSliders.map(s => html`
      <div className="control-row" key=${s.key}>
        <div className="control-label">
          ${s.label}
          <${InfoTooltip} infoKey=${s.infoKey} onOpen=${onOpenInfo} />
          <span className="val">${s.key === 'declination' ? controls[s.key].toFixed(3) : controls[s.key]}${s.unit}</span>
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
