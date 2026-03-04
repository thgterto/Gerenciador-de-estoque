# LabControl - SPFx Deployment & Architecture

Este documento detalha o processo de empacotamento, implantação (deploy) e a nova arquitetura da aplicação LabControl migrada para Microsoft SharePoint Framework (SPFx).

## 1. Arquitetura Pós-Migração
O LabControl foi migrado de uma aplicação desktop Standalone (Electron + React) para uma **Web Part** renderizada nativamente dentro do SharePoint Online.

### Mudanças Principais:
- **Roteamento:** A navegação interna da aplicação usa o `HashRouter` (`/#/inventory`, `/#/history`) ao invés do `BrowserRouter`, garantindo que a URL host do SharePoint não seja alterada e cause erros 404.
- **Armazenamento de Dados:** O sistema abandonou o uso do banco local (Dexie/Better-SQLite3) e agora interage de forma assíncrona com **Listas do SharePoint**.
- **Comunicação (PnPjs):** A injeção de contexto é feita através da biblioteca `@pnp/sp`. As operações em lote (escrita transacional para saldo + histórico) utilizam `sp.batched()`, simulando operações atômicas da V2 anterior.
- **Estilização Isolada:** O TailwindCSS foi reconfigurado com um prefixo (`tw-`) para prevenir o vazamento de estilos globais que poderiam quebrar o layout padrão da suíte de navegação do Microsoft 365.

---

## 2. Pré-requisitos do Ambiente de Desenvolvimento
Antes de construir ou modificar o LabControl, garanta as seguintes ferramentas na máquina:
1. Node.js v22 ou superior (O projeto utiliza `@microsoft/sp-core-library` 1.22.x).
2. NPM (`npm install -g npm`) e `gulp-cli` (`npm install -g gulp-cli`).
3. Uma conta de Desenvolvedor M365 (Tenant de testes para deploy local e validação).

---

## 3. Empacotando o Código (Build)
Para compilar e gerar o pacote instalável para produção, siga os seguintes passos via terminal, dentro do diretório `/labcontrol-spfx/`:

```bash
# 1. Instale as dependências (com flag legacy se necessário pelas versões do React)
npm install --legacy-peer-deps

# 2. Rode o Build e Testes em modo de produção
npm run build
# ou usando o Gulp
gulp bundle --ship

# 3. Gere a solução (.sppkg)
gulp package-solution --ship
```
> O pacote será gerado no caminho: `labcontrol-spfx/sharepoint/solution/labcontrol-spfx.sppkg`.

---

## 4. Instruções de Implantação (Deploy no SharePoint)
Uma vez que você possua o arquivo `.sppkg`, execute a implantação na organização destino:

1. **Acessar o App Catalog:**
   - Faça login com uma conta com perfil de `SharePoint Administrator`.
   - Navegue até o **SharePoint Admin Center** > **Mais Recursos (More features)** > **Apps**.
   - Ou acesse diretamente: `https://[SEU-TENANT]-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/manageApps`.

2. **Upload da Solução:**
   - Clique no botão **Upload** e selecione o arquivo `labcontrol-spfx.sppkg`.
   - O SharePoint irá apresentar uma tela de confirmação de segurança.
   - Marque a caixa: *"Make this solution available to all sites in the organization"* (Permitir acesso a todos os sites).
   - Marque a caixa sobre o acesso à API (caso haja solicitações de acesso a Graph API no manifest do pacote).
   - Clique em **Deploy**.

3. **Provisionando Listas Iniciais (Estrutura de Dados V2):**
   Para a aplicação não falhar ao carregar, o site destino precisa ter 4 listas base criadas:
   - `LabControl_Catalog`
   - `LabControl_Batches`
   - `LabControl_Balances`
   - `LabControl_History`
   > *Nota: Você deve garantir que essas listas estejam presentes e expostas corretamente para o PnPjs fazer a leitura/escrita.*

4. **Instalando a Web Part na Página:**
   - Vá até um site de Grupo/Comunicação no SharePoint e crie uma nova Página Moderna.
   - Em modo de edição, clique no ícone `(+)` para adicionar uma Web Part.
   - Busque por **"LabControlApp"** e adicione-a ao layout.
   - Publique a página. A aplicação carregará a interface completa dentro da Web Part renderizada.
