# PRD: Excel Automation Setup Modal

## 1. Contexto Técnico
O sistema LabControl UMV suporta integração com planilhas online (Google Sheets ou Excel Online via Power Automate) para sincronização de dados e relatórios. Atualmente, a configuração depende de processos manuais (criar planilha, criar script, copiar URL) descritos em `EXCEL_INTEGRATION_GUIDE.md`. O usuário precisa de uma forma simplificada de configurar essa integração diretamente na interface, incluindo a geração automática ou assistida dos scripts necessários.

A página de configurações (`src/components/Settings.tsx`) já possui um cartão "Excel / Power Automate" que usa o componente `ExcelIntegrationForm.tsx`. Este formulário atual apenas pede "Nome" e "Email" para enviar dados, mas não configura a *conexão* (URL do Webhook ou Script). O `GoogleSheetsService.ts` lê a URL de `localStorage` (`LC_GAS_WEBAPP_URL`), mas não há UI clara para definir isso além de edições manuais ou variáveis de ambiente.

## 2. Problema a Resolver
1.  **Configuração Obscura**: O usuário não tem onde colar a URL do Webhook/Script facilmente.
2.  **Processo Manual**: O usuário precisa ler um guia markdown para saber como criar o script no Excel/Google Sheets.
3.  **Falta de Automação**: Não há uma ferramenta que "gere" o código do script para o usuário copiar e colar no editor do Excel/GAS.

## 3. Solução Proposta
Criar um **Modal de Configuração de Automação** (`ExcelSetupModal`) que guie o usuário em três passos:
1.  **Escolha da Plataforma**: Google Sheets (Legacy) ou Excel Online (Power Automate).
2.  **Geração de Script**:
    *   Para **Google Sheets**: Exibir o código `.gs` necessário para o Apps Script.
    *   Para **Excel Online**: Exibir o esquema JSON para o Power Automate ou o código Office Script (`.osts`) para criar as tabelas.
3.  **Conexão**: Campo para colar a URL do Webhook gerado (Power Automate) ou Web App URL (Google Apps Script).
4.  **Teste**: Botão para enviar um "Ping" e verificar a conexão.

Este modal será acionado a partir da página de Configurações, substituindo ou complementando o formulário atual.

## 4. Arquivos Afetados
*   `src/components/Settings.tsx`: Adicionar botão para abrir o novo modal.
*   `src/components/ExcelIntegrationForm.tsx`: Pode ser depreciado ou integrado ao novo fluxo.
*   `src/components/ExcelSetupModal.tsx` (Novo): O componente principal do wizard.
*   `src/services/GoogleSheetsService.ts`: Atualizar para suportar teste de conexão explícito e salvar URL.
*   `src/utils/ExcelScriptGenerator.ts` (Novo): Utilitário para gerar os templates de código dinamicamente.

## 5. Referências Técnicas
*   **Office Scripts**: TypeScript para Excel.
*   **Google Apps Script**: JavaScript para GSheets.
*   `GOOGLE_CONFIG` em `src/config/apiConfig.ts`: Gerencia o `localStorage`.

## 6. Restrições
*   Não é possível criar a planilha *diretamente* via API sem OAuth complexo (fora do escopo). A abordagem será "Copiar Código -> Colar no Excel -> Colar URL de volta".
*   O sistema deve suportar ambos os modos (GSheets e Excel) se possível, ou focar no Excel conforme pedido recente ("automação em excel script"). O foco principal será **Excel Script**.
