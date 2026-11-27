import React, { useEffect, useRef, useState } from 'react';
import { X, Database, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ConfigModal({
  onClose,
  config,
  onSaveConfig
}) {
  const [databaseURL, setDatabaseURL] = useState(config.databaseURL || '');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [devicePrefix, setDevicePrefix] = useState(config.devicePrefix || 'device-01');
  const [projectId, setProjectId] = useState(config.projectId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const firstFieldRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    firstFieldRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      clearTimeout(closeTimer.current);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig({
      databaseURL: databaseURL.trim(),
      apiKey: apiKey.trim(),
      devicePrefix: devicePrefix.trim(),
      projectId: projectId.trim()
    });
    setSavedSuccess(true);
    closeTimer.current = setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleReset = () => {
    setDatabaseURL('');
    setApiKey('');
    setDevicePrefix('device-01');
    setProjectId('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-title"
        className="bg-industrial-900 border border-industrial-700 w-full max-w-xl max-h-[90vh] rounded-lg shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-industrial-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-md bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="config-title" className="text-sm font-semibold text-slate-100">
                Koneksi Firebase
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Realtime Database untuk data live
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="icon-btn shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="cfg-url" className="field-label">
              Database URL <span className="text-cyber-rose">*</span>
            </label>
            <input
              id="cfg-url"
              ref={firstFieldRef}
              type="url"
              required
              placeholder="https://proyek-anda-default-rtdb.firebaseio.com"
              value={databaseURL}
              onChange={(e) => setDatabaseURL(e.target.value)}
              className="field"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Salin dari Firebase Console, Realtime Database, bagian atas halaman.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-prefix" className="field-label">Device / user prefix</label>
              <input
                id="cfg-prefix"
                type="text"
                placeholder="lab-iot-01"
                value={devicePrefix}
                onChange={(e) => setDevicePrefix(e.target.value)}
                className="field"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Path root: /{devicePrefix || 'root'}
              </p>
            </div>

            <div>
              <label htmlFor="cfg-project" className="field-label">
                Project ID <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                id="cfg-project"
                type="text"
                placeholder="proyek-anda"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cfg-key" className="field-label">
              Web API key <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              id="cfg-key"
              type="text"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="field"
            />
          </div>

          <div className="bg-industrial-950 border border-industrial-800 rounded-md p-3.5">
            <div className="flex items-center gap-1.5 text-cyber-amber font-mono text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Rules terbuka hanya untuk pengujian
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] mt-1.5">
              Aturan <code className="text-slate-200">.read: true</code> dan{' '}
              <code className="text-slate-200">.write: true</code> membuat siapa pun bisa
              mengubah relay. Pakai hanya di lab atau jaringan lokal. Untuk produksi, aktifkan
              Firebase Auth dan batasi rules per path.
            </p>
            <pre className="mt-2 p-2 rounded bg-industrial-900 border border-industrial-800 text-[10px] font-mono text-cyber-green overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
            </pre>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-industrial-800">
            <button type="button" onClick={handleReset} className="btn btn-ghost">
              Reset form
            </button>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Batal
              </button>
              <button
                type="submit"
                aria-live="polite"
                className={`btn ${
                  savedSuccess
                    ? 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green'
                    : 'btn-primary'
                }`}
              >
                {savedSuccess && <CheckCircle className="w-4 h-4" />}
                {savedSuccess ? 'Tersimpan' : 'Simpan & hubungkan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
