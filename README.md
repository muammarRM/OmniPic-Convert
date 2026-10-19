# 🎨 OmniPic-Convert

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.13+-brightgreen.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)](https://microsoft.com)
[![Offline Capable](https://img.shields.io/badge/Offline-100%25%20Capable-success.svg)](#)

> **OmniPic-Convert** adalah aplikasi desktop Windows modern dan ringan untuk konversi dan kompresi berbagai format gambar (termasuk **Apple HEIC**) secara **100% offline**, dilengkapi fitur pengunduh foto resolusi penuh dari Instagram.

---

## ✨ Fitur Utama

### 1. 🔄 Konverter Gambar Universal (100% Offline)
- **Konversi Antar-Format Lengkap:** Mengubah gambar dari dan ke format:
  - **Apple iPhone:** `HEIC` / `HEIF`
  - **Modern Web:** `WEBP`, `AVIF`, `PNG`, `JPG` / `JPEG`
  - **Grafik & Ikon:** `BMP`, `TIFF`, `ICO` (Windows Icon), `GIF`
- **Batch Processing:** Masukkan puluhan file sekaligus dan ubah semuanya hanya dengan 1 klik.
- **Proteksi Transparansi:** Konversi file transparan (PNG/WebP) ke JPG secara otomatis diberi latar belakang putih bersih tanpa menghasilkan visual artefak hitam.

### 2. ⚡ Mesin Kompresi & Optimasi Ukuran
- **Quality Slider (10% - 100%):** Kontrol granular antara kualitas visual dan rasio kompresi.
- **Penskalaan Dimensi (Resize):** Opsi instan untuk mengecilkan dimensi (`75%`, `50%`, `25%`, atau custom width).
- **Statistik Kompresi:** Menampilkan rincian hemat byte (*space saved*) setelah proses selesai.

### 3. 📸 Pengunduh Foto Instagram (Single & Carousel)
- Ekstrak foto beresolusi tinggi langsung dari tautan postingan Instagram publik (`/p/`, `/reel/`, `/tv/`).
- Mendukung postingan tunggal (*single post*) maupun album multi-slide (*carousel*).
- **Direct Pipeline:** Foto yang diunduh dari Instagram bisa langsung dikirim ke antrean Converter dengan tombol **"Kirim ke Converter"**.

### 4. 💻 Antarmuka Desktop Modern (Dark Mode)
- Dibangun dengan **CustomTkinter** untuk tampilan elegan ala Windows 11.
- Multi-threading terisolasi: Aplikasi tidak pernah macet (*freeze*) saat memproses file besar.

---

## 🏗️ Struktur Proyek

```
OmniPic-Convert/
├── src/
│   ├── core/
│   │   ├── converter.py       # Mesin konversi, kompresi, & penanganan format
│   │   └── instagram.py       # Ekstraktor media publik Instagram
│   ├── ui/
│   │   ├── app.py             # Jendela utama & navigasi tab
│   │   ├── tab_converter.py   # UI Konverter & Kompresor
│   │   └── tab_instagram.py   # UI Instagram Downloader
│   └── utils/
│       └── helpers.py         # Formatter ukuran, validasi, & penanganan path
├── tests/                     # Suite pengujian otomatis (18+ tests)
├── build_exe.py               # Skrip otomatis kompilasi ke Windows .exe
├── main.py                    # Entrypoint aplikasi desktop
├── requirements.txt           # Daftar dependensi Python
└── README.md
```

---

## 🚀 Panduan Instalasi & Menjalankan

### Persyaratan Sistem
- Windows 10 atau 11
- Python 3.10 atau yang lebih baru

### 1. Clone Repositori
```bash
git clone https://github.com/muammarRM/OmniPic-Convert.git
cd OmniPic-Convert
```

### 2. Pasang Dependensi
```bash
pip install -r requirements.txt
```

### 3. Jalankan Aplikasi
```bash
python main.py
```

---

## 🧪 Pengujian Otomatis (Unit & Integration Tests)

Semua fungsionalitas inti telah divalidasi dengan pengujian otomatis sebelum dirilis:

```bash
python -m unittest discover tests
```

Output:
```text
Ran 18 tests in 0.678s
OK
```

---

## 📦 Kompilasi ke Standalone Windows `.exe`

Untuk membuat file executable mandiri (`.exe`) yang dapat dibagikan dan dijalankan di komputer tanpa perlu menginstal Python:

```bash
python build_exe.py
```

File `.exe` akan langsung tersedia di:
```
dist/OmniPic-Convert/OmniPic-Convert.exe
```

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE). Hak Cipta (c) 2026 **muammarRM**.
