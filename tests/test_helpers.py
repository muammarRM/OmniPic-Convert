import unittest
from src.utils.helpers import format_bytes, get_safe_output_path, validate_image_format

class TestHelpers(unittest.TestCase):
    def test_format_bytes(self):
        self.assertEqual(format_bytes(500), "500.00 B")
        self.assertEqual(format_bytes(1024), "1.00 KB")
        self.assertEqual(format_bytes(1024 * 1024), "1.00 MB")
        self.assertEqual(format_bytes(1024 * 1024 * 1024), "1.00 GB")

    def test_validate_image_format(self):
        self.assertTrue(validate_image_format("heic"))
        self.assertTrue(validate_image_format(".jpg"))
        self.assertTrue(validate_image_format("PNG"))
        self.assertTrue(validate_image_format("webp"))
        self.assertFalse(validate_image_format("exe"))
        self.assertFalse(validate_image_format("txt"))

    def test_get_safe_output_path(self):
        path = get_safe_output_path("sample.png", "jpg")
        self.assertTrue(path.endswith(".jpg"))
        self.assertTrue("sample" in path)

if __name__ == "__main__":
    unittest.main()
