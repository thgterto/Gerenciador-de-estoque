from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_app_loads(page: Page):
    print("Navigating to http://localhost:5173")
    page.goto("http://localhost:5173")

    print("Waiting for body")
    page.wait_for_selector("body", timeout=10000)

    # Wait a bit for rendering
    page.wait_for_timeout(2000)

    print("Taking screenshot")
    page.screenshot(path="verification/app_loaded.png")
    print(f"Screenshot saved to {os.path.abspath('verification/app_loaded.png')}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app_loads(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
