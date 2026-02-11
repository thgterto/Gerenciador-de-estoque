# Melhorias Propostas para o LabControl

## 1. Experiência Mobile & Offline (PWA)
- **Status:** Pendente
- **Benefício:** Permitir que o aplicativo seja instalado no celular e funcione sem internet (cache de assets).
- **Implementação:** Configurar `vite-plugin-pwa` com estratégias de cache para fontes, ícones e bundle JS.

## 2. Refatoração de Componentes Críticos
- **Status:** Parcialmente Identificado
- **Alvo:** `InventoryList.tsx` e `InventoryTable.tsx`
- **Problema:** Lógica misturada de Mobile/Desktop e Virtualização no mesmo arquivo, dificultando manutenção.
- **Ação:**
  - Separar `InventoryList` em `InventoryListDesktop` e `InventoryListMobile`.
  - Extrair lógica de virtualização (`react-window`) para um hook ou componente wrapper.
  - Tipar estritamente as props `flatList` (atualmente `any[]`).

## 3. Testes Automatizados (Unitários e Integração)
- **Status:** Setup básico existe (`vitest.setup.ts`), mas cobertura é baixa.
- **Ação:**
  - Criar testes para `utils/businessRules.ts` (regras de negócio críticas).
  - Criar testes de renderização para `InventoryRow` (garantir que não quebra com dados vazios).

## 4. Performance
- **Status:** Otimizável
- **Ação:**
  - Substituir `react-window` por `react-virtuoso` (melhor suporte a alturas dinâmicas, eliminando necessidade de `getItemSize` complexo).
  - Otimizar `useInventoryFilters` para não recalcular filtros em cada digitação (debounce).
  - **Reduzir Tamanho do Bundle:** O arquivo `index.js` principal tem >3MB. É necessário configurar melhor o `manualChunks` no `vite.config.ts` para separar dependências pesadas (MUI, ECharts, etc) ou usar dynamic imports em mais lugares.

## 5. Acessibilidade (A11y)
- **Status:** Melhorado Recentemente
- **Ação:**
  - Garantir que todos os modais tenham foco aprisionado (Focus Trap).
  - Verificar contraste em modo escuro para todos os componentes novos.
