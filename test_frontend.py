import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://localhost:5173")
        # Ensure we're logged in if needed
        # Go to history page
        # Take screenshot
        await browser.close()

asyncio.run(run())
