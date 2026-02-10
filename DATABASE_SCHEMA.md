# Esquema do Banco de Dados (IndexedDB)

Este documento descreve o esquema de dados do banco de dados local `QStockCorpDB`, gerenciado via **Dexie.js**. O sistema utiliza uma abordagem híbrida, mantendo tabelas legadas (V1) para compatibilidade com a UI e tabelas normalizadas (V2) para a arquitetura LIMS.

## Visão Geral

*   **Nome do Banco:** `QStockCorpDB`
*   **Versão Atual:** 6
*   **Tecnologia:** IndexedDB (via Dexie.js wrapper)

---

## 1. Tabelas LIMS V2 (Normalizadas - 3NF)

Esta é a estrutura "real" e normalizada do banco de dados, desenhada para integridade referencial e escalabilidade.

### `catalog` (Catálogo de Produtos)
Define "O QUE" é o item (Dados Mestres). Compartilhado entre múltiplos lotes.
*   **Chave Primária:** `id` (CAT-{HASH})
*   **Índices:** `sapCode`, `name`, `categoryId`, `casNumber`, `[categoryId+isActive]` (Composto V6)
*   **Integridade:** Bloqueia deleção se existirem `batches` associados.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | string | Identificador único (CAT-...) |
| `sapCode` | string | Código corporativo SAP |
| `name` | string | Nome do produto |
| `categoryId` | string | Categoria do item |
| `baseUnit` | string | Unidade de Medida (UOM) |
| `casNumber` | string? | Número CAS (para químicos) |
| `molecularFormula` | string? | Fórmula molecular |
| `molecularWeight` | string? | Peso molecular |
| `risks` | RiskFlags | Flags GHS (Tóxico, Inflamável, etc.) |
| `isControlled` | boolean | Se é controlado (Polícia Federal/Exército) |
| `minStockLevel` | number | Estoque mínimo |
| `isActive` | boolean | Se o item está ativo no catálogo |
| `itemType` | ItemType | Tipo (REAGENT, GLASSWARE, EQUIPMENT, etc.) |

### `batches` (Lotes de Inventário)
Define "QUAL" instância específica nós temos (Lote Físico).
*   **Chave Primária:** `id` (BAT-{UUID})
*   **Índices:** `catalogId`, `lotNumber`, `partnerId`, `status`, `expiryDate`, `[status+expiryDate]` (Composto V6), `[catalogId+status]` (Composto V6)
*   **Integridade:** Bloqueia deleção se existirem `balances` associados (lógica de aplicação).

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | string | Identificador único (BAT-...) |
| `catalogId` | string | FK -> `catalog.id` |
| `partnerId` | string? | FK -> `partners.id` (Fabricante/Fornecedor) |
| `lotNumber` | string | Número do lote |
| `expiryDate` | string? | Data de validade (ISO) |
| `manufactureDate` | string? | Data de fabricação (ISO) |
| `unitCost` | number | Custo unitário |
| `currency` | string? | Moeda do custo |
| `status` | string | ACTIVE, QUARANTINE, BLOCKED, DEPLETED, OBSOLETE |

### `storage_locations` (Locais de Armazenamento)
Definições físicas de armazenamento.
*   **Chave Primária:** `id`
*   **Índices:** `name`, `type`, `parentId`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | string | Identificador único |
| `name` | string | Nome do local (ex: "Armário 1") |
| `type` | string | WAREHOUSE, ROOM, CABINET, SHELF, BOX, VIRTUAL |
| `pathString` | string | Caminho completo (ex: "Almox > Armário 1 > Prateleira 2") |

### `partners` (Parceiros de Negócio)
Fornecedores, fabricantes e entidades internas.
*   **Chave Primária:** `id`
*   **Índices:** `name`, `type`, `active`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | string | Identificador único |
| `name` | string | Nome da empresa/entidade |
| `type` | string | SUPPLIER, MANUFACTURER, INTERNAL |
| `active` | boolean | Status do parceiro |

### `balances` (Saldos de Estoque)
Define "ONDE" e "QUANTO" (Quantidades). Conecta um Lote a um Local Físico. Atua como um cache persistente para leitura rápida.
*   **Chave Primária:** `id` (BAL-{HASH})
*   **Índices:** `[batchId+locationId]` (Índice Composto), `batchId`, `locationId`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | string | Identificador único (BAL-...) |
| `batchId` | string | FK -> `batches.id` |
| `locationId` | string | FK -> `storage_locations.id` |
| `quantity` | number | Quantidade atual |
| `lastMovementAt` | string | Data da última movimentação (ISO) |

### `stock_movements` (Movimentações de Estoque)
O Razão (Ledger) real. Registro imutável de todas as transações.
*   **Chave Primária:** `id`
*   **Índices:** `batchId`, `type`, `[batchId+createdAt]`, `[type+createdAt]`, `fromLocationId`, `toLocationId`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único da transação |
| `batchId` | string | FK -> `batches.id` |
| `fromLocationId` | string? | FK -> `storage_locations.id` (Origem) |
| `toLocationId` | string? | FK -> `storage_locations.id` (Destino) |
| `quantity` | number | Quantidade movimentada |
| `type` | string | ENTRADA, SAIDA, AJUSTE, TRANSFERENCIA |
| `userId` | string? | ID do usuário responsável |
| `createdAt` | string | Data da transação (ISO) |
| `observation` | string? | Observações |

---

## 2. Tabelas V1 (Legado / Otimização UI)

Estas tabelas mantêm a estrutura original "flat" (desnormalizada) usada pela interface React para performance (Cache L1). Elas são mantidas em sincronia com as tabelas V2.

### `items` (Inventário Denormalizado)
A entidade principal da UI. É um JOIN de Catalog + Batch + Balance.
*   **Chave Primária:** `id`
*   **Índices:** `sapCode`, `lotNumber`, `name`, `category`, `supplier`, `expiryDate`, `itemStatus`, `location.warehouse`, `molecularFormula`, `batchId`, `catalogId`
*   **Índices Compostos (V6):**
    *   `[category+itemStatus]`
    *   `[location.warehouse+category]`
    *   `[expiryDate+itemStatus]`

### `history` (Histórico Legado)
Registro de movimentações simplificado para exibição na UI.
*   **Chave Primária:** `id`
*   **Índices:** `itemId`, `date`, `type`, `sapCode`, `lot`, `productName`, `batchId`, `fromLocationId`, `toLocationId`

### Outras Tabelas de Suporte V1
*   **`sapOrders` / `sapOrderItems`**: Integração com pedidos SAP.
*   **`locations`**: Container legado de importações de locais.
*   **`suppliers`**: Container legado de importações de fornecedores.
*   **`localOrders`**: Pedidos de compra locais.
*   **`systemConfigs`**: Configurações chave-valor do sistema.
*   **`systemLogs`**: Logs de erro e atividades do sistema.

---

## 3. Tabelas de Suporte Offline (V3)

### `syncQueue` (Fila de Sincronização)
Armazena operações realizadas offline para posterior sincronização.
*   **Chave Primária:** `++id` (Auto-incremento)
*   **Índices:** `timestamp`, `action`, `[timestamp+action]` (Composto V6)

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | number | ID sequencial |
| `timestamp` | number | Timestamp da ação |
| `action` | string | Tipo da ação (ex: CREATE_ITEM) |
| `payload` | any | Dados da operação |
| `retryCount` | number | Contador de tentativas |
| `error` | string? | Último erro de sincronização |
