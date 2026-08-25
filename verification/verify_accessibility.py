from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to the login page
    page.goto("http://localhost:5173")

    # Wait for the input to be present
    page.wait_for_selector("input[type='text']")

    # Get the username input and its label
    username_input = page.locator("input[type='text']").first
    username_label = page.locator("label:has-text('Usuário')").first

    # Check if the input has an ID
    input_id = username_input.get_attribute("id")
    print(f"Input ID: {input_id}")

    # Check if the label has htmlFor matching the input ID
    label_for = username_label.get_attribute("for")
    print(f"Label for: {label_for}")

    if input_id and label_for and input_id == label_for:
        print("SUCCESS: Input ID matches Label htmlFor")
    else:
        print("FAILURE: Input ID does not match Label htmlFor")

    # Take a screenshot
    page.screenshot(path="verification/accessibility_check.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
