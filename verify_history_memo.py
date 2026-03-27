import time
from playwright.sync_api import sync_playwright

def verify_history_memo():
    print("Starting history pagination verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # LOGIN
            print("Logging in...")
            page.wait_for_selector('input[placeholder="Digite seu usuário"]', timeout=10000)
            page.fill('input[placeholder="Digite seu usuário"]', "admin")
            page.fill('input[placeholder="Digite sua senha"]', "admin")
            page.click('button[type="submit"]')

            print("Waiting for dashboard to load...")
            page.wait_for_selector('text=DASHBOARD', timeout=15000)

            # BYPASS MODALS AND FIX SIDEBAR
            print("Bypassing modals and expanding sidebar...")
            page.evaluate("""
                () => {
                    const modals = document.querySelectorAll('.fixed');
                    modals.forEach(modal => {
                        if (modal.id === 'tour-sidebar' || modal.tagName === 'HEADER') return;
                        const zIndex = window.getComputedStyle(modal).zIndex;
                        if (zIndex && parseInt(zIndex) > 40) {
                            modal.remove();
                        }
                    });
                }
            """)
            time.sleep(1) # wait for DOM to settle

            # NAVIGATE TO HISTORY
            # In HashRouter, the link is #/history, so href="/history" doesn't match a regular href if it gets transformed,
            # but wait, the links returned were "http://localhost:5173/#/history", so let's try finding by href="#/history" or just text.
            print("Navigating to Histórico using specific CSS/text locator...")

            # Since React Router NavLink creates a link with href="#/history" in hashrouter mode, or similar.
            hist_link = page.locator('a[href="#/history"], a:has-text("Histórico")').first
            hist_link.wait_for(state='visible', timeout=5000)
            hist_link.click(force=True)
            time.sleep(2) # wait for data to load

            # Click "Carregar Mais" if it exists to trigger pagination
            print("Checking for 'Carregar Mais' button...")
            load_more = page.locator('button:has-text("Carregar Mais")')
            if load_more.count() > 0 and load_more.is_visible():
                print("Clicking 'Carregar Mais'...")
                load_more.first.click()
                time.sleep(2) # wait for render
            else:
                print("'Carregar Mais' not found or not needed. This is fine if the list is short.")

            # Take success screenshot
            page.screenshot(path="verification/success_history_memo.png")
            print("✓ Verification complete. Screenshot saved.")

        except Exception as e:
            print(f"❌ Verification failed: {e}")
            page.screenshot(path="verification/failure_history_memo.png")
            raise e

        context.close()
        browser.close()

if __name__ == "__main__":
    verify_history_memo()
