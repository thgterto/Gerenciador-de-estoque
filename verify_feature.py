from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1280px minimum width for sidebar
        context = browser.new_context(
            record_video_dir="/home/jules/verification/video/",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        try:
            print("Navigating to local server...")
            page.goto("http://localhost:5173", wait_until="networkidle")

            # Login
            print("Logging in...")
            page.fill('input[placeholder="Digite seu usuário"]', "admin")
            page.fill('input[placeholder="Digite sua senha"]', "admin")
            page.click('button:has-text("Entrar")')

            # Wait for dashboard to load
            print("Waiting for dashboard...")
            page.wait_for_selector('text="Dashboard"', state="visible", timeout=10000)
            time.sleep(1) # Let animations settle

            print("Removing ALL modals by setting local storage flags so they don't appear...")
            # We can also just click through the "INITIALIZE SYSTEM" modal
            # The image shows "INITIALIZE SYSTEM" -> "ZERO STATE" and "LOAD SAMPLE DATA"
            try:
                page.wait_for_selector('text="INITIALIZE SYSTEM"', timeout=3000)
                print("Initialization modal found! Clicking 'SELECT EMPTY'...")
                page.click('text="SELECT EMPTY"')
            except Exception:
                print("No initialization modal or couldn't click it.")

            print("Removing setup/tutorial overlays if any...")
            page.evaluate('''() => {
                const overlays = document.querySelectorAll('.fixed');
                overlays.forEach(el => {
                    const zIndex = window.getComputedStyle(el).zIndex;
                    if (zIndex && parseInt(zIndex) > 40) {
                        el.remove();
                    }
                });
            }''')
            time.sleep(0.5)

            print("Opening sidebar / navigating...")
            page.goto("http://localhost:5173/inventory", wait_until="networkidle")

            # Click "Adicionar Item"
            print("Clicking Adicionar Item...")
            page.locator('button[aria-label="Adicionar Item"]').first.click()

            # Wait for the modal to appear
            print("Waiting for modal...")
            page.wait_for_selector('text="Cadastrar Novo Item"', state="visible")

            # Find the "Corrosivo" button which we updated to be an accessible button
            print("Finding Corrosivo button...")
            corrosivo_btn = page.locator('button[aria-label="Corrosivo (Corrosive)"]')
            corrosivo_btn.wait_for(state="visible")

            # Verify aria-pressed is false initially
            print("Verifying initial state...")
            assert corrosivo_btn.get_attribute("aria-pressed") == "false"

            # Focus and press Enter to test keyboard accessibility
            print("Focusing and pressing Enter on Corrosivo button...")
            corrosivo_btn.focus()
            page.keyboard.press("Enter")

            # Verify aria-pressed is now true
            print("Verifying updated state...")
            time.sleep(0.5)
            assert corrosivo_btn.get_attribute("aria-pressed") == "true"
            print("Successfully toggled accessible Risk button via keyboard!")

            # Take a screenshot
            page.screenshot(path="/home/jules/verification/screenshot.png")
            print("Screenshot saved.")

        except Exception as e:
            print(f"Error occurred: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run()
