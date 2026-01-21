
# Manual de Funcionalidades do LabControl

Este documento detalha as capacidades funcionais do sistema LabControl, desde a gestão básica de estoque até ferramentas avançadas de inteligência química e importação de dados.

---

## 1. Gestão de Inventário (Core)

O módulo central do sistema, projetado para alta performance mesmo com milhares de itens.

*   **Listagem Virtualizada:** Utiliza tecnologia de "Windowing" para renderizar listas infinitas sem travar o navegador.
*   **Agrupamento Inteligente:** Itens com o mesmo Código SAP ou Nome são agrupados visualmente, permitindo ver o saldo total do produto e expandir para ver os lotes individuais.
*   **Busca Fuzzy:** Encontre itens por nome, código SAP, Lote ou CAS, mesmo com pequenos erros de digitação.
*   **Filtros Rápidos:**
    *   **Categorias:** Reagentes, Vidrarias, Equipamentos.
    *   **Localização:** Filtragem por armazém ou sala específica.
    *   **Status:** Visualização rápida de itens Vencidos ou com Estoque Baixo.

## 2. Motor de Importação & Dados (Atualizado v1.8)

Ferramentas avançadas para migração e manutenção de dados em massa via Excel.

*   **Detecção Automática de Tabelas:** O sistema escaneia a planilha enviada, ignora cabeçalhos irrelevantes (logos, títulos) e identifica automaticamente onde os dados começam usando heurísticas de regex.
*   **Mapeamento GHS:** Reconhece colunas específicas de risco químico:
    *   `O` (Oxidante), `T` (Tóxico), `T+` (Muito Tóxico).
    *   `C` (Corrosivo), `E` (Explosivo), `N` (Ambiental).
    *   `Xn` (Nocivo), `Xi` (Irritante), `F` (Inflamável), `F+` (Ext. Inflamável).
*   **Smart Merge (Mesclagem Inteligente):**
    *   Ao importar uma planilha de "Inventário Mestre", o sistema verifica se o item já existe.
    *   Se existir, ele atualiza apenas o saldo e validade, **preservando** dados ricos que não existem na planilha (como Fórmula Molecular, Classificação GHS detalhada e IDs internos).
*   **Histórico Determinístico:**
    *   Ao importar planilhas de movimentação passada, o sistema gera um ID único (Hash).
    *   Isso impede que a mesma movimentação seja duplicada no banco de dados.

## 3. Matriz de Armazenamento

Visualização espacial para gestão física do laboratório.

*   **Grid Interativo (8x6):** Representação visual de caixas, gavetas de freezers ou prateleiras.
*   **Modo Auditoria:** Com um clique, o grid muda de cor para destacar problemas:
    *   🔴 **Vermelho:** Itens vencidos.
    *   🟡 **Amarelo:** Estoque baixo.
    *   ⚠️ **Ícones de Risco:** Mostra se há incompatibilidade química no mesmo local (ex: Oxidantes próximos a Inflamáveis).
*   **Atribuição Visual:** Clique em um slot vazio para alocar um item ou mover um existente via Drag-and-Drop.

## 4. Inteligência Química (Integração CAS)

Enriquecimento automático de dados para segurança e padronização.

*   **Busca Automática:** Ao cadastrar um item com *CAS Number*, o sistema consulta a API pública do *CAS Common Chemistry*.
*   **Dados Recuperados:**
    *   Nome oficial padronizado.
    *   Fórmula Molecular e Peso Molecular.
    *   Estrutura Química (Imagem 2D).
    *   Sugestão de Riscos GHS (Inflamável, Corrosivo, etc) baseada em propriedades físico-químicas.

## 5. Rastreabilidade & Histórico (Ledger)

Sistema de auditoria completa baseada em arquitetura de Livro-Razão (Ledger).

*   **Imutabilidade:** Cada entrada, saída ou ajuste gera um registro indelével no histórico.
*   **Auditoria de Saldo:** Ferramenta nas configurações que recalcula todo o estoque atual baseando-se na soma histórica de todas as transações, garantindo que o saldo exibido na tela seja matematicamente real.
*   **Filtros de Rastreio:** Permite filtrar o histórico por Lote específico para responder perguntas como: *"Quem consumiu o lote X do Ácido Sulfúrico em 2023?"*.

## 6. Planejamento de Compras

Automação do fluxo de reposição.

*   **Carrinho de Compras:** Adicione itens manualmente ou via alertas.
*   **Alertas Automáticos:** O Dashboard sugere compras baseadas em:
    *   Itens abaixo do Estoque Mínimo.
    *   Itens próximos ao vencimento (30 dias).
*   **Exportação:** Gera uma lista consolidada pronta para envio ao departamento de compras.

## 7. Ferramentas Móveis

Funcionalidades otimizadas para uso em tablets ou celulares no chão do laboratório.

*   **Gerador de Etiquetas QR:** Cria etiquetas SVG prontas para impressão com QR Code contendo ID, Lote e Validade.
*   **Scanner Nativo:** Usa a câmera do dispositivo para ler QR Codes e abrir automaticamente a ficha do produto ou preencher formulários de entrada/saída.

## 8. Segurança e Backup

*   **Offline-First:** Todos os dados residem no navegador do usuário (IndexedDB). O sistema funciona sem internet.
*   **Backup JSON/Excel:** Exportação completa do banco de dados para backup frio.
*   **Reset Seguro:** Opções para limpar o banco (Factory Reset) ou restaurar dados de demonstração, protegidas por confirmação de texto.
