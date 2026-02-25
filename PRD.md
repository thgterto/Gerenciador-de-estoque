# PRD: Backend Data Model Upgrade to V2

## 1. Contexto Técnico
O frontend do LabControl UMV evoluiu para uma arquitetura V2 (Ledger-based) que utiliza um modelo de dados rico contendo Catálogo, Lotes (Batches), Saldos (Balances) e Localizações. O backend atual (Node.js/Fastify/SQLite) opera em um modelo V1 simplificado (Produto e Transação simples), incapaz de suportar a sincronização completa e a persistência dos dados complexos gerados pelo frontend.

## 2. Problema a Resolver
O backend atual não persiste nem retorna as entidades fundamentais do modelo V2:
- `CatalogProduct` (Dados mestres enriquecidos: CAS, Fórmulas, Riscos).
- `InventoryBatch` (Rastreabilidade: Lote, Validade).
- `StockBalance` (Saldos por lote e localização).
- `StorageLocation` (Estrutura física do armazém).
- `StockMovement` (Transações detalhadas com origem/destino e vínculo com lotes).

Atualmente, o endpoint `GET /api/inventory` retorna apenas uma visão simplificada, e a sincronização (`fetchFullDatabase`) no frontend recebe arrays vazios para estas entidades, impedindo o funcionamento correto da aplicação em modo híbrido/conectado.

## 3. Arquivos Afetados
### Infraestrutura
- `server/src/infrastructure/database/database.ts`: Migração de esquema para adicionar tabelas V2 (`catalog`, `batches`, `balances`, `locations`, `stock_movements`).
- `server/src/infrastructure/database/SQLiteInventoryRepository.ts`: Adaptação para persistir e ler o grafo de objetos completo.

### Domínio
- `server/src/domain/entities/`: Criação das novas entidades (`Catalog`, `Batch`, `Balance`, `Location`, `Movement`).

### Casos de Uso
- `server/src/use-cases/GetFullDatabase.ts` (Novo): Para retornar o dump completo do banco para o frontend.
- `server/src/use-cases/SyncTransaction.ts` (Novo/Adaptação): Para processar transações complexas recebidas do frontend.

### Adaptadores
- `server/src/adapters/controllers/InventoryController.ts`: Expor novos endpoints de sincronização.
- `server/src/app.ts`: Registrar novas rotas.

## 4. Referências Técnicas
- Frontend `InventoryService.ts`: Define a estrutura esperada e lógica de sincronização.
- Frontend `types/index.ts` (implícito): Define as interfaces dos objetos.
- `EXCEL_INTEGRATION_GUIDE.md`: Menciona integração com Power Automate, que deve ser preservada ou suportada via Webhooks no futuro (fora do escopo imediato, mas manter compatibilidade).

## 5. Restrições
- **Banco de Dados**: SQLite (já em uso).
- **Performance**: As operações de leitura completa (`GetFullDatabase`) devem ser otimizadas.
- **Compatibilidade**: O backend deve ser a "Source of Truth".
- **Segurança**: Manter autenticação JWT existente.
