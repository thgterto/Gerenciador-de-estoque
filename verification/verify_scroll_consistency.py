from playwright.sync_api import sync_playwright
import time

def run(playwright):
    # Emulate iPhone 12 Pro (Mobile Viewport)
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 390, 'height': 844}, user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1")
    page = context.new_page()

    results = []

    try:
        # 1. Login
        print("Logging in...")
        page.goto("http://localhost:4173/")
        page.fill("input[type='text']", "admin")
        page.fill("input[type='password']", "admin")
        page.click("button:has-text('Acessar Sistema')")
        page.wait_for_url("**/dashboard")

        # Helper to check scroll consistency
        def verify_page(name, url_suffix):
            print(f"Verifying {name} ({url_suffix})...")
            page.goto(f"http://localhost:4173/#{url_suffix}")
            time.sleep(2) # Allow render

            # Safe Modal Removal
            page.evaluate("""
                const divs = document.querySelectorAll('div');
                divs.forEach(div => {
                    if (window.getComputedStyle(div).position === 'fixed' && window.getComputedStyle(div).zIndex >= 50) {
                        div.remove();
                    }
                });
            """)

            # 1. Check Container Overflow Style
            scroll_container_found = page.evaluate("""
                () => {
                    // Start from body and look down
                    const candidates = Array.from(document.querySelectorAll('div'));
                    for (const el of candidates) {
                        const style = window.getComputedStyle(el);
                        if ((style.overflowY === 'auto' || style.overflowY === 'scroll')) {
                            // Check if it's a main layout element (size reasonable)
                            if (el.clientHeight > 300) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
            """)

            # 2. Check actual scrollability (Scroll Height > Client Height)
            can_scroll = page.evaluate("""
                () => {
                    const candidates = Array.from(document.querySelectorAll('div'));
                    for (const el of candidates) {
                        const style = window.getComputedStyle(el);
                        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.clientHeight > 300) {
                            if (el.scrollHeight > el.clientHeight) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
            """)

            status = "PASS" if scroll_container_found else "FAIL"
            results.append({
                "Page": name,
                "Container Configured": scroll_container_found,
                "Content Overflows": can_scroll,
                "Status": status
            })

            page.screenshot(path=f"verification/scroll_check_{name}.png")

        # Test Suite
        verify_page("Dashboard", "/dashboard")
        verify_page("Inventory", "/inventory")
        verify_page("History", "/history")
        verify_page("Storage", "/storage")
        verify_page("Purchases", "/purchases")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

    # Report
    print("\n--- SCROLL CONSISTENCY REPORT ---")
    print(f"{'Page':<15} | {'Container Config':<18} | {'Content Overflow':<18} | {'Status':<10}")
    print("-" * 70)
    for r in results:
        print(f"{r['Page']:<15} | {str(r['Container Configured']):<18} | {str(r['Content Overflows']):<18} | {r['Status']:<10}")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
