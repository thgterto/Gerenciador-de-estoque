import time
from playwright.sync_api import sync_playwright

def verify_history(page):
    print("Navigating to index...")
    page.goto("http://localhost:5173/")
    time.sleep(1)

    # Login if needed (Default local credentials in memory: admin/admin)
    try:
        page.fill('input[type="text"]', 'admin', timeout=5000)
        page.fill('input[type="password"]', 'admin', timeout=5000)
        page.click('button:has-text("ENTRAR NO SISTEMA")', timeout=5000)
        time.sleep(1)
        print("Logged in successfully.")
    except Exception as e:
        print("Login form not found or error:", e)

    print("Removing possible overlays...")
    # By memory: Playwright verification scripts require aggressive DOM manipulation (removing elements with class .fixed and high z-index) to bypass persistent 'Setup' and 'Tutorial' modal overlays
    page.evaluate('''
        document.querySelectorAll('.fixed').forEach(el => {
            const zIndex = window.getComputedStyle(el).zIndex;
            if (zIndex && parseInt(zIndex) >= 40) {
                el.remove();
            }
        });
    ''')
    time.sleep(1)

    print("Navigating to History Table...")
    try:
        page.click('text=Histórico')
        time.sleep(1)
    except Exception as e:
        print("Could not click Histórico:", e)

    print("Taking screenshot of History Table...")
    page.screenshot(path="verify_history.png", full_page=True)
    print("Verification complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800}, record_video_dir="/app/verification_video")
        page = context.new_page()
        try:
            verify_history(page)
        finally:
            context.close()
            browser.close()
