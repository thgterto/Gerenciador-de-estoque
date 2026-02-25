# PRD - Toast Notification System Fix

## 1. Contexto Técnico
O sistema atual utiliza uma implementação customizada de Toasts (`src/context/AlertContext.tsx` e `src/components/Toast.tsx`).
A estilização depende de classes utilitárias do plugin `tailwindcss-animate` (ex: `animate-in`, `slide-in-from-bottom-5`), que **não está instalado** no projeto.
Como resultado, as notificações aparecem instantaneamente sem animação de entrada ou saída, prejudicando a UX.
Além disso, a implementação atual de empilhamento é visualmente simples e pode sobrepor elementos críticos da interface.

O projeto já possui a biblioteca `framer-motion` instalada (`^12.31.2`), que é uma solução superior para animações em React.

## 2. Problema a Resolver
- **Animações Quebradas**: Classes CSS inexistentes fazem com que os toasts não animem.
- **UX Pobre**: O feedback visual é abrupto.
- **Dívida Técnica**: Dependência implícita de um plugin não instalado.

## 3. Arquivos Afetados
- `src/components/Toast.tsx`: Componente de UI responsável pela renderização.
- `src/context/AlertContext.tsx`: Lógica de gerenciamento de estado (provavelmente não precisará de grandes mudanças, mas deve ser revisado).

## 4. Referências Técnicas
- **Framer Motion**: Já disponível no projeto. Será usado para `AnimatePresence` e `motion.div`.
- **Tailwind CSS**: Usado para estilização base.

## 5. Restrições
- Não adicionar novas dependências npm (como `sonner` ou `react-hot-toast`) para manter o bundle leve, já que temos ferramentas suficientes.
- Manter a interface da API `addToast` inalterada para evitar refatoração em massa nos consumidores (`useStockOperations`, `usePurchaseManager`, etc.).
- Garantir acessibilidade (z-index adequado, pointer-events).

## 6. Solução Proposta
Refatorar `src/components/Toast.tsx` para utilizar `framer-motion` para gerenciar as animações de entrada (slide up + fade in) e saída (slide right/down + fade out), corrigindo o problema visual sem adicionar dependências.
