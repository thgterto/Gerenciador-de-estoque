# Relatório de Investigação: Swipe em Mobile

## Objetivo
Investigar o comportamento da aplicação ao realizar o gesto de "swipe" (deslizar) em modo mobile e registrar os logs gerados.

## Metodologia
1.  Injeção de listeners de eventos (`touchstart`, `touchmove`, `touchend`, `scroll`, `mousedown`) na aplicação (`App.tsx`).
2.  Execução automatizada via Playwright emulando um iPhone 13.
3.  Simulação de gestos de toque reais utilizando o protocolo CDP (`Input.dispatchTouchEvent`), garantindo que o navegador interprete as ações como toque e não como mouse.

## Resultados Observados

Os logs confirmam que a aplicação recebe e processa os eventos de toque corretamente.

1.  **Reconhecimento de Toque:** O sistema registra `TouchStart`, `TouchMove` e `TouchEnd` sequencialmente.
2.  **Rolagem (Scroll):** Eventos de `Scroll` são disparados durante o movimento de swipe.
3.  **Comportamento de Layout:** O log `Scroll: 0` (referente a `window.scrollY`) confirma que a rolagem ocorre dentro de um container interno (`PageContainer`), e não na janela principal (`window`), o que está alinhado com a arquitetura CSS `overflow: hidden` definida no `index.css`.

## Log Capturado

```log
[MobileSwipeDebug] MouseDown: 139, 467  <-- Clique no botão de Login
[MobileSwipeDebug] TouchStart: 200.00, 200.00
[MobileSwipeDebug] TouchMove: 200.00, 230.00
[MobileSwipeDebug] TouchMove: 200.00, 260.00
[MobileSwipeDebug] TouchMove: 200.00, 290.00
[MobileSwipeDebug] TouchMove: 200.00, 320.00
[MobileSwipeDebug] TouchMove: 200.00, 350.00
[MobileSwipeDebug] TouchMove: 200.00, 380.00
[MobileSwipeDebug] TouchMove: 200.00, 410.00
[MobileSwipeDebug] TouchMove: 200.00, 440.00
[MobileSwipeDebug] TouchMove: 200.00, 470.00
[MobileSwipeDebug] TouchMove: 200.00, 500.00
[MobileSwipeDebug] TouchEnd
[MobileSwipeDebug] TouchStart: 200.00, 500.00
[MobileSwipeDebug] TouchMove: 200.00, 470.00
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] TouchMove: 200.00, 440.00
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] TouchMove: 200.00, 410.00
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] TouchMove: 200.00, 350.00
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] TouchMove: 200.00, 320.00
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] TouchMove: 200.00, 260.00
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] Scroll: 0
[MobileSwipeDebug] TouchMove: 200.00, 230.00
[MobileSwipeDebug] Scroll: 0
```
