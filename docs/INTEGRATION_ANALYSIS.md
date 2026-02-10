# Análise de Integração Frontend-Backend (React + Electron)

## 1. Visão Geral da Arquitetura Atual
O sistema LabControl evoluiu de uma integração Web com Google Apps Script (GAS) para uma aplicação Desktop Portátil usando **Electron** com **SQLite**. A arquitetura atual é híbrida e "Offline-First", mantendo compatibilidade com o modelo antigo enquanto migra para o novo backend local.

### Componentes Principais:
1.  **Frontend (UI/View):** React 19 + Vite.
    -   **Armazenamento Local (Cache L1/L2):** Dexie.js (IndexedDB). A UI lê e escreve diretamente aqui para performance instantânea (Optimistic UI).
    -   **Lógica de Negócio:** `InventoryService.ts` contém regras de validação, geração de IDs e cálculos de estoque.
2.  **Camada de Sincronização:** `InventorySyncManager.ts`.
    -   Intercepta mudanças no Frontend e as envia para o Backend (seja GAS ou Electron).
    -   Utiliza `ApiClient` para abstrair se o destino é `window.electronAPI` ou `fetch` (GAS).
3.  **Backend (Electron/Node):**
    -   **IPC Bridge:** `preload.cjs` expõe métodos seguros para o Frontend.
    -   **Controladores:** `InventoryController.cjs` recebe requisições IPC e executa transações no SQLite.
    -   **Persistência (Fonte da Verdade):** SQLite (via `better-sqlite3`).

---

## 2. Fluxo de Dados Atual (The "Dual Write" Pattern)

Atualmente, uma operação de escrita (ex: Adicionar Item) segue este fluxo:

1.  **Usuário** preenche formulário e clica em Salvar.
2.  **Frontend (`InventoryService.ts`)**:
    -   Gera IDs (CatalogID, BatchID, etc.) localmente.
    -   Escreve no **Dexie (IndexedDB)**.
    -   Atualiza a UI imediatamente.
3.  **Sincronização (`InventorySyncManager.ts`)**:
    -   Chama `notifyChange` / `notifyItemChange`.
    -   Envia o payload (o objeto item completo) para o Backend via IPC (`db:upsert-item`).
4.  **Backend (`InventoryController.cjs`)**:
    -   Recebe o payload.
    -   Re-calcula ou extrai IDs (com lógica ligeiramente diferente ou duplicada).
    -   Executa `UPSERT` nas tabelas SQL (`catalog`, `batches`, `balances`).

---

## 3. Lacunas e Riscos Identificados (Gaps)

### 3.1. Duplicação de Lógica de Negócio (Critical)
A lógica de negócio, especialmente a geração de IDs e a decomposição de objetos (Item -> Catalog/Batch/Balance), existe em dois lugares:
-   **Frontend:** `InventoryService.ts` (`addItem`, `updateItem`).
-   **Backend:** `InventoryController.cjs` (`upsertItem`).

**Risco:** Se a lógica divergir (ex: um muda a regra de ID, o outro não), o Dexie e o SQLite ficarão inconsistentes. O Backend tenta ser resiliente (usando `ON CONFLICT DO UPDATE`), mas a geração de IDs diferentes criaria registros duplicados ou órfãos.

### 3.2. Integridade Transacional (Sync Reliability)
O modelo "Dual Write" não é atômico entre Frontend e Backend.
-   Se o Dexie escreve com sucesso, mas o IPC falha (ex: crash do app, erro de SQL), a UI mostra o dado como salvo, mas ele não foi persistido no SQLite.
-   Ao reiniciar, o `syncFromCloud` (que puxa do SQLite) poderia sobrescrever o dado do Dexie, causando perda de dados "silenciosa" para o usuário que achou que salvou.

### 3.3. Fonte da Verdade Ambígua
Embora o SQLite seja a persistência definitiva, a UI confia cegamente no Dexie. Não há um mecanismo robusto de confirmação (ACK) que reverta o Dexie se o Backend rejeitar a transação.

---

## 4. Recomendações de Melhoria

### 4.1. Centralizar Lógica no Backend (Thin Client)
Mover a responsabilidade de "Regras de Negócio" e "Geração de IDs" estritamente para o Backend.
-   **Fluxo Proposto:**
    1.  Frontend envia `Intent` (ex: `CreateItemDTO`).
    2.  Backend gera IDs, valida, persiste no SQLite.
    3.  Backend retorna o objeto completo persistido.
    4.  Frontend recebe o objeto e atualiza o Dexie (como um cache).
-   **Benefício:** Garante consistência total e elimina duplicação de código.

### 4.2. Robustez na Sincronização (Queue/Ack)
Se mantivermos o "Optimistic UI" (para performance), devemos garantir que a fila de sincronização (`SyncQueueService`) funcione robustamente também para o Electron (hoje parece focada em Offline/GAS).
-   Se o IPC falhar, a requisição deve ser retentada ou o usuário notificado para "Tentar Novamente".

### 4.3. Unificação de Tipos
Compartilhar definições de tipos (`types.ts`) entre o Frontend e os scripts do Electron para garantir que os payloads sejam validados em tempo de compilação (se possível, ou via schemas runtime como Zod).

### 4.4. Refatoração Específica (Prioridade)
-   Remover a lógica de geração de IDs duplicada em `InventoryController.cjs` e fazer com que ele aceite os IDs gerados pelo Frontend (se confiarmos nele) OU fazer o Frontend esperar os IDs do Backend.
-   Dada a natureza "Desktop App", confiar no Backend é mais seguro e arquiteturalmente correto.

---

## 5. Conclusão
O sistema é funcional, mas a arquitetura de "escrita dupla" com lógica duplicada apresenta riscos de manutenção e integridade a longo prazo. A migração para um modelo onde o **Backend (SQLite) é a única fonte da verdade** e o Frontend atua como uma View reativa (com cache local apenas para leitura) é o caminho recomendado para a versão 2.0.
