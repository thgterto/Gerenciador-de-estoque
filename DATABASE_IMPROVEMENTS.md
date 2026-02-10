# Análise e Oportunidades de Melhoria do Banco de Dados

Este documento apresenta uma análise técnica do esquema atual (`QStockCorpDB`) com foco em performance local (IndexedDB/Dexie.js), integridade de dados e robustez para operação offline.

## 1. Otimização de Performance (Índices e Tipos)

O IndexedDB utiliza B-Trees para indexação. A escolha correta de chaves e tipos de dados impacta diretamente a performance de leitura e escrita.

### 1.1. Índices Compostos Faltantes (✅ Implementado na V6)
A tabela `items` (V1) possui muitos índices individuais, o que força o Dexie a fazer "intersecção de índices" em memória para queries complexas.
*   **Problema:** Filtros comuns na UI (ex: "Todos os Reagentes Ativos") podem ser lentos.
*   **Recomendação:** Criar índices compostos para padrões de acesso frequentes.
    *   `[category+itemStatus]`: Para filtrar itens por categoria e status.
    *   `[location.warehouse+category]`: Para inventário por local.
    *   `[expiryDate+itemStatus]`: Para relatórios de validade (ex: vencidos e ativos).

### 1.2. Otimização de Datas (String vs Timestamp)
Atualmente, datas são armazenadas como `DateISOString` (string ~24 bytes).
*   **Problema:** Comparação de strings é mais lenta que números, e ocupam 3x mais espaço no índice.
*   **Recomendação:** Migrar colunas indexadas de data (`expiryDate`, `createdAt`, `date`) para `number` (Timestamp Unix em ms).
    *   *Benefício:* Range queries (`.where('date').between(...)`) até 2x mais rápidas.
    *   *Ação:* Manter ISO apenas para exibição ou serialização JSON na camada de API.

### 1.3. Chaves Primárias e IDs
O uso de UUIDs (strings de 36 chars) é correto para sistemas distribuídos/offline, mas impacta o tamanho do índice.
*   **Melhoria (Opcional):** Considerar **ULID** (Universally Unique Lexicographically Sortable Identifier).
    *   *Vantagem:* Ordenável por tempo (dispensa coluna `createdAt` para ordenação simples) e mais compacto (26 chars).

---

## 2. Consistência da Arquitetura Híbrida (V1 vs V2)

O sistema mantém dados duplicados entre V1 (UI Snapshot) e V2 (Normalizado). A integridade depende da aplicação.

### 2.1. Transações Atômicas
A escrita em `items` (V1) deve ser estritamente atômica com `catalog`/`batches`/`balances` (V2).
*   **Risco:** Se o navegador travar durante uma operação, podemos ter um Lote criado (V2) sem reflexo na UI (V1).
*   **Recomendação:** Envolver TODAS as operações de escrita em `db.transaction('rw', [tables...], async () => { ... })`.
    *   *Exemplo:* Ao criar um item, a transação deve incluir `catalog`, `batches`, `balances`, `items` e `stock_movements`. Se um falhar, tudo é revertido.

### 2.2. "Soft Foreign Keys" (✅ Implementado Hooks de Integridade na V6)
IndexedDB não possui chaves estrangeiras nativas.
*   **Recomendação:** Implementar Hooks no Dexie (`db.batches.hook('deleting', ...)`).
    *   *Ação:* Impedir a deleção de um `CatalogProduct` se existirem `Batches` associados.
    *   *Ação:* Implementar "Cascade Delete" lógico (ex: deletar Batch -> deletar Balances associados).

---

## 3. Robustez Offline e Sincronização

A tabela `syncQueue` é um bom começo, mas pode ser aprimorada.

### 3.1. Controle de Concorrência (Optimistic Locking)
*   **Problema:** Dois usuários editam o mesmo item offline. Quem ganha ao sincronizar?
*   **Recomendação:** Adicionar coluna `version` (inteiro) ou `updatedAt` (timestamp confiável do servidor) em todas as tabelas sincronizáveis.
    *   *Lógica:* Ao salvar, verificar se `local.version === remote.version`. Se não, solicitar merge ao usuário.

### 3.2. Prioridade de Sincronização
*   **Recomendação:** A `syncQueue` deve processar dependências.
    *   *Cenário:* Criar Item A (ID temp) -> Movimentar Item A.
    *   *Solução:* Garantir ordem sequencial (FIFO) estrita por entidade ou usar UUIDs gerados no front (já feito, o que é ótimo).

---

## 4. Manutenibilidade e Limpeza

### 4.1. Soft Deletes
*   **Recomendação:** Padronizar `deletedAt` em todas as tabelas (interface `Auditable` já tem, mas precisa ser usada).
    *   *Motivo:* Permite "Desfazer" ações e facilita a sincronização incremental (saber o que foi deletado para replicar no servidor).

### 4.2. Exppurgo de Logs
A tabela `systemLogs` pode crescer indefinidamente.
*   **Recomendação:** Implementar rotina de limpeza automática no startup.
    *   *Regra:* `db.systemLogs.where('timestamp').below(oneMonthAgo).delete()`.

---

## Resumo das Prioridades

1.  🔴 **Crítico:** Implementar **Transações Atômicas (db.transaction)** para todas as escritas híbridas V1/V2.
2.  ✅ **Concluído:** Criar **Índices Compostos** em `items` e `batches` para queries lentas da UI (Versão 6).
3.  ✅ **Concluído:** Implementar **Hooks de Integridade** (Soft FKs) para evitar dados órfãos.
4.  🟢 **Desejável:** Migrar datas para `Timestamp (number)` e adotar `ULID`.
