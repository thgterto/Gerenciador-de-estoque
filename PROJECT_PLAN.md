
# Plano de Projeto & Roadmap (Agile)

Este documento rastreia o progresso do desenvolvimento do LabControl rumo à arquitetura V2 completa e funcionalidades avançadas de Gestão.

## 📊 Status Geral
*   **Versão Atual:** 1.8.3
*   **Fase Atual:** Milestone 3 (Mobile & Field Ops)
*   **Próxima Release Principal:** 1.9.0 (Previsão: Q3 2025)

---

## 📅 Roadmap Detalhado

### ✅ Milestone 1: Fundação V2 & Integridade (CONCLUÍDO)
*Objetivo: Estabelecer a integridade de dados e arquitetura híbrida.*
*   [x] Implementar `HybridStorageManager` (L1/L3 Cache).
*   [x] Modelar Schema V2 (`catalog`, `batches`, `balances`).
*   [x] Migração Automática V1 -> V2 no boot.
*   [x] Ferramenta de Auditoria de Ledger (`runLedgerAudit`).
*   [x] **Persistência de Logs:** Implementação do `LogService` com armazenamento em IndexedDB.
*   [x] **Gerenciador de Compras Offline:** Persistência de rascunhos de compras (`db.localOrders`).

### ✅ Milestone 2: Motor de Importação & Migração (CONCLUÍDO)
*Objetivo: Facilitar a carga de dados legados e planilhas externas.*
*   [x] **Import Wizard Inteligente:** Detecção de tabelas e mapeamento via Regex.
*   [x] **Smart Merge:** Atualização não-destrutiva de saldos (V1) mantendo dados ricos (V2).
*   [x] **Suporte GHS:** Mapeamento automático de colunas de risco (O, T, T+, C, E, etc.).
*   [x] **IDs Determinísticos:** Uso de Hashing para evitar duplicação de histórico em re-importações.

### 🚧 Milestone 3: Mobile & Operação em Campo (EM ANDAMENTO)
*Objetivo: Otimizar o uso em tablets e celulares dentro do laboratório (PWA).*
*   [x] **Scanner Nativo Otimizado:** Melhorias na estabilidade do `QuickScanModal` e `useScanner` (correção de double-mount).
*   [x] **Responsividade Avançada:** Refatoração da `StorageMatrix` para scroll unificado (`PageContainer`) e suporte a subdivisão de prateleiras.
*   [ ] **Ações de Deslizar (Swipe):** Implementar gestos nas listas mobile para Editar/Mover rapidamente.
*   [ ] **Modo Offline Robusto:** Implementar `SyncQueue` para enfileirar transações caso a conexão caia durante o uso em zonas mortas do laboratório.

### 📅 Milestone 4: Relatórios & Compliance (FUTURO)
*Objetivo: Atender requisitos legais (Polícia Federal/Anvisa) e Inteligência de Negócio.*
*   [ ] **Relatório de Controlados:** Mapa automático de entradas e saídas de itens com flag `isControlled` (já preparado no backend).
*   [ ] **Análise de Custo:** Dashboard financeiro detalhado (Custo Médio, Valor em Estoque por Local).
*   [ ] **Certificados Digitais:** Upload e anexo de PDFs (Laudos/CoAs) aos lotes V2.
*   [ ] **Trilha de Auditoria Exportável:** Gerar PDF imutável com o log de ações do sistema.

---

## 🛠️ Definição de Pronto (DoD)
Uma tarefa só é considerada pronta quando:
1.  O código está escrito em TypeScript estrito.
2.  A funcionalidade persiste dados corretamente nas tabelas V2 (Ledger).
3.  A UI reflete a alteração instantaneamente (Optimistic UI).
4.  Não há regressão na performance de renderização da lista principal.
5.  A funcionalidade opera 100% offline.
