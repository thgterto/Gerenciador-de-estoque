# Relatório de Inconsistências de Comportamento em Tabelas

## Visão Geral

Este relatório identifica as diferenças comportamentais e estruturais entre as diversas implementações de tabelas na base de código (`InventoryTable`, `HistoryTable`, `Purchases`, `BatchList`, `Dashboard`). O objetivo é fornecer uma análise detalhada para orientar a padronização e melhoria da Experiência do Usuário (UX).

## Tabelas Analisadas

1.  **InventoryTable** (`components/InventoryTable.tsx`, `components/inventory/InventoryList.tsx`)
2.  **HistoryTable** (`components/HistoryTable.tsx`)
3.  **Purchases Table** (`components/Purchases.tsx`)
4.  **BatchList Table** (`components/BatchList.tsx`)
5.  **Dashboard Transactions Table** (`components/Dashboard.tsx`)

## Comparativo de Funcionalidades

| Feature | InventoryTable | HistoryTable | Purchases | BatchList | Dashboard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tecnologia** | Virtualized (`react-window`) | Virtualized (`react-window`) | HTML Nativo (`<table>`) | HTML Nativo (`<table>`) | HTML Nativo (`<table>`) |
| **Scroll** | Interno (Container Próprio) | Interno (Container Próprio) | Externo (Página) | Externo (Página/Card) | Externo (Card) |
| **Seleção** | Multi-seleção, Grupo, Checkbox Header Custom | Nenhuma | Checkbox (`<thead>` padrão) | Nenhuma | Nenhuma |
| **Mobile** | Componentes Dedicados (`MobileRow`) | Grid Responsivo (`minmax`) | Stack/Scroll Horizontal | Scroll/Overflow | Scroll/Overflow |
| **Filtros** | Componente Externo Dedicado | Card Embutido | Input de Busca Embutido | Nenhum | Nenhum |
| **Empty State** | Componente `EmptyState` | Componente `EmptyState` | Componente `EmptyState` | Div Customizada | Linha de Tabela (`colSpan`) |

## Inconsistências Comportamentais Identificadas

### 1. Comportamento de Rolagem (Scrolling)
*   **Problema:** Usuários experimentam dois modos de rolagem distintos. Nas tabelas de Inventário e Histórico, a rolagem é confinada à área da tabela (virtualizada), mantendo o cabeçalho e filtros fixos. Nas tabelas de Compras, Lotes e Dashboard, a rolagem move a página inteira (ou o container pai), fazendo com que cabeçalhos desapareçam.
*   **Impacto:** Perda de contexto em listas longas (Compras) e sensação de "aplicativo vs. site" misturada.

### 2. Padrões de Seleção e Ações
*   **Problema:**
    *   `InventoryTable`: Checkbox localizado em um `div` customizado de cabeçalho. Selecionar itens ativa uma *Floating Action Bar* (barra flutuante) animada.
    *   `Purchases`: Checkbox localizado no `<thead>` nativo. Não há barra flutuante; ações são locais ou botões globais no topo da página.
    *   `BatchList`: Possui uma ação "Rastrear" que só aparece no *hover* do mouse, invisível em dispositivos touch/móveis.
*   **Impacto:** Curva de aprendizado aumentada. O usuário precisa aprender 3 formas diferentes de interagir com itens (Seleção global, Seleção simples, Hover oculto).

### 3. Experiência Móvel (Responsividade)
*   **Problema:**
    *   `InventoryTable`: Adapta-se perfeitamente, trocando as linhas por "cards" (`InventoryMobileChildRow`), otimizado para toque.
    *   `HistoryTable`: Usa CSS Grid para encolher colunas. Funciona, mas pode truncar dados importantes em telas muito pequenas.
    *   `Purchases`, `BatchList`, `Dashboard`: Tabelas nativas tendem a quebrar o layout ou exigir rolagem horizontal indesejada em celulares.
*   **Impacto:** A experiência no celular é degradada fora da tela principal de Inventário.

### 4. Feedback Visual (Loading & Empty States)
*   **Problema:**
    *   `HistoryTable` exibe um *spinner* centralizado.
    *   `BatchList` exibe apenas o texto "Carregando...".
    *   `InventoryTable` não possui indicador de carregamento explícito no código do componente principal (depende do pai ou cache).
    *   `Dashboard` usa uma linha de tabela com `colSpan` para estado vazio, enquanto outros usam o componente rico `EmptyState`.
*   **Impacto:** Falta de consistência visual no feedback do sistema.

## Recomendações

1.  **Padronização Tecnológica:** Migrar a tabela de **Compras (`Purchases`)** para usar a mesma estrutura virtualizada do Inventário, ou abstrair o `InventoryList` em um componente `DataTable` genérico que aceite colunas e dados dinâmicos.
2.  **Unificação de Seleção:** Adotar o padrão de *Floating Action Bar* para qualquer tela que permita seleção múltipla (como Compras), garantindo consistência.
3.  **Mobile First:** Implementar renderização condicional de "Rows" vs "Cards" para todas as tabelas, não apenas Inventário, garantindo usabilidade em tablets e celulares no laboratório.
4.  **Componentes de UI:** Criar um wrapper `<TableContainer>` que padronize o *loading state* e o *empty state* para evitar implementações ad-hoc como a do Dashboard.
