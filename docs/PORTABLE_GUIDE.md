# Guia de Modo Portátil (Portable Mode)

O **LabControl** pode ser executado em modo portátil, ideal para uso em computadores corporativos com restrições de administrador (ADM) ou para levar o sistema em um Pen Drive.

## O que é o Modo Portátil?

Neste modo, o sistema roda como um executável único (`.exe`) que não requer instalação. Todos os dados (banco de dados SQLite) são salvos em uma pasta `labcontrol_data` criada *ao lado* do executável, garantindo que você possa mover a pasta inteira para outro computador sem perder nada.

## Como Construir a Versão Portátil

Se você é um desenvolvedor ou tem acesso ao código fonte:

1.  Certifique-se de ter o Node.js instalado.
2.  Execute o script de build na raiz do projeto:
    ```cmd
    scripts\build_portable.bat
    ```
    Ou manualmente:
    ```cmd
    npm install
    npm run electron:build
    ```

3.  O executável será gerado na pasta `release/`. Procure por um arquivo como `LabControl UMV 1.8.0.exe`.

## Como Usar (Usuário Final)

1.  **Copie** o arquivo `.exe` para qualquer pasta no seu computador ou Pen Drive.
2.  **Execute** o arquivo.
3.  Na primeira execução, o sistema criará automaticamente uma pasta chamada `labcontrol_data` no mesmo local.
4.  O sistema abrirá uma janela contendo a aplicação completa.
5.  **Não feche** a janela preta de console (se aparecer) enquanto usa o sistema (em versões de debug).

### Estrutura de Pastas
```
Minha Pasta/
├── LabControl UMV.exe      # O Sistema
└── labcontrol_data/        # Seus Dados (NÃO APAGUE)
    └── labcontrol.db       # Banco de Dados
```

### Backup
Para fazer backup, basta copiar a pasta `labcontrol_data` para um local seguro.

### Atualização
Para atualizar o sistema, basta substituir o arquivo `.exe` pela nova versão. Seus dados na pasta `labcontrol_data` serão preservados (desde que o esquema do banco de dados seja compatível).

## Solução de Problemas

*   **Tela Branca/Erro de Carregamento**: Verifique se o arquivo não foi movido para uma pasta sem permissão de escrita. O modo portátil precisa criar a pasta de dados.
*   **Bloqueio de Antivírus**: Como o executável não é assinado digitalmente (em builds locais), alguns antivírus corporativos podem bloqueá-lo. Adicione uma exceção se necessário.
*   **Performance**: O banco de dados SQLite é rápido, mas em Pen Drives USB 2.0 pode haver lentidão. Recomenda-se USB 3.0 ou rodar direto do HD.
