import time
from playwright.sync_api import sync_playwright
import os

def verify_frontend():
    print("Starting frontend verification...")

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)

        # --- TEST 1: DESKTOP VIEW ---
        print("\n--- Testing Desktop View (1280x800) ---")
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # Navigate to the app
            page.goto("http://localhost:4173")

            # Since the failure is at login input, let's take a screenshot before interacting
            page.wait_for_load_state('networkidle')

            # Fill login (if present)
            user_input = page.locator('input[placeholder="Digite seu usuário"]')
            if user_input.count() > 0:
                print("Logging in...")
                user_input.fill("admin")
                page.locator('input[placeholder="Digite sua senha"]').fill("admin")

                # The "Entrar no sistema" button is actually type="button" perhaps?
                # Or just click it based on text
                page.locator('button').filter(has_text="Entrar").click()
                time.sleep(2)
            else:
                 print("Already logged in or no login found")

            # Remove setup/tutorial modals
            try:
                page.evaluate("""() => {
                    document.querySelectorAll('.fixed').forEach(el => {
                        const z = parseInt(window.getComputedStyle(el).zIndex, 10);
                        if (z >= 40) el.remove();
                    });
                }""")
            except:
                pass

            time.sleep(1)

            # Go to Add Item (Cadastrar)
            add_button = page.get_by_role("button", name="Cadastrar").first
            if add_button.count() > 0:
                 add_button.click()
                 time.sleep(1)
                 # Take screenshot
                 page.screenshot(path="/home/jules/verification/verification_2.png")
                 print("✓ Saved Add Item screenshot.")
            else:
                 # Check for elements containing "Cadastrar" or "Adicionar"
                 btn = page.locator('text=Cadastrar').first
                 if btn.count() > 0:
                      btn.click()
                      time.sleep(1)
                      page.screenshot(path="/home/jules/verification/verification_2.png")
                      print("✓ Saved Add Item screenshot via text locator.")
                 else:
                      print("❌ Could not find 'Cadastrar' button. Taking screenshot of current state.")
                      page.screenshot(path="/home/jules/verification/verification_2.png")

        except Exception as e:
            print(f"❌ Desktop Test Failed: {e}")
            page.screenshot(path="/home/jules/verification/verification_2.png")

        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    os.makedirs("/home/jules/verification", exist_ok=True)
    verify_frontend()
