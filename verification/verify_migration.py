from playwright.sync_api import sync_playwright
import time

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1400, 'height': 900})

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173", timeout=30000)
            time.sleep(3)

            # Login
            if page.locator('input[type="text"]').count() > 0:
                print("Found login form...")
                page.locator('input[type="text"]').first.fill("admin")
                page.locator('input[type="password"]').first.fill("admin")
                page.get_by_role("button").first.click()
                time.sleep(3)

            # Check for Database Setup Modal
            # It might appear after login
            if page.get_by_text("Bem-vindo ao LabControl").is_visible():
                print("Handling Database Setup...")
                page.screenshot(path="verification/setup_modal.png")
                # The button has "Começar do Zero" text inside
                page.get_by_text("Começar do Zero").first.click()
                time.sleep(3)

            # Check for Tutorial Modal
            if page.get_by_text("Tutorial").is_visible() or page.get_by_text("Pular Tutorial").is_visible():
                 print("Handling Tutorial...")
                 if page.get_by_text("Pular").count() > 0:
                     page.get_by_text("Pular").first.click()
                 else:
                     # Close via escape or click outside? Or "Fechar"
                     page.keyboard.press("Escape")
                 time.sleep(1)

            print("Taking dashboard screenshot...")
            page.screenshot(path="verification/dashboard.png")

            print("Navigating to Inventory...")
            # Drawer navigation
            page.get_by_text("Inventário").first.click()
            time.sleep(2)
            page.screenshot(path="verification/inventory.png")

            print("Opening Add Item Modal...")
            page.get_by_role("button", name="Adicionar").first.click()
            time.sleep(1)
            page.screenshot(path="verification/add_modal.png")

            print("Verification complete.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
