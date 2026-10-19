"""Converter and Compressor Tab for OmniPic-Convert."""
import os
import threading
from tkinter import filedialog, messagebox
import customtkinter as ctk

from src.core.converter import convert_image, SUPPORTED_FORMATS
from src.utils.helpers import format_bytes, validate_image_format

class ConverterTab(ctk.CTkFrame):
    """Tab for offline multi-format image conversion and compression."""
    def __init__(self, master, on_queue_change=None, **kwargs):
        super().__init__(master, **kwargs)
        self.on_queue_change = on_queue_change
        self.queued_files: list[str] = []
        self.is_converting = False
        self.output_directory: str | None = None
        
        self._build_ui()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Top Action Bar
        top_bar = ctk.CTkFrame(self, fg_color="transparent")
        top_bar.grid(row=0, column=0, padx=20, pady=(15, 10), sticky="ew")
        top_bar.grid_columnconfigure(2, weight=1)

        btn_add = ctk.CTkButton(
            top_bar,
            text="+ Tambah Gambar",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._select_files,
            width=140,
            height=36,
            corner_radius=8,
        )
        btn_add.grid(row=0, column=0, padx=(0, 10))

        btn_clear = ctk.CTkButton(
            top_bar,
            text="Bersihkan Antrean",
            fg_color="#444444",
            hover_color="#555555",
            command=self._clear_queue,
            width=130,
            height=36,
            corner_radius=8,
        )
        btn_clear.grid(row=0, column=1, padx=(0, 10))

        self.lbl_queue_stats = ctk.CTkLabel(
            top_bar,
            text="Antrean Kosong (0 file)",
            font=ctk.CTkFont(size=12),
            text_color="#888888",
            anchor="e",
        )
        self.lbl_queue_stats.grid(row=0, column=2, sticky="e")

        # Center: Scrollable File List
        self.scroll_list = ctk.CTkScrollableFrame(
            self,
            corner_radius=10,
            fg_color=("#F0F0F0", "#1E1E1E"),
            border_width=1,
            border_color=("#D0D0D0", "#333333"),
        )
        self.scroll_list.grid(row=1, column=0, padx=20, pady=5, sticky="nsew")
        self.scroll_list.grid_columnconfigure(0, weight=1)

        self.empty_label = ctk.CTkLabel(
            self.scroll_list,
            text="Tarik & lepas gambar ke sini, atau klik tombol '+ Tambah Gambar'\n\nFormat didukung: HEIC, PNG, JPG, WEBP, AVIF, BMP, TIFF, ICO, GIF",
            font=ctk.CTkFont(size=13),
            text_color="#777777",
            justify="center",
        )
        self.empty_label.pack(pady=60)

        # Bottom Options & Controls
        options_panel = ctk.CTkFrame(
            self,
            corner_radius=10,
            fg_color=("#F5F5F5", "#252525"),
            border_width=1,
            border_color=("#E0E0E0", "#383838"),
        )
        options_panel.grid(row=2, column=0, padx=20, pady=(10, 15), sticky="ew")
        options_panel.grid_columnconfigure((0, 1, 2, 3), weight=1)

        # Option: Target Format
        ctk.CTkLabel(options_panel, text="Format Target:", font=ctk.CTkFont(size=12, weight="bold")).grid(
            row=0, column=0, padx=15, pady=(10, 2), sticky="w"
        )
        self.combo_format = ctk.CTkComboBox(
            options_panel,
            values=SUPPORTED_FORMATS,
            state="readonly",
            width=130,
            corner_radius=8,
        )
        self.combo_format.set("WEBP")
        self.combo_format.grid(row=1, column=0, padx=15, pady=(0, 10), sticky="w")

        # Option: Quality Slider
        quality_frame = ctk.CTkFrame(options_panel, fg_color="transparent")
        quality_frame.grid(row=0, column=1, rowspan=2, padx=15, pady=5, sticky="ew")
        quality_frame.grid_columnconfigure(0, weight=1)

        self.lbl_quality = ctk.CTkLabel(
            quality_frame,
            text="Kualitas: 85%",
            font=ctk.CTkFont(size=12, weight="bold"),
        )
        self.lbl_quality.pack(anchor="w", pady=(5, 2))

        self.slider_quality = ctk.CTkSlider(
            quality_frame,
            from_=10,
            to=100,
            number_of_steps=90,
            command=self._on_quality_change,
            width=160,
        )
        self.slider_quality.set(85)
        self.slider_quality.pack(fill="x", pady=(0, 5))

        # Option: Resize scale
        ctk.CTkLabel(options_panel, text="Dimensi / Ukuran:", font=ctk.CTkFont(size=12, weight="bold")).grid(
            row=0, column=2, padx=15, pady=(10, 2), sticky="w"
        )
        self.combo_resize = ctk.CTkComboBox(
            options_panel,
            values=["Asli (100%)", "75%", "50%", "25%"],
            state="readonly",
            width=130,
            corner_radius=8,
        )
        self.combo_resize.set("Asli (100%)")
        self.combo_resize.grid(row=1, column=2, padx=15, pady=(0, 10), sticky="w")

        # Option: Output destination
        dest_frame = ctk.CTkFrame(options_panel, fg_color="transparent")
        dest_frame.grid(row=0, column=3, rowspan=2, padx=15, pady=5, sticky="ew")

        ctk.CTkLabel(dest_frame, text="Folder Output:", font=ctk.CTkFont(size=12, weight="bold")).pack(
            anchor="w", pady=(5, 2)
        )
        self.btn_dest = ctk.CTkButton(
            dest_frame,
            text="Folder Asal",
            fg_color="#3B3B3B",
            hover_color="#4C4C4C",
            command=self._select_output_dir,
            width=130,
            height=28,
            corner_radius=6,
        )
        self.btn_dest.pack(anchor="w", pady=(0, 5))

        # Execution Bar (Progress + CTA)
        exec_bar = ctk.CTkFrame(self, fg_color="transparent")
        exec_bar.grid(row=3, column=0, padx=20, pady=(0, 15), sticky="ew")
        exec_bar.grid_columnconfigure(0, weight=1)

        self.progress_bar = ctk.CTkProgressBar(exec_bar, height=10)
        self.progress_bar.set(0)
        self.progress_bar.grid(row=0, column=0, padx=(0, 15), sticky="ew")

        self.btn_convert = ctk.CTkButton(
            exec_bar,
            text="⚡ Mulai Konversi & Kompresi",
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self._start_conversion,
            width=230,
            height=42,
            corner_radius=8,
        )
        self.btn_convert.grid(row=0, column=1, sticky="e")

        self.lbl_status = ctk.CTkLabel(
            self,
            text="",
            font=ctk.CTkFont(size=11),
            text_color="#999999",
        )
        self.lbl_status.grid(row=4, column=0, padx=20, pady=(0, 10), sticky="w")

    def _on_quality_change(self, value):
        self.lbl_quality.configure(text=f"Kualitas: {int(value)}%")

    def _select_files(self):
        filetypes = [
            ("Semua Gambar", "*.heic *.heif *.png *.jpg *.jpeg *.webp *.avif *.bmp *.tiff *.tif *.ico *.gif"),
            ("Apple HEIC/HEIF", "*.heic *.heif"),
            ("JPEG/JPG", "*.jpg *.jpeg"),
            ("PNG", "*.png"),
            ("WebP", "*.webp"),
            ("Semua File", "*.*"),
        ]
        files = filedialog.askopenfilenames(
            title="Pilih Gambar untuk Dikonversi",
            filetypes=filetypes,
        )
        if files:
            self.add_files(list(files))

    def add_files(self, paths: list[str]):
        """Add files to queue and refresh list UI."""
        for p in paths:
            if os.path.isfile(p) and p not in self.queued_files:
                ext = os.path.splitext(p)[1]
                if validate_image_format(ext):
                    self.queued_files.append(p)
        self._refresh_list_ui()

    def _clear_queue(self):
        if self.is_converting:
            return
        self.queued_files.clear()
        self._refresh_list_ui()

    def _select_output_dir(self):
        folder = filedialog.askdirectory(title="Pilih Folder Penyimpanan Hasil")
        if folder:
            self.output_directory = folder
            folder_name = os.path.basename(folder)
            display_name = folder_name if len(folder_name) < 16 else folder_name[:13] + "..."
            self.btn_dest.configure(text=f"📁 {display_name}")

    def _refresh_list_ui(self):
        # Clear existing rows
        for widget in self.scroll_list.winfo_children():
            widget.destroy()

        count = len(self.queued_files)
        if count == 0:
            self.empty_label = ctk.CTkLabel(
                self.scroll_list,
                text="Tarik & lepas gambar ke sini, atau klik tombol '+ Tambah Gambar'\n\nFormat didukung: HEIC, PNG, JPG, WEBP, AVIF, BMP, TIFF, ICO, GIF",
                font=ctk.CTkFont(size=13),
                text_color="#777777",
                justify="center",
            )
            self.empty_label.pack(pady=60)
            self.lbl_queue_stats.configure(text="Antrean Kosong (0 file)")
            return

        total_bytes = sum(os.path.getsize(f) for f in self.queued_files if os.path.exists(f))
        self.lbl_queue_stats.configure(
            text=f"Total: {count} file ({format_bytes(total_bytes)})"
        )

        for idx, file_path in enumerate(self.queued_files):
            row_frame = ctk.CTkFrame(
                self.scroll_list,
                fg_color=("#FFFFFF", "#2A2A2A"),
                corner_radius=6,
                height=38,
            )
            row_frame.pack(fill="x", pady=2, padx=2)
            row_frame.grid_columnconfigure(1, weight=1)

            # Icon / Index
            ctk.CTkLabel(
                row_frame,
                text=f"{idx + 1}.",
                font=ctk.CTkFont(size=12, weight="bold"),
                width=30,
            ).grid(row=0, column=0, padx=5, pady=5)

            # File name
            name = os.path.basename(file_path)
            ctk.CTkLabel(
                row_frame,
                text=name,
                font=ctk.CTkFont(size=12),
                anchor="w",
            ).grid(row=0, column=1, padx=5, pady=5, sticky="ew")

            # File size
            size_str = format_bytes(os.path.getsize(file_path)) if os.path.exists(file_path) else "0 B"
            ctk.CTkLabel(
                row_frame,
                text=size_str,
                font=ctk.CTkFont(size=11),
                text_color="#888888",
                width=80,
                anchor="e",
            ).grid(row=0, column=2, padx=5, pady=5)

            # Delete button
            btn_del = ctk.CTkButton(
                row_frame,
                text="✕",
                width=24,
                height=24,
                fg_color="#CC3333",
                hover_color="#EE4444",
                corner_radius=4,
                command=lambda p=file_path: self._remove_file(p),
            )
            btn_del.grid(row=0, column=3, padx=8, pady=5)

    def _remove_file(self, file_path: str):
        if file_path in self.queued_files:
            self.queued_files.remove(file_path)
            self._refresh_list_ui()

    def _start_conversion(self):
        if not self.queued_files:
            messagebox.showinfo("Antrean Kosong", "Silakan tambahkan setidaknya 1 gambar terlebih dahulu.")
            return

        if self.is_converting:
            return

        self.is_converting = True
        self.btn_convert.configure(state="disabled", text="Sedang Memproses...")
        self.progress_bar.set(0)
        self.lbl_status.configure(text="Memulai konversi...", text_color="#3399FF")

        # Parse options
        target_fmt = self.combo_format.get()
        quality = int(self.slider_quality.get())
        resize_str = self.combo_resize.get()
        resize_pct = 100
        if "75%" in resize_str:
            resize_pct = 75
        elif "50%" in resize_str:
            resize_pct = 50
        elif "25%" in resize_str:
            resize_pct = 25

        # Background thread execution
        thread = threading.Thread(
            target=self._run_conversion_worker,
            args=(list(self.queued_files), target_fmt, quality, resize_pct, self.output_directory),
            daemon=True,
        )
        thread.start()

    def _run_conversion_worker(self, files: list[str], target_fmt: str, quality: int, resize_pct: int, output_dir: str | None):
        total = len(files)
        success_count = 0
        total_original_bytes = 0
        total_output_bytes = 0

        for i, file_path in enumerate(files):
            try:
                res = convert_image(
                    input_path=file_path,
                    target_format=target_fmt,
                    quality=quality,
                    resize_percent=resize_pct,
                    output_dir=output_dir,
                )
                success_count += 1
                total_original_bytes += res["original_size"]
                total_output_bytes += res["output_size"]
            except Exception as e:
                print(f"Error converting {file_path}: {e}")

            progress = (i + 1) / total
            self.after(0, self._update_progress, progress, i + 1, total)

        self.after(
            0,
            self._finish_conversion,
            success_count,
            total,
            total_original_bytes,
            total_output_bytes,
        )

    def _update_progress(self, progress: float, current: int, total: int):
        self.progress_bar.set(progress)
        self.lbl_status.configure(text=f"Memproses gambar {current} dari {total}...")

    def _finish_conversion(self, success: int, total: int, orig_bytes: int, out_bytes: int):
        self.is_converting = False
        self.btn_convert.configure(state="normal", text="⚡ Mulai Konversi & Kompresi")
        self.progress_bar.set(1.0)

        saved_bytes = orig_bytes - out_bytes
        pct = (saved_bytes / orig_bytes * 100) if orig_bytes > 0 else 0

        msg = (
            f"✅ Selesai! Berhasil mengonversi {success} dari {total} gambar.\n"
            f"Ukuran Asal: {format_bytes(orig_bytes)} ➔ Ukuran Baru: {format_bytes(out_bytes)}\n"
            f"Hemat Ruang: {format_bytes(saved_bytes)} ({pct:.1f}% kompresi)"
        )
        self.lbl_status.configure(text=f"Selesai! {success}/{total} gambar diproses. Hemat {pct:.1f}% ruang.", text_color="#2ECC71")
        messagebox.showinfo("Konversi Berhasil", msg)
