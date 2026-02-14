from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1. Desktop Test
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to login...")
        page.goto("http://localhost:4173/")

        # Login
        try:
            page.get_by_label("Usuário").fill("admin")
            page.get_by_label("Senha").fill("admin")
            page.get_by_role("button", name="Acessar Sistema").click()
            page.wait_for_url("**/dashboard")
        except Exception as e:
            print(f"Login failed: {e}")
            browser.close()
            return

        # Handle Modal
        page.wait_for_timeout(2000)
        if page.get_by_text("Boas-vindas ao LabControl").is_visible():
            print("Modal detected. Closing...")
            page.get_by_label("Não mostrar novamente").click()
            page.get_by_role("button", name="close").click()
            page.wait_for_timeout(1000)

        print("Navigating to inventory...")
        page.goto("http://localhost:4173/#/inventory")
        page.wait_for_timeout(2000)

        # 1. Verify Clear Selection Button
        # Find checkboxes. MUI Checkbox input has type="checkbox".
        # Ensure list is loaded.
        page.wait_for_selector("text=PRODUTO / SKU")

        checkboxes = page.get_by_role("checkbox").all()
        print(f"Checkboxes found: {len(checkboxes)}")

        if len(checkboxes) > 1:
            print("Clicking first group checkbox...")
            # Click the second checkbox (first is header)
            checkboxes[1].click()
            page.wait_for_timeout(1000)

            # Check for "Limpar seleção" button
            # It's in the floating bar at bottom
            clear_btns = page.get_by_label("Limpar seleção").all()
            if len(clear_btns) > 0 and clear_btns[0].is_visible():
                print("SUCCESS: 'Limpar seleção' button found and visible.")
            else:
                print("FAILURE: 'Limpar seleção' button NOT found.")
                # Debug screenshot
                page.screenshot(path="verification/desktop_debug_selection.png")

            # Cleanup
            checkboxes[1].click()
        else:
             print("Not enough checkboxes found.")

        # 2. Verify Desktop Row Actions
        if len(checkboxes) > 1:
             # We need to expand the group to see child row actions.
             # Clicking the checkbox selects the group but doesn't expand it.
             # We need to click the row content (e.g. the chevron or text).

             # Locate the row container of the first group.
             # We can use the checkbox to find its parent row.
             # But Playwright locators are easier.
             # Let's try to click the chevron.
             # Chevrons are `ChevronRightIcon`.
             # We can find them by `data-testid="ChevronRightIcon"`.
             chevrons = page.get_by_test_id("ChevronRightIcon").all()
             if len(chevrons) > 0:
                 print("Clicking chevron to expand...")
                 chevrons[0].click()
                 page.wait_for_timeout(1000)

                 # Now hover over the expanded area (below the group row)
                 # We can hover over the first "Lote" text we find now?
                 # Or just hover slightly below the chevron.
                 box = chevrons[0].bounding_box()
                 if box:
                     page.mouse.move(box['x'], box['y'] + 50)
                     page.wait_for_timeout(500)

                     if page.get_by_label("Clonar").first.is_visible():
                         print("SUCCESS: 'Clonar' button visible.")
                     else:
                         print("FAILURE: 'Clonar' button NOT visible.")
             else:
                 print("No chevrons found.")

        page.screenshot(path="verification/desktop_inventory.png")

        # 3. Mobile Test
        print("Switching to mobile...")
        mobile_context = browser.new_context(viewport={'width': 375, 'height': 800}, is_mobile=True)
        mobile_page = mobile_context.new_page()

        mobile_page.goto("http://localhost:4173/")
        try:
            mobile_page.get_by_label("Usuário").fill("admin")
            mobile_page.get_by_label("Senha").fill("admin")
            mobile_page.get_by_role("button", name="Acessar Sistema").click()
            mobile_page.wait_for_url("**/dashboard")
        except:
             pass

        mobile_page.wait_for_timeout(2000)
        if mobile_page.get_by_text("Boas-vindas ao LabControl").is_visible():
            mobile_page.get_by_label("Não mostrar novamente").click()
            mobile_page.get_by_role("button", name="close").click()
            mobile_page.wait_for_timeout(1000)

        mobile_page.goto("http://localhost:4173/#/inventory")
        mobile_page.wait_for_timeout(2000)

        # Scroll down to list
        mobile_page.mouse.wheel(0, 600)
        mobile_page.wait_for_timeout(1000)

        # Click "lotes" chip to expand
        lotes = mobile_page.get_by_text("lotes").all()
        if len(lotes) > 0:
            lotes[0].click()
            mobile_page.wait_for_timeout(1000)

            if mobile_page.get_by_label("Movimentar item").first.is_visible():
                print("SUCCESS: Mobile buttons found.")
            else:
                print("FAILURE: Mobile buttons NOT found.")
        else:
             print("No 'lotes' chip found.")
             # Try clicking a chevron on mobile if present? Or just the card.
             # Mobile group row doesn't have chevron?
             # Let's try to click center of the first card visible.
             mobile_page.mouse.click(180, 500)
             mobile_page.wait_for_timeout(1000)
             if mobile_page.get_by_label("Movimentar item").first.is_visible():
                print("SUCCESS: Mobile buttons found (fallback).")

        mobile_page.screenshot(path="verification/mobile_inventory.png")

        browser.close()

if __name__ == "__main__":
    run()
