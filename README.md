# LabControl - Sistema de Gestão Laboratorial (Portable Edition)

![Version](https://img.shields.io/badge/version-1.8.3-blue)
![Architecture](https://img.shields.io/badge/Architecture-Portable_SQLite-success)
![Stack](https://img.shields.io/badge/Stack-Electron_|_React_19_|_SQLite-903A40)

O **LabControl** é uma plataforma de gestão de inventário laboratorial. Esta versão **Portable Edition** opera de forma totalmente independente, utilizando um banco de dados SQLite embarcado, eliminando a necessidade de conexão com internet ou configurações de nuvem.

---

## 🚀 Novidades da Versão 1.8.3 (Portable)

*   **Backend Local (SQLite):** Substituição do Google Sheets/Apps Script por SQLite local.
*   **Portabilidade Total:** O banco de dados (`labcontrol.db`) reside na pasta da aplicação (em modo produção), permitindo transportar o software em Pen Drives sem perda de dados.
*   **Performance:** Operações de leitura e escrita instantâneas via IPC nativo.
*   **Segurança:** Transações ACID garantem integridade dos dados mesmo em caso de falha de energia.

---

## 🧠 Arquitetura de Engenharia (V3 Portable)

O sistema utiliza o **Electron** para orquestrar o Frontend (React) e o Backend (Node.js/SQLite):

1.  **Frontend (Renderer):** React 19 + TypeScript.
2.  **Backend (Main):** Node.js com `better-sqlite3`.
3.  **Comunicação:** IPC Bridge seguro.

Para detalhes técnicos profundos, consulte:

👉 **[LER A ARQUITETURA TÉCNICA (ARCHITECTURE.md)](./ARCHITECTURE.md)**

---

## 📚 Documentação Funcional

Para um detalhamento das funcionalidades de negócio:

👉 **[LER O MANUAL DE FUNCIONALIDADES (FEATURES.md)](./FEATURES.md)**

---

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos
*   Node.js 18+
*   Python (para compilação de dependências nativas, se necessário)

### 1. Instalação
O projeto utiliza `electron-builder` para gerenciar dependências nativas (`better-sqlite3`).

```bash
npm install
# O script 'postinstall' rodará automaticamente para compilar o SQLite para o Electron
```

Se houver problemas com módulos nativos:
```bash
npm run postinstall
```

### 2. Rodar em Desenvolvimento
Inicia o React (Vite) e o Electron simultaneamente.

```bash
npm run electron:dev
```

### 3. Compilar para Produção (Portable)
Gera um executável portátil na pasta `dist/win-unpacked` (ou equivalente conforme o OS).

```bash
npm run electron:build
```

---
**Licença:** Proprietária / Uso Interno.
