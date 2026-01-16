
# Arquitetura do LabControl (V2 Híbrida)

Este documento descreve a arquitetura de engenharia do LabControl, projetada para combinar a performance de UI necessária para operações diárias com a integridade de dados exigida por normas laboratoriais.

## 1. Filosofia: Híbrida (Snapshot + Ledger)

Para resolver o dilema entre *Velocidade de Leitura* (necessária para filtros em tempo real e listas virtuais) e *Integridade Contábil* (necessária para auditoria e rastreabilidade), o sistema opera com dois modelos de dados simultâneos:

### 1.1 Modelo V1: O Snapshot (Leitura Rápida)
*   **Tabela:** `items` (IndexedDB) + Cache em Memória (L1).
*   **Estrutura:** Denormalizada (Flat). O objeto `InventoryItem` contém todos os dados necessários para renderizar uma linha na tabela (Nome, Lote, Localização, Saldo Total).
*   **Uso:** Alimentação de UI, Busca Rápida, Dashboards.
*   **Performance:** Leitura O(1) via cache L1.

### 1.2 Modelo V2: O Ledger Relacional (Fonte da Verdade)
*   **Tabelas:** `catalog`, `batches`, `balances`, `history`, `partners`, `storage_locations`.
*   **Estrutura:** Altamente normalizada (3NF). Separa a definição do produto (Catálogo) da instância física (Lote) e da sua distribuição espacial (Saldos).
*   **Uso:** Auditoria, Rastreabilidade, Relatórios Legais, Controle de Qualidade.
*   **Integridade:** Garante que o saldo total seja sempre a soma das partes.

---

## 2. Esquema de Dados V2 (Schema)

### 2.1 Catálogo (`catalog`)
Define "O Que" é o item.
*   `id`: `CAT-{HASH}` (Gerado via SAP+Nome)
*   `sapCode`: Código de material corporativo.
*   `casNumber`: Identificador químico único.
*   `risks`: Matriz de riscos GHS (Inflamável, Tóxico, etc).

### 2.2 Lotes Físicos (`batches`)
Define "Qual" instância do item estamos tratando.
*   `id`: `BAT-{UUID}`
*   `catalogId`: FK para Catálogo.
*   `lotNumber`: Número do lote do fabricante.
*   `expiryDate`: Validade crítica.
*   `qaStatus`: Status de qualidade (Aprovado, Quarentena).

### 2.3 Saldos Distribuídos (`balances`)
Define "Onde" e "Quanto" existe de cada lote.
*   `id`: UUID
*   `batchId`: FK para Lote.
*   `locationId`: FK para Localização.
*   `quantity`: Quantidade decimal exata neste local específico.

### 2.4 Localizações (`storage_locations`)
Hierarquia de armazenamento.
*   `id`: `LOC-{SLUG}`
*   `type`: WAREHOUSE > ROOM > CABINET > SHELF > BOX.
*   `pathString`: Caminho legível (ex: "Almoxarifado > Geladeira 1 > Gaveta B").

---

## 3. Padrões de Projeto (Design Patterns)

### 3.1 Escrita Dupla Atômica (Atomic Dual-Write)
Toda operação de modificação de estoque (Entrada/Saída/Ajuste) deve passar pelo `InventoryService.processTransaction`. Este método executa uma transação ACID no Dexie.js que atualiza simultaneamente:
1.  O registro denormalizado em `items` (para a UI atualizar instantaneamente).
2.  O registro imutável em `history` (Log de auditoria).
3.  O registro de saldo em `balances` (Contabilidade V2).

Se qualquer uma das escritas falhar, a transação inteira é revertida, garantindo que o V1 nunca diverja do V2.

### 3.2 Camada de Persistência Híbrida (`HybridStorageManager`)
Wrapper sobre o Dexie.js que intercepta chamadas de leitura/escrita.
*   **L1 Cache (Memória):** Mantém arrays de objetos JS simples para acesso instantâneo pelo React.
*   **L3 Storage (IndexedDB):** Persistência durável.
*   **Optimistic UI:** Ao salvar, o L1 é atualizado antes da Promise do IDB resolver. Se o IDB falhar, o L1 sofre rollback silencioso e o usuário é notificado.

### 3.3 Estratégia de Normalização de Importação
Para suportar cargas massivas via Excel (que são inerentemente "planas"), o sistema utiliza uma estratégia de **Lazy Normalization** no `ImportEngine`:
1.  O usuário carrega uma planilha plana (Nome, Lote, Qtd).
2.  O sistema gera Hashes determinísticos para `CatalogID` (baseado no nome/SAP) e `BatchID` (baseado no lote).
3.  Durante a transação de salvamento, o sistema verifica se esses IDs já existem no Ledger V2.
    *   Se não existirem, cria os registros de Catálogo e Lote.
    *   Se existirem, atualiza apenas o Saldo (`balances`).
4.  Isso permite que o usuário gerencie o estoque via planilhas simples sem perder a integridade relacional do banco de dados.

---

## 4. Fluxo de Dados (Data Flow)

1.  **Usuário** clica em "Registrar Saída".
2.  **Component** (`MovementModal`) chama `InventoryService.registerMovement`.
3.  **Service** valida regras de negócio (ex: estoque negativo).
4.  **Service** constrói objetos V1 e V2.
5.  **Service** chama `db.transaction`.
6.  **HybridStorage** atualiza cache L1 e notifica `useInventoryData` (React re-renderiza).
7.  **Dexie** comita dados no IndexedDB em background.