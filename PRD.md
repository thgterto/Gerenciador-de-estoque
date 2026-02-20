# Product Research Document (PRD)

## Arquivos Relevantes
- `src/services/SyncQueueService.ts`
- `src/hooks/useInventoryData.ts`
- `src/hooks/useECharts.ts`
- `src/components/BatchList.tsx`
- `src/components/Dashboard.tsx` (exemplo de arquivo com lint warnings)
- `src/components/HistoryTable.tsx` (exemplo de arquivo com lint warnings)
- `src/services/InventoryService.ts` (exemplo de arquivo com lint warnings)
- Outros arquivos listados no `lint_output_v4.txt` para correções de linting.

## Documentações Relevantes
- **React Hooks (useEffect):**
  - **Trecho Importante:** `useEffect` deve incluir todas as dependências reativas usadas dentro do efeito no array de dependências, ou usar padrões como `useCallback` para funções estáveis.
  - **Fonte:** https://react.dev/reference/react/useEffect

- **Event Listeners (Cleanup):**
  - **Trecho Importante:** Ao adicionar um event listener em um componente ou serviço de longa duração, deve-se garantir sua remoção (cleanup) para evitar vazamento de memória.
  - **Fonte:** MDN Web Docs (EventTarget.removeEventListener)

- **Debouncing (Performance):**
  - **Trecho Importante:** Debouncing limita a taxa na qual uma função pode disparar. Útil para assinaturas de banco de dados que disparam frequentemente.
  - **Fonte:** Conceito geral de programação (ex: Lodash debounce, mas será implementado nativamente).

## Padrões de Implementação
- **Correção de Memory Leak em Serviços:**
  - **Origem:** Análise do `src/services/SyncQueueService.ts`
  - **Snippet de Código:**
    ```typescript
    startAutoSync() {
        // ... setup
        window.addEventListener('online', handler);
    }
    stopAutoSync() {
        // ... cleanup
        window.removeEventListener('online', handler);
    }
    ```
  - **Descrição:** O serviço adiciona um listener global na janela mas não o remove ao parar a sincronização, causando acúmulo de listeners.

- **Otimização de Assinatura (Debounce):**
  - **Origem:** Análise de performance em `src/hooks/useInventoryData.ts`
  - **Snippet de Código:**
    ```typescript
    const timerRef = useRef<NodeJS.Timeout>(null);
    // ...
    const unsubscribe = db.subscribe(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (isMounted.current) loadData(false);
        }, 100); // 100ms debounce
    });
    ```
  - **Descrição:** Evita recargas excessivas (O(N^2)) quando múltiplas operações de escrita ocorrem em sequência rápida.

- **Cleanup de Linting (TypeScript):**
  - **Origem:** `lint_output_v4.txt`
  - **Descrição:** Substituição de `any` por tipos específicos e remoção de variáveis não utilizadas para melhorar a qualidade e segurança do código.

## Conflitos e Observações
- **BatchList.tsx:** O relatório indicava dependência faltante `load`, mas a análise do código atual mostra que `load` está definido dentro do `useEffect`. A ação será confirmar se há melhorias possíveis ou se é um falso positivo do relatório anterior.
- **useECharts.ts:** O código atual já possui `chartRef` nas dependências, sugerindo que a correção mencionada no relatório já foi aplicada. A ação será verificar e limpar comentários residuais se necessário.
