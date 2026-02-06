# LabControl - Sistema de Gestão Laboratorial

![Version](https://img.shields.io/badge/version-1.8.2-blue)
![Architecture](https://img.shields.io/badge/Architecture-Portable--Electron-success)
![Stack](https://img.shields.io/badge/Stack-React_19_|_TypeScript_|_Tailwind-903A40)
![Storage](https://img.shields.io/badge/Storage-SQLite_via_Better--Sqlite3-293141)

O **LabControl** é uma plataforma de missão crítica para gestão de inventário laboratorial. Agora operando como uma **Aplicação Desktop Portátil (Electron)**, o sistema garante integridade de dados localmente (SQLite), eliminando a necessidade de conexão com internet ou servidores externos.

---

## 🚀 Versão 1.8.2 (Portátil)

Esta versão migra o backend para uma arquitetura local e portátil:

*   **Execução Local (Portable):** O sistema roda diretamente do executável, armazenando dados em uma pasta `labcontrol_data` adjacente ao aplicativo. Isso permite transportar o sistema e seus dados em um pendrive.
*   **Backend SQLite:** Substituição do Google Apps Script por um backend Node.js embutido usando SQLite, garantindo transações ACID e alta performance.
*   **Smart Merge & Importação:** Mantém as capacidades de importação inteligente e detecção de duplicatas.
*   **React 19 Core:** Atualização completa do core e remoção de APIs depreciadas.

---

## 🧠 Arquitetura de Engenharia (Portable)

O sistema utiliza uma arquitetura baseada em Electron com persistência em SQLite:

### 1. Backend Embutido (Electron Main Process)
*   **Controladores:** Lógica de negócio (Upsert, Delete, Import) reside em `electron/controllers`, executando no processo principal.
*   **IPC Bridge:** Comunicação segura entre a UI (Renderer) e o Banco de Dados via `preload.cjs` e `ipcRenderer.invoke`.

### 2. Camada de Persistência (SQLite)
*   **Better-SQLite3:** Biblioteca de alta performance para acesso síncrono/assíncrono ao banco de dados.
*   **Transações Atômicas:** Todas as operações críticas (Importação, Movimentação) são executadas dentro de transações para garantir consistência.

---

## 📚 Documentação Funcional

Para um detalhamento completo de todas as funcionalidades, incluindo Matriz de Armazenamento e Integração CAS, consulte o guia de features:

👉 **[LER O MANUAL DE FUNCIONALIDADES (FEATURES.md)](./FEATURES.md)**

---

## 🛠️ Stack Tecnológico

*   **Runtime:** Electron 34 (Chromium + Node.js).
*   **Core:** React 19, TypeScript 5, Vite 6.
*   **Dados:** SQLite3 (Persistência Local Relacional).
*   **UI:** Tailwind CSS, React Window (Virtualização).
*   **Empacotamento:** Electron Builder.

## 🚀 Instalação e Execução

### Modo de Desenvolvimento

Para rodar o ambiente de desenvolvimento com Hot Reload (Frontend) e Backend Electron:

1.  **Instalar dependências:**
    ```bash
    npm install
    ```

2.  **Rodar App (Dev Mode):**
    ```bash
    npm run electron:dev
    ```
    *Isso iniciará o Vite em paralelo com o Electron.*

### Gerar Executável (Build)

Para criar o executável portátil para distribuição (Windows/Linux/Mac):

1.  **Compilar e Empacotar:**
    ```bash
    npm run electron:build
    ```
    *O executável será gerado na pasta `release/`.*

2.  **Modo Portátil:**
    *   Ao executar o aplicativo gerado (ex: `LabControl UMV.exe`), uma pasta `labcontrol_data` será criada automaticamente ao lado do executável.
    *   Para mover o sistema (backup ou outro PC), basta copiar o executável e a pasta `labcontrol_data` juntos.

## 🧪 Testes

O projeto utiliza **Vitest** + **React Testing Library**.

1.  **Rodar testes unitários:**
    ```bash
    npm test
    ```

---
**Licença:** Proprietária / Uso Interno.
