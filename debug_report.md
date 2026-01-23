# Relatório de Depuração: Falha de Deploy e Inconsistência de Banco de Dados

## Resumo do Problema
O sistema apresenta instabilidade após atualizações recentes de banco de dados (Schema V4). A causa raiz identificada é uma falha na lógica de migração de dados (V1 -> V2), que deixa o banco de dados em um estado "híbrido", onde itens antigos existem na visualização (tabela `items`) mas não possuem os registros contábeis correspondentes (tabelas `batches`, `balances`) exigidos pelo novo `LedgerService`.

## Evidências Encontradas

### 1. Bloqueio de Migração (`utils/MigrationV2.ts`)
A função de migração possui uma verificação de segurança excessivamente restritiva:
```typescript
const batchCount = await db.rawDb.batches.count();
if (batchCount > 0) {
    console.log("[Migration] V2 Ledger already populated. Skipping.");
    return;
}
```
**Impacto:** Se existir *qualquer* registro na tabela `batches` (ex: um item de teste criado manualmente), a migração de todos os outros itens legados é cancelada silenciosamente.

### 2. Dependência Estrita do Ledger (`services/LedgerService.ts`)
O serviço de transações exige que o registro de saldo exista previamente para saídas:
```typescript
const existing = await db.rawDb.balances.where({ batchId, locationId }).first();
if (!existing) {
    throw new Error(`Saldo insuficiente (Registro inexistente) para Lote...`);
}
```
**Impacto:** Tentativas de movimentar itens que não foram migrados (órfãos) resultam em erro de execução (Crash/Exception), pois o `InventoryService` tenta debitar de um saldo que não existe.

## Diagnóstico
O "Deploy inviabilizado" é causado por erros de runtime (`Runtime Errors`) que ocorrem assim que o usuário tenta interagir com dados antigos. O banco de dados não está corrompido, mas está **incompleto**.

## Solução Recomendada

### Passo 1: Correção do Script de Migração
É necessário alterar `utils/MigrationV2.ts` para que a migração seja **Idempotente** (segura de rodar múltiplas vezes) e **Incremental**.

**Lógica Proposta:**
Em vez de checar `batches.count() > 0`, devemos iterar sobre os itens que ainda não possuem vínculo V2:
```typescript
// Pseudocódigo da correção
const items = await db.items.filter(i => !i.batchId).toArray();
// Processar apenas estes itens...
```

### Passo 2: Execução de Script de Correção (Emergency Fix)
Para recuperar o ambiente atual sem perder dados, recomenda-se executar o seguinte comando no Console do Desenvolvedor (F12) ou criar um botão temporário de "Forçar Migração":

```javascript
// Snippet para forçar a migração dos itens restantes
import { db } from './db';
import { MigrationV2 } from './utils/MigrationV2';

async function forceMigration() {
    console.log("Forçando migração de itens órfãos...");
    const items = await db.items.toArray();
    for (const item of items) {
        if (!item.batchId) { // Só migrar quem não tem Batch ID
             await MigrationV2._promoteItem(item);
             console.log(`Item migrado: ${item.name}`);
        }
    }
    console.log("Concluído.");
}
forceMigration();
```

## Próximos Passos
1. Implementar a correção em `utils/MigrationV2.ts`.
2. Criar uma versão nova do DB (v5) ou um hook de inicialização que chame a migração corrigida.
3. Realizar novo build e deploy.
