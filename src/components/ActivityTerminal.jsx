import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Trash2, ArrowDownCircle, FileSpreadsheet, FileJson } from 'lucide-react';
import { exportLogsToCSV, exportLogsToJSON } from '../utils/exportLogs';

const FILTERS = ['ALL', 'TX', 'RX', 'SYS', 'ERR'];
const FILTER_LABELS = { ALL: 'Semua', TX: 'TX', RX: 'RX', SYS: 'SYS', ERR: 'ERR' };

export default function ActivityTerminal({
  logs = [],
  onClearLogs
}) {
  const [filter, setFilter] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleContainerRef = useRef(null);

  useEffect(() => {
    if (autoScroll && consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => filter === 'ALL' || log.type === filter);
  const hasLogs = logs.length > 0;

  const getLogBadge = (type) => {
    switch (type) {
      case 'TX':
        return 'chip-ok';
      case 'RX':
        return 'chip-info';
      case 'SYS':
        return 'border-cyber-indigo/40 bg-cyber-indigo/10 text-cyber-indigo';
      case 'ERR':
        return 'chip-bad';
      default:
        return 'border-industrial-700 bg-industrial-800 text-slate-300';
    }
  };

  const handleClear = () => {
    if (window.confirm('Hapus seluruh log aktivitas? Tindakan ini tidak bisa dibatalkan.')) {
      onClearLogs();
    }
  };

  return (
    <section className="panel flex flex-col h-[380px] lg:h-[420px]" aria-labelledby="terminal-title">
      <div className="panel-head">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-cyber-cyan shrink-0" />
          <h2 id="terminal-title" className="panel-title truncate">Log aktivitas</h2>
          <span className="font-mono text-[10px] text-slate-400 shrink-0">{logs.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => exportLogsToCSV(logs)}
            disabled={!hasLogs}
            title="Ekspor log ke CSV"
            className="btn btn-ghost"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyber-green" />
            CSV
          </button>

          <button
            type="button"
            onClick={() => exportLogsToJSON(logs)}
            disabled={!hasLogs}
            title="Ekspor log ke JSON"
            className="btn btn-ghost"
          >
            <FileJson className="w-3.5 h-3.5 text-cyber-cyan" />
            JSON
          </button>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            aria-pressed={autoScroll}
            aria-label={autoScroll ? 'Matikan auto-scroll' : 'Aktifkan auto-scroll'}
            title={autoScroll ? 'Matikan auto-scroll' : 'Aktifkan auto-scroll'}
            className={`icon-btn ${
              autoScroll ? 'border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan' : ''
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!hasLogs}
            aria-label="Hapus seluruh log"
            title="Hapus seluruh log"
            className="icon-btn hover:border-cyber-rose/40 hover:bg-cyber-rose/10 hover:text-cyber-rose"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-industrial-850">
        <span className="text-[10px] font-mono text-slate-400 mr-1">Filter</span>
        {FILTERS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            aria-pressed={filter === tab}
            className={`tap px-2.5 py-1 min-h-[44px] sm:min-h-[32px] rounded text-[11px] font-mono transition-colors ${
              filter === tab
                ? 'bg-industrial-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {FILTER_LABELS[tab]}
          </button>
        ))}
      </div>

      <div
        ref={consoleContainerRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-1 p-2"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-1 text-center px-4">
            <p className="text-xs text-slate-300">
              {hasLogs ? 'Tidak ada log untuk filter ini.' : 'Belum ada aktivitas.'}
            </p>
            <p className="text-[11px] text-slate-400">
              {hasLogs
                ? 'Pilih filter lain untuk melihat entri lainnya.'
                : 'Aksi relay dan update data akan muncul di sini.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 py-1 px-2 rounded hover:bg-industrial-850/60 transition-colors"
            >
              <span className="text-slate-400 text-[10px] whitespace-nowrap pt-0.5">
                {log.timestamp}
              </span>

              <span className={`chip ${getLogBadge(log.type)} shrink-0`}>{log.type}</span>

              {log.channel && (
                <span className="text-slate-400 font-semibold text-[10px] whitespace-nowrap">
                  {log.channel}
                </span>
              )}

              <span className="text-slate-200 text-[11px] break-all flex-1 min-w-0">
                {typeof log.payload === 'object' ? JSON.stringify(log.payload) : String(log.payload)}
              </span>

              {log.latencyMs !== undefined && (
                <span className="text-[10px] text-cyber-cyan whitespace-nowrap">
                  {log.latencyMs} ms
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-industrial-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Buffer 100 entri</span>
        <span>{filteredLogs.length} tampil</span>
      </div>
    </section>
  );
}
