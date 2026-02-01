# Detalhamento do Banco de Dados (QStockDB)

Este documento detalha a estrutura, arquitetura e funcionalidades do banco de dados local utilizado no projeto, baseado na tecnologia **Dexie.js** (IndexedDB).

## 🏛️ Arquitetura Híbrida

O sistema utiliza uma arquitetura **Hybrid Storage** personalizada, definida em `utils/HybridStorage.ts`.

*   **L1 Cache (Memória)**: Arrays em memória para acesso instantâneo e renderização de UI (Zero-latency).
    *   Implementa **Optimistic Updates**: As alterações refletem na tela imediatamente, revertendo apenas em caso de erro no disco.
*   **L3 Persistence (IndexedDB)**: Persistência robusta no navegador via Dexie.js.

## 🗂️ Estrutura do Schema (Evolução)

O banco de dados (`db.ts`) evoluiu através de versões para suportar a transição de um sistema simples para um LIMS (Laboratory Information Management System).

### Versão 1: Legado (Compatibilidade UI)
Tabelas planas mantidas para compatibilidade com componentes de UI existentes.
*   **`items`**: Inventário principal (denormalizado).
*   **`history`**: Log de movimentações simples.

### Versão 2 & 4: Arquitetura LIMS (Normalizada)
Estrutura relacional para rastreabilidade total.

| Tabela | Função | Detalhes |
| :--- | :--- | :--- |
| **`catalog`** | Cadastro Mestre | Produtos únicos (SKU, Nome, CAS, Fórmula). 1 Produto : N Lotes. |
| **`batches`** | Lotes Físicos | Instâncias de recebimento com Validade, Lote do Fornecedor e ID do Parceiro. |
| **`stock_movements`** | Livro Razão (Ledger) | Registro imutável de todas as transações (Entrada, Saída, Consumo). Indexado por `[batchId+createdAt]`. |
| **`balances`** | Saldos (Cache) | Tabela de performance que armazena a quantidade atual de um lote em um local específico. Indexado por `[batchId+locationId]`. |
| **`storage_locations`** | Hierarquia de Locais | Armazéns, Estantes e Prateleiras. |
| **`partners`** | Parceiros de Negócio | Fornecedores e Clientes centralizados. |

### Versão 3: Funcionalidades Offline
*   **`syncQueue`**: Fila de operações realizadas offline, aguardando sincronização com o backend (Google Apps Script) quando a conexão retornar.

## 🔄 Fluxo de Dados

1.  **Leitura**: O sistema tenta ler do Cache L1. Se vazio, busca no IndexedDB (L3) e popula o Cache.
2.  **Escrita**:
    *   Atualiza Cache L1 (Optimistic).
    *   Dispara escrita assíncrona no IndexedDB.
    *   Notifica listeners (React Components) para re-renderizar.

## 🛡️ Backup e Segurança

*   **Backup**: O sistema possui exportação nativa para JSON (`HybridStorageManager.performBackup`), permitindo salvar `items` e `history` localmente.
*   **Tipagem**: Todo o acesso é tipado via TypeScript (`InventoryItem`, `StockBalance`), prevenindo erros de estrutura.
