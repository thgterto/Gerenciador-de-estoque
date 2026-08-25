from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    print("Navigating...")
    try:
        page.goto("http://localhost:5173", timeout=60000)
        print("Navigation complete.")

        # Wait a bit to see what happens
        page.wait_for_timeout(5000)

        print(" taking screenshot...")
        page.screenshot(path="verification/debug_screenshot.png")

        # Check for ANY input
        inputs = page.locator("input").count()
        print(f"Found {inputs} inputs")

        if inputs > 0:
            # Get the username input and its label
            username_input = page.locator("input").first
            input_html = username_input.evaluate("el => el.outerHTML")
            print(f"First Input HTML: {input_html}")

            # Check if the input has an ID
            input_id = username_input.get_attribute("id")
            print(f"Input ID: {input_id}")

            # Check for label
            labels = page.locator("label").count()
            print(f"Found {labels} labels")

            if labels > 0:
                label = page.locator("label").first
                label_html = label.evaluate("el => el.outerHTML")
                print(f"First Label HTML: {label_html}")

                label_for = label.get_attribute("for")
                print(f"Label for: {label_for}")

                if input_id and label_for and input_id == label_for:
                    print("SUCCESS: Input ID matches Label htmlFor")
                else:
                    print("FAILURE: Input ID does not match Label htmlFor")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_screenshot.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
