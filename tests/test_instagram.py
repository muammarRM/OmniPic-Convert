import unittest
from unittest.mock import patch, MagicMock
import os
from src.core.instagram import extract_shortcode, fetch_instagram_images, download_image_to_file

class TestInstagram(unittest.TestCase):
    def test_extract_shortcode_standard_post(self):
        url = "https://www.instagram.com/p/C-abc123XYZ/"
        self.assertEqual(extract_shortcode(url), "C-abc123XYZ")

    def test_extract_shortcode_reel(self):
        url = "https://www.instagram.com/reel/C-abc123XYZ/?utm_source=ig_web_copy_link"
        self.assertEqual(extract_shortcode(url), "C-abc123XYZ")

    def test_extract_shortcode_tv(self):
        url = "https://instagram.com/tv/C-abc123XYZ"
        self.assertEqual(extract_shortcode(url), "C-abc123XYZ")

    def test_extract_invalid_url(self):
        self.assertIsNone(extract_shortcode("https://google.com/test"))
        self.assertIsNone(extract_shortcode("not_a_url"))

    @patch("requests.get")
    def test_fetch_instagram_images_mocked_success(self, mock_get):
        # Mock HTML or JSON response with display_url
        fake_html = """
        <html>
            <head>
                <meta property="og:image" content="https://instagram.fsub1.fna.fbcdn.net/v/fake_image.jpg" />
                <meta property="og:title" content="Awesome post" />
            </head>
        </html>
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = fake_html
        mock_get.return_value = mock_response

        res = fetch_instagram_images("https://www.instagram.com/p/C-abc123XYZ/")
        self.assertTrue(res["success"])
        self.assertEqual(res["shortcode"], "C-abc123XYZ")
        self.assertTrue(len(res["images"]) >= 1)
        self.assertEqual(res["images"][0]["url"], "https://instagram.fsub1.fna.fbcdn.net/v/fake_image.jpg")

    @patch("requests.get")
    def test_download_image_to_file_mocked(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.iter_content.return_value = [b"fake_image_bytes"]
        mock_get.return_value = mock_response

        temp_target = "test_downloaded.jpg"
        result_path = download_image_to_file("https://example.com/fake.jpg", temp_target)
        self.assertTrue(os.path.exists(temp_target))
        with open(temp_target, "rb") as f:
            self.assertEqual(f.read(), b"fake_image_bytes")
        if os.path.exists(temp_target):
            os.remove(temp_target)

if __name__ == "__main__":
    unittest.main()
