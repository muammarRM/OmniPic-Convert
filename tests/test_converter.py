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
        for f in ["test_out.jpg", "test_out.webp", "test_out.heic", "test_out.png"]:
            if os.path.exists(f):
                os.remove(f)

    def test_supported_formats(self):
        self.assertIn("HEIC", SUPPORTED_FORMATS)
        self.assertIn("WEBP", SUPPORTED_FORMATS)
        self.assertIn("JPG", SUPPORTED_FORMATS)
        self.assertIn("PNG", SUPPORTED_FORMATS)
        self.assertIn("BMP", SUPPORTED_FORMATS)
        self.assertIn("TIFF", SUPPORTED_FORMATS)
        self.assertIn("ICO", SUPPORTED_FORMATS)

    def test_convert_png_to_jpg_with_transparency(self):
        res = convert_image(self.test_img_path, "test_out.jpg", target_format="JPG", quality=80)
        self.assertTrue(os.path.exists(res["output_path"]))
        self.assertTrue(res["output_size"] > 0)
        with Image.open(res["output_path"]) as img:
            self.assertEqual(img.format, "JPEG")
            self.assertEqual(img.size, (200, 200))

    def test_convert_to_heic(self):
        res = convert_image(self.test_img_path, "test_out.heic", target_format="HEIC", quality=75)
        self.assertTrue(os.path.exists(res["output_path"]))
        self.assertTrue(res["output_size"] > 0)

    def test_resize_scaling(self):
        res = convert_image(self.test_img_path, "test_out.webp", target_format="WEBP", resize_percent=50)
        self.assertEqual(res["new_dimensions"], (100, 100))
        with Image.open(res["output_path"]) as img:
            self.assertEqual(img.size, (100, 100))

    def test_quality_compression_difference(self):
        res_high = convert_image(self.test_img_path, "test_out_high.jpg", target_format="JPG", quality=95)
        res_low = convert_image(self.test_img_path, "test_out_low.jpg", target_format="JPG", quality=20)
        self.assertGreaterEqual(res_high["output_size"], res_low["output_size"])
        if os.path.exists("test_out_high.jpg"):
            os.remove("test_out_high.jpg")
        if os.path.exists("test_out_low.jpg"):
            os.remove("test_out_low.jpg")

if __name__ == "__main__":
    unittest.main()
