
# LabControl - Sistema de Gestão Laboratorial

![Version](https://img.shields.io/badge/version-1.8.2-blue)
![Architecture](https://img.shields.io/badge/Architecture-Offline--First-success)
![Stack](https://img.shields.io/badge/Stack-React_19_|_TypeScript_|_Tailwind-903A40)
![Storage](https://img.shields.io/badge/Storage-IndexedDB_via_Dexie-293141)

O **LabControl** é uma plataforma de missão crítica para gestão de inventário laboratorial. Operando sob uma filosofia **Offline-First**, o sistema garante integridade de dados (Rastreabilidade de Lotes), alta performance via arquitetura híbrida e conformidade com normas de segurança (GHS).

---

## 🚀 Versão 1.8.2 (Estável)

Esta versão traz melhorias significativas no motor de dados e integridade:

*   **Motor de Importação Inteligente:** Detecção automática de tabelas dentro de planilhas Excel desorganizadas com suporte a colunas GHS (T, T+, O, etc).
*   **Smart Merge (Mesclagem Não-Destrutiva):** Atualiza saldos via planilha sem apagar dados enriquecidos manualmente (como Links CAS, Fórmulas e Classificações de Risco).
*   **Identidade Determinística:** O sistema agora gera IDs baseados no conteúdo (Hash) para importações de histórico e saldos, prevenindo duplicação de registros se a mesma planilha for carregada duas vezes.
*   **React 19 Core:** Atualização completa do core e remoção de APIs depreciadas.

---

## 🧠 Arquitetura de Engenharia (V2 Híbrida)

O sistema utiliza uma arquitetura de "Dupla Camada" para balancear UX e Contabilidade:

### 1. Camada de Persistência Híbrida (`HybridStorageManager`)
Wrapper sobre o IndexedDB que implementa o padrão **L1/L3 Cache**:
*   **L1 (Memory Cache):** Mantém dados "quentes" para renderização síncrona do React (Zero Flickering).
*   **L3 (Transactional Persistence):** Dexie.js garante escritas ACID no disco.

### 2. Integridade: Snapshot vs. Ledger
*   **Snapshot (V1):** Tabela `items`. Contém o saldo atual consolidado. Usado pela UI.
*   **Ledger (V2):** Tabelas `history` e `balances`. A fonte da verdade contábil.
*   **Auditoria Automática:** O sistema possui uma ferramenta (`InventoryService.runLedgerAudit`) que recalcula o V1 baseado na soma do V2 para corrigir desvios (Drift).

---

## 📚 Documentação Funcional

Para um detalhamento completo de todas as funcionalidades, incluindo Matriz de Armazenamento e Integração CAS, consulte o guia de features:

👉 **[LER O MANUAL DE FUNCIONALIDADES (FEATURES.md)](./FEATURES.md)**

---

## 🛠️ Stack Tecnológico

*   **Core:** React 19, TypeScript 5, Vite 6.
*   **Dados:** Dexie.js (IndexedDB), Algoritmos de Hashing (SHA-like) para deduplicação.
*   **UI:** Tailwind CSS, React Window (Virtualização de listas longas).
*   **Integração:** SheetJS (Excel), CAS Common Chemistry API.

## 🚀 Instalação

1.  **Instalar dependências:**
    ```bash
    npm install
    ```
2.  **Rodar servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

---
**Licença:** Proprietária / Uso Interno.
