"""Core image conversion, compression, and resizing engine."""
import os
from typing import Any
from PIL import Image

# Register HEIC/HEIF support
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIC_AVAILABLE = True
except ImportError:
    HEIC_AVAILABLE = False

from src.utils.helpers import get_safe_output_path

SUPPORTED_FORMATS = ["JPG", "PNG", "WEBP", "HEIC", "BMP", "TIFF", "ICO", "GIF"]

# Format mappings for PIL
PIL_FORMAT_MAP = {
    "JPG": "JPEG",
    "JPEG": "JPEG",
    "PNG": "PNG",
    "WEBP": "WEBP",
    "HEIC": "HEIF",
    "HEIF": "HEIF",
    "BMP": "BMP",
    "TIFF": "TIFF",
    "TIF": "TIFF",
    "ICO": "ICO",
    "GIF": "GIF",
}

import io

def _compress_to_target_bytes(base_img: Image.Image, pil_format: str, target_bytes: int) -> tuple[bytes, tuple[int, int]]:
    """Compress image to target byte size using binary search and adaptive scaling."""
    current_img = base_img.copy()
    is_lossy_format = pil_format in ("JPEG", "WEBP", "HEIF")
    scales = [1.0, 0.85, 0.70, 0.55, 0.40, 0.30, 0.20]
    
    for scale in scales:
        if scale < 1.0:
            new_w = max(16, int(base_img.width * scale))
            new_h = max(16, int(base_img.height * scale))
            current_img = base_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        cur_dims = (current_img.width, current_img.height)
        
        if is_lossy_format:
            low_q, high_q = 5, 95
            matched_buf = None
            while low_q <= high_q:
                mid_q = (low_q + high_q) // 2
                buf = io.BytesIO()
                save_kw: dict[str, Any] = {"quality": mid_q}
                if pil_format in ("JPEG", "WEBP"):
                    save_kw["optimize"] = True
                current_img.save(buf, format=pil_format, **save_kw)
                size = buf.tell()
                if size <= target_bytes:
                    matched_buf = buf.getvalue()
                    low_q = mid_q + 1
                else:
                    high_q = mid_q - 1
            if matched_buf is not None:
                return matched_buf, cur_dims
        elif pil_format == "PNG":
            buf = io.BytesIO()
            current_img.save(buf, format="PNG", optimize=True, compress_level=9)
            if buf.tell() <= target_bytes:
                return buf.getvalue(), cur_dims
            try:
                quant_img = current_img.convert("RGB").quantize(colors=256)
                buf_q = io.BytesIO()
                quant_img.save(buf_q, format="PNG", optimize=True)
                if buf_q.tell() <= target_bytes:
                    return buf_q.getvalue(), cur_dims
            except Exception:
                pass
        else:
            buf = io.BytesIO()
            current_img.save(buf, format=pil_format)
            if buf.tell() <= target_bytes:
                return buf.getvalue(), cur_dims

    buf_fallback = io.BytesIO()
    if is_lossy_format:
        current_img.save(buf_fallback, format=pil_format, quality=10, optimize=True)
    else:
        current_img.save(buf_fallback, format=pil_format)
    return buf_fallback.getvalue(), (current_img.width, current_img.height)

def convert_image(
    input_path: str,
    output_path: str | None = None,
    target_format: str = "WEBP",
    quality: int = 85,
    target_size_kb: int | None = None,
    resize_percent: int = 100,
    custom_width: int | None = None,
    output_dir: str | None = None,
) -> dict[str, Any]:
    """
    Convert, compress, and resize an image.
    
    Args:
        input_path: Path to source image file.
        output_path: Optional explicit output path. If None, generated automatically.
        target_format: Target image format (e.g. 'WEBP', 'JPG', 'PNG', 'HEIC').
        quality: Compression quality from 1 to 100 (used when target_size_kb is None).
        target_size_kb: Optional target maximum file size in kilobytes (e.g. 200 for 200 KB).
        resize_percent: Dimension scale percentage (e.g. 50 for 50%).
        custom_width: Optional exact width in pixels (height scales proportionally).
        output_dir: Directory where the converted file should be saved if output_path is None.
        
    Returns:
        dict containing conversion statistics and metadata.
    """
    norm_target = target_format.upper().lstrip(".")
    if norm_target == "JPEG":
        norm_target = "JPG"
        
    pil_format = PIL_FORMAT_MAP.get(norm_target, norm_target)
    
    if output_path is None:
        output_path = get_safe_output_path(input_path, norm_target.lower(), output_dir)
    else:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        
    original_size = os.path.getsize(input_path)
    
    with Image.open(input_path) as img:
        orig_w, orig_h = img.size
        orig_dimensions = (orig_w, orig_h)
        
        # Calculate new dimensions
        new_w, new_h = orig_w, orig_h
        if custom_width and custom_width > 0 and custom_width != orig_w:
            ratio = custom_width / float(orig_w)
            new_w = custom_width
            new_h = max(1, int(orig_h * ratio))
        elif resize_percent and resize_percent != 100 and resize_percent > 0:
            scale = resize_percent / 100.0
            new_w = max(1, int(orig_w * scale))
            new_h = max(1, int(orig_h * scale))
            
        if (new_w, new_h) != orig_dimensions:
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        # Color mode handling for target format
        if pil_format == "JPEG":
            if img.mode in ("RGBA", "LA", "P"):
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                rgb_img.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
                img = rgb_img
            elif img.mode != "RGB":
                img = img.convert("RGB")
        elif pil_format == "BMP":
            if img.mode != "RGB":
                img = img.convert("RGB")
        elif pil_format == "ICO":
            if img.width > 256 or img.height > 256:
                img.thumbnail((256, 256), Image.Resampling.LANCZOS)
            if img.mode != "RGBA":
                img = img.convert("RGBA")
        elif pil_format in ("PNG", "WEBP", "HEIF"):
            if img.mode == "CMYK":
                img = img.convert("RGB")
                
        # If target size in KB is specified, run adaptive optimizer
        if target_size_kb and target_size_kb > 0:
            target_bytes = target_size_kb * 1024
            compressed_bytes, final_dims = _compress_to_target_bytes(img, pil_format, target_bytes)
            with open(output_path, "wb") as f:
                f.write(compressed_bytes)
            new_w, new_h = final_dims
        else:
            save_kwargs: dict[str, Any] = {}
            quality_clamped = max(1, min(100, quality))
            
            if pil_format in ("JPEG", "WEBP"):
                save_kwargs["quality"] = quality_clamped
                save_kwargs["optimize"] = True
            elif pil_format == "PNG":
                compress_level = max(1, min(9, int((100 - quality_clamped) / 10)))
                save_kwargs["compress_level"] = compress_level
                save_kwargs["optimize"] = True
            elif pil_format == "HEIF":
                save_kwargs["quality"] = quality_clamped
                
            img.save(output_path, format=pil_format, **save_kwargs)
        
    output_size = os.path.getsize(output_path)
    savings = original_size - output_size
    ratio = (savings / original_size * 100.0) if original_size > 0 else 0.0
    
    return {
        "input_path": input_path,
        "output_path": output_path,
        "target_format": norm_target,
        "original_size": original_size,
        "output_size": output_size,
        "compression_ratio": ratio,
        "original_dimensions": orig_dimensions,
        "new_dimensions": (new_w, new_h),
    }
