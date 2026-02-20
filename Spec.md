# Especificação de Implementação (Spec)

## Arquivo: `src/services/SyncQueueService.ts`
### Ações Necessárias
- **Modificar `startAutoSync`**:
  - Garantir que o listener `online` seja armazenado em uma propriedade da classe ou do objeto (em vez de `window._syncOnlineListener` global se possível, ou manter o padrão global mas garantir a remoção).
  - O código atual usa `(window as any)._syncOnlineListener`. Vamos manter a consistência mas garantir que `removeEventListener` seja chamado corretamente.

- **Modificar `stopAutoSync`**:
  - Adicionar a remoção do event listener:
    ```typescript
    if ((window as any)._syncOnlineListener) {
        window.removeEventListener('online', (window as any)._syncOnlineListener);
        delete (window as any)._syncOnlineListener; // Opcional, para limpeza
    }
    ```

## Arquivo: `src/hooks/useInventoryData.ts`
### Ações Necessárias
- **Modificar `useEffect`**:
  - Implementar *debounce* na subscrição do banco de dados para evitar chamadas excessivas a `loadData`.
  - Adicionar `const timerRef = useRef<NodeJS.Timeout>(null);` (ou similar dentro do efeito se não precisar persistir entre renders, mas `useRef` é melhor para `useEffect` cleanup).
  - No callback do `db.subscribe`:
    ```typescript
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
        if (isMounted.current) loadData(false);
    }, 100); // 100ms debounce
    ```
  - No cleanup do `useEffect`:
    ```typescript
    if (timerRef.current) clearTimeout(timerRef.current);
    ```

## Arquivo: `src/components/BatchList.tsx`
### Ações Necessárias
- **Verificar e Corrigir Warning**:
  - O linter aponta `missing dependency: 'load'`.
  - Se `load` estiver definida dentro do `useEffect`, verificar se o linter está atualizado ou se há algo sutil.
  - Se necessário, mover `load` para fora e usar `useCallback`, ou manter dentro e suprimir o warning se for falso positivo, mas preferencialmente corrigir a estrutura.
  - **Ação:** Mover a definição de `load` para dentro do `useEffect` (se já não estiver) ou garantir que todas as dependências reativas de `load` estejam no array do `useEffect`.

## Arquivo: `src/hooks/useECharts.ts`
### Ações Necessárias
- **Limpeza**:
  - Remover comentários de debug "Added chartRef to dependencies as requested" se não forem mais necessários.
  - Verificar se há tipos `any` que podem ser substituídos por tipos do ECharts (se disponíveis) ou `HTMLElement`.

## Arquivo: `src/services/InventoryService.ts`
### Ações Necessárias
- **Linting Fixes**:
  - Substituir `any` por tipos explícitos onde o contexto permite (ex: `InventoryItem`, `Promise<void>`, etc.).
  - Focar nos métodos principais como `getAllItems`, `updateItem`.

## Arquivo: `src/components/Dashboard.tsx`
### Ações Necessárias
- **Linting Fixes**:
  - Remover variáveis não utilizadas (ex: `_onAddStock` se não for usado).
  - Corrigir tipos `any` nos handlers de eventos ou props.
