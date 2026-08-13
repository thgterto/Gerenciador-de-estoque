
import { test, expect } from '@playwright/test';

test('Verify Inventory Filters and Dashboard', async ({ page }) => {
  // 1. Go to Inventory Page
  await page.goto('http://localhost:5173/');

  // Wait for initial load
  await page.waitForTimeout(2000);

  // 2. Check if Inventory Table loads
  const inventoryRow = page.locator('text=Lote').first();
  await expect(inventoryRow).toBeVisible();

  // 3. Test Filtering (Simulates useInventoryFilters hook)
  const searchInput = page.locator('input[placeholder="Buscar por nome, lote, CAS..."]');
  await searchInput.fill('ACIDO');
  await page.waitForTimeout(1000); // Wait for debounce

  // Verify results are filtered
  const filteredRow = page.locator('text=ACIDO').first();
  await expect(filteredRow).toBeVisible();

  // 4. Go to Dashboard (Simulates useDashboardAnalytics hook)
  await page.click('text=Dashboard'); // Assuming there is a link/button

  // 5. Verify Dashboard KPIs load
  await expect(page.locator('text=Itens Vencidos')).toBeVisible();
  await expect(page.locator('text=Baixo Estoque')).toBeVisible();

  // Take screenshot for verification
  await page.screenshot({ path: 'verification_inventory_perf.png' });
});
