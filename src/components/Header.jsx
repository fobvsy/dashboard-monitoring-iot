import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Cpu,
  Sliders,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  Sun,
  Moon,
  X
} from 'lucide-react';

const THEME_KEY = 'scada-theme';

function readTheme() {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function ResetConfirmDialog({ onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 scrim backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-dialog-title"
        className="bg-industrial-900/90 backdrop-blur-xl border border-industrial-700 rounded-lg shadow-xl max-w-sm w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-cyber-rose/10 border border-cyber-rose/30 text-cyber-rose shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 id="reset-dialog-title" className="text-sm font-semibold text-slate-100">
              Reset semua label?
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Nama kustom untuk sakelar, indikator, gauge, dan level bar kembali ke default.
              Konfigurasi Firebase tidak terpengaruh.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup dialog"
            className="p-1 -m-1 text-slate-400 hover:text-slate-100 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Batal
          </button>
          <button type="button" ref={confirmRef} onClick={onConfirm} className="btn btn-danger">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset label
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const STATUS_STYLES = {
  demo: { label: 'Mode simulasi', dot: 'bg-cyber-amber', chip: 'chip-warn' },
  connected: { label: 'Terhubung', dot: 'bg-cyber-green', chip: 'chip-ok' },
  connecting: { label: 'Menghubungkan', dot: 'bg-cyber-cyan animate-pulse', chip: 'chip-info' },
  error: { label: 'Gagal terhubung', dot: 'bg-cyber-rose', chip: 'chip-bad' },
  disconnected: { label: 'Terputus', dot: 'bg-cyber-rose', chip: 'chip-bad' }
};

export default function Header({
  connectionStatus,
  statusMessage,
  latency,
  isDemoMode,
  setIsDemoMode,
  onOpenConfig,
  onResetLabels,
  devicePrefix,
  onRefresh,
  activeRelayCount
}) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const closeResetDialog = useCallback(() => setShowResetDialog(false), []);
  const status = STATUS_STYLES[isDemoMode ? 'demo' : connectionStatus] || STATUS_STYLES.disconnected;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) { /* storage blocked */ }
  }, [theme]);

  return (
    <header className="border-b border-industrial-800/80 bg-industrial-950/70 backdrop-blur-xl md:sticky md:top-0 z-30">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2.5">

          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:mr-auto min-w-0">
            <div className="h-8 w-8 rounded-md bg-industrial-850/60 border border-industrial-700 grid place-items-center text-cyber-cyan shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-slate-100 truncate">
                SCADA Control
              </h1>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                /{devicePrefix || 'root'} · {activeRelayCount}/8 relay aktif
              </p>
            </div>
          </div>

          {/* Status and actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`chip ${status.chip}`}
              role="status"
              aria-live="polite"
              title={statusMessage}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </div>

            <div
              className="chip border-industrial-700 bg-industrial-850 text-slate-300"
              title={isDemoMode ? 'Latensi simulasi' : 'Latensi tulis terakhir'}
            >
              TX
              <span className="text-slate-100">{latency !== null ? `${latency} ms` : '--'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsDemoMode(!isDemoMode)}
              aria-pressed={isDemoMode}
              className={`btn ${isDemoMode ? 'btn-amber' : 'btn-ghost'}`}
              title={isDemoMode ? 'Beralih ke Firebase live' : 'Aktifkan data simulasi'}
            >
              {isDemoMode ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isDemoMode ? 'Hentikan demo' : 'Mode demo'}
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isDemoMode}
              aria-label="Muat ulang koneksi Firebase"
              title={isDemoMode ? 'Tidak tersedia di mode simulasi' : 'Muat ulang koneksi Firebase'}
              className="icon-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              className="icon-btn"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              aria-label="Reset semua label"
              className="btn border-cyber-rose/30 bg-transparent text-cyber-rose hover:bg-cyber-rose/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="sm:hidden">Reset</span>
              <span className="hidden sm:inline">Reset label</span>
            </button>

            <button type="button" onClick={onOpenConfig} className="btn btn-primary">
              <Sliders className="w-3.5 h-3.5" />
              Firebase
            </button>
          </div>

        </div>
      </div>

      {showResetDialog && (
        <ResetConfirmDialog
          onConfirm={() => {
            onResetLabels();
            closeResetDialog();
          }}
          onCancel={closeResetDialog}
        />
      )}
    </header>
  );
}
