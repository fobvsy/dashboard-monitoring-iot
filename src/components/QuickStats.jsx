import React from 'react';

function thresholdStatus(val, warn, crit) {
  if (val >= crit) return { label: 'Kritis', className: 'chip-bad' };
  if (val >= warn) return { label: 'Waspada', className: 'chip-warn' };
  return { label: 'Normal', className: 'chip-ok' };
}

function formatValue(val) {
  return typeof val === 'number' ? val.toFixed(1) : val;
}

export default function QuickStats({
  activeRelayCount,
  gauge1Val,
  gauge1Cfg,
  gauge2Val,
  gauge2Cfg,
  logCount
}) {
  const g1Status = thresholdStatus(gauge1Val, gauge1Cfg.warn, gauge1Cfg.crit);
  const g2Status = thresholdStatus(gauge2Val, gauge2Cfg.warn, gauge2Cfg.crit);

  return (
    <section
      aria-label="Ringkasan status"
      className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-xl border border-industrial-800/80 bg-industrial-800/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Relay count */}
      <div className="bg-industrial-900/60 px-4 py-3 min-w-0">
        <p className="text-[11px] text-slate-400">Relay aktif</p>
        <p className="mt-1 font-mono text-xl text-slate-100">
          {activeRelayCount}
          <span className="text-xs text-slate-400"> / 8</span>
        </p>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-sm ${
                i < activeRelayCount ? 'bg-cyber-green' : 'bg-industrial-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Gauge 1 */}
      <div className="bg-industrial-900/60 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] text-slate-400 truncate">{gauge1Cfg?.name || 'Gauge 1'}</p>
          <span className={`chip ${g1Status.className} shrink-0`}>{g1Status.label}</span>
        </div>
        <p className="mt-1 font-mono text-xl text-cyber-cyan truncate">
          {formatValue(gauge1Val)}
          <span className="text-xs text-slate-400"> {gauge1Cfg?.unit || ''}</span>
        </p>
        <p className="mt-1 text-[10px] font-mono text-slate-400">
          {gauge1Cfg?.min ?? 0}–{gauge1Cfg?.max ?? 100} · waspada ≥ {gauge1Cfg?.warn ?? 70}
        </p>
      </div>

      {/* Gauge 2 */}
      <div className="bg-industrial-900/60 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] text-slate-400 truncate">{gauge2Cfg?.name || 'Gauge 2'}</p>
          <span className={`chip ${g2Status.className} shrink-0`}>{g2Status.label}</span>
        </div>
        <p className="mt-1 font-mono text-xl text-cyber-green truncate">
          {formatValue(gauge2Val)}
          <span className="text-xs text-slate-400"> {gauge2Cfg?.unit || ''}</span>
        </p>
        <p className="mt-1 text-[10px] font-mono text-slate-400">
          {gauge2Cfg?.min ?? 0}–{gauge2Cfg?.max ?? 100} · kritis ≥ {gauge2Cfg?.crit ?? 90}
        </p>
      </div>

      {/* Log buffer */}
      <div className="bg-industrial-900/60 px-4 py-3 min-w-0">
        <p className="text-[11px] text-slate-400">Log aktivitas</p>
        <p className="mt-1 font-mono text-xl text-slate-100">
          {logCount}
          <span className="text-xs text-slate-400"> / 100</span>
        </p>
        <p className="mt-1 text-[10px] font-mono text-slate-400">Buffer berjalan</p>
      </div>
    </section>
  );
}
