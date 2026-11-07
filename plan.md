1. **Add `aria-label` to buttons in `src/components/QuickScanModal.tsx`**:
   - Add `aria-label="Set continuous mode to Entrada (IN)"` to the "IN" button.
   - Add `aria-label="Set continuous mode to Saida (OUT)"` to the "OUT" button.
   - Add `aria-label="Toggle continuous mode"` to the "AUTO-SCAN" / "MANUAL" button.

2. **Add `aria-label` to buttons in `src/components/Purchases.tsx`**:
   - Add `aria-label="Diminuir quantidade"` to the "-" button.
   - Add `aria-label="Aumentar quantidade"` to the "+" button.

3. **Add `aria-label` to buttons in `src/components/inventory/InventoryFilters.tsx`**:
   - Add `aria-label="Filtrar todos os status"` to the "Todos" button.
   - Add `aria-label="Filtrar estoque baixo"` to the "Baixo" button.
   - Add `aria-label="Filtrar vencidos"` to the "Vencidos" button.
   - Add `aria-label={\`Filtrar categoria \${cat || 'Outros'}\`}` to category buttons.
   - Add `aria-label="Limpar filtro de categoria"` to the "Limpar" button.

4. **Complete pre commit steps**
   - Run linter and tests to ensure no regressions.
