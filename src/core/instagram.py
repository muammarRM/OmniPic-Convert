"""Instagram public media extraction and downloading module."""
import re
import json
import os
from typing import Any
import requests

SHORTCODE_REGEX = re.compile(r"(?:https?://)?(?:www\.)?instagram\.com/(?:p|reel|tv)/([A-Za-z0-9_-]+)", re.IGNORECASE)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Mode": "navigate",
}

def extract_shortcode(url: str) -> str | None:
    """Extract Instagram shortcode from post/reel/tv URL."""
    match = SHORTCODE_REGEX.search(url.strip())
    if match:
        return match.group(1)
    return None

def fetch_instagram_images(url: str, timeout: int = 10) -> dict[str, Any]:
    """
    Fetch high-resolution images from a public Instagram post or carousel.
    
    Returns:
        dict with keys: 'success', 'shortcode', 'title', 'images', 'error'
    """
    shortcode = extract_shortcode(url)
    if not shortcode:
        return {
            "success": False,
            "shortcode": None,
            "title": "",
            "images": [],
            "error": "URL Instagram tidak valid. Harap masukkan link post/reel/tv (contoh: https://www.instagram.com/p/...).",
        }
        
    canonical_url = f"https://www.instagram.com/p/{shortcode}/"
    
    try:
        response = requests.get(canonical_url, headers=DEFAULT_HEADERS, timeout=timeout)
        if response.status_code != 200:
            return {
                "success": False,
                "shortcode": shortcode,
                "title": "",
                "images": [],
                "error": f"Gagal mengakses post Instagram (HTTP status: {response.status_code}). Akun mungkin bersifat privat.",
            }
            
        html_text = response.text
        images: list[dict[str, Any]] = []
        
        # Strategy 1: Look for embedded JSON script data or GraphQL carousel items
        carousel_matches = re.findall(r'"display_url"\s*:\s*"([^"]+)"', html_text)
        if carousel_matches:
            seen_urls = set()
            for raw_u in carousel_matches:
                clean_u = raw_u.replace("\\u0026", "&").replace("\\/", "/")
                if clean_u not in seen_urls and "http" in clean_u:
                    seen_urls.add(clean_u)
                    idx = len(seen_urls)
                    images.append({
                        "url": clean_u,
                        "filename": f"ig_{shortcode}_{idx}.jpg",
                        "is_video": False,
                    })

        # Strategy 2: If no carousel display_url found, extract OpenGraph meta tags
        if not images:
            og_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
            if og_match:
                img_url = og_match.group(1).replace("&amp;", "&")
                images.append({
                    "url": img_url,
                    "filename": f"ig_{shortcode}_1.jpg",
                    "is_video": False,
                })
                
        # Extract title if present
        title = ""
        og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
        if og_title:
            title = og_title.group(1)
            
        if not images:
            return {
                "success": False,
                "shortcode": shortcode,
                "title": title,
                "images": [],
                "error": "Tidak ditemukan gambar publik pada postingan ini. Post mungkin hanya berupa video atau akun dikunci.",
            }
            
        return {
            "success": True,
            "shortcode": shortcode,
            "title": title,
            "images": images,
            "error": None,
        }
        
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "shortcode": shortcode,
            "title": "",
            "images": [],
            "error": "Koneksi ke Instagram time out. Periksa koneksi internet Anda.",
        }
    except Exception as e:
        return {
            "success": False,
            "shortcode": shortcode,
            "title": "",
            "images": [],
            "error": f"Terjadi kesalahan saat mengambil gambar: {str(e)}",
        }

def download_image_to_file(image_url: str, save_path: str, timeout: int = 15) -> str:
    """Download image from direct URL to local file."""
    os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
    response = requests.get(image_url, headers=DEFAULT_HEADERS, stream=True, timeout=timeout)
    response.raise_for_status()
    with open(save_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    return os.path.abspath(save_path)
