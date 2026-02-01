# Relatório de Análise de Código (Design Principles)

Este documento apresenta uma análise técnica da base de código focada nos princípios SOLID, DRY, KISS e YAGNI.

## 1. SOLID (Single Responsibility, Open/Closed, Liskov, Interface, Dependency)

### ✅ Pontos Fortes
*   **SRP (Single Responsibility) - `services/LedgerService.ts`**: Focado exclusivamente na integridade contábil (transações, saldos), sem misturar com UI ou persistência externa.
*   **SRP - `utils/stringUtils.ts`**: Centraliza regras de normalização de texto, garantindo que mudanças de regra (ex: "LT" vs "L") sejam feitas em um único lugar.
*   **DIP (Dependency Inversion) - `hooks/useInventoryData.ts`**: Abstrai a origem dos dados para a View Layer. Componentes React não sabem (e não devem saber) se os dados vêm do Dexie ou de uma API.

### ⚠️ Violações e Riscos
*   **SRP (God Object) - `services/InventoryService.ts`**:
    *   Acumula responsabilidades demais: CRUD de itens, orquestração de Sync, Auditoria, Lógica de Migração e Exportação.
    *   *Recomendação*: Separar em `InventorySyncManager`, `InventoryAuditService` e `InventoryExportService`.
*   **SRP (Monolithic Component) - `components/InventoryTable.tsx`**:
    *   Mistura apresentação visual complexa, lógica de filtro de estado e manipulação de dados em massa.
    *   *Recomendação*: Extrair subcomponentes funcionais.

## 2. DRY (Don't Repeat Yourself)

### ✅ Pontos Fortes
*   **Componentes de UI**: O uso de `InventoryRow` para encapsular a lógica de renderização condicional (Mobile/Desktop/Group) evita duplicação de código na iteração principal da lista virtualizada.
*   **Sanitização Centralizada**: Funções como `sanitizeProductName` evitam que regras de limpeza de dados sejam replicadas em múltiplos pontos de entrada.

### ⚠️ Violações
*   **Lógica de Sync**: Fragmentos de lógica de decisão sobre "quando sincronizar" parecem divididos entre o Service principal e o Queue Service, dificultando o entendimento do fluxo completo.

## 3. KISS (Keep It Simple, Stupid)

### ✅ Pontos Fortes
*   **Hooks Customizados**: `useInventoryFilters` é um ótimo exemplo de simplificação, removendo lógica complexa de filtragem de dentro do componente visual.

### ⚠️ Violações
*   **Complexidade Transacional**: A função `InventoryService.addItem` realiza uma transação atômica em 6 tabelas. Isso é justificável pelo requisito de LIMS (integridade), mas eleva a complexidade de manutenção.
*   **HybridStorage**: A camada de *Optimistic Updates* customizada adiciona overhead cognitivo significativo para manutenibilidade futura.

## 4. YAGNI (You Ain't Gonna Need It)

### ⚠️ Principais Violações
*   **`services/SharePointService.ts`**:
    *   Implementação completa de integração Microsoft Graph/SharePoint que não aparenta ser o backend primário (o foco está em Google Apps Script).
    *   Adiciona dependências pesadas (`@azure/msal-browser`) e complexidade de autenticação que pode nunca ser utilizada em produção.
    *   *Recomendação*: Se não for um requisito explícito atual, deve ser removido ou movido para um branch de feature "dormant".
