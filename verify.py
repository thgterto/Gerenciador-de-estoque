import time
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        page.goto("http://localhost:5173", wait_until="networkidle")
        time.sleep(2)

        page.evaluate("""
            document.querySelectorAll('.fixed').forEach(el => {
                const zIndex = window.getComputedStyle(el).zIndex;
                if (zIndex && parseInt(zIndex) > 40) {
                    el.remove();
                }
            });
        """)

        # Fill login
        try:
            # Let's use place-holders as seen in screenshot
            page.fill('input[placeholder="Digite seu usuário"]', 'admin')
            page.fill('input[placeholder="Digite sua senha"]', 'admin')
            page.click('button:has-text("ENTRAR NO SISTEMA")')
            time.sleep(2)
        except Exception as e:
            pass

        page.evaluate("""
            document.querySelectorAll('.fixed').forEach(el => {
                const zIndex = window.getComputedStyle(el).zIndex;
                if (zIndex && parseInt(zIndex) > 40) {
                    el.remove();
                }
            });
        """)

        # Go to Inventário via URL to be sure
        page.goto("http://localhost:5173/#/inventory", wait_until="networkidle")
        time.sleep(2)

        page.evaluate("""
            document.querySelectorAll('.fixed').forEach(el => {
                const zIndex = window.getComputedStyle(el).zIndex;
                if (zIndex && parseInt(zIndex) > 40) {
                    el.remove();
                }
            });
        """)

        page.evaluate("""
            window.seedData = async () => {
                const req = indexedDB.open('LabControlDB');
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    const tx = db.transaction('items', 'readwrite');
                    const store = tx.objectStore('items');
                    store.put({
                        id: 'test-item-1',
                        sapCode: 'SAP-12345',
                        name: 'Test Item 1',
                        category: 'Test',
                        quantity: 10,
                        baseUnit: 'UN',
                        minStockLevel: 5,
                        location: { warehouse: 'A', shelf: '1' },
                        risks: {},
                        casNumber: '',
                        lotNumber: 'L1',
                        expiryDate: '2025-12-31'
                    });
                     store.put({
                        id: 'test-item-2',
                        sapCode: 'SAP-12345',
                        name: 'Test Item 2',
                        category: 'Test',
                        quantity: 10,
                        baseUnit: 'UN',
                        minStockLevel: 5,
                        location: { warehouse: 'A', shelf: '1' },
                        risks: {},
                        casNumber: '',
                        lotNumber: 'L2',
                        expiryDate: '2025-12-31'
                    });
                };
            };
            window.seedData();
        """)
        time.sleep(1) # wait for IDB

        page.goto("http://localhost:5173/#/", wait_until="networkidle")
        time.sleep(1)
        page.goto("http://localhost:5173/#/inventory", wait_until="networkidle")
        time.sleep(2)

        page.evaluate("""
            document.querySelectorAll('.fixed').forEach(el => {
                const zIndex = window.getComputedStyle(el).zIndex;
                if (zIndex && parseInt(zIndex) > 40) {
                    el.remove();
                }
            });
        """)

        page.screenshot(path="inventory_after.png")

        # try to expand group
        page.evaluate("""
            document.querySelectorAll('.group').forEach(el => {
                el.click();
            });
        """)
        time.sleep(1)
        page.screenshot(path="inventory_expanded.png")

        browser.close()

if __name__ == "__main__":
    verify()
