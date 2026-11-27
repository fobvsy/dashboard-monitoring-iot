import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

const STORAGE_KEY = 'iot_scada_cfg_v1';
const LABELS_STORAGE_KEY = 'iot_scada_labels_v2';

export const DEFAULT_CONFIG = {
  databaseURL: '',
  apiKey: '',
  devicePrefix: 'device-01',
  projectId: ''
};

export const DEFAULT_LABELS = {
  switches: {
    switch1: 'Sakelar 1',
    switch2: 'Sakelar 2',
    switch3: 'Sakelar 3',
    switch4: 'Sakelar 4',
    switch5: 'Sakelar 5',
    switch6: 'Sakelar 6',
    switch7: 'Sakelar 7',
    switch8: 'Sakelar 8'
  },
  indicators: {
    indicator1: 'Indikator 1',
    indicator2: 'Indikator 2',
    indicator3: 'Indikator 3',
    indicator4: 'Indikator 4',
    indicator5: 'Indikator 5',
    indicator6: 'Indikator 6',
    indicator7: 'Indikator 7',
    indicator8: 'Indikator 8'
  },
  gauges: {
    gauge1: { name: 'Gauge 1', unit: '', min: 0, max: 100, warn: 70, crit: 90 },
    gauge2: { name: 'Gauge 2', unit: '', min: 0, max: 100, warn: 70, crit: 90 }
  },
  hlevels: {
    hlevel1: { name: 'Level Bar 1', unit: '%' },
    hlevel2: { name: 'Level Bar 2', unit: '%' }
  }
};

export function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Failed to load stored config', err);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.warn('Failed to save config', err);
  }
}

export function loadStoredLabels() {
  try {
    // Purge old arbitrary labels
    localStorage.removeItem('iot_scada_labels_v1');
    const raw = localStorage.getItem(LABELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.switches?.switch1 === 'Relay Pompa Utama') {
        localStorage.removeItem(LABELS_STORAGE_KEY);
        return DEFAULT_LABELS;
      }
      return { ...DEFAULT_LABELS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load stored labels', err);
  }
  return DEFAULT_LABELS;
}

export function saveStoredLabels(labels) {
  try {
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(labels));
  } catch (err) {
    console.warn('Failed to save labels', err);
  }
}

export function clearStoredLabels() {
  try {
    localStorage.removeItem(LABELS_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear labels', err);
  }
}

let activeApp = null;
let activeDb = null;
let unsubscribeListener = null;

export function cleanupFirebase() {
  if (unsubscribeListener) {
    unsubscribeListener();
    unsubscribeListener = null;
  }
  if (activeApp) {
    try {
      deleteApp(activeApp);
    } catch (e) {
      // ignore
    }
    activeApp = null;
    activeDb = null;
  }
}

export function connectFirebase(config, onDataReceived, onLogEvent, onStatusChange) {
  cleanupFirebase();

  if (!config.databaseURL) {
    onStatusChange('disconnected', 'Database URL belum diisi');
    return false;
  }

  try {
    onStatusChange('connecting', 'Menghubungkan ke Firebase...');
    const appName = `scada-app-${Date.now()}`;
    activeApp = initializeApp({
      databaseURL: config.databaseURL.trim().replace(/\/+$/, ''),
      apiKey: config.apiKey ? config.apiKey.trim() : undefined,
      projectId: config.projectId ? config.projectId.trim() : undefined
    }, appName);

    activeDb = getDatabase(activeApp);
    const prefix = (config.devicePrefix || 'root').trim().replace(/^\/+|\/+$/g, '');
    const dataRef = ref(activeDb, prefix);

    onLogEvent({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'SYS',
      channel: 'CORE',
      payload: `Menghubungkan ke ${config.databaseURL} [Path: /${prefix}]`
    });

    unsubscribeListener = onValue(dataRef, (snapshot) => {
      onStatusChange('connected', 'Terhubung ke Firebase Realtime DB');
      if (snapshot.exists()) {
        const val = snapshot.val();
        onDataReceived(val);
        onLogEvent({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          type: 'RX',
          channel: 'TELEMETRI',
          payload: `Update diterima (${Object.keys(val || {}).length} node)`
        });
      } else {
        // Init schema if empty
        const initialSeed = {};
        for (let i = 1; i <= 8; i++) {
          initialSeed[`switch${i}`] = false;
          initialSeed[`indicator${i}`] = 0;
        }
        initialSeed.gauge1 = 25.0;
        initialSeed.gauge2 = 60.0;
        initialSeed.hlevel1 = 45;
        initialSeed.hlevel2 = 70;
        update(dataRef, initialSeed);
        onDataReceived(initialSeed);
      }
    }, (error) => {
      console.error('Firebase read error:', error);
      onStatusChange('error', error.message || 'Gagal membaca database');
      onLogEvent({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERR',
        channel: 'AUTH/READ',
        payload: `Error: ${error.message}. Periksa aturan (Rules) database Anda!`
      });
    });

    return true;
  } catch (err) {
    console.error('Firebase init error:', err);
    onStatusChange('error', err.message);
    return false;
  }
}

export async function writeSwitchState(config, switchKey, newState, onLogEvent) {
  if (!activeDb) return false;
  const prefix = (config.devicePrefix || 'root').trim().replace(/^\/+|\/+$/g, '');
  const targetRef = ref(activeDb, `${prefix}/${switchKey}`);

  const start = performance.now();
  try {
    await set(targetRef, newState);
    const latency = Math.round(performance.now() - start);
    onLogEvent({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'TX',
      channel: switchKey.toUpperCase(),
      payload: `Relay disetel ${newState ? 'ON (CLOSED)' : 'OFF (OPEN)'}`,
      latencyMs: latency
    });
    return true;
  } catch (err) {
    onLogEvent({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'ERR',
      channel: switchKey.toUpperCase(),
      payload: `Gagal menulis: ${err.message}`
    });
    return false;
  }
}

export async function writeBatchSwitches(config, switchMap, onLogEvent) {
  if (!activeDb) return false;
  const prefix = (config.devicePrefix || 'root').trim().replace(/^\/+|\/+$/g, '');
  const targetRef = ref(activeDb, prefix);

  const start = performance.now();
  try {
    await update(targetRef, switchMap);
    const latency = Math.round(performance.now() - start);
    onLogEvent({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'TX',
      channel: 'BATCH-RELAY',
      payload: `Batch update: ${Object.keys(switchMap).length} relay diubah`,
      latencyMs: latency
    });
    return true;
  } catch (err) {
    onLogEvent({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'ERR',
      channel: 'BATCH-RELAY',
      payload: `Gagal batch write: ${err.message}`
    });
    return false;
  }
}
