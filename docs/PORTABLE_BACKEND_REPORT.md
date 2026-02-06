# Relatório de Análise Técnica: Migração para Arquitetura Portátil (Backend)

## 1. Objetivo
Transformar o LabControl UMV em uma aplicação Desktop Standalone (Portátil), eliminando a dependência do Google Sheets e Google Apps Script. O foco é migrar a persistência e regras de negócio para o processo local do Electron.

## 2. Diagnóstico da Arquitetura Atual
*   **Backend Atual:** Script remoto (`backend/GoogleAppsScript.js`) rodando na infraestrutura do Google.
*   **Persistência:** Planilhas do Google Sheets atuam como tabelas relacionais.
*   **Comunicação:** Frontend utiliza `fetch` HTTP para endpoints públicos do script.
*   **Limitação:** Requer internet constante para escrita e validação de consistência.

## 3. Arquitetura Proposta (Backend Local)
Substituição completa do GAS por um backend Node.js embarcado no processo principal do Electron (`Main Process`), utilizando **SQLite** como banco de dados único.

### 3.1 Tecnologias
*   **Banco de Dados:** `better-sqlite3` (Síncrono, performático, ideal para Electron).
*   **Camada de Dados:** Implementação direta via SQL ou Query Builder leve (KISS).
*   **Comunicação:** IPC (Inter-Process Communication) nativo do Electron.

## 4. Mudanças Necessárias no Backend

### 4.1 Infraestrutura de Dados (Novo Módulo `electron/db`)
Deve ser criado um módulo de persistência local dentro da pasta `electron/`.
*   **Localização do Arquivo:** O banco `labcontrol.db` deve residir em `portableDataPath` (já configurado em `main.cjs`), garantindo que ao mover a pasta, o banco vá junto.
*   **Schema:** Criar tabelas SQL espelhando a estrutura atual:
    *   `items` (Inventário)
    *   `movements` (Histórico)
    *   `catalog` (Catálogo de Produtos)
    *   `batches` (Lotes)

### 4.2 Migração de Lógica de Negócios (GAS -> Node.js)
As funções críticas do `GoogleAppsScript.js` devem ser reescritas em JavaScript/TypeScript no contexto do Electron:

| Função GAS | Implementação Local (Electron/Node) | Detalhe Técnico |
| :--- | :--- | :--- |
| `upsert_item` | `INSERT OR REPLACE` + Transação | Garantir atomicidade ao atualizar saldo e registrar histórico. |
| `log_movement` | `INSERT INTO movements` | Registro imutável de transações. |
| `read_full_db` | `SELECT * FROM ...` | Carregamento inicial (pode ser otimizado posteriormente). |
| `LockService` | `db.transaction()` | O SQLite garante isolamento de transações nativamente. |

### 4.3 Interface IPC (Camada de Serviço)
No arquivo `electron/main.cjs`:
*   Remover dependências de rede/fetch se existirem no main.
*   Registrar handlers IPC (`ipcMain.handle`) que mapeiam solicitações do frontend para funções do banco de dados local.
*   Exemplo: `ipcMain.handle('db:upsert-item', (_, item) => db.upsertItem(item))`.

### 4.4 Script de Inicialização
*   Ao iniciar o Electron, verificar a existência do arquivo `labcontrol.db`.
*   Se não existir, executar script de migração inicial (criação de tabelas).
*   *(Opcional)* Implementar função de importação única para puxar dados do Google Sheets legado.

## 5. Próximos Passos Sugeridos
1.  Instalar `better-sqlite3`.
2.  Configurar `electron-builder` para incluir binários nativos.
3.  Criar estrutura de pastas `electron/db`.
4.  Escrever testes unitários para a nova camada de dados local.
