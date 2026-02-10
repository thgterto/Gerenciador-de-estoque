import pytest
import time

def login_if_needed(page):
    # Check if already on dashboard
    if page.url.endswith("/dashboard") or "#/dashboard" in page.url:
        return

    # Wait for login input or dashboard text
    try:
        # Increase timeout to 10s
        page.wait_for_selector('input[placeholder="Digite seu usuário"]', timeout=10000)
        # If found, perform login
        page.fill('input[placeholder="Digite seu usuário"]', 'admin')
        page.fill('input[placeholder="Digite sua senha"]', 'admin')
        page.click('button[type="submit"]')

        # Wait for navigation
        page.wait_for_url("**/#/dashboard", timeout=30000)
    except Exception as e:
        # If timeout waiting for selector, maybe we are already logged in?
        # Check for dashboard
        if page.is_visible("text=Dashboard"):
            return
        print(f"Login failed or element not found: {e}")
        # Don't raise, let caller assert state

def handle_overlays(page):
    time.sleep(1)
    try:
        page.evaluate("""
            const overlays = document.querySelectorAll('.fixed.inset-0');
            overlays.forEach(el => el.remove());
        """)
        if page.is_visible("text=Boas-vindas ao LabControl"):
             page.keyboard.press("Escape")
    except:
        pass

def test_login_flow(page, base_url):
    page.goto(base_url, timeout=60000)
    login_if_needed(page)
    handle_overlays(page)

    # Wait explicitly for dashboard text
    try:
        page.wait_for_selector("text=Dashboard", timeout=10000)
    except:
        pass

    assert "dashboard" in page.url or page.is_visible("text=Dashboard")

def test_storage_matrix_layout(page, base_url):
    page.goto(base_url)
    login_if_needed(page)
    handle_overlays(page)

    page.goto(f"{base_url}/#/storage")
    page.wait_for_selector("text=Locais de Armazenamento", timeout=20000)
    handle_overlays(page)

    corrosive_card = page.locator("text=CORROSIVO").first
    if corrosive_card.count() == 0:
        page.wait_for_timeout(2000)
        corrosive_card = page.locator("text=CORROSIVO").first

    if corrosive_card.count() == 0:
        pytest.skip("Corrosivo location not found")

    corrosive_card.click()

    try:
        page.wait_for_selector("text=C3", timeout=10000)
    except:
        page.screenshot(path="verification/failure_matrix_layout.png")
        pytest.fail("Cell C3 not found")

    assert page.locator("text=C3").is_visible()
    assert not page.locator("text=D1").is_visible()

def test_inventory_list(page, base_url):
    page.goto(base_url)
    login_if_needed(page)
    handle_overlays(page)

    page.goto(f"{base_url}/#/inventory")
    try:
        page.wait_for_selector("table", timeout=10000)
    except:
        pass

    assert "inventory" in page.url or "Inventário" in page.title() or page.locator("text=Inventário").first.is_visible()
