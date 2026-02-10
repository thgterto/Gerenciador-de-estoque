# Estratégia de Testes do LabControl

Este documento descreve a rotina geral de testes do projeto LabControl, cobrindo testes unitários, de integração e ponta-a-ponta (E2E).

## 🧪 Visão Geral (Pirâmide de Testes)

O projeto segue uma abordagem híbrida para garantir a qualidade:

1.  **Testes Unitários (Vitest)**: Verificam a lógica de negócios, utilitários e funções isoladas. São rápidos e rodam a cada commit.
2.  **Testes E2E (Playwright + Python)**: Simulam o usuário real navegando na aplicação. Verificam fluxos críticos (Login, Navegação, Operações de Estoque).

---

## 🚀 Como Executar a Rotina de Testes

### Pré-requisitos

*   Node.js instalado.
*   Python 3 instalado com `pytest` e `playwright`.
*   Aplicação rodando localmente na porta `5173`.

### Comando Único

Para rodar todos os testes (Unitários + E2E), execute o script automatizado:

```bash
./scripts/run_tests.sh
```

### Execução Manual

#### 1. Testes Unitários

```bash
npm test
```

#### 2. Testes E2E

Certifique-se de que o servidor de desenvolvimento está rodando (`npm run dev`) e execute:

```bash
# Opção 1: Via script Python
python3 -m pytest tests/e2e/

# Opção 2: Via comando pytest direto
pytest tests/e2e/
```

---

## 📂 Estrutura de Testes

*   `tests/`
    *   `utils/`: Testes unitários de funções utilitárias (`.test.ts`).
    *   `e2e/`: Testes de ponta-a-ponta.
        *   `conftest.py`: Configurações do Pytest e Playwright (Browser fixtures).
        *   `test_critical_flows.py`: Cenários de teste (Login, Dashboard, Matriz de Estoque).

## 📝 Escrevendo Novos Testes

### Unitários (TypeScript)

Crie arquivos `.test.ts` na pasta `tests/` ou próximo ao componente sendo testado.

```typescript
import { describe, it, expect } from 'vitest';
import { minhaFuncao } from './minhaFuncao';

describe('minhaFuncao', () => {
    it('deve retornar valor correto', () => {
        expect(minhaFuncao(1)).toBe(2);
    });
});
```

### E2E (Python)

Crie arquivos `test_*.py` na pasta `tests/e2e/`.

```python
def test_exemplo(page, base_url):
    page.goto(base_url)
    assert page.is_visible("text=Bem-vindo")
```

---

## 🛠 Solução de Problemas

*   **Erro: "Server NOT detected on port 5173"**: Inicie a aplicação com `npm run dev` em outro terminal.
*   **Timeouts nos testes E2E**: A primeira execução pode ser lenta devido ao build do Vite ou login inicial. Tente rodar novamente.
*   **Dependências Python**: Se faltar módulos, instale: `pip install pytest playwright pytest-playwright`.
