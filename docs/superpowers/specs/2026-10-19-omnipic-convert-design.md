# Architecture Specification: OmniPic-Convert

**Target Repository:** `muammarRM/OmniPic-Convert`  
**Date:** 2026-10-19  
**Platform:** Windows Desktop Application (`.exe`), 100% Offline Capable  
**Author:** Antigravity (Pair Programming with User)

---

## 1. Executive Summary & Goals

**OmniPic-Convert** is an all-in-one, modern Windows desktop application designed to:
1. **Convert & Compress Any Image Offline:** Support seamless format transformation between `HEIC` (Apple iPhone), `JPG`, `PNG`, `WEBP`, `AVIF`, `BMP`, `TIFF`, `ICO`, and `GIF` completely offline with zero data sent to external servers.
2. **Advanced Compression & Optimization:** Provide lossy/lossless compression with a quality percentage slider, custom resolution scaling, and batch queue execution.
3. **Instagram Image Grabber:** When connected to the internet, allow users to paste public Instagram post or carousel URLs, extract high-resolution photos, and either save them locally or pipe them directly into the conversion/compression queue with a single click.
4. **Maintenance & Packaging:** Built using Python 3.13, `CustomTkinter` (sleek dark/light UI), `Pillow` + `pillow-heif`, and compiled into a standalone Windows `.exe` via `PyInstaller`.
5. **Quality Assurance:** 100% test coverage on core conversion and parsing engines prior to executable compilation.

---

## 2. System Architecture & Component Design

The codebase strictly enforces the **Separation of Concerns (SoC)** principle, isolating business logic from the graphical user interface.

```
OmniPic-Convert/
├── .gitignore                      # Strict anti-leak & temporary file patterns
├── LICENSE                         # MIT License
├── README.md                       # GitHub documentation with screenshots & badges
├── requirements.txt                # Python dependencies
├── main.py                         # Desktop application entrypoint
├── src/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── converter.py            # Offline conversion, compression, resize, format matrix
│   │   └── instagram.py            # Instagram post/carousel public image extractor
│   ├── ui/
│   │   ├── __init__.py
│   │   ├── app.py                  # Main CustomTkinter window & navigation sidebar
│   │   ├── tab_converter.py        # Tab 1: Converter & Compressor UI
│   │   └── tab_instagram.py        # Tab 2: Instagram Downloader UI
│   └── utils/
│       ├── __init__.py
│       └── helpers.py              # File size formatter, image info helpers
├── tests/
│   ├── __init__.py
│   ├── test_converter.py           # Unit tests for HEIC, PNG, JPG, WebP, compression, resize
│   └── test_instagram.py           # Unit tests for link validation and extraction logic
```

### 2.1 Core Conversion & Compression Engine (`src/core/converter.py`)
- **Format Support Matrix:**
  - Input: `HEIC`, `HEIF`, `JPG`, `JPEG`, `PNG`, `WEBP`, `AVIF`, `BMP`, `TIFF`, `ICO`, `GIF`.
  - Output: `JPG`, `PNG`, `WEBP`, `AVIF`, `HEIC`, `BMP`, `TIFF`, `ICO`.
- **HEIC Integration:** Native reading and writing powered by `pillow-heif` registered into PIL.
- **Color Profile & Transparency Safety:**
  - Automatic `RGBA` to `RGB` translation with white background when converting transparent PNG/WebP to JPEG.
  - CMYK to RGB conversion safeguard for camera/print assets.
- **Compression Logic:**
  - Configurable quality parameter `(1 - 100)`.
  - `optimize=True` for PNG and JPEG.
  - Dimension scaling (maintain aspect ratio or custom width/height).
  - EXIF handling (option to keep or strip metadata for privacy).

### 2.2 Instagram Image Extractor (`src/core/instagram.py`)
- **Input:** Standard Instagram URLs (`https://www.instagram.com/p/{shortcode}/`, `https://www.instagram.com/reel/{shortcode}/`).
- **Extraction Protocol:**
  - Extracts shortcode from URL.
  - Queries public GraphQL / post info endpoint with randomized realistic headers without requiring paid API keys or user login credentials.
  - Supports single image posts and multi-image carousel sets.
- **Output:** Structured list of high-res image URLs with metadata and thumbnail preview URLs.
- **Direct Pipe:** Ability to stream image bytes directly into the converter queue.

### 2.3 Graphical User Interface (`src/ui/`)
- Powered by **CustomTkinter** for high-DPI scaling and modern Windows 11 aesthetics.
- **Tab 1: Converter & Compressor:**
  - Drag-and-drop / file selector supporting multi-file queue.
  - Per-item or batch target format dropdown.
  - Quality slider (10% to 100%) with real-time feedback.
  - Resize controls (Original, 75%, 50%, 25%, or custom width).
  - Background threading (`threading.Thread`) to ensure UI remains fluid during heavy batch processing.
  - Progress bar and status report.
- **Tab 2: Instagram Downloader:**
  - URL input box with clear and paste buttons.
  - Fetch button with loading indicator.
  - Scrollable grid preview of extracted photos.
  - Action buttons: "Download Selected", "Download All as ZIP/Folder", and "Send to Converter".

---

## 3. Error Handling & Edge Cases

1. **HEIC / iPhone Specifics:** Handle Apple live photos and burst sequences gracefully; ensure `pillow_heif.register_heif_opener()` is initialized at startup.
2. **Network Failures (Instagram):** Timeout guards (10s), user-friendly error banners when post is private or link is invalid.
3. **File Lock / Permission Issues:** Atomic file write with automatic renaming (`filename_converted.ext`) if the source and target path collide.
4. **Memory Management:** Stream large images and close file descriptors immediately after conversion.

---

## 4. Testing & Verification Strategy

Before generating the `.exe`, automated test suites will run:
1. `test_converter.py`:
   - Generate programmatically synthetic images (RGB and RGBA).
   - Test conversion: Synthetic Image -> HEIC -> PNG -> JPG -> WebP.
   - Verify file headers and readability.
   - Verify compression reduces file byte size when quality is lowered.
   - Verify image dimensions after resize operation.
2. `test_instagram.py`:
   - Verify shortcode extraction regex across varied URL formats.
   - Mock network responses to ensure carousel parsing returns expected image arrays.

---

## 5. Build & Packaging Pipeline

Using PyInstaller to generate a single standalone `.exe`:
```bash
pyinstaller --noconfirm --onedir --windowed --name "OmniPic-Convert" \
  --add-data "src;src" \
  main.py
```
*(Or `--onefile` depending on performance requirements)*.

---

## 6. Repository Hygiene & Git Setup

Strict adherence to anti-leak rules:
- Prohibited from Git remote: scratch scripts, intermediate binaries, prompt archives.
- Initial commit includes `.gitignore`, `LICENSE`, `README.md`, full source code, and passing tests.
