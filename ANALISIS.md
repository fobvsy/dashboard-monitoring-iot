# Analisis Kode — `dashboard-monitoring`

> **Proyek:** IoT SCADA Monitoring & Control Center
> **Lokasi:** `F:\CODE\dashboard-monitoring`
> **Tanggal analisis:** 26 November 2026
> **Metode:** pembacaan seluruh source (13 file), inspeksi konfigurasi build, verifikasi output CSS/JS hasil `npm run build`, dan pengecekan statis referensi simbol.

---

## Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Arsitektur & Alur Data](#2-arsitektur--alur-data)
3. [Inventaris File](#3-inventaris-file)
4. [Hasil Build](#4-hasil-build)
5. [Temuan 🔴 Tinggi — Bug Fungsional](#5-temuan--tinggi--bug-fungsional)
6. [Temuan 🟠 Sedang — Keamanan & UX](#6-temuan--sedang--keamanan--ux)
7. [Temuan 🟡 Rendah — Housekeeping](#7-temuan--rendah--housekeeping)
8. [Matriks Ringkasan Temuan](#8-matriks-ringkasan-temuan)
9. [Prioritas Perbaikan](#9-prioritas-perbaikan)
10. [Hal yang Sudah Baik](#10-hal-yang-sudah-baik)
11. [Lampiran: Perintah Verifikasi](#11-lampiran-perintah-verifikasi)

---

## 1. Ringkasan Proyek

Dashboard SCADA/IoT berbasis web untuk **kontrol 8-channel relay** dan **monitoring sensor analog/digital**, terhubung ke **Firebase Realtime Database** dengan fallback ke **mode simulasi (demo)**.

| Aspek | Detail |
|---|---|
| Nama paket | `iot-scada-dashboard` v1.0.0 |
| Stack | React 18.3 + Vite 6 + Tailwind CSS 3.4 + Firebase 11 + lucide-react |
| Ukuran source | ~1.950 baris pada 13 file (12 kode + 1 CSS) |
| Jumlah komponen | 8 komponen UI + 1 service + 1 util |
| Build | ✅ Sukses — 434 kB JS (113 kB gzip), 24 kB CSS, ~24 detik |
| Node/npm terpasang | Node v26.8.2, npm 11.19.1 |
| `node_modules` | 133 paket top-level, ±203 MB |
| Version control | ❌ Bukan git repository |
| Tooling kualitas | ❌ Tidak ada ESLint, Prettier, test, TypeScript, README, `.gitignore` |

### Fitur yang tersedia

- Kontrol 8 relay individual + aksi batch (*All ON*, *All OFF*, *Invert*)
- 2 gauge analog SVG semi-circle dengan ambang *warning*/*critical*
- 2 level bar (tangki) horizontal
- Matriks 8 sensor digital dengan deteksi status aktif
- Grafik tren time-series multi-kanal (SVG murni, tanpa library chart)
- Konsol log aktivitas dengan filter TX/RX/SYS/ERR dan ekspor CSV/JSON
- Label channel dapat diedit user dan dipersist ke `localStorage`
- Mode demo dengan simulasi gelombang sinus
- Konfigurasi koneksi Firebase via modal (URL, API key, device prefix)

---

## 2. Arsitektur & Alur Data

```
┌──────────────────────────────────────────────────────────────┐
│                        App.jsx (God Component)               │
│  config · labels · connectionStatus · switches · indicators  │
│  gauge1/2 · hlevel1/2 · timeSeriesData · activityLogs        │
└───────────┬───────────────────────────────┬──────────────────┘
            │ props (drilling)              │ state setter
            ▼                               ▼
   ┌────────────────────┐        ┌───────────────────────────┐
   │ 8 komponen UI      │        │ services/firebase.js      │
   │ (presentational)   │        │ • connectFirebase()       │
   └────────────────────┘        │ • writeSwitchState()      │
                                 │ • writeBatchSwitches()    │
                                 │ • load/save localStorage  │
                                 └─────────────┬─────────────┘
                                               │ onValue / set / update
                                               ▼
                                    Firebase Realtime Database
                                       /<devicePrefix>/...
```

**Karakteristik arsitektur:**

- **Single source of truth** terpusat di `App.jsx` (~325 baris) — semua state, efek, dan handler ada di satu file.
- **Props drilling** 1 level (tidak ada Context/Redux) — masih wajar untuk skala ini.
- **Singleton modul** di `firebase.js` (`activeApp`, `activeDb`, `unsubscribeListener`) — bukan React lifecycle, sehingga reconnect harus manual lewat `cleanupFirebase()`.
- **Komponen presentasional murni** — tidak ada komponen yang menyentuh Firebase langsung. Ini pemisahan yang baik.

### Skema data RTDB yang diasumsikan

```json
{
  "device-01": {
    "switch1": false,  "switch2": false,  "...": "switch8",
    "indicator1": 0,   "indicator2": 0,   "...": "indicator8",
    "gauge1": 25.0,    "gauge2": 60.0,
    "hlevel1": 45,     "hlevel2": 70
  }
}
```

---

## 3. Inventaris File

| File | Baris | Peran |
|---|---:|---|
| `src/App.jsx` | 325 | State container utama, efek koneksi, simulasi, handler |
| `src/components/TimeSeriesChart.jsx` | 291 | Grafik SVG multi-kanal + tooltip hover |
| `src/components/AnalogTelemetry.jsx` | 286 | 2 gauge SVG + 2 level bar + editor config gauge |
| `src/services/firebase.js` | 230 | Koneksi RTDB, read/write, persistensi localStorage |
| `src/components/Header.jsx` | 179 | Status bar, tombol aksi, dialog konfirmasi reset |
| `src/components/RelayRack.jsx` | 163 | Grid 8 relay + kontrol master + edit label |
| `src/components/ConfigModal.jsx` | 161 | Form konfigurasi Firebase |
| `src/components/ActivityTerminal.jsx` | 160 | Konsol log + filter + ekspor |
| `src/components/DigitalSensors.jsx` | 141 | Matriks 8 sensor digital |
| `src/components/QuickStats.jsx` | 104 | 4 kartu KPI ringkas |
| `src/utils/exportLogs.js` | 42 | Ekspor log ke CSV & JSON |
| `src/index.css` | 38 | Tailwind layers, scrollbar, grid pattern |
| `src/main.jsx` | 9 | Bootstrap React |

**File konfigurasi:** `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `DESIGN.md`.

---

## 4. Hasil Build

```
> iot-scada-dashboard@1.0.0 build
> vite build

vite v6.4.6 building for production...
✓ 1609 modules transformed.
dist/index.html                 1.34 kB │ gzip:  0.69 kB
dist/assets/index-5UZUWq1a.css  24.19 kB │ gzip:  5.00 kB
dist/assets/index-IEvpEIJm.js  434.36 kB │ gzip: 113.39 kB
✓ built in 23.66s
```

**Catatan ukuran bundle:** 434 kB sebagian besar berasal dari Firebase SDK. Karena hanya `firebase/app` dan `firebase/database` yang diimpor, tree-shaking sudah bekerja — tetapi Firebase tetap menyumbang mayoritas berat. Pertimbangkan *dynamic import* (`await import('./services/firebase')`) agar halaman pertama ringan saat mode demo.

---

## 5. Temuan 🔴 Tinggi — Bug Fungsional

### a. Tombol Refresh mematikan stream data

**Lokasi:** `src/App.jsx:270-277`

```js
onRefresh={() => {
  if (!isDemoMode && config.databaseURL) {
    connectFirebase(config, () => {}, addLog, (status, msg) => { ... });
    //                       ^^^^^^^^ callback data dibuang
  }
}}
```

`connectFirebase()` memanggil `cleanupFirebase()` di baris pertamanya, sehingga listener lama dilepas dan diganti listener baru yang **mengabaikan seluruh payload data**. Akibatnya setelah menekan Refresh, nilai gauge/switch/sensor berhenti diperbarui sampai `config` berubah.

**Dampak:** Tombol utama "Refresh Koneksi" justru merusak fungsionalitas.

**Perbaikan:** Ekstrak handler data ke fungsi bernama (mis. `handleRealtimeData`) lalu pakai di kedua tempat.

---

### b. Pesan error tidak pernah tampil ke user

**Lokasi:** `src/components/Header.jsx:57`

```js
export default function Header({
  connectionStatus,
  statusMessage,   // ← di-destructure
  ...
```

`statusMessage` hanya muncul **1 kali** di seluruh file (yaitu saat destructuring) dan tidak pernah dirender. Padahal `App.jsx` mengisinya dengan pesan diagnostik penting:

- `"Database URL belum diisi"`
- `"Menghubungkan ke Firebase..."`
- `"Terhubung ke Firebase Realtime DB"`
- `"Gagal membaca database"` / pesan error dari Firebase

**Dampak:** User hanya melihat badge `DISCONNECTED` tanpa tahu penyebabnya. Debugging menjadi sulit.

**Perbaikan:** Tampilkan `statusMessage` sebagai tooltip pada badge status, atau sebagai baris kecil di bawah judul.

---

### c. Optimistic update tanpa rollback

**Lokasi:** `src/App.jsx:171-188`

```js
const handleToggleSwitch = async (key, newState) => {
  setSwitches(prev => ({ ...prev, [key]: newState }));   // UI langsung berubah
  if (isDemoMode) { /* ... */ return; }
  await writeSwitchState(config, key, newState, addLog);  // return value diabaikan
};
```

`writeSwitchState()` mengembalikan `false` bila `activeDb` null atau penulisan ditolak Firebase Rules, tetapi nilai itu tidak dicek.

**Dampak:** Pada sistem kontrol fisik, UI bisa menampilkan relay `CLOSED` padahal perangkat tetap `OPEN`. Ini **status palsu** — risiko operasional yang serius.

**Perbaikan:**
```js
const ok = await writeSwitchState(config, key, newState, addLog);
if (!ok) {
  setSwitches(prev => ({ ...prev, [key]: !newState }));  // rollback
  // tampilkan notifikasi error
}
```
Pola yang sama berlaku untuk `handleBatchAction` (`App.jsx:191-216`).

---

### d. Dashboard menulis data seed ke database user

**Lokasi:** `src/services/firebase.js:159-172`

```js
} else {
  // Init schema if empty
  const initialSeed = { /* switch1..8, indicator1..8, gauge, hlevel */ };
  update(dataRef, initialSeed);   // ← tidak di-await, tanpa .catch()
  onDataReceived(initialSeed);
}
```

Dua masalah:

1. **Unhandled promise rejection** — jika rules menolak write, promise reject tanpa handler → error di console yang membingungkan.
2. **Menimpa data perangkat** — dashboard seharusnya read-only. Jika node perangkat kebetulan kosong (misalnya baru di-flash atau sedang maintenance), dashboard akan mengisi nilai default dan **menimpa state sebenarnya**.

**Perbaikan:** Hapus penulisan seed dari alur baca; cukup tampilkan state default di UI lokal, atau minta konfirmasi eksplisit user.

---

### e. Grafik dua sumbu Y berbeda tanpa axis label

**Lokasi:** `src/components/TimeSeriesChart.jsx:31-35`

```js
const minG1 = ...Math.min(...allValuesG1) * 0.9...;
const maxG1 = ...Math.max(...allValuesG1) * 1.1...;
const minG2 = ...Math.min(...allValuesG2) * 0.9...;
const maxG2 = ...Math.max(...allValuesG2) * 1.1...;
```

G1 dan G2 masing-masing dinormalisasi dengan skala **sendiri**, lalu digambar pada area yang sama. Tidak ada sumbu Y yang ditampilkan sama sekali.

**Dampak:** Dua garis dengan rentang nilai berbeda (mis. suhu 20–35 °C vs kelembapan 40–90 %) tampak "sebanding" dan dapat menyesatkan pembacaan tren.

**Perbaikan:** Pilih salah satu:
- Tampilkan dua sumbu Y (kiri untuk G1, kanan untuk G2) beserta gridline-nya, atau
- Normalisasi eksplisit ke 0–100 % dan beri label "normalized" pada sumbu.

---

### f. Sampling grafik tidak terjadwal

**Lokasi:** `src/App.jsx:158-168`

```js
useEffect(() => {
  if (isChartPaused) return;
  const point = { timestamp: new Date().toLocaleTimeString(), g1: gauge1, g2: gauge2 };
  setTimeSeriesData(prev => [...prev.slice(-99), point]);
}, [gauge1, gauge2, isChartPaused]);
```

Efek bergantung pada nilai gauge, bukan waktu:

- Jika di mode Firebase hanya `indicator` yang berubah, **tidak ada titik baru** ditambahkan.
- Jika terjadi burst update (banyak perubahan dalam 1 detik), **puluhan titik** tercatat dengan interval tidak seragam.
- Sumbu X jadi tidak merepresentasikan waktu yang sebenarnya.

**Perbaikan:** Gunakan `setInterval` tetap (mis. 2 detik, selaras dengan interval simulasi) dan baca nilai terkini lewat `useRef`.

---

### g. Nilai latency adalah angka acak

**Lokasi:** `src/App.jsx:67` dan `App.jsx:116`

```js
setLatency(12);                                        // demo
setLatency(Math.floor(25 + Math.random() * 20));       // "connected"
```

Label UI menyebutnya `PING` dan `Live Ping`, tetapi nilainya bukan hasil pengukuran apa pun. Satu-satunya latency nyata ada di `latencyMs` pada log TX (`performance.now()` di `firebase.js:198-201`).

**Dampak:** Indikator "kesehatan jaringan" yang menyesatkan operator.

**Perbaikan:** Ukur latensi nyata via round-trip (mis. `set(serverTimeRef, Date.now())` lalu baca balik), atau ubah label menjadi indikator koneksi non-numerik.

---

### h. Shallow merge berpotensi menyebabkan white screen

**Lokasi:** `src/services/firebase.js:48` dan `firebase.js:74`

```js
// loadStoredConfig
return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };

// loadStoredLabels
return { ...DEFAULT_LABELS, ...parsed };   // nested object tertimpa utuh
```

Spread hanya melakukan *shallow merge*. Jika `localStorage` berisi objek `gauges` yang tidak lengkap (dari versi lama, data korup, atau edit manual), maka:

- `QuickStats.jsx:19` → `gauge1Cfg.warn` → **TypeError: Cannot read properties of undefined**
- `AnalogTelemetry.jsx:233` → `gaugeCfgs.gauge1.min` → TypeError

Karena tidak ada *error boundary*, seluruh aplikasi menjadi **layar putih**.

**Perbaikan:** Deep merge per-level (`switches`, `indicators`, `gauges`, `hlevels`) + optional chaining di titik konsumsi + `<ErrorBoundary>` di `main.jsx`.

---

## 6. Temuan 🟠 Sedang — Keamanan & UX

### i. Pola keamanan yang dianjurkan justru tidak aman

**Lokasi:** `src/components/ConfigModal.jsx:114-130`

Modal menampilkan snippet berikut sebagai "Petunjuk Aturan Keamanan (Rules)":

```json
{ "rules": { ".read": true, ".write": true } }
```

Kombinasi ini berarti **siapa pun yang mengetahui URL database dapat mengontrol relay fisik** tanpa autentikasi. Diperparah oleh:

- Tidak ada Firebase Auth sama sekali (tidak ada `signInAnonymously`).
- `apiKey` disimpan **plaintext** di `localStorage` (`firebase.js:55-61`).
- API key Firebase memang bukan rahasia, tetapi bersama rules terbuka ia melengkapi akses penuh.

**Rekomendasi:**
1. Gunakan Auth anonim/email lalu rules berbasis `auth.uid`.
2. Ubah teks modal menjadi peringatan eksplisit: *"Hanya untuk lab lokal/offline — JANGAN dipakai di jaringan publik."*
3. Sediakan snippet rules yang aman sebagai contoh utama.

---

### j. `projectId` tidak memiliki input di form

**Lokasi:** `src/components/ConfigModal.jsx:13, 24`

```js
const [projectId, setProjectId] = useState(config.projectId || '');   // ada state
...
onSaveConfig({ ..., projectId: projectId.trim() });                   // dikirim
```

Namun **tidak ada field input** untuk `projectId` di JSX. Nilainya selalu string kosong (kecuali diisi lewat localStorage manual).

**Dampak:** Dead code yang menandakan form belum selesai. Field `apiKey` ada, `projectId` hilang — tidak konsisten.

---

### k. `onUpdateHlevelCfg` adalah no-op

**Lokasi:** `src/App.jsx:319`

```js
<AnalogTelemetry ... onUpdateHlevelCfg={() => {}} />
```

Padahal dialog reset di `Header.jsx:26` menyatakan:

> "Semua nama kustom untuk **Sakelar, Indikator, Gauge, dan Level Bar** akan dikembalikan ke default"

**Dampak:** Janji UI tidak sesuai implementasi — nama Level Bar tidak bisa diedit, sehingga klaim "dikembalikan ke default" tidak bermakna.

---

### l. Class Tailwind tidak valid → style hilang diam-diam

Diverifikasi langsung terhadap `dist/assets/*.css`: class-class berikut **tidak ada** di output final, sehingga elemen kehilangan style tanpa error apa pun.

| Class | Lokasi | Penyebab |
|---|---|---|
| `border-industrial-750` | `RelayRack.jsx:94` | warna `750` tidak didefinisikan di `tailwind.config.js` |
| `shadow-glow-indigo` | `TimeSeriesChart.jsx:69` | config hanya punya glow-green/cyan/amber/rose |
| `shadow-xs` | `RelayRack.jsx:51` | sintaks Tailwind v4, proyek memakai v3 |
| `py-0.2` | `ActivityTerminal.jsx:143,161` · `QuickStats.jsx:52,75` · `RelayRack.jsx:94` | spacing scale Tailwind tidak punya `0.2` |
| `animate-fade-in` | `ConfigModal.jsx:34` | keyframe `fade-in` tidak didefinisikan |

**Perbaikan:** Ganti dengan `border-industrial-700`, `shadow-glow-cyan`, `shadow-sm`, `py-0.5`, dan hapus/definisikan `animate-fade-in` di `tailwind.config.js`.

---

### m. Aksesibilitas (a11y)

| Masalah | Lokasi | Detail |
|---|---|---|
| Kartu relay tidak bisa dioperasikan keyboard | `RelayRack.jsx:79-86` | `<div onClick>` tanpa `role`, `tabIndex`, atau `onKeyDown` |
| Toggle switch bukan elemen semantik | `RelayRack.jsx:160-166` | `<div>` visual, bukan `role="switch"` + `aria-checked` |
| Tombol edit label tersembunyi di perangkat sentuh | `RelayRack.jsx:145`, `DigitalSensors.jsx:126` | `opacity-0 group-hover:opacity-100` → tidak pernah muncul tanpa hover |
| Modal tanpa semantik dialog | `ConfigModal.jsx:34` | tidak ada `role="dialog"`, `aria-modal`, focus trap, atau handler `Escape` |
| Status tidak diumumkan ke screen reader | `Header.jsx:115` | badge status tanpa `aria-live` |

**Perbaikan minimal:** tambahkan `role="switch"` + `aria-checked` + `tabIndex={0}` + `onKeyDown` (Enter/Space) pada kartu relay, dan buat tombol edit selalu terlihat (atau tampil saat `focus-visible`).

---

### n. Mode demo vs config tidak sinkron

**Lokasi:** `src/App.jsx:237-241`

```js
const handleSaveConfig = (newConfig) => {
  setConfig(newConfig);
  saveStoredConfig(newConfig);
  setIsDemoMode(false);    // ← selalu, meski databaseURL kosong
};
```

Jika user menyimpan form dengan `databaseURL` kosong, `isDemoMode` menjadi `false` sementara tidak ada koneksi → status `DISCONNECTED`, tidak ada data, dan tombol demo harus diklik manual untuk pulih.

**Perbaikan:** `setIsDemoMode(!newConfig.databaseURL)`.

---

### o. Area hover grafik saling tumpang tindih

**Lokasi:** `src/components/TimeSeriesChart.jsx:198-206`

```js
<rect x={cx - 10} y={padding.top} width={20} height={innerHeight} ... />
```

Lebar hover 20px per titik. Dengan 100 titik pada lebar ~565px, jarak antar titik ≈ 5,7px → band hover saling menimpa dan tooltip "melompat" ke titik yang salah.

**Perbaikan:** Gunakan satu overlay rect tunggal + hitung indeks dari `mouseX` relatif terhadap `getX()`.

---

### p. Timestamp log tidak layak untuk audit

**Lokasi:** `App.jsx:70,177,205,248` · `firebase.js:141,154,178` · dst.

```js
timestamp: new Date().toLocaleTimeString()   // hanya jam:menit:detik
```

Masalah:

- **Tidak ada tanggal** → log dari hari berbeda tidak bisa dibedakan.
- **Tidak ada timezone** → ambigu saat diekspor dan dibuka di mesin lain.
- **Format bergantung locale** → tidak konsisten antar browser.
- Tidak bisa di-sort kronologis secara andal.

**Perbaikan:** Simpan `new Date().toISOString()` di field `ts` dan format hanya saat render.

---

### q. Ekspor CSV rentan dan tidak konsisten

**Lokasi:** `src/utils/exportLogs.js:5-29`

1. **Tanpa BOM UTF-8** → Excel dapat merusak karakter non-ASCII.
2. **`alert()`** → tidak konsisten dengan UI; seharusnya toast/inline message.
3. **CSV formula injection** — payload yang diawali `=`, `+`, `-`, atau `@` akan dieksekusi sebagai formula saat dibuka di Excel. Perlu prefix `'` atau sanitasi.
4. Implementasi CSV memakai `data:` URI (dibatasi panjang di beberapa browser) sementara JSON memakai `Blob` — tidak konsisten. Gunakan `Blob` untuk keduanya.

---

### r. StrictMode double-invoke

**Lokasi:** `src/App.jsx:62-125`

Pada development, `React.StrictMode` (`main.jsx:7`) menjalankan effect dua kali, sehingga:

- Log `SYS / SIMULATOR` tercatat ganda.
- `initializeApp()` + `deleteApp()` dipanggil dua kali.

Tidak fatal (production tidak terpengaruh), tetapi `deleteApp()` di `firebase.js:109` **tidak di-await**, sehingga reconnect cepat berpotensi meninggalkan instance Firebase yang menggantung.

---

## 7. Temuan 🟡 Rendah — Housekeeping

### Import & dependency tidak terpakai

**22 ikon lucide** diimpor tetapi tidak dipakai:

| File | Ikon tidak terpakai |
|---|---|
| `ActivityTerminal.jsx` | `Download` |
| `AnalogTelemetry.jsx` | `Sliders`, `Check`, `BarChart2` |
| `ConfigModal.jsx` | `Key`, `Radio`, `Info`, `ExternalLink` |
| `DigitalSensors.jsx` | `Radio`, `ShieldCheck`, `AlertCircle` |
| `QuickStats.jsx` | `Flame`, `Droplets`, `Cpu`, `CheckCircle2` |
| `RelayRack.jsx` | `ToggleLeft`, `ToggleRight`, `Zap`, `Power`, `ShieldAlert` |
| `TimeSeriesChart.jsx` | `LineChart`, `RefreshCw`, `ZoomIn` |

**Import lain:**
- `useRef` — `App.jsx:1` (tidak dipakai)
- `getApps`, `get` — `firebase.js:1-2` (tidak dipakai)

**Dependency terinstal tanpa pemakaian:**
- `clsx` — 0 referensi di `src/`
- `tailwind-merge` — 0 referensi di `src/`
- (kemungkinan sisa rencana utilitas `cn()`)

### Lain-lain

| Temuan | Lokasi | Catatan |
|---|---|---|
| CSS mati | `index.css:39-45` | `.toggle-checkbox` tidak dipakai komponen mana pun |
| ID log rapuh | `App.jsx:69` dkk. | `Math.random().toString(36).substr(2,9)` — `substr` deprecated, berpotensi kolisi sebagai React `key` |
| Magic number | 6+ lokasi | `switch1..switch8` dan loop `1..8` hardcoded; tidak ada satu sumber kebenaran untuk jumlah channel |
| Migrasi hacky | `firebase.js:70-73` | Menghapus **seluruh** label user jika `switch1 === 'Relay Pompa Utama'` |
| Tanpa `.gitignore` | root | `node_modules` (203 MB) dan `dist` ikut dalam folder |
| Tanpa repo git | root | Tidak ada riwayat perubahan, tidak bisa `diff`/`blame` |
| Tanpa README | root | Tidak ada instruksi setup/jalankan/deploy |
| Tanpa test | — | `exportLogs.js` dan merge config adalah kandidat unit test yang mudah |
| Tanpa error boundary | `main.jsx` | Satu error di komponen → layar putih total |
| Tanpa loading state | — | Tidak ada indikator saat koneksi awal |
| Tidak ada penanganan offline | — | Status hanya connected/disconnected/error, tanpa deteksi jaringan |

---

## 8. Matriks Ringkasan Temuan

| # | Severity | Temuan | File | Baris |
|---|---|---|---|---|
| a | 🔴 | Refresh mematikan stream data | `App.jsx` | 270-277 |
| b | 🔴 | `statusMessage` tidak dirender | `Header.jsx` | 57 |
| c | 🔴 | Optimistic update tanpa rollback | `App.jsx` | 171-216 |
| d | 🔴 | Dashboard menulis seed ke RTDB | `firebase.js` | 159-172 |
| e | 🔴 | Dua sumbu Y berbeda tanpa axis | `TimeSeriesChart.jsx` | 31-35 |
| f | 🔴 | Sampling chart tidak terjadwal | `App.jsx` | 158-168 |
| g | 🔴 | Latency acak, bukan pengukuran | `App.jsx` | 67, 116 |
| h | 🔴 | Shallow merge → potensi white screen | `firebase.js` | 48, 74 |
| i | 🟠 | Rules `.read/.write: true` dianjurkan | `ConfigModal.jsx` | 114-130 |
| j | 🟠 | `projectId` tanpa input form | `ConfigModal.jsx` | 13, 24 |
| k | 🟠 | `onUpdateHlevelCfg` no-op | `App.jsx` | 319 |
| l | 🟠 | 5 class Tailwind tidak valid | 4 file | — |
| m | 🟠 | Aksesibilitas keyboard & screen reader | 3 file | — |
| n | 🟠 | Demo mode tidak sinkron dengan config | `App.jsx` | 237-241 |
| o | 🟠 | Hover area grafik tumpang tindih | `TimeSeriesChart.jsx` | 198-206 |
| p | 🟠 | Timestamp tanpa tanggal/timezone | 8+ lokasi | — |
| q | 🟠 | CSV: BOM, injection, `alert()` | `exportLogs.js` | 5-29 |
| r | 🟠 | StrictMode double-invoke, `deleteApp` tidak await | `App.jsx`, `firebase.js` | 62-125, 109 |
| — | 🟡 | 22 ikon + 3 import tidak terpakai | 8 file | — |
| — | 🟡 | `clsx` & `tailwind-merge` tak terpakai | `package.json` | 12, 17 |
| — | 🟡 | CSS mati `.toggle-checkbox` | `index.css` | 39-45 |
| — | 🟡 | Tanpa git, `.gitignore`, README, test, ESLint | root | — |

**Total: 8 🔴 tinggi · 10 🟠 sedang · 4+ 🟡 rendah**

---

## 9. Prioritas Perbaikan

### Fase 1 — Perbaikan cepat, dampak besar (< 1 jam)

1. **Fix `onRefresh`** → pakai handler data asli, bukan `() => {}` **(a)**
2. **Render `statusMessage`** di Header (tooltip badge atau baris status) **(b)**
3. **Rollback state** saat `writeSwitchState` mengembalikan `false` + log error **(c)**
4. **Await + `.catch()`** pada `update(dataRef, initialSeed)` — atau hapus **(d)**
5. **Bersihkan 5 class Tailwind tidak valid** **(l)**

### Fase 2 — Perbaikan menengah (1–2 hari)

6. **Deep merge** config/labels + optional chaining + `<ErrorBoundary>` **(h)**
7. **Sampling chart** dengan `setInterval` tetap; tambah label sumbu Y atau normalisasi eksplisit **(e, f)**
8. **Input `projectId`** di form + validasi `max > min` pada gauge **(j)**
9. **Aksesibilitas:** `role="switch"`, `tabIndex`, keyboard handler, `Escape`/focus trap di modal, tombol edit selalu terlihat **(m)**
10. **Timestamp ISO 8601** + ekspor CSV dengan BOM dan sanitasi formula **(p, q)**
11. **`setIsDemoMode(!newConfig.databaseURL)`** saat simpan config **(n)**
12. **Latency nyata** atau ganti label menjadi indikator non-numerik **(g)**

### Fase 3 — Perbaikan struktural

13. **Firebase Auth** + rules berbasis `auth.uid`; hapus snippet `true/true` sebagai default **(i)**
14. **Refactor `App.jsx`** → hook `useTelemetry()` / `useFirebaseConnection()`, dan definisikan channel config sebagai konstanta tunggal (hilangkan magic number 8)
15. **Tooling:** init git + `.gitignore`, ESLint + Prettier, README, unit test untuk `exportLogs` dan merge config
16. **Optimasi bundle:** dynamic import Firebase agar mode demo tidak memuat SDK RTDB

---

## 10. Hal yang Sudah Baik

- ✅ **Pemisahan tanggung jawab jelas** — komponen presentasional, service Firebase terisolasi, util ekspor terpisah.
- ✅ **`DESIGN.md` konsisten dengan implementasi** — warna fungsional (emerald=normal, amber=warning, rose=danger) benar-benar dipakai sesuai makna, bukan sekadar dekorasi.
- ✅ **Mode demo** — memungkinkan pengembangan tanpa database, dengan simulasi gelombang sinus yang halus.
- ✅ **Persistensi label** ke `localStorage` — konfigurasi user tidak hilang saat reload.
- ✅ **Grafik SVG murni** — tanpa dependency chart eksternal, ukuran bundle lebih kecil.
- ✅ **Ekspor log CSV + JSON** — fitur yang jarang ada di dashboard serupa.
- ✅ **Komentar kode rapi** dan penamaan konsisten (`handleX`, `onX`, `isX`).
- ✅ **`tailwind.config.js` tertata** — custom palette, font, dan glow shadow yang terdefinisi baik (hanya 5 class yang luput).
- ✅ **Build bersih** tanpa warning, tree-shaking Firebase berfungsi.
- ✅ **Batas buffer eksplisit** — log 100 entri (`App.jsx:58`), chart 100 titik (`App.jsx:167`) mencegah memory leak.

---

## 11. Lampiran: Perintah Verifikasi

Perintah yang dipakai untuk memvalidasi temuan di dokumen ini.

```powershell
# Build & ukuran output
npm run build

# Verifikasi class Tailwind hilang dari output CSS
$css = Get-Content dist\assets\*.css -Raw
foreach($p in 'py-0\.2','shadow-xs','industrial-750','glow-indigo','animate-fade-in'){
    "{0,-20} {1}" -f $p, ($css -match $p)
}

# Cari ikon lucide yang tidak terpakai
$files = Get-ChildItem src -Recurse -Include *.jsx,*.js
foreach($f in $files){
    $c = Get-Content $f.FullName -Raw
    [regex]::Matches($c, "import\s+\{([^}]+)\}\s+from\s+'lucide-react'") | ForEach-Object {
        $_.Groups[1].Value -split ',' | ForEach-Object {
            $n = $_.Trim()
            if($n -and ([regex]::Matches($c, "\b$([regex]::Escape($n))\b")).Count -le 1){
                "UNUSED  $($f.Name): $n"
            }
        }
    }
}

# Hitung baris per file
Get-ChildItem src -Recurse -Include *.jsx,*.js,*.css |
  ForEach-Object { "{0,5}  {1}" -f (Get-Content $_.FullName | Measure-Object -Line).Lines, $_.Name }

# Cek referensi dependency
foreach($p in 'clsx','tailwind-merge'){ (Select-String -Path src\**\*.jsx,src\**\*.js -Pattern $p).Count }
```

---

*Dokumen ini dihasilkan dari analisis statis menyeluruh + verifikasi build. Tidak ada file source yang diubah.*
