
# 🚀 Checklist de Migração: LabControl V1 → V2 (React 19)

Este documento rastreia a evolução do sistema para a Arquitetura Híbrida (Snapshot + Ledger) e atualização da stack tecnológica.

---

## FASE 1: Fundação e Dependências

### Etapa 1: Consolidação do React 19
Garantir que o núcleo da aplicação esteja estável na nova versão do framework.
- [x] Atualizar `package.json` para `react@19.0.0` e `react-dom@19.0.0`.
- [x] Configurar `importmap` no `index.html` para resolver dependências corretamente via `esm.sh`.
- [x] Verificar compatibilidade de `react-router-dom` e `react-window` com React 19.
- [x] **Validação:** A aplicação carrega sem erros de console relacionados a "Minified React error #31" ou "#130".

### Etapa 2: Limpeza de Artefatos
Remover código morto e arquivos de prototipagem que poluem o projeto.
- [x] Excluir pasta `stitch_dashboard_principal` e seus arquivos `.html` duplicados.
- [x] Remover imports não utilizados em `App.tsx` e `index.tsx`.
- [x] Centralizar definições de tipos em `types.ts` (remover duplicatas em arquivos locais).
- [x] **Validação:** Build do Vite (`npm run build`) ocorre sem warnings de arquivos não utilizados.

### Etapa 3: Configuração do Dexie (Schema V2)
Definir a estrutura de banco de dados relacional.
- [x] Implementar esquema V2 em `db.ts` (tabelas `catalog`, `batches`, `balances`, etc.).
- [x] Adicionar índices compostos para performance (ex: `[batchId+locationId]` em `balances`).
- [x] Garantir que o versionamento do Dexie (`.version(2)`) mantenha os dados da V1 acessíveis.
- [x] **Validação:** O banco de dados abre no navegador e as novas tabelas aparecem vazias no DevTools > Application.

---

## FASE 2: Camada de Dados (Logic Layer)

### Etapa 4: Implementação do HybridStorageManager
Implementar o padrão L1/L3 Cache para performance de UI.
- [x] Criar classe `HybridStorageManager` em `utils/HybridStorage.ts`.
- [x] Implementar lógica de *Optimistic UI* (atualizar memória antes do disco).
- [x] Implementar mecanismo de *Rollback* caso a escrita no IndexedDB falhe.
- [x] **Validação:** Adicionar um item atualiza a lista instantaneamente, mesmo simulando lentidão no IndexedDB.

### Etapa 5: Refatoração do InventoryService (Escrita Dupla)
Garantir integridade contábil.
- [x] Atualizar `InventoryService.addItem` para escrever em `items` (V1) e `catalog`/`batches` (V2).
- [x] Atualizar `InventoryService.processTransaction` para atualizar `history` e `balances`.
- [x] Garantir que todas as operações usem transações (`db.transaction`).
- [x] **Validação:** Uma entrada de estoque gera registros em: `items`, `history` e `balances`.

### Etapa 6: Seeding e Dados Mock (LIMS)
Adaptar a carga inicial de dados para o modelo relacional.
- [x] Atualizar `DatabaseSeeder.ts` para popular tabelas V2 baseadas no JSON legado.
- [x] Implementar lógica de geração de UUIDs determinísticos para evitar duplicação em imports repetidos.
- [x] Criar vínculos relacionais (FKs) corretos durante o seed.
- [x] **Validação:** O botão "Restaurar Demo" popula corretamente a aba "Histórico" e a "Matriz de Armazenamento".

### Etapa 7: Ferramenta de Auditoria (Ledger Audit)
Criar mecanismo de autocorreção.
- [x] Implementar `InventoryService.runLedgerAudit()`.
- [x] Comparar `items.quantity` (Snapshot) com `sum(balances.quantity)` (Ledger).
- [x] Criar rotina de correção automática (Drift Correction).
- [x] **Validação:** Rodar a auditoria em `Settings` deve retornar "Sincronizado" após operações normais.

---

## FASE 3: Interface do Usuário (UI/UX)

