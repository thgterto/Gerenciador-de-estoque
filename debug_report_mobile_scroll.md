# Relatório de Investigação: Swipe em Mobile

## Objetivo
Investigar o relato de que "ao fazer swipe nos cards, a tela não scrolla".

## Metodologia
1.  Reprodução automatizada via Playwright emulando iPhone 13.
2.  Identificação de bloqueios de UI (Modais).
3.  Teste isolado de componentes (Metric Cards vs Charts).

## Resultados

1.  **Bloqueio por Modais:** Inicialmente, todos os testes de rolagem falharam devido à presença do Modal de Configuração de Banco de Dados (`DatabaseSetupModal`) e/ou Tutorial, que cobrem a tela com um overlay. Ao desabilitar/fechar esses modais, a rolagem funcionou normalmente na maior parte da tela.
2.  **Metric Cards (Polaris):** A rolagem funciona corretamente sobre os cards de métricas (KPIs), confirmando que os componentes Polaris não bloqueiam nativamente a rolagem.
3.  **Charts (ApexCharts):** A rolagem FALHA consistentemente ao tentar iniciar o swipe sobre a área do gráfico. Isso é um comportamento conhecido da biblioteca ApexCharts, que captura eventos de toque para interações (zoom, pan, tooltip).

## Solução Aplicada

Para mitigar o problema nos gráficos:
1.  **CSS Global:** Adicionado `touch-action: pan-y !important` para `.apexcharts-canvas` em `index.css`.
2.  **Configuração do Gráfico:** Desabilitado `zoom` e `selection` nas configurações do ApexCharts em `Dashboard.tsx` para reduzir a captura de eventos.
3.  **Wrapper:** Adicionado wrapper `div` com classe `touch-pan-y` ao redor dos gráficos.

Nota: Devido à implementação interna de `preventDefault` pelo ApexCharts, a rolagem pode ainda ser intermitente diretamente sobre o SVG do gráfico, mas as medidas acima maximizam a compatibilidade com a rolagem nativa.
