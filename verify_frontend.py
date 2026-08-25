import os
import glob
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Desktop view port requested by memory
    page.goto("http://localhost:4173")
    page.wait_for_timeout(2000)

    # LOGIN FLOW (Mobile/Desktop login is the same form)
    try:
        print("Attempting login...")
        page.wait_for_selector('input[placeholder="Digite seu usuário"]', timeout=5000)
        page.fill('input[placeholder="Digite seu usuário"]', "admin")
        page.fill('input[placeholder="Digite sua senha"]', "admin")
        page.click('button[type="submit"]')
        page.wait_for_timeout(2000)
    except:
        pass

    # Try to bypass any modals if they exist per memory instruction
    try:
        page.evaluate("""() => {
            const modals = document.querySelectorAll('.fixed');
            modals.forEach(m => {
                if(window.getComputedStyle(m).zIndex > 10) m.remove();
            });
        }""")
    except:
        pass

    # Wait for dashboard and try to go to Inventory
    page.wait_for_timeout(1000)
    try:
        page.click('text=Inventário')
        page.wait_for_timeout(1000)
    except:
        pass

    page.screenshot(path="/home/jules/verification/screenshots/verification-top.png")
    page.wait_for_timeout(1000)

    # Try to scroll inside the orbital list container if possible, or body
    try:
        page.mouse.wheel(0, 1000)
    except:
        pass

    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/verification-scrolled.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a viewport >= 1280px as requested by memory
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

    # Find the video file
    videos = glob.glob("/home/jules/verification/videos/*.webm")
    if videos:
        print(f"Video saved to: {videos[0]}")
