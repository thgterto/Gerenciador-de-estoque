# PRD: Excel Automation Setup & Migration

## 1. Contexto Técnico
O sistema LabControl UMV está migrando sua arquitetura de integração de planilhas. A solução legada baseada em Google Apps Script (GAS) será completamente substituída por uma solução nativa de Excel Online, utilizando **Office Scripts** e **Power Automate**.

## 2. Problema a Resolver
1.  **Dependência de GAS**: O código atual depende de scripts do Google (`GoogleSheetsService.ts` e `backend/GoogleAppsScript.js`), que não atendem aos requisitos de conformidade de algumas organizações focadas em Microsoft 365.
2.  **Configuração Manual**: A configuração de webhooks e scripts é complexa e manual.
3.  **Falta de Ferramentas**: Não há assistente na interface para gerar os scripts necessários para o Excel.

## 3. Solução Proposta
Implementar uma nova camada de serviço `ExcelIntegrationService` que substitua integralmente o `GoogleSheetsService`. Criar um modal assistente (`ExcelSetupModal`) que automatize a geração de código para os scripts do Excel.

### Arquitetura V2 (Excel First)
*   **Frontend**: React (Client) envia dados para um Webhook.
*   **Middleware**: Power Automate (Webhook Receiver) ou Script direto.
*   **Backend**: Excel Online (Armazenamento).

### Componentes Chave
1.  **Service Layer**: `ExcelIntegrationService.ts` substitui `GoogleSheetsService.ts`. Todas as chamadas (`logMovement`, `fetchInventory`, `addOrUpdateItem`) serão redirecionadas.
2.  **Configuração**: Substituir `LC_GAS_WEBAPP_URL` por `LC_EXCEL_WEBHOOK_URL`.
3.  **Automação (Script Generation)**:
    *   O sistema deve fornecer o código TypeScript (Office Script) pronto para o usuário copiar e colar no Excel Online. Esse script criará as tabelas necessárias (`Inventory`, `Transactions`, `Catalog`, etc.).
    *   O sistema deve orientar o usuário a criar um fluxo no Power Automate para receber os dados via HTTP (Webhook) e chamar o script ou inserir linhas.

## 4. Arquivos Afetados
*   `src/services/GoogleSheetsService.ts`: **DEPRECATED / REMOVER**.
*   `src/services/ExcelIntegrationService.ts`: **NOVO**.
*   `src/services/InventorySyncManager.ts`: Atualizar importações.
*   `src/components/ExcelSetupModal.tsx`: **NOVO**.
*   `src/components/Settings.tsx`: Atualizar UI.

## 5. Requisitos Funcionais do Modal
O modal deve ter 3 etapas:
1.  **Gerar Script**: Exibir código `.osts` (Office Script) que cria as tabelas no Excel. Botão "Copiar".
2.  **Instrução Power Automate**: Exibir JSON Schema para o Webhook do Power Automate.
3.  **Conexão**: Input para salvar a URL do Webhook do Power Automate. Teste de conexão (Ping).

## 6. Restrições
*   A "construção" da planilha é feita pelo *usuário* executando o script fornecido pelo modal, pois a API Graph requer OAuth complexo. O fluxo "Copiar Script -> Colar no Excel" é o MVP aprovado.
