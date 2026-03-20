import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            record_video_dir="videos/"
        )
        page = await context.new_page()

        print("Navigating to local dev server...")
        await page.goto("http://localhost:5173", wait_until="networkidle")

        # Log in
        print("Logging in...")
        await page.fill("input[placeholder='Digite seu usuário']", "admin")
        await page.fill("input[placeholder='Digite sua senha']", "admin")
        await page.click("button:has-text('ENTRAR NO SISTEMA')")

        print("Waiting for dashboard to load...")
        await page.wait_for_timeout(3000)

        # Remove any strict overlays (Setup/Tutorial)
        await page.evaluate('''() => {
            document.querySelectorAll('.fixed').forEach(el => {
                const zIndex = parseInt(window.getComputedStyle(el).zIndex);
                if (zIndex > 10 || isNaN(zIndex)) {
                    el.remove();
                }
            });
        }''')

        print("Navigating to History...")
        # In the sidebar, look for "Histórico"
        try:
            await page.click("text=Histórico", timeout=3000)
        except Exception as e:
            print("Failed to click Histórico normally, trying to force click or find by other means")
            await page.evaluate('''() => {
                const links = Array.from(document.querySelectorAll('a, button, div, span'));
                const hist = links.find(el => el.textContent.includes('Histórico'));
                if(hist) hist.click();
            }''')

        print("Waiting for history table to load...")
        await page.wait_for_timeout(3000)

        print("Taking screenshot...")
        await page.screenshot(path="verify_history_table.png")

        await context.close()
        await browser.close()
        print("Done! Check verify_history_table.png and the videos/ folder.")

if __name__ == "__main__":
    asyncio.run(main())
