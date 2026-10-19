"""Main desktop application window for OmniPic-Convert with native stable Drag & Drop."""
import customtkinter as ctk
from tkinterdnd2 import TkinterDnD, DND_FILES
from src.ui.tab_converter import ConverterTab
from src.ui.tab_instagram import InstagramTab

class OmniPicApp(ctk.CTk, TkinterDnD.DnDWrapper):
    """Main application container with stable TkinterDnD drag-and-drop."""
    def __init__(self):
        super().__init__()

        # Initialize TkinterDnD wrapper safely
        try:
            self.TkdndVersion = TkinterDnD._require(self)
        except Exception as e:
            print(f"TkinterDnD initialization note: {e}")

        # Window Configuration
        self.title("OmniPic-Convert — Offline Image Converter, Compressor & Instagram Studio")
        self.geometry("980x720")
        self.minsize(850, 600)

        # Apply Modern Dark Theme
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        self._build_ui()
        self._setup_global_drag_and_drop()

    def _setup_global_drag_and_drop(self):
        """Register native drag and drop on main window."""
        try:
            self.drop_target_register(DND_FILES)
            self.dnd_bind("<<Drop>>", self._on_global_drop)
        except Exception as e:
            print(f"Global Drag & Drop register note: {e}")

    def _on_global_drop(self, event):
        """Handler when files are dropped anywhere onto the application window."""
        try:
            raw_data = getattr(event, "data", "")
            if raw_data:
                files = list(self.tk.splitlist(raw_data))
                self.tab_converter.add_files(files)
                self.tabview.set("🔄 Konverter & Kompresi Gambar (Offline)")
        except Exception as e:
            print(f"Error handling dropped files: {e}")

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header Bar
        header = ctk.CTkFrame(self, fg_color=("#E5E5E5", "#181818"), height=55, corner_radius=0)
        header.grid(row=0, column=0, sticky="ew")
        header.grid_columnconfigure(1, weight=1)

        title_lbl = ctk.CTkLabel(
            header,
            text="OmniPic-Convert",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=("#1A1A1A", "#FFFFFF"),
        )
        title_lbl.grid(row=0, column=0, padx=(20, 10), pady=12, sticky="w")

        badge_offline = ctk.CTkLabel(
            header,
            text="🔒 100% Offline Capable",
            font=ctk.CTkFont(size=11, weight="bold"),
            fg_color=("#D1E7DD", "#1E3A2F"),
            text_color=("#0F5132", "#48C774"),
            corner_radius=6,
            padx=10,
            pady=2,
        )
        badge_offline.grid(row=0, column=1, sticky="w")

        version_lbl = ctk.CTkLabel(
            header,
            text="v1.1.0 • muammarRM/OmniPic-Convert",
            font=ctk.CTkFont(size=11),
            text_color="#888888",
        )
        version_lbl.grid(row=0, column=2, padx=20, sticky="e")

        # Main Navigation Tabs
        self.tabview = ctk.CTkTabview(
            self,
            corner_radius=10,
            fg_color="transparent",
            segmented_button_fg_color=("#D5D5D5", "#222222"),
            segmented_button_selected_color=("#1F6AA5", "#1F6AA5"),
            segmented_button_selected_hover_color=("#144870", "#144870"),
        )
        self.tabview.grid(row=1, column=0, padx=15, pady=(5, 15), sticky="nsew")

        tab_conv_name = "🔄 Konverter & Kompresi Gambar (Offline)"
        tab_ig_name = "📸 Unduh Foto Instagram"

        self.tabview.add(tab_conv_name)
        self.tabview.add(tab_ig_name)

        # Embed Converter Tab
        self.tab_converter = ConverterTab(master=self.tabview.tab(tab_conv_name), app_root=self)
        self.tab_converter.pack(fill="both", expand=True)

        # Embed Instagram Tab
        self.tab_instagram = InstagramTab(
            master=self.tabview.tab(tab_ig_name),
            on_send_to_converter=self._on_receive_instagram_images,
        )
        self.tab_instagram.pack(fill="both", expand=True)

    def _on_receive_instagram_images(self, image_paths: list[str]):
        """Handler when images are forwarded from Instagram Tab to Converter Tab."""
        tab_conv_name = "🔄 Konverter & Kompresi Gambar (Offline)"
        self.tab_converter.add_files(image_paths)
        self.tabview.set(tab_conv_name)
