
# Plano de Projeto & Roadmap (Agile)

Este documento rastrea o progresso do desenvolvimento do LabControl rumo à arquitetura V2 completa e funcionalidades avançadas de Gestão.

## 📊 Status Geral
*   **Versão Atual:** 1.7.0
*   **Fase Atual:** Milestone 2 (UX & Auditoria Visual)
*   **Próxima Release:** 1.8.0 (Previsão: Q3 2025)

---

## 📅 Roadmap Detalhado

### ✅ Milestone 1: Fundação V2 & Integridade (CONCLUÍDO)
*Objetivo: Estabelecer a integridade de dados e arquitetura híbrida.*
*   [x] Implementar `HybridStorageManager` (L1/L3 Cache).
*   [x] Modelar Schema V2 (`catalog`, `batches`, `balances`).
*   [x] Migração Automática V1 -> V2 no boot.
*   [x] Ferramenta de Auditoria de Ledger (`runLedgerAudit`).
*   [x] Suporte a "Ghost Items" para importação de legado.

### 🚧 Milestone 2: Refinamento de UX & Visualização V2 (EM ANDAMENTO)
*Objetivo: Expor a riqueza de dados do V2 para o usuário final na interface.*
*   [ ] **Issue #101 - Árvore de Lotes:** Atualizar o modal de "Editar Item" para mostrar não apenas o saldo total, mas a lista de lotes (V2 `batches`) que compõem aquele saldo, com suas respectivas validades.
*   [ ] **Issue #102 - Rastreabilidade:** Criar uma view dedicada em "Histórico" que permita filtrar por `Batch ID`, mostrando todo o ciclo de vida de um frasco específico (Entrada -> Consumo -> Descarte).
*   [ ] **Issue #103 - Gestão de Localização:** Permitir mover estoques entre locais (tabela `balances`) via Drag-and-Drop na Matriz de Armazenamento.

### 📅 Milestone 3: Mobile & Operação em Campo (PLANEJADO)
*Objetivo: Facilitar o uso em tablets e celulares dentro do laboratório.*
*   [ ] **Issue #201 - Scanner Nativo:** Melhorar a performance do leitor de QR Code para uso contínuo (modo "Inventário Rápido").
*   [ ] **Issue #202 - Modo Offline Robusto:** Garantir que transações sejam enfileiradas (`SyncQueue`) se a conexão cair (embora seja local, útil para PWA sync futuro).
*   [ ] **Issue #203 - UI Responsiva:** Adaptar a `InventoryTable` para cards empilhados em telas < 768px.

### 📅 Milestone 4: Relatórios & Compliance (FUTURO)
*Objetivo: Atender requisitos legais (Polícia Federal/Anvisa).*
*   [ ] **Issue #301 - Mapa de Mapa de Produtos Controlados:** Relatório mensal automático somando entradas e saídas de itens com flag `isControlled`.
*   [ ] **Issue #302 - Curva ABC:** Dashboard de inteligência de consumo.
*   [ ] **Issue #303 - Certificados:** Upload e anexo de PDFs (Laudos/CoAs) aos lotes V2.

---

## 🛠️ Definição de Pronto (DoD)
Uma tarefa só é considerada pronta quando:
1.  O código está escrito em TypeScript estrito.
2.  A funcionalidade persiste dados corretamente nas tabelas V2 (Ledger).
3.  A UI reflete a alteração instantaneamente (Optimistic UI).
4.  Não há regressão na performance de renderização da lista principal.
