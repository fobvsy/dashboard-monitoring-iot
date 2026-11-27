import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';

function ArcGauge({
  value = 0,
  min = 0,
  max = 100,
  unit = '',
  title = 'Sensor',
  warn = 60,
  crit = 85,
  id = 'gauge-1',
  onUpdateCfg
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(title);
  const [unitInput, setUnitInput] = useState(unit);
  const [maxInput, setMaxInput] = useState(max);

  const numericVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const clampedVal = Math.min(Math.max(numericVal, min), max);
  const percent = max > min ? (clampedVal - min) / (max - min) : 0;

  const radius = 70;
  const halfCircumference = Math.PI * radius;
  const strokeDashoffset = halfCircumference * (1 - percent);

  let strokeColor = 'var(--signal-green)';
  let status = { label: 'Normal', className: 'chip-ok' };

  if (numericVal >= crit) {
    strokeColor = 'var(--signal-rose)';
    status = { label: 'Kritis', className: 'chip-bad' };
  } else if (numericVal >= warn) {
    strokeColor = 'var(--signal-amber)';
    status = { label: 'Waspada', className: 'chip-warn' };
  }

  const handleSave = () => {
    onUpdateCfg({
      name: nameInput.trim() || title,
      unit: unitInput.trim() || unit,
      max: Number(maxInput) || max
    });
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border border-industrial-800/70 bg-industrial-950/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] text-slate-400 shrink-0">{id}</span>
          <span className="text-xs font-medium text-slate-200 truncate" title={title}>{title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className={`chip ${status.className}`}>{status.label}</span>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            aria-expanded={isEditing}
            aria-label={`Pengaturan ${title}`}
            className="tap p-1.5 -m-1 rounded text-slate-400 hover:text-cyber-cyan"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center mt-2">
        <svg
          viewBox="0 0 180 110"
          role="img"
          aria-label={`${title}: ${numericVal.toFixed(1)} ${unit}, ${Math.round(percent * 100)} persen dari batas`}
          className="w-full max-w-[200px] h-24"
        >
          <path
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none"
            stroke="var(--chart-grid)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={halfCircumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute bottom-0 flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {numericVal.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">{unit}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {Math.round(percent * 100)}% rentang
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 mt-1 border-t border-industrial-850">
        <span>MIN {min}</span>
        <span>MAX {max} {unit}</span>
      </div>

      {isEditing && (
        <div className="mt-2 p-2.5 rounded-md bg-industrial-900/70 backdrop-blur-md border border-industrial-700 space-y-2">
          <div>
            <label htmlFor={`${id}-name`} className="field-label">Nama label</label>
            <input
              id={`${id}-name`}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="field"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${id}-unit`} className="field-label">Satuan</label>
              <input
                id={`${id}-unit`}
                type="text"
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor={`${id}-max`} className="field-label">Batas max</label>
              <input
                id={`${id}-max`}
                type="number"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                className="field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-0.5">
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost">
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn border-cyber-green/40 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20"
            >
              Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelBar({ id, name, unit, value, color }) {
  const clamped = Math.min(Math.max(Number(value) || 0, 0), 100);

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] text-slate-400 shrink-0">{id}</span>
          <span className="text-slate-200 truncate">{name}</span>
        </div>
        <span className={`font-mono font-semibold shrink-0 ${color.text}`}>
          {clamped.toFixed(0)} {unit}
        </span>
      </div>
      <div
        className="h-2.5 w-full bg-industrial-950/60 rounded-full border border-industrial-800/70 overflow-hidden"
        role="progressbar"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color.bar}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalogTelemetry({
  gauge1Val,
  gauge2Val,
  hlevel1Val,
  hlevel2Val,
  gaugeCfgs,
  hlevelCfgs,
  onUpdateGaugeCfg
}) {
  return (
    <section className="panel" aria-labelledby="analog-title">
      <div className="panel-head">
        <h2 id="analog-title" className="panel-title">Telemetri analog</h2>
        <span className="panel-meta">2 gauge · 2 level</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3">
        <ArcGauge
          id="gauge1"
          value={gauge1Val}
          min={gaugeCfgs.gauge1.min}
          max={gaugeCfgs.gauge1.max}
          unit={gaugeCfgs.gauge1.unit}
          title={gaugeCfgs.gauge1.name || 'Gauge 1'}
          warn={gaugeCfgs.gauge1.warn}
          crit={gaugeCfgs.gauge1.crit}
          onUpdateCfg={(cfg) => onUpdateGaugeCfg('gauge1', cfg)}
        />
        <ArcGauge
          id="gauge2"
          value={gauge2Val}
          min={gaugeCfgs.gauge2.min}
          max={gaugeCfgs.gauge2.max}
          unit={gaugeCfgs.gauge2.unit}
          title={gaugeCfgs.gauge2.name || 'Gauge 2'}
          warn={gaugeCfgs.gauge2.warn}
          crit={gaugeCfgs.gauge2.crit}
          onUpdateCfg={(cfg) => onUpdateGaugeCfg('gauge2', cfg)}
        />
      </div>

      <div className="px-3 pb-3 space-y-3">
        <LevelBar
          id="hlevel1"
          name={hlevelCfgs.hlevel1?.name || 'Level Bar 1'}
          unit={hlevelCfgs.hlevel1?.unit || '%'}
          value={hlevel1Val}
          color={{ text: 'text-cyber-cyan', bar: 'bg-cyber-cyan' }}
        />
        <LevelBar
          id="hlevel2"
          name={hlevelCfgs.hlevel2?.name || 'Level Bar 2'}
          unit={hlevelCfgs.hlevel2?.unit || '%'}
          value={hlevel2Val}
          color={{ text: 'text-cyber-green', bar: 'bg-cyber-green' }}
        />
      </div>
    </section>
  );
}
