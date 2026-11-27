import React, { useState } from 'react';
import { Edit2, Check } from 'lucide-react';

const INACTIVE_VALUES = ['', '0', 'false', 'low', 'off', '-'];

export default function DigitalSensors({
  indicators,
  labels,
  onUpdateLabel
}) {
  const [editingKey, setEditingKey] = useState(null);
  const [tempLabel, setTempLabel] = useState('');

  const handleStartEdit = (key, currentLabel, e) => {
    e.stopPropagation();
    setEditingKey(key);
    setTempLabel(currentLabel);
  };

  const handleSaveEdit = (key, e) => {
    e.stopPropagation();
    if (tempLabel.trim()) {
      onUpdateLabel(key, tempLabel.trim());
    }
    setEditingKey(null);
  };

  const isSignalActive = (rawVal) => {
    if (rawVal === undefined || rawVal === null || rawVal === false || rawVal === 0) return false;
    return !INACTIVE_VALUES.includes(String(rawVal).trim().toLowerCase());
  };

  const activeCount = [1, 2, 3, 4, 5, 6, 7, 8].filter((num) =>
    isSignalActive(indicators[`indicator${num}`])
  ).length;

  return (
    <section className="panel" aria-labelledby="digital-title">
      <div className="panel-head">
        <h2 id="digital-title" className="panel-title">Input digital</h2>
        <span className="panel-meta">{activeCount} aktif dari 8</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
          const key = `indicator${num}`;
          const rawVal = indicators[key];
          const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '—';
          const isActive = isSignalActive(rawVal);
          const currentLabel = labels[key] || `Indikator ${num}`;
          const isEditing = editingKey === key;

          return (
            <div
              key={key}
              className={`rounded-lg border p-3 transition-colors ${
                isActive
                  ? 'bg-cyber-cyan/[0.10] border-cyber-cyan/40'
                  : 'bg-industrial-950/50 border-industrial-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="font-mono text-[11px] font-semibold text-slate-200 whitespace-nowrap">
                    IN-0{num}
                  </span>
                  <span className="hidden min-[360px]:inline font-mono text-[10px] text-slate-400 truncate">{key}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`font-mono text-[11px] font-semibold ${
                      isActive ? 'text-cyber-cyan' : 'text-slate-400'
                    }`}
                    title={displayVal}
                  >
                    {displayVal.length > 6 ? `${displayVal.slice(0, 6)}…` : displayVal}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${
                      isActive ? 'bg-cyber-cyan' : 'bg-industrial-700 border border-industrial-600'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-1">
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={tempLabel}
                      onChange={(e) => setTempLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(key, e);
                        if (e.key === 'Escape') setEditingKey(null);
                      }}
                      aria-label={`Nama ${key}`}
                      autoFocus
                      className="w-full min-w-0 text-xs bg-industrial-900/70 border border-cyber-cyan rounded px-2 py-1 text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSaveEdit(key, e)}
                      aria-label="Simpan nama"
                      className="p-1.5 rounded bg-cyber-cyan text-industrial-950 hover:brightness-110 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-medium text-slate-100 line-clamp-2 leading-snug min-w-0">
                      {currentLabel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(key, currentLabel, e)}
                      aria-label={`Ubah nama ${currentLabel}`}
                      className="tap p-1.5 -m-1 rounded text-slate-400 hover:text-cyber-cyan shrink-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
