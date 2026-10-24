"""Pruebas de integridad competitiva de Cuaderno Vivo Pro.

Ejecución:
  uv run --with playwright python -m unittest tests/test_product_integrity.py -v

Requiere servir la raíz en http://localhost:4180.
"""
import base64
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get("CUADERNO_VIVO_URL", "http://localhost:4180/?integrity-test=1")
MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHROME = os.environ.get("CHROME_PATH") or (MAC_CHROME if Path(MAC_CHROME).exists() else None)


class ProductIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        launch = {"headless": True}
        if CHROME:
            launch["executable_path"] = CHROME
        cls.browser = cls.pw.chromium.launch(**launch)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(accept_downloads=True)
        self.page = self.context.new_page()
        self.page.goto(URL, wait_until="networkidle")
        self.page.evaluate("localStorage.clear()")
        self.page.reload(wait_until="networkidle")
        self.page.locator("#exploreWelcome").click()

    def tearDown(self):
        self.context.close()

    def test_question_edits_reach_printed_material_and_reload(self):
        p = self.page
        p.locator('[data-view="activity"]').first.click()
        p.locator("#toggleAdvanced").click()
        marker = "PREGUNTA EDITADA Y PERSISTENTE"
        p.locator('#questionTable input[aria-label="Enunciado pregunta 1"]').fill(marker)
        p.evaluate("buildPrintRoot()")
        self.assertIn(marker, p.locator("#printRoot").inner_text())
        p.reload(wait_until="networkidle")
        p.locator('[data-view="activity"]').first.click()
        p.locator("#toggleAdvanced").click()
        self.assertEqual(
            p.locator('#questionTable input[aria-label="Enunciado pregunta 1"]').input_value(),
            marker,
        )

    def test_scan_requires_an_image(self):
        p = self.page
        p.evaluate("setView('scan')")
        p.locator("#startScan").click()
        p.wait_for_timeout(3500)
        self.assertNotIn("7 fichas procesadas", p.locator("#queueTitle").inner_text())
        self.assertTrue(p.locator("#scanValidation").is_visible())

    def test_different_images_do_not_silently_produce_same_result(self):
        p = self.page
        p.evaluate("setView('scan')")
        p.locator("#photoInput").set_input_files(
            {"name": "negra.png", "mimeType": "image/png", "buffer": b"not-a-real-png"}
        )
        p.wait_for_timeout(200)
        self.assertTrue(p.locator("#scanValidation").is_visible())
        self.assertIn("imagen válida", p.locator("#scanValidation").inner_text().lower())

    def test_omr_engine_reads_controlled_grid(self):
        answers = self.page.evaluate("""
            () => {
              const canvas = document.createElement('canvas');
              canvas.width = 400; canvas.height = 800;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 400, 800);
              ctx.fillStyle = '#000';
              [[0,0],[360,0],[0,760],[360,760]].forEach(([x,y]) => ctx.fillRect(x,y,40,40));
              const expected = [0,1,2,3,2,1,0,3];
              expected.forEach((choice,row) => {
                const x = 80 + choice * 80;
                const y = 100 + row * 85;
                ctx.beginPath(); ctx.arc(x,y,20,0,Math.PI*2); ctx.fill();
              });
              return window.CVCore.analyzeCanvas(canvas).answers.map(item => item.answer);
            }
        """)
        self.assertEqual(answers, ["A", "B", "C", "D", "C", "B", "A", "D"])

    def test_real_png_upload_is_processed_and_persisted(self):
        expected = ["A", "B", "C", "D", "A", "D", "C", "B"]
        data_url = self.page.evaluate("""
            () => {
              const canvas = document.createElement('canvas');
              canvas.width = 400; canvas.height = 800;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = 'white'; ctx.fillRect(0,0,400,800);
              ctx.fillStyle = 'black';
              [[0,0],[360,0],[0,760],[360,760]].forEach(([x,y]) => ctx.fillRect(x,y,40,40));
              const picks = [0,1,2,3,0,3,2,1];
              picks.forEach((pick,row) => {
                ctx.beginPath();
                ctx.arc([80,160,240,320][pick],100+row*85,18,0,Math.PI*2);
                ctx.fill();
              });
              return canvas.toDataURL('image/png');
            }
        """)
        payload = base64.b64decode(data_url.split(',', 1)[1])
        self.page.locator("[data-view='scan']").first.click()
        self.page.locator("#photoInput").set_input_files(
            files=[{"name": "omr-controlado.png", "mimeType": "image/png", "buffer": payload}]
        )
        self.page.locator("#startScan").click()
        self.page.wait_for_timeout(1400)
        saved = self.page.evaluate("JSON.parse(localStorage.getItem('cv-pro-domain-v1')).scan.answers.map(x=>x.answer)")
        self.assertEqual(saved, expected)
        self.assertTrue(self.page.locator("#view-review").evaluate("el=>el.classList.contains('active')"))
        self.assertIn("A", self.page.locator("#reviewProposal").inner_text())
        self.assertTrue(self.page.locator(".crop-options span").first.evaluate("el=>el.classList.contains('selected')"))
        self.assertIn("A 98 %", self.page.locator(".decision-pane > p:not(.kicker)").inner_text())

    def test_reinforcement_edit_reaches_preview_and_persists(self):
        p = self.page
        p.evaluate("setView('interventions')")
        task = p.locator("#taskList .task").first
        task.locator(".edit-task").click()
        marker = "REFUERZO EDITADO PERSISTENTE"
        task.locator("p").evaluate("(el, value) => el.textContent = value", marker)
        task.locator(".edit-task").click()
        p.locator("#previewMaterial").click()
        self.assertIn(marker, p.locator("#previewSheetTasks").inner_text())
        p.locator("#reinforceModal .close-modal").first.click()
        p.reload(wait_until="networkidle")
        p.evaluate("setView('interventions')")
        self.assertIn(marker, p.locator("#taskList").inner_text())

    def test_exit_ticket_requires_evidence_and_is_not_precompleted(self):
        p = self.page
        p.evaluate("setView('progress')")
        self.assertNotEqual(p.locator(".comparison-pro .green").inner_text(), "2/2")
        self.assertNotIn("Mejora comprobada", p.locator("#progressState").inner_text())
        p.locator("#simulateExit").click()
        self.assertTrue(p.locator("#exitEvidenceForm").is_visible())

    def test_delete_all_local_data_removes_every_product_key(self):
        p = self.page
        p.evaluate("localStorage.setItem('cv-pro-profile-v1', JSON.stringify({name:'Privado',email:'p@example.test',photo:'data:image/png;base64,AA'})); localStorage.setItem('cv-pro-onboarded','1')")
        p.evaluate("setView('privacy')")
        p.locator("#deleteDemo").click()
        p.wait_for_timeout(1000)
        keys = p.evaluate("Object.keys(localStorage).filter(k => k.startsWith('cv-'))")
        self.assertEqual(keys, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
