from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            page.goto("http://localhost:4173")
            print("Navigated to http://localhost:4173")
            page.wait_for_selector("#root", state="attached")
            print("Root attached")
            # Wait for React to render something.
            page.wait_for_timeout(3000)

            page.screenshot(path="verification_screenshot.png")
            print("Screenshot taken: verification_screenshot.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
