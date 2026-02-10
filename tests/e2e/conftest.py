import pytest
from playwright.sync_api import sync_playwright

@pytest.fixture(scope="session")
def playwright_instance():
    with sync_playwright() as p:
        yield p

@pytest.fixture(scope="session")
def browser(playwright_instance):
    browser = playwright_instance.chromium.launch(headless=True)
    yield browser
    browser.close()

@pytest.fixture(scope="function")
def page(browser):
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()
    yield page
    context.close()

@pytest.fixture(scope="session")
def base_url():
    return "http://localhost:5173"
