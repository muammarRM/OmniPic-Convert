# OmniPic-Convert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% offline-capable Windows desktop application (`OmniPic-Convert`) for converting and compressing any image format (including Apple HEIC) and fetching Instagram post/carousel photos, packaged as an executable (.exe) and ready for GitHub (`muammarRM/OmniPic-Convert`).

**Architecture:** Pure Python 3.13 architecture using `CustomTkinter` for modern desktop UI, `Pillow` + `pillow-heif` for image conversion/compression, `requests` for Instagram public media scraping, and `PyInstaller` for `.exe` distribution. Core business logic is isolated in `src/core/` and rigorously tested via `unittest` prior to UI packaging.

**Tech Stack:** Python 3.13, CustomTkinter, Pillow, pillow-heif, Requests, PyInstaller, Unittest.

**Spec:** [`docs/superpowers/specs/2026-10-19-omnipic-convert-design.md`](file:///d:/ZIIPROJECT/Converter/docs/superpowers/specs/2026-10-19-omnipic-convert-design.md)

## Global Constraints

- Platform: Windows Desktop Application (`.exe`).
- Conversion and compression MUST function 100% offline without external network calls.
- HEIC (iPhone) format reading and writing MUST be supported natively via `pillow-heif`.
- Core conversion logic must automatically handle color spaces (e.g. RGBA to RGB for JPEG, CMYK to RGB).
- Tests must pass 100% before packaging.
- Strict anti-leak repository hygiene (no scratch/dummy/prompt files in Git commits).

## Review Focus

- **HEIC Conversion:** Apple HEIC files converted to JPG/PNG must not throw missing decoder errors.
- **Transparency Safeguard:** Converting transparent PNG/WebP to JPG must fill alpha channel with white instead of producing black backgrounds or crashing.
- **Extreme Compression / Small File Quality:** Setting quality to low values (e.g. 10%) must produce valid uncorrupted files with smaller byte size.
- **Invalid Instagram Links:** Submitting a malformed or private Instagram URL must return a clean error without freezing the desktop UI.
- **Large Dimension Scaling:** Resizing images by percentage or custom width must preserve aspect ratios without integer division rounding errors.

---

### Task 1: Environment Foundation & Helper Utilities

**Files:**
- Create: `requirements.txt`
- Create: `src/__init__.py`
- Create: `src/utils/__init__.py`
- Create: `src/utils/helpers.py`
- Test: `tests/__init__.py`
- Test: `tests/test_helpers.py`

**Interfaces:**
- Produces: `format_bytes(size_bytes: int) -> str`
- Produces: `get_safe_output_path(source_path: str, target_ext: str, output_dir: str | None = None) -> str`
- Produces: `validate_image_format(ext: str) -> bool`

- [ ] **Step 1: Write failing test in `tests/test_helpers.py`**
  ```python
  import unittest
  from src.utils.helpers import format_bytes, get_safe_output_path, validate_image_format

  class TestHelpers(unittest.TestCase):
      def test_format_bytes(self):
          self.assertEqual(format_bytes(500), "500 B")
          self.assertEqual(format_bytes(1024), "1.00 KB")
          self.assertEqual(format_bytes(1024 * 1024), "1.00 MB")

      def test_validate_image_format(self):
          self.assertTrue(validate_image_format("heic"))
          self.assertTrue(validate_image_format(".jpg"))
          self.assertFalse(validate_image_format("exe"))

      def test_get_safe_output_path(self):
          path = get_safe_output_path("sample.png", "jpg")
          self.assertTrue(path.endswith(".jpg"))
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `python -m unittest tests/test_helpers.py`
  Expected: FAIL with ModuleNotFoundError or ImportError

- [ ] **Step 3: Implement `src/utils/helpers.py` and `requirements.txt`**
  Add dependency specifications in `requirements.txt` and implement helper functions for byte formatting, path generation, and format extension validation.

- [ ] **Step 4: Run test to verify it passes**
  Run: `python -m unittest tests/test_helpers.py`
  Expected: OK (all tests pass)

- [ ] **Step 5: Commit**
  ```bash
  git add requirements.txt src/ utils/ tests/
  git commit -m "feat: add project helpers and requirements"
  ```

---

### Task 2: Core Offline Image Converter & Compressor

**Files:**
- Create: `src/core/__init__.py`
- Create: `src/core/converter.py`
- Test: `tests/test_converter.py`

**Interfaces:**
- Consumes: `src.utils.helpers.get_safe_output_path`
- Produces: `convert_image(input_path: str, output_path: str, target_format: str, quality: int = 85, resize_percent: int = 100, custom_width: int | None = None) -> dict`
- Produces: `SUPPORTED_FORMATS: list[str]` (`HEIC`, `JPG`, `PNG`, `WEBP`, `AVIF`, `BMP`, `TIFF`, `ICO`, `GIF`)

- [ ] **Step 1: Write failing tests in `tests/test_converter.py`**
  ```python
  import unittest
  import os
  from PIL import Image
  from src.core.converter import convert_image, SUPPORTED_FORMATS

  class TestConverter(unittest.TestCase):
      def setUp(self):
          self.test_img_path = "test_source.png"
          img = Image.new("RGBA", (200, 200), color=(255, 0, 0, 128))
          img.save(self.test_img_path)

      def tearDown(self):
          if os.path.exists(self.test_img_path):
              os.remove(self.test_img_path)
          for f in ["test_out.jpg", "test_out.webp", "test_out.heic"]:
              if os.path.exists(f):
                  os.remove(f)

      def test_supported_formats(self):
          self.assertIn("HEIC", SUPPORTED_FORMATS)
          self.assertIn("WEBP", SUPPORTED_FORMATS)
          self.assertIn("JPG", SUPPORTED_FORMATS)

      def test_convert_png_to_jpg_with_transparency(self):
          res = convert_image(self.test_img_path, "test_out.jpg", target_format="JPG", quality=80)
          self.assertTrue(os.path.exists(res["output_path"]))
          self.assertTrue(res["output_size"] > 0)

      def test_convert_to_heic(self):
          res = convert_image(self.test_img_path, "test_out.heic", target_format="HEIC", quality=75)
          self.assertTrue(os.path.exists(res["output_path"]))

      def test_resize_scaling(self):
          res = convert_image(self.test_img_path, "test_out.webp", target_format="WEBP", resize_percent=50)
          self.assertEqual(res["new_dimensions"], (100, 100))
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `python -m unittest tests/test_converter.py`
  Expected: FAIL with ModuleNotFoundError: No module named 'src.core.converter'

- [ ] **Step 3: Implement `src/core/converter.py`**
  - Register `pillow_heif.register_heif_opener()`.
  - Handle transparency: if converting RGBA to JPEG/BMP/ICO, create an RGB image with white canvas and paste using alpha mask.
  - Apply quality parameters (`quality=quality`, `optimize=True`).
  - Calculate dimension resizing preserving aspect ratio.
  - Return metadata dict: `{"input_path": ..., "output_path": ..., "original_size": ..., "output_size": ..., "compression_ratio": ..., "new_dimensions": ...}`.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `python -m unittest tests/test_converter.py`
  Expected: OK

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/ tests/test_converter.py
  git commit -m "feat: implement offline image converter and compression engine"
  ```

---

### Task 3: Instagram Image Extractor

**Files:**
- Create: `src/core/instagram.py`
- Test: `tests/test_instagram.py`

**Interfaces:**
- Produces: `extract_shortcode(url: str) -> str | None`
- Produces: `fetch_instagram_images(url: str) -> dict`
  - Output dict structure: `{"success": bool, "shortcode": str, "title": str, "images": list[dict], "error": str | None}`
  - Image item structure: `{"url": str, "filename": str, "is_video": bool}`
- Produces: `download_image_to_file(image_url: str, save_path: str) -> str`

- [ ] **Step 1: Write failing tests in `tests/test_instagram.py`**
  ```python
  import unittest
  from src.core.instagram import extract_shortcode

  class TestInstagram(unittest.TestCase):
      def test_extract_shortcode_standard_post(self):
          url = "https://www.instagram.com/p/C-abc123XYZ/"
          self.assertEqual(extract_shortcode(url), "C-abc123XYZ")

      def test_extract_shortcode_reel(self):
          url = "https://www.instagram.com/reel/C-abc123XYZ/?utm_source=ig_web"
          self.assertEqual(extract_shortcode(url), "C-abc123XYZ")

      def test_extract_invalid_url(self):
          self.assertIsNone(extract_shortcode("https://google.com/test"))
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `python -m unittest tests/test_instagram.py`
  Expected: FAIL with ModuleNotFoundError

- [ ] **Step 3: Implement `src/core/instagram.py`**
  - Implement shortcode regex `r"(?:p|reel|tv)/([A-Za-z0-9_-]+)"`.
  - Implement `fetch_instagram_images` with standard Instagram public queries and fallback mechanisms.
  - Implement `download_image_to_file` streaming image bytes to local disk.

- [ ] **Step 4: Run test to verify it passes**
  Run: `python -m unittest tests/test_instagram.py`
  Expected: OK

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/instagram.py tests/test_instagram.py
  git commit -m "feat: implement Instagram media extractor and downloader"
  ```

---

### Task 4: Modern Desktop GUI (CustomTkinter)

**Files:**
- Create: `src/ui/__init__.py`
- Create: `src/ui/app.py`
- Create: `src/ui/tab_converter.py`
- Create: `src/ui/tab_instagram.py`
- Create: `main.py`

**Interfaces:**
- Consumes: `src.core.converter.convert_image`, `src.core.converter.SUPPORTED_FORMATS`
- Consumes: `src.core.instagram.fetch_instagram_images`, `src.core.instagram.download_image_to_file`
- Produces: `OmniPicApp` (CustomTkinter main application window)

- [ ] **Step 1: Build `src/ui/tab_converter.py`**
  - File picker button & drag-and-drop file list table.
  - Target format dropdown (`JPG`, `PNG`, `WEBP`, `AVIF`, `HEIC`, `BMP`, `TIFF`, `ICO`).
  - Quality slider (`10% - 100%`) with dynamic numeric label.
  - Resize options (`Original`, `75%`, `50%`, `25%`, `Custom Width`).
  - Background thread processing with progress bar and success summary.

- [ ] **Step 2: Build `src/ui/tab_instagram.py`**
  - Instagram URL entry field with Paste button.
  - "Fetch Photos" button with status indicator.
  - Scrollable photo cards with thumbnails.
  - "Save to Folder" and "Send to Converter" direct action buttons.

- [ ] **Step 3: Build `src/ui/app.py` & `main.py`**
  - Dark mode by default (`set_appearance_mode("Dark")`, `set_default_color_theme("blue")`).
  - TabView containing Converter Tab and Instagram Tab.
  - Header with app title: `OmniPic-Convert` and version info.
  - `main.py` executes `app.mainloop()`.

- [ ] **Step 4: Verify UI initializes headlessly/programmatically**
  Run: `python -c "import main; print('Main imports successfully')"`
  Expected: "Main imports successfully"

- [ ] **Step 5: Commit**
  ```bash
  git add src/ui/ main.py
  git commit -m "feat: implement modern CustomTkinter desktop interface"
  ```

---

### Task 5: End-to-End Automated Testing & Pre-Commit Verification

**Files:**
- Create: `tests/test_e2e_pipeline.py`

- [ ] **Step 1: Write integration test exercising full pipeline**
  - Generate synthetic image file.
  - Convert through converter engine into multiple target formats (HEIC, WebP, JPG, PNG).
  - Verify output file sizes and dimension changes.
  - Clean up all test output files.

- [ ] **Step 2: Run all project test suites**
  Run: `python -m unittest discover tests`
  Expected: All tests pass with 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add tests/
  git commit -m "test: add comprehensive end-to-end conversion verification"
  ```

---

### Task 6: GitHub Repository Setup & Executable (.exe) Build

**Files:**
- Create: `README.md`
- Create: `LICENSE` (MIT)
- Create: `build_exe.py` or PyInstaller command script

- [ ] **Step 1: Create `README.md` and `LICENSE`**
  - Clear English & Indonesian instructions.
  - Feature highlights (Offline, HEIC support, Compressor, Instagram Downloader).
  - Installation, usage guide, and build instructions.
  - Link to GitHub: `muammarRM/OmniPic-Convert`.

- [ ] **Step 2: Build Standalone Executable (.exe) with PyInstaller**
  Run PyInstaller build command:
  ```bash
  pyinstaller --noconfirm --onedir --windowed --name "OmniPic-Convert" main.py
  ```
  Expected: Executable successfully generated in `dist/OmniPic-Convert/OmniPic-Convert.exe`.

- [ ] **Step 3: Mandatory Pre-Commit & Pre-Push Hygiene Audit**
  - Verify `.gitignore` ignores `build/`, `dist/`, `__pycache__/`, temporary files.
  - Run `git status` to ensure only clean source files are staged.
  - Final commit.
