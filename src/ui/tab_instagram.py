"""Instagram Downloader Tab for OmniPic-Convert."""
import os
import tempfile
import threading
from tkinter import filedialog, messagebox
import customtkinter as ctk

from src.core.instagram import fetch_instagram_images, download_image_to_file

class InstagramTab(ctk.CTkFrame):
    """Tab for downloading high-resolution photos from Instagram posts/carousels."""
    def __init__(self, master, on_send_to_converter=None, **kwargs):
        super().__init__(master, **kwargs)
        self.on_send_to_converter = on_send_to_converter
        self.extracted_images: list[dict] = []
        self.is_fetching = False

        self._build_ui()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        # Top URL Input Section
        input_card = ctk.CTkFrame(
            self,
            corner_radius=10,
            fg_color=("#F5F5F5", "#252525"),
            border_width=1,
            border_color=("#E0E0E0", "#383838"),
        )
        input_card.grid(row=0, column=0, padx=20, pady=(15, 10), sticky="ew")
        input_card.grid_columnconfigure(0, weight=1)

        lbl_desc = ctk.CTkLabel(
            input_card,
            text="Unduh Foto Instagram (Single Post & Multi-Slide / Carousel)",
            font=ctk.CTkFont(size=13, weight="bold"),
        )
        lbl_desc.grid(row=0, column=0, columnspan=3, padx=15, pady=(10, 5), sticky="w")

        self.entry_url = ctk.CTkEntry(
            input_card,
            placeholder_text="Tempel URL Post/Reel Instagram di sini (misal: https://www.instagram.com/p/.../)",
            font=ctk.CTkFont(size=12),
            height=38,
            corner_radius=8,
        )
        self.entry_url.grid(row=1, column=0, padx=(15, 8), pady=(0, 15), sticky="ew")

        btn_paste = ctk.CTkButton(
            input_card,
            text="📋 Tempel",
            width=80,
            height=38,
            fg_color="#444444",
            hover_color="#555555",
            command=self._paste_clipboard,
            corner_radius=8,
        )
        btn_paste.grid(row=1, column=1, padx=(0, 8), pady=(0, 15))

        self.btn_fetch = ctk.CTkButton(
            input_card,
            text="🔍 Ambil Gambar",
            font=ctk.CTkFont(size=13, weight="bold"),
            width=130,
            height=38,
            command=self._start_fetch,
            corner_radius=8,
        )
        self.btn_fetch.grid(row=1, column=2, padx=(0, 15), pady=(0, 15))

        # Status & Action Bar
        self.action_bar = ctk.CTkFrame(self, fg_color="transparent")
        self.action_bar.grid(row=1, column=0, padx=20, pady=5, sticky="ew")
        self.action_bar.grid_columnconfigure(0, weight=1)

        self.lbl_status = ctk.CTkLabel(
            self.action_bar,
            text="Masukkan link postingan Instagram publik di atas lalu klik 'Ambil Gambar'.",
            font=ctk.CTkFont(size=12),
            text_color="#888888",
            anchor="w",
        )
        self.lbl_status.grid(row=0, column=0, sticky="w")

        self.btn_save_all = ctk.CTkButton(
            self.action_bar,
            text="💾 Simpan Semua",
            command=self._save_all_images,
            width=130,
            height=32,
            corner_radius=6,
        )

        self.btn_send_conv = ctk.CTkButton(
            self.action_bar,
            text="🔄 Kirim ke Converter",
            fg_color="#8E44AD",
            hover_color="#9B59B6",
            command=self._send_to_converter,
            width=150,
            height=32,
            corner_radius=6,
        )

        # Scrollable Results Frame
        self.scroll_results = ctk.CTkScrollableFrame(
            self,
            corner_radius=10,
            fg_color=("#F0F0F0", "#1E1E1E"),
            border_width=1,
            border_color=("#D0D0D0", "#333333"),
        )
        self.scroll_results.grid(row=2, column=0, padx=20, pady=(5, 15), sticky="nsew")
        self.scroll_results.grid_columnconfigure(0, weight=1)

        self.empty_result_lbl = ctk.CTkLabel(
            self.scroll_results,
            text="Belum ada gambar yang diambil.\nPostingan publik single photo maupun album (carousel) dapat diunduh di sini.",
            font=ctk.CTkFont(size=13),
            text_color="#777777",
            justify="center",
        )
        self.empty_result_lbl.pack(pady=60)

    def _paste_clipboard(self):
        try:
            clipboard_text = self.clipboard_get()
            self.entry_url.delete(0, "end")
            self.entry_url.insert(0, clipboard_text.strip())
        except Exception:
            pass

    def _start_fetch(self):
        url = self.entry_url.get().strip()
        if not url:
            messagebox.showinfo("URL Kosong", "Silakan masukkan link postingan Instagram terlebih dahulu.")
            return

        if self.is_fetching:
            return

        self.is_fetching = True
        self.btn_fetch.configure(state="disabled", text="Mengambil...")
        self.lbl_status.configure(text="Sedang menghubungi Instagram dan mengekstrak gambar...", text_color="#3399FF")

        thread = threading.Thread(target=self._fetch_worker, args=(url,), daemon=True)
        thread.start()

    def _fetch_worker(self, url: str):
        result = fetch_instagram_images(url)
        self.after(0, self._handle_fetch_result, result)

    def _handle_fetch_result(self, result: dict):
        self.is_fetching = False
        self.btn_fetch.configure(state="normal", text="🔍 Ambil Gambar")

        if not result.get("success"):
            error_msg = result.get("error", "Gagal mengambil data dari Instagram.")
            self.lbl_status.configure(text=f"❌ {error_msg}", text_color="#E74C3C")
            messagebox.showerror("Gagal", error_msg)
            return

        self.extracted_images = result.get("images", [])
        count = len(self.extracted_images)

        self.lbl_status.configure(
            text=f"✅ Ditemukan {count} gambar resolusi tinggi dari post {result.get('shortcode')}.",
            text_color="#2ECC71",
        )

        # Show action buttons
        self.btn_save_all.grid(row=0, column=1, padx=(10, 5), sticky="e")
        self.btn_send_conv.grid(row=0, column=2, padx=5, sticky="e")

        # Refresh results UI
        for widget in self.scroll_results.winfo_children():
            widget.destroy()

        for idx, item in enumerate(self.extracted_images):
            card = ctk.CTkFrame(
                self.scroll_results,
                fg_color=("#FFFFFF", "#2A2A2A"),
                corner_radius=8,
                height=50,
            )
            card.pack(fill="x", pady=4, padx=5)
            card.grid_columnconfigure(1, weight=1)

            ctk.CTkLabel(
                card,
                text=f"Foto {idx + 1}",
                font=ctk.CTkFont(size=12, weight="bold"),
                width=60,
            ).grid(row=0, column=0, padx=10, pady=10)

            # Link display preview
            url_short = item["url"][:60] + "..." if len(item["url"]) > 60 else item["url"]
            ctk.CTkLabel(
                card,
                text=f"URL: {url_short}",
                font=ctk.CTkFont(size=11),
                text_color="#AAAAAA",
                anchor="w",
            ).grid(row=0, column=1, padx=5, pady=10, sticky="ew")

            # Single download button
            btn_dl = ctk.CTkButton(
                card,
                text="💾 Unduh",
                width=80,
                height=30,
                corner_radius=6,
                command=lambda u=item["url"], fn=item["filename"]: self._download_single(u, fn),
            )
            btn_dl.grid(row=0, column=2, padx=10, pady=10)

    def _download_single(self, image_url: str, default_filename: str):
        save_path = filedialog.asksaveasfilename(
            title="Simpan Foto Instagram",
            initialfile=default_filename,
            filetypes=[("JPEG Image", "*.jpg"), ("Semua File", "*.*")],
        )
        if save_path:
            try:
                download_image_to_file(image_url, save_path)
                messagebox.showinfo("Berhasil", f"Foto berhasil disimpan ke:\n{save_path}")
            except Exception as e:
                messagebox.showerror("Gagal", f"Gagal mengunduh foto: {e}")

    def _save_all_images(self):
        if not self.extracted_images:
            return

        folder = filedialog.askdirectory(title="Pilih Folder Penyimpanan Semua Foto")
        if not folder:
            return

        self.btn_save_all.configure(state="disabled", text="Menyimpan...")

        def worker():
            saved_count = 0
            for item in self.extracted_images:
                try:
                    dest = os.path.join(folder, item["filename"])
                    download_image_to_file(item["url"], dest)
                    saved_count += 1
                except Exception as e:
                    print(f"Error saving {item['filename']}: {e}")

            self.after(
                0,
                lambda: [
                    self.btn_save_all.configure(state="normal", text="💾 Simpan Semua"),
                    messagebox.showinfo(
                        "Selesai",
                        f"Berhasil menyimpan {saved_count} dari {len(self.extracted_images)} foto ke:\n{folder}",
                    ),
                ],
            )

        threading.Thread(target=worker, daemon=True).start()

    def _send_to_converter(self):
        """Download images to temporary directory and forward to converter queue."""
        if not self.extracted_images or not self.on_send_to_converter:
            return

        self.btn_send_conv.configure(state="disabled", text="Mengirim...")

        def worker():
            temp_dir = tempfile.mkdtemp(prefix="omnipic_ig_")
            downloaded_paths = []
            for item in self.extracted_images:
                try:
                    dest = os.path.join(temp_dir, item["filename"])
                    download_image_to_file(item["url"], dest)
                    downloaded_paths.append(dest)
                except Exception as e:
                    print(f"Error downloading for converter: {e}")

            self.after(
                0,
                lambda: [
                    self.btn_send_conv.configure(state="normal", text="🔄 Kirim ke Converter"),
                    self.on_send_to_converter(downloaded_paths),
                ],
            )

        threading.Thread(target=worker, daemon=True).start()
