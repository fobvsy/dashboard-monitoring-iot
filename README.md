# IoT SCADA Dashboard

Dashboard monitoring dan kontrol perangkat IoT berbasis **React + Vite + Tailwind CSS**, terhubung ke **Firebase Realtime Database**. Satu layar untuk memantau telemetri, mengontrol relay, dan membaca riwayat aktivitas — dengan mode gelap dan terang.

Dirancang sebagai control room industri: gelap, padat, dan warna hanya dipakai untuk menandai keadaan nyata (ON, normal, waspada, error), bukan hiasan. Aturan visualnya ada di [`DESIGN.md`](./DESIGN.md).

## Fitur

- **8 kanal relay** — sakelar bisa diklik atau dioperasikan lewat keyboard, plus aksi batch Semua ON / Semua OFF / Balik. UI optimistis: kalau penulisan ke Firebase gagal, status dikembalikan.
- **8 input digital** — indikator aktif/mati dengan nama yang bisa diubah.
- **2 gauge analog** — nama, satuan, dan batas maksimum bisa diatur langsung dari kartu; status Normal / Waspada / Kritis mengikuti ambang `warn` dan `crit`.
- **2 level bar** — nilai persentase dengan bar progres.
- **Grafik tren** — dua kanal dinormalisasi ke persen rentang masing-masing sehingga satu sumbu Y tetap jujur walau satuannya berbeda. Bisa dijeda, jumlah sampel diatur, dan titik bisa disentuh untuk melihat nilai.
- **Log aktivitas** — buffer 100 entri dengan filter TX / RX / SYS / ERR, ekspor CSV & JSON, dan hapus dengan konfirmasi.
- **Mode demo** — simulator data acak, aktif otomatis kalau belum ada Database URL.
- **Tema gelap/terang** — pilihan disimpan di `localStorage` dan diterapkan sebelum paint pertama.
- **Konfigurasi dari UI** — Database URL, device prefix, Project ID, dan API key; tersimpan di browser.
- **Aksesibilitas** — focus ring yang terlihat, target sentuh 44px di perangkat sentuh, `aria-live` untuk status, dukungan `prefers-reduced-motion`, dan skip link.

## Stack

| Bagian | Teknologi |
|---|---|
| UI | React 18, Tailwind CSS 3, lucide-react |
| Build | Vite 6 |
| Data | Firebase Realtime Database (`firebase` v11) |
| Font | Plus Jakarta Sans, JetBrains Mono |

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Tanpa konfigurasi Firebase, aplikasi otomatis masuk **mode demo** dengan data simulasi.

Build produksi:

```bash
npm run build     # hasil di dist/
npm run preview   # cek hasil build secara lokal
```

Hasil build adalah situs statis, jadi bisa di-deploy ke Vercel, Netlify, Firebase Hosting, atau GitHub Pages (set `base` di `vite.config.js` kalau di-host di sub-path).

## Konfigurasi Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com), aktifkan **Realtime Database**.
2. Klik tombol **Firebase** di header, isi:
   - **Database URL** — mis. `https://nama-project-default-rtdb.asia-southeast1.firebasedatabase.app`
   - **Device / user prefix** — path node perangkat, default `device-01`
   - **Project ID** dan **Web API key** — opsional, hanya diperlukan kalau rules memakai auth
3. Simpan. Dashboard akan membaca node `/{devicePrefix}` dan mengisi skema awal kalau node masih kosong.

Konfigurasi disimpan di `localStorage` browser, bukan di server. Setiap pengguna mengisi konfigurasinya sendiri.

### Skema data

Semua data berada di bawah `/{devicePrefix}`:

```json
{
  "device-01": {
    "switch1": false,
    "switch2": true,
    "switch3": false,
    "switch4": false,
    "switch5": false,
    "switch6": false,
    "switch7": false,
    "switch8": false,
    "indicator1": 0,
    "indicator2": 1,
    "indicator3": 0,
    "indicator4": 0,
    "indicator5": 0,
    "indicator6": 0,
    "indicator7": 0,
    "indicator8": 0,
    "gauge1": 28.4,
    "gauge2": 62.5,
    "hlevel1": 48,
    "hlevel2": 74
  }
}
```

- `switch1`–`switch8`: boolean, ditulis dashboard saat relay diubah.
- `indicator1`–`indicator8`: `0` atau `1`, dibaca dari perangkat.
- `gauge1`, `gauge2`: angka dengan satuan bebas.
- `hlevel1`, `hlevel2`: angka persentase `0`–`100`.

### Rules

Contoh rules untuk pengujian (bisa dibaca dan ditulis siapa saja):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> **Peringatan keamanan.** Rules di atas berarti siapa pun yang tahu URL database bisa menyalakan relay Anda. Untuk perangkat nyata, wajib aktifkan Firebase Authentication dan batasi akses per path, misalnya:

```json
{
  "rules": {
    "device-01": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

Dashboard belum punya halaman login; kalau rules ditutup, isi **Project ID** dan **Web API key** agar SDK bisa terhubung dengan sesi yang ada.

## Struktur proyek

```
src/
├── App.jsx                  # state, koneksi Firebase, simulator, log
├── index.css                # token tema, komponen dasar, focus, reduced motion
├── components/
│   ├── Header.jsx           # status koneksi, tema, aksi cepat
│   ├── QuickStats.jsx       # ringkasan status satu baris
│   ├── RelayRack.jsx        # 8 relay + aksi batch + edit nama
│   ├── AnalogTelemetry.jsx  # gauge dan level bar
│   ├── TimeSeriesChart.jsx  # grafik tren (SVG, tanpa library chart)
│   ├── DigitalSensors.jsx   # 8 input digital
│   ├── ActivityTerminal.jsx # log, filter, ekspor
│   └── ConfigModal.jsx      # konfigurasi Firebase
├── services/firebase.js     # koneksi, baca/tulis, label, config
└── utils/exportLogs.js      # ekspor CSV/JSON
```

## Catatan

- Log aktivitas dan riwayat grafik hanya disimpan di memori; hilang saat halaman dimuat ulang.
- Aksi **Semua ON** langsung menulis ke 8 relay tanpa dialog konfirmasi.
- Latensi TX yang ditampilkan adalah durasi tulis terakhir yang sebenarnya, bukan angka acak.
