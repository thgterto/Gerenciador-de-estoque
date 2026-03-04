# Checklist de Migração SPFx - Pendências

O projeto base SPFx (`labcontrol-spfx`) foi gerado e os arquivos de código-fonte (`src/`) do projeto React/Electron foram copiados para a nova estrutura. No entanto, devido às mudanças de diretório e arquitetura, a nova web part encontra-se em um estado **não compilável**.

Abaixo está o checklist detalhado com as ações necessárias para concluir a migração com sucesso:

## 1. Correção de Imports Relativos 🔴 [Crítico]
Como os componentes foram movidos de `src/components/` para `src/webparts/labControlApp/components/`, quase todos os *imports* relativos estão quebrados.
- [ ] Atualizar todos os imports de `../../types` nos componentes para o novo caminho correto.
- [ ] Atualizar todos os imports de `../../services/*` nos componentes para o novo caminho.
- [ ] Atualizar todos os imports de `../../utils/*` nos componentes para o novo caminho.
- [ ] Atualizar todos os imports de `../../hooks/*` nos componentes para o novo caminho.
- [ ] Atualizar todos os imports de `../../context/*` nos componentes para o novo caminho.

## 2. Refatoração da Camada de Dados (PnPjs) 🔴 [Crítico]
A arquitetura anterior usava `Dexie.js` e `Better-SQLite3` para IndexedDB/SQLite locais. Estes devem ser completamente substituídos para que o SPFx funcione com Listas do SharePoint.
- [ ] Remover ou desativar o uso de `db.ts` (Dexie) nos componentes.
- [ ] Refatorar a classe `src/services/InventoryService.ts` para usar `@pnp/sp` (conforme o modelo de prova de conceito `SPFxInventoryService`).
- [ ] Refatorar `LedgerService.ts` e `SnapshotService.ts` para buscar dados de Listas do SharePoint (`sp.web.lists.getByTitle()`).
- [ ] Criar as Listas no SharePoint (`LabControl_Catalog`, `LabControl_Batches`, `LabControl_Balances`, `LabControl_History`) que correspondem ao modelo relacional V2.
- [ ] Atualizar a importação de massa (Excel) para realizar *Batches* do SharePoint ao invés de transações IndexedDB.

## 3. Contextos e Roteamento 🟡 [Atenção]
- [ ] **Router:** Substituir o `<BrowserRouter>` (react-router-dom) na raiz do projeto por `<HashRouter>` ou remover totalmente o roteamento dependendo se a Web Part for concebida como uma SPA inteira ou componentes isolados na página.
- [ ] **Context Providers:** Envolver o componente base da web part (`LabControlApp.tsx`) com todos os Providers necessários que estavam no antigo `App.tsx` (ex: `ThemeProvider`, `AuthProvider`, `AlertProvider`, `InventoryProvider`).

## 4. UI e Estilização 🟡 [Atenção]
- [ ] **Tailwind CSS:** Configurar o Tailwind para compilar junto com o Webpack do SPFx. Frequentemente requer ferramentas como `spfx-fast-serve` ou a criação de um prefixo CSS (ex: `.labcontrol-app`) para evitar vazamento de estilos que quebrem a interface nativa do SharePoint.
- [ ] **Tema MUI:** Ajustar a paleta do Material-UI para herdar, opcionalmente, o tema da *site collection* do SharePoint.

## 5. Build e Dependências 🟢 [Limpeza]
- [ ] Remover a pasta antiga `/electron` e arquivos obsoletos (ex: `vite.config.ts`, `main.cjs`).
- [ ] Limpar dependências do `package.json` base (que estava na raiz) que já não são utilizadas (ex: `better-sqlite3`, `electron`, `vite`, `dexie`).
- [ ] Executar com sucesso `gulp build` e `gulp serve` no diretório `labcontrol-spfx` validando a ausência de erros de compilação do TypeScript.

## 6. Configuração PnPjs no Web Part
- [ ] Em `LabControlAppWebPart.ts`, importar o PnPjs e iniciar o contexto durante o método `onInit()`:
  ```typescript
  import { spfi, SPFx } from "@pnp/sp";

  protected async onInit(): Promise<void> {
    await super.onInit();
    const sp = spfi().using(SPFx(this.context));
    // Atribuir 'sp' para uma variável global ou injetar nos serviços.
  }
  ```