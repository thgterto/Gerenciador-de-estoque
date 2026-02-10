
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    try:
        print("Navigating...")
        page.goto("http://localhost:5173", timeout=120000)

        print("Waiting for login...")
        page.wait_for_selector('input[placeholder="Digite seu usuário"]', timeout=60000)

        page.fill('input[placeholder="Digite seu usuário"]', 'admin')
        page.fill('input[placeholder="Digite sua senha"]', 'admin')
        page.click('button[type="submit"]')

        print("Waiting for Dashboard...")
        try:
            page.wait_for_url("**/#/dashboard", timeout=60000)
        except:
            print("Wait for URL failed, checking selector...")
            page.wait_for_selector("text=Dashboard", timeout=10000)

        page.wait_for_timeout(5000)

        print("Navigating to Storage...")
        page.goto("http://localhost:5173/#/storage")
        page.wait_for_timeout(5000)

        # Handle Tutorial Modal - BRUTE FORCE
        try:
            print("Checking for tutorial modal...")
            # Remove any fixed overlay with high z-index by generic classes
            page.evaluate("""
                // Select elements that have 'fixed' and 'inset-0' classes
                const overlays = document.querySelectorAll('.fixed.inset-0');
                overlays.forEach(el => el.remove());
            """)
            print("Removed potential overlays.")
            page.wait_for_timeout(1000)
        except Exception as e:
            print(f"Modal handling info: {e}")

        # Ensure we are on storage page
        page.wait_for_selector("text=Locais de Armazenamento", timeout=20000)

        print("Selecting Chemical Storage (Corrosivo)...")

        # Click the card
        page.click("text=CORROSIVO", timeout=10000)
        page.wait_for_timeout(2000)

        # Verify Grid
        print("Verifying Matrix Size...")

        has_c3 = page.locator("text=C3").count() > 0
        has_d1 = page.locator("text=D1").count() > 0

        print(f"Has C3: {has_c3}")
        print(f"Has D1: {has_d1}")

        if has_c3 and not has_d1:
            print("SUCCESS: Chemical Matrix layout detected (3x3).")
        else:
            print("WARNING: Matrix layout mismatch. Expected 3x3.")

        page.screenshot(path="verification/storage_matrix_view.png")
        print("Screenshot taken: storage_matrix_view.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_matrix_final.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
