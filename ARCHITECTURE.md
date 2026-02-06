# Arquitetura do LabControl (V3 Portable)

O LabControl evoluiu para uma aplicação Desktop Standalone (Portátil), utilizando o **Electron** como runtime e **SQLite** embarcado como fonte única de verdade.

## 1. Filosofia: Portable & Local-First

A arquitetura foi redesenhada para operar 100% offline, sem dependência de serviços externos (Google Sheets/Apps Script). O banco de dados viaja junto com a aplicação, permitindo que a pasta do software seja movida entre computadores sem perda de dados (quando configurado em modo portátil).

### 1.1 Backend: Electron Main Process
*   **Runtime:** Node.js (via Electron).
*   **Banco de Dados:** SQLite3 (via `better-sqlite3`).
*   **Comunicação:** IPC (Inter-Process Communication) nativo.
*   **Benefício:** Latência zero, suporte a transações ACID robustas, sem dependência de internet.

### 1.2 Frontend: React + IPC Bridge
*   **Camada de Serviço:** `GoogleSheetsService` foi adaptado para atuar como um *Gateway Agnostic*. Se detectar o ambiente Electron (`window.electronAPI`), ele roteia as requisições para o processo local via IPC. Caso contrário (Web mode), mantém o fallback para HTTP (se configurado).
*   **Interface:** A UI permanece em React 19, consumindo dados assincronamente.

---

## 2. Esquema de Dados V3 (SQLite)

O esquema relacional (3NF) foi portado do conceito lógico V2 para tabelas físicas SQL.

### 2.1 Catálogo (`catalog`)
Tabela Mestre de Produtos.
*   `id`: PK (TEXT).
*   `name`, `sapCode`, `casNumber`, `risks` (JSON).

### 2.2 Lotes (`batches`)
Instâncias físicas dos produtos.
*   `id`: PK (TEXT).
*   `catalogId`: FK -> catalog.id.
*   `lotNumber`, `expiryDate`, `status`.

### 2.3 Saldos (`balances`)
Quantificação e localização.
*   `id`: PK (TEXT).
*   `batchId`: FK -> batches.id.
*   `quantity`, `locationId`.
*   *Soft Delete:* Registros deletados recebem status 'DELETED'.

### 2.4 Movimentações (`movements`)
Log de auditoria imutável (Append-Only).
*   `id`: PK (TEXT).
*   `itemId`, `type` (ENTRADA/SAIDA), `quantity`, `date`.
*   Dados denormalizados (snapshot) do item no momento da ação para preservação histórica.

---

## 3. Padrões de Implementação

### 3.1 IPC Bridge Pattern
O arquivo `electron/preload.cjs` expõe uma API segura (`window.electronAPI`) para o contexto de renderização. O Frontend não acessa o `better-sqlite3` diretamente (segurança); ele envia "mensagens" solicitando ações (`upsert-item`, `read-full`).

### 3.2 Transactional Upsert
A operação de salvar item (`upsertItem`) é atômica. O SQLite garante que a atualização do Catálogo, Criação do Lote e Atualização do Saldo ocorram todas ou nenhuma.

### 3.3 Portable Data Path
No modo produção, o banco de dados `labcontrol.db` é criado em uma pasta `labcontrol_data` adjacente ao executável, em vez de usar o diretório de dados do usuário do sistema operacional (%APPDATA%). Isso facilita backups manuais e portabilidade (Pen Drives).

---

## 4. Estrutura de Diretórios Backend

```
electron/
├── main.cjs        # Entry Point. Configura Janela e IPC.
├── preload.cjs     # Bridge de Segurança.
├── db.cjs          # Camada de Acesso a Dados (DAO). Gerencia SQLite.
└── db/
    └── schema.sql  # Definição DDL das tabelas.
```

## 5. Fluxo de Dados (Data Flow)

1.  **UI:** Usuário salva um item.
2.  **Service:** `GoogleSheetsService.addOrUpdateItem(item)` é chamado.
3.  **Gateway:** Verifica `window.electronAPI`. Chama `request('upsert_item', ...)` .
4.  **IPC:** Electron Main recebe evento `db:upsert-item`.
5.  **Controller:** Invoca `db.upsertItem(item)` em `electron/db.cjs`.
6.  **DB:** `better-sqlite3` abre transação, executa SQLs, comita.
7.  **Response:** Retorna `{ success: true }` para a UI.
