# Guia de Integração: Excel Online via Power Automate

Este guia descreve como configurar o fluxo do Power Automate para receber dados do LabControl UMV e inseri-los em uma planilha do Excel Online.

## Pré-requisitos
- Conta Microsoft 365 (Empresarial ou Pessoal com acesso ao Power Automate).
- Acesso ao Excel Online.

## Passo 1: Preparar a Planilha Excel
1. Acesse [excel.office.com](https://excel.office.com).
2. Crie uma nova planilha chamada `LabControl_Data.xlsx`.
3. Crie uma Tabela:
   - Adicione cabeçalhos na primeira linha: `Nome`, `Email`, `Data`.
   - Selecione as colunas e vá em **Inserir > Tabela**.
   - Marque "Minha tabela tem cabeçalhos".
   - Dê um nome para a tabela (ex: `TabelaDados`) na aba "Design da Tabela".

## Passo 2: Criar o Fluxo no Power Automate
1. Acesse [make.powerautomate.com](https://make.powerautomate.com).
2. Vá em **Meus fluxos** > **Novo fluxo** > **Fluxo da nuvem instantâneo**.
3. Selecione o gatilho: **Quando uma solicitação HTTP é recebida** (Request).
   - *Nota: Se for uma conta pessoal, pode ser necessário procurar por "Request" ou "Solicitação".*
4. No gatilho, clique em "Usar carga de amostra para gerar esquema".
5. Cole o seguinte JSON e clique em Concluir:
   ```json
   {
     "name": "Exemplo",
     "email": "exemplo@teste.com"
   }
   ```
6. Adicione uma nova etapa: **Excel Online (Business)** > **Adicionar uma linha a uma tabela**.
   - **Localização**: OneDrive for Business ou SharePoint (onde salvou o arquivo).
   - **Biblioteca de Documentos**: OneDrive.
   - **Arquivo**: Selecione `LabControl_Data.xlsx`.
   - **Tabela**: Selecione `TabelaDados`.
   - **Mapeamento de Campos**:
     - **Nome**: Selecione o conteúdo dinâmico `name`.
     - **Email**: Selecione o conteúdo dinâmico `email`.
     - **Data**: Use a expressão `utcNow()`.

## Passo 3: Salvar e Obter URL
1. Salve o fluxo.
2. O gatilho "Quando uma solicitação HTTP é recebida" irá gerar uma URL (HTTP POST URL).
3. Copie esta URL.

## Passo 4: Configurar no LabControl
1. No diretório raiz do projeto, crie ou edite o arquivo `.env`.
2. Adicione a variável `POWER_AUTOMATE_WEBHOOK_URL` com a URL copiada:
   ```ini
   POWER_AUTOMATE_WEBHOOK_URL=https://prod-XX.westus.logic.azure.com:443/workflows/...
   ```
3. Reinicie a aplicação (se estiver em desenvolvimento) ou reconstrua o executável.

## Testando
1. Abra o LabControl.
2. Vá em **Configurações**.
3. Na seção "Excel / Power Automate", preencha Nome e Email.
4. Clique em "Enviar para Excel".
5. Verifique se a linha foi adicionada na sua planilha do Excel Online.
