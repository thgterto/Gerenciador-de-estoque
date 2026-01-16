
# Guia de Desenvolvimento LabControl

## Padrões de Arquitetura

### 1. Separação Lógica vs. UI
*   **Componentes (`/components`):** Devem ser puramente visuais. Evite regras de negócio complexas (cálculos de imposto, validação de compatibilidade química) dentro do JSX.
*   **Hooks (`/hooks`):** A lógica de estado e efeitos colaterais reside aqui. Ex: `useInventoryData` gerencia o ciclo de vida do carregamento do banco.
*   **Services (`/services`):** Regras de negócio puras e interação direta com o banco de dados (`db`). A UI nunca deve chamar `db.table.add()` diretamente; deve usar `InventoryService.addItem()`.

### 2. Gerenciamento de Estado (Sync vs Async)
Como o IndexedDB é assíncrono, a renderização do React pode sofrer.
*   **Use `HybridStorage`:** Para listas longas (Inventário, Histórico), confiamos no cache em memória do `db.ts` para renderizar instantaneamente.
*   **Escrita Otimista:** Ao salvar um dado, atualize a UI (state local) imediatamente, mesmo antes da Promise do banco resolver, para dar sensação de instantaneidade. Reverta se falhar (catch).

### 3. Padrão de Nomenclatura V2
Ao trabalhar com o banco de dados:
*   Entidades V1 (Legado/UI): `InventoryItem` (contém tudo num objeto só).
*   Entidades V2 (Relacional): `CatalogProduct` (Definição), `InventoryBatch` (Lote físico), `StockBalance` (Saldo por local).
*   **Regra:** Novas features devem ler de V1 (pela velocidade) mas escrever em AMBOS (V1 e V2) para manter o Ledger consistente.

## Setup do Ambiente

1.  Certifique-se de usar Node v18+.
2.  VS Code com extensões: ESLint, Prettier, Tailwind CSS IntelliSense.

## Comandos Úteis

*   `npm run typecheck`: Valida tipagem TypeScript sem compilar.
*   `npm run lint`: Verifica estilo de código.

## Fluxo de Deploy
O projeto é compilado para estático (`dist/`). Como é Offline-First, não requer backend (Node/Python). Pode ser hospedado em qualquer CDN (Vercel, Netlify, S3, GitHub Pages).
