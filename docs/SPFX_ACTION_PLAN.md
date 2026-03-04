# Plano de Ação Robusto: Migração para SPFx (SharePoint Framework)

Este documento detalha o plano de execução passo-a-passo, transformando as pendências estruturais da migração em uma sequência lógica, mitigando riscos e garantindo um deploy funcional do LabControl como uma *SharePoint Web Part*.

---

## Fase 1: Saneamento e Reestruturação (Semana 1)
**Objetivo:** Obter um projeto compilável (`gulp build` sem erros), mesmo que as lógicas de negócio ainda não apontem para o backend real.

### 1.1 Correção de Estrutura de Diretórios
- Mover o conteúdo da pasta redundante `labcontrol-spfx/labcontrol-spfx/` para a raiz de um repositório limpo SPFx, ou achatar a estrutura atual para evitar nested projects (ex: mover para a raiz do monorepo).
- Consolidar `package.json` base, garantindo que dependências SPFx (`@microsoft/sp-core-library`, etc.) coexistam com as dependências React necessárias (`@mui/material`, `tailwindcss`).

### 1.2 Refatoração de Imports (Automated/Manual Sweep)
- **Problema:** Ao mover componentes para `src/webparts/labControlApp/components/`, centenas de imports (ex: `../../types`) quebraram.
- **Ação:** Utilizar ferramentas de *Find & Replace* ou scripts em Node/Python para remapear os caminhos relativos de forma estruturada.
- **Validação:** Rodar `npx tsc --noEmit` na pasta SPFx até atingir zero erros de resolução de módulos.

### 1.3 Isolamento da Camada de Dados Antiga
- Comentar ou encapsular todos os *imports* e chamadas a `db.ts` (Dexie) e `Better-SQLite3`.
- Substituir chamadas diretas ao IndexedDB por chamadas a *Interfaces* vazias ou *Mocks* que retornem promessas (ex: usar o já criado `SPFxInventoryService` como *Mock* inicial).
- **Validação final da Fase 1:** O comando `gulp serve` deve abrir o *SharePoint Workbench* local sem erros de console ou de compilação.

---

## Fase 2: Infraestrutura SharePoint (Semana 2)
**Objetivo:** Preparar o ambiente SharePoint (Tenant) e integrar a biblioteca de comunicação (`@pnp/sp`).

### 2.1 Provisionamento do Modelo de Dados (V2 Ledger)
- Criar script PowerShell (PnP.PowerShell) ou lógica via código para provisionar automaticamente as listas necessárias no Site do SharePoint:
  - `LabControl_Catalog` (Colunas: SAPCode, CAS, Name, Risks, MinStock)
  - `LabControl_Batches` (Colunas: CatalogId (Lookup), LotNumber, ExpiryDate, QAStatus)
  - `LabControl_Balances` (Colunas: BatchId (Lookup), Location, Quantity)
  - `LabControl_History` (Registro imutável das transações)

### 2.2 Configuração do PnPjs e Autenticação
- No arquivo `LabControlAppWebPart.ts`, configurar o provedor principal do PnPjs:
  ```typescript
  import { spfi, SPFx } from "@pnp/sp";
  // Dentro do onInit()
  const sp = spfi().using(SPFx(this.context));
  ```
- Criar um **Service Locator** ou **Contexto React (`SPContext.tsx`)** para injetar a instância do `sp` (PnPjs) globalmente nos serviços e componentes da aplicação, removendo a necessidade de passar via *props* para dezenas de componentes.

---

## Fase 3: Refatoração dos Serviços Core (Semanas 3 e 4)
**Objetivo:** Substituir as lógicas de negócio do IndexedDB (Offline) pelas operações na nuvem (SharePoint Lists).

### 3.1 Migração de Leitura (Snapshot/Dashboard)
- Reescrever `SnapshotService.ts` e hooks como `useInventoryData.ts` para usar:
  `sp.web.lists.getByTitle("LabControl_Catalog").items.select("...").expand("...").get()`
- Garantir que a renderização do `InventoryTable` (Tabela Virtualizada) se mantenha performática, implementando paginação caso a lista ultrapasse 5.000 itens (limite do SharePoint).

### 3.2 Migração de Escrita Transacional (Ledger)
- **Desafio Crítico:** O LabControl V2 garante a integridade usando *Escrita Dupla Atômica* (`db.transaction`). O SharePoint não possui transações ACID nativas entre listas.
- **Ação:** Reescrever `InventoryService.ts` (`processTransaction`) utilizando **SPFx Batching** (`sp.web.createBatch()`).
  - Lógica: Ler saldos atuais -> Calcular novos saldos -> Enviar atualizações para `Balances` e inserção para `History` no mesmo *Batch Request*.
  - Tratamento de Falhas (Rollback manual ou bloqueios lógicos caso o Batch falhe no meio).

---

## Fase 4: Adequação de UI, Contexto e Integrações (Semana 5)
**Objetivo:** Ajustar a experiência do usuário para rodar harmonicamente como uma Web Part, garantindo responsividade e usabilidade.

### 4.1 Tailwind CSS e SPFx
- Integrar o Tailwind ao pipeline do Gulp.
- **Essencial:** Prefixar o Tailwind (`prefix: 'tw-'` no `tailwind.config.js`) ou isolar as classes `.css` geradas para evitar que as classes de *reset* do Tailwind destruam o layout da *suite navigation* do Microsoft 365.

### 4.2 Roteamento (Routing)
- Migrar `<BrowserRouter>` para `<HashRouter>` (ou MemoryRouter). O `BrowserRouter` altera a URL base e causará erros 404 dentro de uma página moderna do SharePoint.

### 4.3 Tratamento de Erros e Logs
- Redirecionar `LogService.ts` (que salvava no IndexedDB) para criar itens em uma lista de `LabControl_SystemLogs` no SharePoint, auxiliando a depuração em produção.

---

## Fase 5: Testes e Deploy (Semana 6)
**Objetivo:** Homologação do sistema completo e empacotamento.

### 5.1 Testes E2E (Playwright)
- Criar fluxos de automação verificando os cenários mais sensíveis:
  - Adição de novo item ao Catálogo.
  - Movimentação de estoque (Entrada/Saída) impactando corretamente o saldo.
  - Leitura de Códigos de Barras (Zebra/Câmera) renderizando corretamente os modais.

### 5.2 Empacotamento
- Executar `gulp bundle --ship` e `gulp package-solution --ship`.
- Submeter o pacote `.sppkg` gerado para o *App Catalog* do SharePoint do cliente.
- Realizar a inserção da Web Part em uma página moderna de testes.