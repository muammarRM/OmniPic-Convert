"""Helper utility functions for OmniPic-Convert."""
import os

VALID_IMAGE_EXTENSIONS = {
    "jpg", "jpeg", "png", "webp", "heic", "heif", "avif",
    "bmp", "tiff", "tif", "ico", "gif"
}

def format_bytes(size_bytes: int) -> str:
    """Format bytes into human-readable string (B, KB, MB, GB)."""
    if size_bytes < 0:
        return "0.00 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0
    size = float(size_bytes)
    while size >= 1024.0 and unit_index < len(units) - 1:
        size /= 1024.0
        unit_index += 1
    return f"{size:.2f} {units[unit_index]}"

def validate_image_format(ext: str) -> bool:
    """Check if file extension is a supported image format."""
    clean_ext = ext.lower().lstrip(".")
    return clean_ext in VALID_IMAGE_EXTENSIONS

def get_safe_output_path(source_path: str, target_ext: str, output_dir: str | None = None) -> str:
    """Generate a collision-free output file path for conversion."""
    target_ext = target_ext.lower().lstrip(".")
    base_name = os.path.splitext(os.path.basename(source_path))[0]
    
    if output_dir:
        dest_dir = output_dir
    else:
        dest_dir = os.path.dirname(os.path.abspath(source_path))
        
    candidate = os.path.join(dest_dir, f"{base_name}.{target_ext}")
    
    # If candidate matches source path exactly, append _converted
    if os.path.abspath(candidate) == os.path.abspath(source_path):
        candidate = os.path.join(dest_dir, f"{base_name}_converted.{target_ext}")
        
    counter = 1
    while os.path.exists(candidate):
        candidate = os.path.join(dest_dir, f"{base_name}_{counter}.{target_ext}")
        counter += 1
        
    return candidate
