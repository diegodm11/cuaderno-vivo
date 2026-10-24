from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ServiceWorkerContractTests(unittest.TestCase):
    def test_new_product_assets_are_precached(self):
        text = (ROOT / "service-worker.js").read_text()
        self.assertIn("./product-core.js", text)
        self.assertIn("./product-core.css", text)

    def test_navigation_cache_rejects_error_responses(self):
        text = (ROOT / "service-worker.js").read_text()
        self.assertIn("response.ok", text)
        self.assertIn("text/html", text)

    def test_missing_route_cannot_replace_cached_index(self):
        text = (ROOT / "service-worker.js").read_text()
        self.assertNotIn("cache.put('./index.html',response.clone())", text.replace(" ", ""))


if __name__ == "__main__":
    unittest.main(verbosity=2)
