
# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.8.1] - 2025-05-26 (Hotfix & Technical Debt)

### Corrigido
- **React Router v7 Warnings:** Ativadas as flags `v7_startTransition` e `v7_relativeSplatPath` para eliminar avisos de depreciação no console.
- **ErrorBoundary (TypeScript):** Correção na herança da classe `ErrorBoundary` importando `Component` explicitamente do React para resolver erros de tipagem estrita (`props` e `setState`).

## [1.8.0] - 2025-05-25 (Import & UX Polish)

### Adicionado
- **Import Wizard Inteligente:** Detecção automática de estruturas de tabela em arquivos Excel, com mapeamento de colunas baseado em Regex e heurística de similaridade.
- **Normalização V2 no Import:** A função `importBulk` agora converte dados planos (V1) em estruturas relacionais (Catalog, Batches, Balances) automaticamente, mantendo a integridade do Ledger.
- **Ações em Inputs:** Campos de formulário agora suportam botões de ação internos (ex: Scanner em SKU, Busca em CAS, Gerador de Lote), melhorando a densidade da UI.

### Alterado
- **Tipagem Estrita:** Refinamento de tipos em `InventoryService` para conformidade com React 19.
- **Feedback Visual:** Melhores indicadores de carregamento e validação nos formulários de item.
- **Auditoria de Ledger:** Aprimoramento na lógica de `runLedgerAudit` para detectar e corrigir divergências decimais em saldos.

### Corrigido
- Erro de tipo `unknown` ao acessar tabelas do Dexie em transações complexas.
- Comportamento de ponteiro do mouse em inputs com ícones de carregamento.

---

## [1.7.0] - 2025-05-20 (Arquitetura V2)

### Adicionado
- **HybridStorageManager:** Camada de abstração sobre o Dexie.js que implementa cache em memória (L1) com persistência assíncrona (L3) para performance de UI instantânea.
- **Tabelas V2 Normalizadas:** Introdução das tabelas `catalog`, `batches`, `partners`, `storage_locations` e `balances` no esquema do banco de dados (Dexie Version 2).
- **Ledger Audit:** Ferramenta de auditoria em `Settings` que compara o saldo "Snapshot" (V1) com o saldo calculado via histórico (V2) e corrige discrepâncias.
- **Auto-Migração:** Hook `useInventoryData` agora detecta bancos de dados legados (V1) e executa `InventoryService.migrateLegacyDataToV2()` automaticamente na inicialização.

### Alterado
- **Database Seeder:** Atualizado para popular tanto as tabelas planas (V1) quanto as relacionais (V2) durante o setup inicial ou reset.
- **InventoryService:** Refatorado para realizar escrita dupla (Double Write) atômica: atualiza o item V1 e insere o registro no histórico/saldos V2 simultaneamente.

### Corrigido
- Correção na tipagem de `MovementRecord` removendo propriedades legadas (`safra`).
- Ajuste na lógica de "Ghost Items" para recuperar históricos órfãos de importações de Excel.

---

## [1.6.0] - 2025-05-10 (Feature Release)
- **Matriz de Armazenamento:** Visualização em Grid interativo para gestão de gavetas e caixas.
- **Integração CAS:** Busca automática de dados de segurança e físico-químicos via API Common Chemistry.

## [1.0.0] - 2025-01-01
- Lançamento inicial (Arquitetura V1 Snapshot-only).