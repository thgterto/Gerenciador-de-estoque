
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    try:
        # 1. Login
        print("Navigating to Login...")
        page.goto("http://localhost:5173/")
        page.wait_for_timeout(2000)

        print("Filling credentials...")
        page.fill('input[placeholder="Digite seu usuário"]', 'admin')
        page.fill('input[placeholder="Digite sua senha"]', 'admin')

        print("Clicking Login...")
        page.click('button:has-text("Entrar no Sistema")')
        page.wait_for_timeout(3000) # Wait for login redirect

        # 2. Verify Inventory Page (Using HashRouter syntax)
        print("Navigating to Inventory...")
        page.goto("http://localhost:5173/#/inventory")
        page.wait_for_timeout(3000)

        # Handle Setup/Tutorial Modals if they appear (aggressive cleanup)
        print("Cleaning up potential modals...")
        page.evaluate("""
            const overlays = document.querySelectorAll('.fixed.z-50, [role="dialog"]');
            overlays.forEach(el => el.remove());
        """)

        # 3. Verify Inventory Table loads
        print("Verifying Inventory Table...")
        # Corrected placeholder based on source code
        search_input = page.locator('input[placeholder="Nome, SKU, CAS ou lote..."]')
        search_input.wait_for(state="visible", timeout=10000)

        if search_input.is_visible():
             print("Inventory Search Input found.")
        else:
             print("Inventory Search Input NOT found.")

        # 4. Test Filtering (Simulates useInventoryFilters hook)
        print("Testing Filter...")
        search_input.fill('ACIDO')
        page.wait_for_timeout(1000) # Wait for debounce

        # Take screenshot of filtered inventory
        page.screenshot(path="verification_inventory.png")
        print("Inventory screenshot taken.")

        # 5. Go to Dashboard (Simulates useDashboardAnalytics hook)
        print("Navigating to Dashboard...")
        page.goto("http://localhost:5173/#/dashboard")
        page.wait_for_timeout(3000)

        # 6. Verify Dashboard KPIs load
        print("Verifying Dashboard KPIs...")
        # Check for key KPI labels. "A Vencer" is the title in Dashboard.tsx
        kpi_locator = page.get_by_text("A Vencer")
        kpi_locator.wait_for(state="visible", timeout=10000)

        if kpi_locator.is_visible():
            print("KPI 'A Vencer' visible.")
        else:
             print("KPI 'A Vencer' NOT visible.")

        # Take screenshot of dashboard
        page.screenshot(path="verification_dashboard.png")
        print("Dashboard screenshot taken.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification_error.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
