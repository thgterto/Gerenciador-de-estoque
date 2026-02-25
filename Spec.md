# Spec - Toast Notification Fix

## 1. Visão Geral
Este documento descreve a implementação técnica para corrigir as animações e o comportamento visual das notificações (toasts) utilizando `framer-motion`, substituindo as classes CSS quebradas.

## 2. Arquivos
- **Modificar**: `src/components/Toast.tsx`

## 3. Implementação Detalhada

### 3.1 `src/components/Toast.tsx`

#### Importações
- Adicionar `import { motion, AnimatePresence } from 'framer-motion';`

#### Estrutura do Componente
1. **Container Principal**:
   - Manter posicionamento `fixed bottom-6 right-6`.
   - Adicionar `w-full max-w-sm` para garantir consistência de largura.
   - Manter `z-[9999]` e `pointer-events-none`.
   - Envolver a lista de toasts em `<AnimatePresence mode="popLayout">`.

2. **Item do Toast (`motion.div`)**:
   - Substituir `div` por `motion.div`.
   - **Propriedade `layout`**: Adicionar para animar o reordenamento da pilha quando um item é removido.
   - **Variantes de Animação**:
     - `initial`: `{ opacity: 0, y: 50, scale: 0.9 }` (Começa invisível, deslocado para baixo e levemente menor)
     - `animate`: `{ opacity: 1, y: 0, scale: 1 }` (Entra suavemente para a posição final)
     - `exit`: `{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }` (Sai desaparecendo e diminuindo)
   - **Transição**: `{ type: "spring", stiffness: 400, damping: 25 }` para um efeito "snappy" mas suave.
   - **Classes CSS**:
     - Remover classes quebradas: `animate-in`, `slide-in-from-bottom-5`, `fade-in`.
     - Manter estilização visual (cores, bordas, ícones).
     - Manter `pointer-events-auto`.

### 3.2 Fluxo Lógico
O fluxo de dados do `AlertContext` permanece inalterado. O `Toast.tsx` apenas reage às mudanças no array `toasts`.
- Quando um toast é adicionado: `AnimatePresence` detecta a nova chave e executa a animação `initial` -> `animate`.
- Quando um toast é removido (automática ou manualmente): `AnimatePresence` executa a animação `exit` antes de remover o elemento do DOM, e os outros toasts deslizam (`layout`) para preencher o espaço.

### 3.3 Edge Cases
- **Múltiplos Toasts Rápidos**: O uso de `layout` e `AnimatePresence` garante que a pilha se ajuste organicamente sem "pulos".
- **Responsividade**: O container `max-w-sm` garante que não ocupe a tela toda em desktops, e `w-full` (com margens implícitas pelo posicionamento) funciona bem. *Nota*: Em telas muito pequenas (<380px), o `right-6` pode causar overflow horizontal se não houver `left-6` ou similar.
  - **Melhoria**: Adicionar `max-w-[calc(100vw-3rem)]` ou similar para mobile safe-area se necessário. Por simplicidade, `max-w-sm` costuma ser seguro, mas adicionaremos um media query implícito via classes se necessário (ex: `w-full sm:w-96`).

## 4. Estrutura de Dados
Nenhuma alteração na interface `AppNotification`.

## 5. Plano de Testes (Manual)
1. Disparar toast de Sucesso (verde). Verificar entrada suave vindo de baixo.
2. Disparar toast de Erro (vermelho).
3. Disparar múltiplos toasts em sequência. Verificar empilhamento.
4. Fechar um toast do meio. Verificar se os de baixo sobem suavemente.
5. Aguardar timeout. Verificar saída suave.
