import React, { useState } from 'react';
import { Edit2, Check } from 'lucide-react';

export default function RelayRack({
  switches,
  labels,
  onToggleSwitch,
  onBatchAction,
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

  const activeCount = Object.values(switches).filter(Boolean).length;

  return (
    <section className="panel" aria-labelledby="relay-title">
      <div className="panel-head">
        <div className="min-w-0">
          <h2 id="relay-title" className="panel-title">Bank relay</h2>
          <p className="panel-meta mt-0.5">{activeCount} dari 8 kanal aktif</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onBatchAction('all_on')}
            className="btn border-cyber-green/40 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20"
          >
            Semua ON
          </button>
          <button type="button" onClick={() => onBatchAction('all_off')} className="btn btn-ghost">
            Semua OFF
          </button>
          <button type="button" onClick={() => onBatchAction('invert')} className="btn btn-ghost">
            Balik
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
          const key = `switch${num}`;
          const isClosed = Boolean(switches[key]);
          const currentLabel = labels[key] || `Sakelar ${num}`;
          const isEditing = editingKey === key;

          return (
            <div
              key={key}
              onClick={() => onToggleSwitch(key, !isClosed)}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                isClosed
                  ? 'bg-cyber-green/[0.06] border-cyber-green/40'
                  : 'bg-industrial-950 border-industrial-800 hover:border-industrial-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="font-mono text-[11px] font-semibold text-slate-200 whitespace-nowrap">
                    CH-0{num}
                  </span>
                  <span className="hidden min-[360px]:inline font-mono text-[10px] text-slate-400 truncate">{key}</span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isClosed}
                  aria-label={`${currentLabel}: ${isClosed ? 'aktif' : 'mati'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSwitch(key, !isClosed);
                  }}
                  className="tap shrink-0 rounded-md p-2 -m-2"
                >
                  <span
                    className={`relative flex h-6 w-11 items-center rounded-full border transition-colors ${
                      isClosed
                        ? 'bg-cyber-green border-cyber-green'
                        : 'bg-industrial-800 border-industrial-600'
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white ring-1 ring-industrial-950/20 transition-transform ${
                        isClosed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-1">
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
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
                      className="w-full min-w-0 text-xs bg-industrial-900 border border-cyber-cyan rounded px-2 py-1 text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSaveEdit(key, e)}
                      aria-label="Simpan nama"
                      className="p-1.5 rounded bg-cyber-green text-industrial-950 hover:brightness-110 shrink-0"
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

              <p
                className={`mt-1 font-mono text-[10px] ${
                  isClosed ? 'text-cyber-green' : 'text-slate-400'
                }`}
              >
                {isClosed ? 'Aktif' : 'Mati'}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
