"""End-to-End Integration Tests for OmniPic-Convert."""
import unittest
import os
import tempfile
from PIL import Image

from src.core.converter import convert_image, SUPPORTED_FORMATS
from src.utils.helpers import format_bytes, get_safe_output_path

class TestE2EPipeline(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="omnipic_e2e_")
        self.source_png = os.path.join(self.temp_dir, "source_transparency.png")
        
        # Create a 300x200 RGBA image with gradient pattern so compression reduces entropy
        img = Image.new("RGBA", (300, 200))
        pixels = img.load()
        for x in range(300):
            for y in range(200):
                pixels[x, y] = ((x * 7) % 256, (y * 5) % 256, (x + y) % 256, 180)
        img.save(self.source_png)

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            for f in os.listdir(self.temp_dir):
                try:
                    os.remove(os.path.join(self.temp_dir, f))
                except OSError:
                    pass
            try:
                os.rmdir(self.temp_dir)
            except OSError:
                pass

    def test_multi_format_conversion_roundtrip(self):
        """Test converting source PNG to HEIC, WebP, JPG, BMP, TIFF, and ICO."""
        formats_to_test = ["HEIC", "WEBP", "JPG", "BMP", "TIFF", "ICO"]
        
        for fmt in formats_to_test:
            with self.subTest(target_format=fmt):
                out_path = os.path.join(self.temp_dir, f"out.{fmt.lower()}")
                res = convert_image(
                    input_path=self.source_png,
                    output_path=out_path,
                    target_format=fmt,
                    quality=80,
                )
                self.assertTrue(os.path.exists(out_path), f"File {out_path} should exist")
                self.assertGreater(os.path.getsize(out_path), 0, f"File {out_path} should not be empty")
                self.assertEqual(res["target_format"], fmt)
                
                # Verify that the generated file can be re-opened by Pillow
                with Image.open(out_path) as opened_img:
                    self.assertGreater(opened_img.width, 0)
                    self.assertGreater(opened_img.height, 0)

    def test_transparency_safeguard_jpeg(self):
        """Verify that converting transparent RGBA image to JPEG fills with white instead of black/crashing."""
        out_jpg = os.path.join(self.temp_dir, "transparency_out.jpg")
        convert_image(self.source_png, out_jpg, target_format="JPG", quality=90)
        
        with Image.open(out_jpg) as img:
            self.assertEqual(img.mode, "RGB")
            # Sample pixel color: should be composite of light blue over white, not black
            pixel = img.getpixel((10, 10))
            self.assertGreater(pixel[0], 50)
            self.assertGreater(pixel[1], 50)
            self.assertGreater(pixel[2], 50)

    def test_compression_savings(self):
        """Verify that quality reduction decreases file size."""
        high_q = os.path.join(self.temp_dir, "high_q.webp")
        low_q = os.path.join(self.temp_dir, "low_q.webp")
        
        res_high = convert_image(self.source_png, high_q, target_format="WEBP", quality=95)
        res_low = convert_image(self.source_png, low_q, target_format="WEBP", quality=20)
        
        self.assertLessEqual(res_low["output_size"], res_high["output_size"])

    def test_dimension_scaling(self):
        """Verify 50% scaling and custom width."""
        half_path = os.path.join(self.temp_dir, "half.jpg")
        res_half = convert_image(self.source_png, half_path, target_format="JPG", resize_percent=50)
        self.assertEqual(res_half["new_dimensions"], (150, 100))
        
        custom_path = os.path.join(self.temp_dir, "custom.png")
        res_custom = convert_image(self.source_png, custom_path, target_format="PNG", custom_width=150)
        self.assertEqual(res_custom["new_dimensions"], (150, 100))

if __name__ == "__main__":
    unittest.main()
