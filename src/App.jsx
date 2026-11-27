import React, { useCallback, useRef, useState, useEffect } from 'react';
import Header from './components/Header';
import QuickStats from './components/QuickStats';
import RelayRack from './components/RelayRack';
import AnalogTelemetry from './components/AnalogTelemetry';
import TimeSeriesChart from './components/TimeSeriesChart';
import DigitalSensors from './components/DigitalSensors';
import ActivityTerminal from './components/ActivityTerminal';
import ConfigModal from './components/ConfigModal';

import {
  loadStoredConfig,
  saveStoredConfig,
  loadStoredLabels,
  saveStoredLabels,
  clearStoredLabels,
  connectFirebase,
  cleanupFirebase,
  writeSwitchState,
  writeBatchSwitches,
  DEFAULT_LABELS
} from './services/firebase';

export default function App() {
  // App Configurations & Labels
  const [config, setConfig] = useState(loadStoredConfig);
  const [labels, setLabels] = useState(loadStoredLabels);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Connection & Telemetry State
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [statusMessage, setStatusMessage] = useState('Standby');
  const [isDemoMode, setIsDemoMode] = useState(!config.databaseURL);
  const [reconnectKey, setReconnectKey] = useState(0);

  // IoT Hardware Data State
  const [switches, setSwitches] = useState({
    switch1: false, switch2: false, switch3: false, switch4: false,
    switch5: false, switch6: false, switch7: false, switch8: false
  });
  const [indicators, setIndicators] = useState({
    indicator1: 0, indicator2: 0, indicator3: 0, indicator4: 0,
    indicator5: 0, indicator6: 0, indicator7: 0, indicator8: 0
  });
  const [gauge1, setGauge1] = useState(28.4);
  const [gauge2, setGauge2] = useState(62.5);
  const [hlevel1, setHlevel1] = useState(48);
  const [hlevel2, setHlevel2] = useState(74);

  // Time Series History Buffer
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [isChartPaused, setIsChartPaused] = useState(false);

  // Activity Logs Buffer
  const [activityLogs, setActivityLogs] = useState([]);
  const demoSessionRef = useRef(false);

  const addLog = (logItem) => {
    setActivityLogs(prev => [...prev.slice(-99), logItem]);
  };

  // Connect or disconnect Firebase when config, demo mode, or reconnect changes
  useEffect(() => {
    if (isDemoMode) {
      cleanupFirebase();
      setConnectionStatus('connected');
      setStatusMessage('Simulasi aktif');
      if (!demoSessionRef.current) {
        demoSessionRef.current = true;
        addLog({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          type: 'SYS',
          channel: 'SIMULATOR',
          payload: 'Mode demo simulator aktif (data sensor acak)'
        });
      }
      return;
    }

    demoSessionRef.current = false;

    if (config.databaseURL) {
      connectFirebase(
        config,
        (data) => {
          if (!data) return;
          const newSwitches = {};
          for (let i = 1; i <= 8; i++) {
            if (data[`switch${i}`] !== undefined) {
              newSwitches[`switch${i}`] = Boolean(data[`switch${i}`]);
            }
          }
          if (Object.keys(newSwitches).length > 0) {
            setSwitches(prev => ({ ...prev, ...newSwitches }));
          }

          const newIndicators = {};
          for (let i = 1; i <= 8; i++) {
            if (data[`indicator${i}`] !== undefined) {
              newIndicators[`indicator${i}`] = data[`indicator${i}`];
            }
          }
          if (Object.keys(newIndicators).length > 0) {
            setIndicators(prev => ({ ...prev, ...newIndicators }));
          }

          if (data.gauge1 !== undefined) setGauge1(Number(data.gauge1) || 0);
          if (data.gauge2 !== undefined) setGauge2(Number(data.gauge2) || 0);
          if (data.hlevel1 !== undefined) setHlevel1(Number(data.hlevel1) || 0);
          if (data.hlevel2 !== undefined) setHlevel2(Number(data.hlevel2) || 0);
        },
        (log) => addLog(log),
        (status, msg) => {
          setConnectionStatus(status);
          setStatusMessage(msg);
        }
      );
    } else {
      setConnectionStatus('disconnected');
      setStatusMessage('Database URL belum diisi');
    }

    return () => cleanupFirebase();
  }, [config, isDemoMode, reconnectKey]);

  // Demo Mode Simulation Interval (Sine wave + smooth jitter)
  useEffect(() => {
    if (!isDemoMode) return;

    let step = 0;
    const interval = setInterval(() => {
      step += 0.15;
      const simG1 = +(28 + Math.sin(step) * 12 + (Math.random() - 0.5) * 2).toFixed(1);
      const simG2 = +(60 + Math.cos(step * 0.8) * 18 + (Math.random() - 0.5) * 3).toFixed(1);
      const simH1 = Math.round(50 + Math.sin(step * 0.5) * 35);
      const simH2 = Math.round(65 + Math.cos(step * 0.4) * 25);

      setGauge1(simG1);
      setGauge2(simG2);
      setHlevel1(simH1);
      setHlevel2(simH2);

      if (Math.random() > 0.8) {
        const randomSensorIdx = Math.floor(Math.random() * 8) + 1;
        setIndicators(prev => ({
          ...prev,
          [`indicator${randomSensorIdx}`]: prev[`indicator${randomSensorIdx}`] === 1 ? 0 : 1
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  // Record Time Series Data Buffer
  useEffect(() => {
    if (isChartPaused) return;

    setTimeSeriesData(prev => {
      const point = {
        timestamp: new Date().toLocaleTimeString(),
        g1: gauge1,
        g2: gauge2
      };
      const last = prev[prev.length - 1];
      if (last && last.g1 === point.g1 && last.g2 === point.g2 && last.timestamp === point.timestamp) {
        return prev;
      }
      return [...prev.slice(-99), point];
    });
  }, [gauge1, gauge2, isChartPaused]);

  // Switch Toggle Handler
  const handleToggleSwitch = async (key, newState) => {
    if (!isDemoMode && !config.databaseURL) {
      addLog({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERR',
        channel: key.toUpperCase(),
        payload: 'Tidak ada koneksi Firebase. Isi Database URL terlebih dahulu.'
      });
      return;
    }

    setSwitches(prev => ({ ...prev, [key]: newState }));

    if (isDemoMode) {
      addLog({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'TX',
        channel: key.toUpperCase(),
        payload: `[DEMO] Relay disetel ${newState ? 'ON (tertutup)' : 'OFF (terbuka)'}`,
        latencyMs: 8
      });
      return;
    }

    const ok = await writeSwitchState(config, key, newState, addLog);
    if (!ok) {
      setSwitches(prev => ({ ...prev, [key]: !newState }));
    }
  };

  // Batch Master Actions
  const handleBatchAction = async (action) => {
    if (!isDemoMode && !config.databaseURL) {
      addLog({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERR',
        channel: 'BATCH-RELAY',
        payload: 'Tidak ada koneksi Firebase. Isi Database URL terlebih dahulu.'
      });
      return;
    }

    const updated = {};
    if (action === 'all_on') {
      for (let i = 1; i <= 8; i++) updated[`switch${i}`] = true;
    } else if (action === 'all_off') {
      for (let i = 1; i <= 8; i++) updated[`switch${i}`] = false;
    } else if (action === 'invert') {
      for (let i = 1; i <= 8; i++) updated[`switch${i}`] = !switches[`switch${i}`];
    }

    const previous = switches;
    setSwitches(prev => ({ ...prev, ...updated }));

    if (isDemoMode) {
      addLog({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'TX',
        channel: 'BATCH-RELAY',
        payload: `[DEMO] Tindakan ${action.toUpperCase()} pada 8 relay`,
        latencyMs: 10
      });
      return;
    }

    const ok = await writeBatchSwitches(config, updated, addLog);
    if (!ok) {
      setSwitches(previous);
    }
  };

  // Label Edit Handlers
  const handleUpdateSwitchLabel = (key, newLabel) => {
    const next = { ...labels, switches: { ...labels.switches, [key]: newLabel } };
    setLabels(next);
    saveStoredLabels(next);
  };

  const handleUpdateSensorLabel = (key, newLabel) => {
    const next = { ...labels, indicators: { ...labels.indicators, [key]: newLabel } };
    setLabels(next);
    saveStoredLabels(next);
  };

  const handleUpdateGaugeCfg = (gaugeKey, newCfg) => {
    const next = { ...labels, gauges: { ...labels.gauges, [gaugeKey]: { ...labels.gauges[gaugeKey], ...newCfg } } };
    setLabels(next);
    saveStoredLabels(next);
  };

  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
    setIsDemoMode(false);
  };

  const closeConfig = useCallback(() => setIsConfigOpen(false), []);

  const handleResetLabels = () => {
    clearStoredLabels();
    setLabels({ ...DEFAULT_LABELS });
    addLog({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'SYS',
      channel: 'CONFIG',
      payload: 'Semua label direset ke default'
    });
  };

  const activeRelayCount = Object.values(switches).filter(Boolean).length;

  // Real latency of the last write, not a random number.
  let lastLatency = null;
  for (let i = activityLogs.length - 1; i >= 0; i--) {
    if (typeof activityLogs[i].latencyMs === 'number') {
      lastLatency = activityLogs[i].latencyMs;
      break;
    }
  }

  return (
    <div className="min-h-screen text-slate-200 flex flex-col">

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:rounded-md focus:bg-cyber-cyan focus:text-industrial-950 focus:text-xs focus:font-semibold"
      >
        Lewati ke konten
      </a>

      <Header
        connectionStatus={connectionStatus}
        statusMessage={statusMessage}
        latency={lastLatency}
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
        onOpenConfig={() => setIsConfigOpen(true)}
        onResetLabels={handleResetLabels}
        devicePrefix={config.devicePrefix}
        onRefresh={() => setReconnectKey(k => k + 1)}
        activeRelayCount={activeRelayCount}
      />

      <main id="main" className="flex-1 max-w-[1440px] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">

        {connectionStatus === 'error' && !isDemoMode && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyber-rose/40 bg-cyber-rose/10 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-cyber-rose">Koneksi Firebase gagal</p>
              <p className="text-[11px] text-slate-300 mt-0.5 break-words">
                {statusMessage || 'Periksa Database URL dan rules.'}
              </p>
            </div>
            <button type="button" onClick={() => setIsConfigOpen(true)} className="btn btn-danger">
              Buka pengaturan
            </button>
          </div>
        )}

        <QuickStats
          activeRelayCount={activeRelayCount}
          gauge1Val={gauge1}
          gauge1Cfg={labels.gauges.gauge1}
          gauge2Val={gauge2}
          gauge2Cfg={labels.gauges.gauge2}
          logCount={activityLogs.length}
        />

        <RelayRack
          switches={switches}
          labels={labels.switches}
          onToggleSwitch={handleToggleSwitch}
          onBatchAction={handleBatchAction}
          onUpdateLabel={handleUpdateSwitchLabel}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">

          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <AnalogTelemetry
              gauge1Val={gauge1}
              gauge2Val={gauge2}
              hlevel1Val={hlevel1}
              hlevel2Val={hlevel2}
              gaugeCfgs={labels.gauges}
              hlevelCfgs={labels.hlevels}
              onUpdateGaugeCfg={handleUpdateGaugeCfg}
            />

            <TimeSeriesChart
              dataHistory={timeSeriesData}
              gauge1Name={labels.gauges.gauge1.name}
              gauge1Unit={labels.gauges.gauge1.unit}
              gauge1Min={labels.gauges.gauge1.min}
              gauge1Max={labels.gauges.gauge1.max}
              gauge2Name={labels.gauges.gauge2.name}
              gauge2Unit={labels.gauges.gauge2.unit}
              gauge2Min={labels.gauges.gauge2.min}
              gauge2Max={labels.gauges.gauge2.max}
              isPaused={isChartPaused}
              setIsPaused={setIsChartPaused}
            />
          </div>

          <div className="lg:col-span-5 space-y-3 sm:space-y-4">
            <DigitalSensors
              indicators={indicators}
              labels={labels.indicators}
              onUpdateLabel={handleUpdateSensorLabel}
            />

            <ActivityTerminal
              logs={activityLogs}
              onClearLogs={() => setActivityLogs([])}
            />
          </div>

        </div>

      </main>

      <footer className="border-t border-industrial-800/80 bg-industrial-900/40 backdrop-blur-md py-3 px-4 text-center text-[11px] font-mono text-slate-400">
        IoT SCADA Control Center · Firebase Realtime Database
        {isDemoMode && <span className="text-cyber-amber"> · data simulasi</span>}
      </footer>

      {isConfigOpen && (
        <ConfigModal
          onClose={closeConfig}
          config={config}
          onSaveConfig={handleSaveConfig}
        />
      )}

    </div>
  );
}
