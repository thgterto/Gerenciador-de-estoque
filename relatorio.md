# Relatório de Análise e Sanitização da Codebase

Este relatório detalha as fragilidades, pontos de fricção e oportunidades de refatoração identificadas na análise da codebase do LabControl UMV. O objetivo é guiar o processo de sanitização para garantir estabilidade, escalabilidade e facilidade de manutenção.

## 1. Fragilidades (Fragilities)

Código propenso a falhas, erros de runtime ou corrupção de dados.

| Arquivo | Problema Identificado | Risco | Proposta de Correção |
|---|---|---|---|
| `services/InventoryService.ts` | **Gerenciamento Manual de Transações**: A função `addItem` e `updateItem` gerencia manualmente múltiplas tabelas (`items`, `catalog`, `batches`, `balances`). | Alto. Se uma operação falhar fora do bloco transacional (ou se a lógica estiver incompleta), o estado do V1 (UI) e V2 (Ledger) ficará inconsistente. | Centralizar a lógica de escrita no `LedgerService` e usar *triggers* ou observadores para atualizar o snapshot V1 automaticamente. |
| `services/InventoryService.ts` | **Audit de Memória (runLedgerAudit)**: Carrega *todos* os itens e balanços para a memória RAM. | Alto. Em produção com muitos dados, causará *Crash* por Out of Memory. | Implementar paginação ou processamento em *stream* (iteradores do Dexie). |
| `services/InventoryService.ts` | **Busca Linear (findItemByCode)**: Itera sobre todo o array de itens para achar um código. | Médio. Performance degradada com o crescimento do banco. | Utilizar índices do Dexie (`table.where('sapCode').equals(...)`). |
| `services/GoogleSheetsService.ts` | **Recursão em Retry**: `fetchWithRetry` usa recursão. | Baixo (mas má prática). Risco teórico de estouro de pilha. | Refatorar para um loop `while` ou `for` simples. |
| `hooks/useInventoryData.ts` | **Reload Total no Subscribe**: Ao detectar qualquer mudança no banco, recarrega *toda* a lista de itens. | Médio. Causa "piscadas" na UI e uso excessivo de CPU/IO. | Implementar atualizações granulares ou usar `useLiveQuery` do Dexie. |
| `components/ItemForm.tsx` | **Tipagem Fraca (any)**: Props como `onSubmit` aceitam dados parcialmente tipados ou `any` implícito. | Médio. Erros de runtime silenciosos. | Tipar estritamente com `CreateItemDTO` e usar validação (Zod) antes do submit. |

## 2. Pontos de Fricção e Dor (Pain Points)

Padrões que dificultam o desenvolvimento e manutenção diária.

*   **Modelo de Dados Duplo (V1 vs V2)**:
    *   **Problema**: O sistema mantém um modelo "Flat" (`InventoryItem` no V1) para a UI e um modelo "Relacional" (`Catalog`/`Batch`/`Balance` no V2) para o backend lógico.
    *   **Impacto**: Toda nova feature precisa ser implementada duas vezes. Mapear dados de V1 para V2 é propenso a erros.
    *   **Solução**: Migrar a UI para consumir diretamente as Views do V2 ou automatizar totalmente a geração do V1 via *Database Triggers* (camada de serviço).

*   **Componente Monolítico (`ItemForm.tsx`)**:
    *   **Problema**: Arquivo com ~500 linhas misturando UI, validação, chamadas de API (CAS), regras de negócio (Categorias) e estado.
    *   **Impacto**: Difícil de testar e alterar. Adicionar um novo campo é arriscado.
    *   **Solução**: Extrair hooks (`useItemForm`, `useCasSearch`) e componentes visuais (`RiskSelector`, `BatchInfo`).

*   **Strings "Hardcoded"**:
    *   **Problema**: Strings como 'REAGENT', 'GLASSWARE', categorias e mensagens de erro espalhadas pelo código.
    *   **Impacto**: Refatorações de nome ou internacionalização (i18n) são quase impossíveis.
    *   **Solução**: Mover para arquivos de constantes (`config/constants.ts`) ou Enums.

## 3. Polimorfismo (Oportunidades)

Trocar condicionais (`if/switch`) por objetos ou estratégias.

*   **Tipos de Movimentação (`InventoryService` / `LedgerService`)**:
    *   **Atual**: Blocos `if (type === 'ENTRADA') ... else if (type === 'SAIDA') ...`.
    *   **Proposta**: Criar interface `MovementStrategy` com métodos `execute()`, `validate()`. Classes: `EntryStrategy`, `ExitStrategy`, `TransferStrategy`.

*   **Categorias por Tipo de Item (`ItemForm.tsx`)**:
    *   **Atual**: Switch case gigante retornando arrays de strings.
    *   **Proposta**: Objeto de configuração ou classe `ItemCategoryRegistry` onde se registra tipos e suas categorias.

## 4. Encapsulamento (Oportunidades)

Ocultar detalhes internos e reduzir acoplamento.

*   **IDs Internos no Frontend**:
    *   **Problema**: A UI manipula IDs como `BAT-123`, `LOC-456`.
    *   **Solução**: A UI deveria lidar com objetos de domínio. O formato do ID é detalhe de implementação do banco.

*   **Configuração Global**:
    *   **Problema**: `GoogleSheetsService` acessa `GOOGLE_CONFIG` diretamente.
    *   **Solução**: Injeção de Dependência ou passar configuração no construtor/inicialização. Facilitaria testes unitários (Mock da config).

*   **Lógica de Sincronização**:
    *   **Problema**: `InventoryService` chama `GoogleSheetsService` diretamente dentro de métodos CRUD.
    *   **Solução**: Usar padrão *Observer* ou *Middleware*. Quando `InventoryService` salva, um evento `ITEM_UPDATED` é disparado, e o `SyncService` (que escuta o evento) lida com a nuvem. Separação de responsabilidades.

## 5. Itens Não Utilizados (Dead Code)

Código que pode ser removido para limpar a base.

*   **Tipos Legados**:
    *   `LegacyLimsData` (types.ts): Parece resquício de uma importação antiga.
    *   `FullRelationalDumpDTO` (types.ts): Usado apenas em seeds/mappers que parecem ser de migração única.

*   **Migração Recorrente**:
    *   `MigrationV2.ts`: É chamado em todo startup (`InventoryService.initialize`). Se a migração já ocorreu, isso é custo de performance desnecessário (mesmo que tenha "early return"). Deveria ser um script separado ou rodar apenas sob demanda/flag de versão.

## Próximos Passos (Plano de Ação)

1.  **Prioridade Alta**: Refatorar `InventoryService.ts` para usar índices do Dexie e corrigir a lógica de transação (evitar inconsistência).
2.  **Prioridade Média**: Extrair lógica de `ItemForm.tsx` para hooks e constantes.
3.  **Prioridade Baixa**: Implementar padrão Strategy para movimentações e Observer para Sync.
4.  **Limpeza**: Remover tipos não usados e otimizar inicialização (`MigrationV2`).

Este relatório serve como base para as tarefas de refatoração técnica ("Tech Debt Payback").
