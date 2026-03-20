import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            record_video_dir="videos/"
        )
        page = await context.new_page()

        print("Navigating to local dev server login...")
        await page.goto("http://localhost:5173", wait_until="networkidle")

        # Log in
        print("Logging in...")
        await page.fill("input[placeholder='Digite seu usuário']", "admin")
        await page.fill("input[placeholder='Digite sua senha']", "admin")
        await page.click("button:has-text('ENTRAR NO SISTEMA')")

        print("Waiting for dashboard to load...")
        await page.wait_for_timeout(2000)

        # Check for DB Setup overlay and select LOAD SAMPLE DATA
        try:
            print("Looking for Initialize System modal...")
            # Click the LOAD SAMPLE DATA button
            await page.click("button:has-text('LOAD SAMPLE DATA')", timeout=3000)
            print("Clicked load sample data. Waiting for it to finish...")
            await page.wait_for_timeout(3000)
        except Exception as e:
            print("No setup modal found or failed to interact.")

        # Remove any strict overlays (Setup/Tutorial)
        await page.evaluate('''() => {
            document.querySelectorAll('.fixed').forEach(el => {
                const zIndex = parseInt(window.getComputedStyle(el).zIndex);
                if (zIndex > 10 || isNaN(zIndex)) {
                    el.remove();
                }
            });
        }''')

        print("Clicking to history directly on page without routing...")
        try:
            # wait for page load finish (Carregando LabControl... is gone)
            await page.wait_for_selector("text=Carregando LabControl...", state="hidden", timeout=10000)
            await page.click("text=Histórico", timeout=3000)
            print("Clicked history. Waiting for table...")
        except Exception as e:
            print("Failed to click Histórico normally, trying to force click")
            await page.evaluate('''() => {
                const links = Array.from(document.querySelectorAll('a, button, div, span'));
                const hist = links.find(el => el.textContent.includes('Histórico') && el.href && el.href.includes('/history'));
                if(hist) hist.click();
            }''')

        print("Waiting for history table to load...")
        await page.wait_for_timeout(5000)

        print("Taking screenshot...")
        await page.screenshot(path="verify_history_table.png")

        await context.close()
        await browser.close()

        # Find the generated video
        videos = [f for f in os.listdir("videos/") if f.endswith(".webm")]
        if videos:
            videos.sort(key=lambda x: os.path.getmtime(os.path.join("videos", x)))
            print(f"Done! Check verify_history_table.png and videos/{videos[-1]}")
        else:
            print("Done! Check verify_history_table.png")

if __name__ == "__main__":
    asyncio.run(main())