### Etapa 8: Adaptação da Tabela de Inventário
Refletir a nova estrutura de dados na listagem principal.
- [x] Atualizar `InventoryTable.tsx` para ler dados otimizados do `HybridStorage`.
- [x] Otimizar renderização de `react-window` para evitar *scroll lock* (já iniciado).
- [x] Implementar expansão de linhas para mostrar detalhes de Lotes (V2) dentro do Item (V1).
- [x] **Validação:** Scroll suave em lista com >1000 itens e expansão de grupos funcional.

### Etapa 9: Modais de Movimentação
Atualizar formulários para suportar lógica V2.
- [x] Atualizar `MovementModal` para exigir seleção de Lote específico (se houver múltiplos).
- [x] Adicionar campo de "Localização de Origem/Destino" nas transferências.
- [x] Validar saldo negativo baseando-se na tabela `balances` e não apenas em `items`.
- [x] **Validação:** Não é possível dar saída em um lote específico se ele não tiver saldo naquele local.

### Etapa 10: Matriz de Armazenamento (Visualização)
Conectar o Grid visual aos dados reais.
- [x] Ligar `StorageMatrix.tsx` à tabela `balances` e `storage_locations` (Via Snapshot Híbrido).
- [x] Implementar Drag-and-Drop visual que dispara `InventoryService.updateItemPosition`.
- [x] Implementar filtros visuais (Audit Mode) usando dados enriquecidos (Validade/Risco).
- [x] **Validação:** Arrastar um item no grid atualiza sua localização no banco de dados.

### Etapa 11: Rastreabilidade e Histórico
Melhorar a visualização de auditoria.
- [x] Atualizar `HistoryTable` para mostrar de qual Armazém/Lote o item saiu.
- [x] Implementar filtro por "ID de Lote" (Rastreabilidade completa do frasco).
- [x] Suporte visual para "Ghost Items" (itens deletados que possuem histórico).
- [x] **Validação:** É possível reconstruir o caminho de um frasco desde a entrada até o descarte.

---

## FASE 4: Integrações e Inteligência

### Etapa 12: Motor de Importação (Excel)
Finalizar a ferramenta de migração de legado.
- [x] Testar `ImportWizard` com planilhas reais desformatadas.
- [x] Validar detecção de colunas inteligente (Regex).
- [x] Garantir que importação de histórico recalcule saldos atuais corretamente.
- [x] **Validação:** Importar um Excel de histórico gera o saldo final correto no inventário.

### Etapa 13: Enriquecimento CAS (API)
Finalizar integração com Common Chemistry.
- [x] Otimizar chamadas de API para evitar Rate Limiting (Batch processing).
- [x] Salvar dados retornados (Fórmula, Peso, Riscos) na tabela `catalog` (V2).
- [x] Exibir estrutura molecular 2D no formulário de edição.
- [x] **Validação:** Cadastrar "Acetona" com CAS busca automaticamente a fórmula C3H6O.

---

## FASE 5: Entrega e Performance

### Etapa 14: Otimização de Performance
Garantir 60fps.
- [x] Implementar `React.memo` em componentes de linha de tabela (InventoryRows.tsx).
- [x] Verificar vazamento de memória em `useEffect` de assinaturas do Dexie (Subscription Cleanup).
- [x] Code splitting de rotas pesadas (`Reports`, `Settings`) via `React.lazy`.
- [x] **Validação:** Lighthouse Score > 90 em Performance e Accessibility (Verificação Manual).

### Etapa 15: Teste de Regressão Final
Garantia de qualidade antes do release 1.8.0.
- [x] Resetar banco (`Settings` > `Limpar Tudo`).
- [x] Executar fluxo completo: Cadastro -> Entrada -> Movimentação -> Saída -> Auditoria.
- [x] Verificar persistência de dados após reload (F5).
- [x] Verificar responsividade Mobile.
- [x] **Validação:** O sistema está estável, sem erros no console e pronto para produção.

---
**Status Atual:** CONCLUÍDO. Pronto para Deploy v1.8.0.
