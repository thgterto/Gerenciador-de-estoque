# Análise de Layout e Scroll

## Resumo Executivo
A investigação identificou que a inconsistência na gestão de contêineres de scroll entre as telas principais (`InventoryTable` vs `Dashboard`/`History`) é a causa raiz dos problemas de navegação em dispositivos móveis.

## Comparativo de Estrutura

| Tela | Contêiner Principal | Scroll Behavior | Virtualização | Problema Identificado |
|------|---------------------|-----------------|---------------|-----------------------|
| **Dashboard** | `PageContainer` | `scrollable={true}` (Overflow Auto) | Não | Nenhum. O conteúdo flui naturalmente e o scroll da página funciona. |
| **History** | `PageContainer` | `scrollable={true}` (Overflow Auto) | Sim (Altura Fixa 600px) | Nenhum. A tabela tem altura fixa, mas a página permite rolar até ela. |
| **Inventory** | `PageContainer` | `scrollable={false}` (Overflow Hidden) | Sim (AutoSizer / Flex) | **Crítico em Mobile**. O layout fixo tenta ocupar 100% da altura. Se o cabeçalho (KPIs + Filtros) ocupar > 60% da tela, a lista virtualizada é esmagada ou empurrada para fora da área visível, sem barra de rolagem para alcançá-la. |
| **Purchases** | `PageContainer` | `scrollable={true}` (Overflow Auto) | Não | Nenhum. |

## Diagnóstico Técnico
A tela de **Inventário (`InventoryTable`)** utiliza um layout de aplicação ("App-like") onde a lista deve ocupar o espaço restante da tela.
- **Desktop:** Funciona bem, pois a altura da tela (1080p+) acomoda cabeçalho e lista.
- **Mobile:** O cabeçalho (Título + KPIs + Filtros) pode ocupar **~650px**. Em dispositivos com viewport menor (ex: iPhone SE, ~600px), o espaço restante para a lista é **Zero ou Negativo**.
- Como o `PageContainer` está configurado com `overflow: hidden`, o usuário vê apenas o cabeçalho cortado e não consegue rolar para baixo para ver a lista ou o restante dos filtros.

## Solução Recomendada
Para manter a performance da lista virtualizada (que exige altura definida) sem quebrar a navegação mobile:

1.  **Mobile:** Tornar os componentes de topo (KPIs e Filtros) **Colapsáveis**.
    -   Padrão: KPIs exibem apenas resumo ou 1 linha.
    -   Padrão: Filtros iniciam fechados (Accordions).
    -   Isso libera espaço vertical crítico para a lista.
2.  **Alternativa:** Mudar para scroll da página inteira (`PageContainer scrollable={true}`) no mobile e desativar a virtualização ou usar altura fixa na lista. (Menos performático para 1200+ itens).

**Decisão:** Implementar a **Colapsabilidade** dos Filtros e KPIs no mobile para preservar a arquitetura de alta performance (Virtualização).
