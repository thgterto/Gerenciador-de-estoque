
@echo off
TITLE LabControl - Sistema Portatil
COLOR 0B
CLS

ECHO ========================================================
ECHO          LABCONTROL - ESTOQUE UMV (PORTABLE)
ECHO ========================================================
ECHO.

:: 1. Verificacao do Node.js
ECHO [1/4] Verificando ambiente...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO [ERRO FATAL] Node.js nao encontrado!
    ECHO.
    ECHO Este sistema requer o Node.js instalado para funcionar.
    ECHO Por favor, baixe e instale a versao LTS em: https://nodejs.org/
    ECHO.
    PAUSE
    EXIT
)

:: 2. Verificacao de Dependencias
IF NOT EXIST "node_modules" (
    ECHO [2/4] Primeira execucao detectada. Instalando dependencias...
    ECHO       Isso pode levar alguns minutos...
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        COLOR 0C
        ECHO [ERRO] Falha ao instalar dependencias. Verifique sua conexao.
        PAUSE
        EXIT
    )
) ELSE (
    ECHO [2/4] Dependencias OK.
)

:: 3. Verificacao de Build (Producao)
IF NOT EXIST "dist" (
    ECHO [3/4] Compilando o sistema para alta performance...
    call npm run build
    IF %ERRORLEVEL% NEQ 0 (
        COLOR 0C
        ECHO [ERRO] Falha na compilacao do projeto.
        PAUSE
        EXIT
    )
) ELSE (
    ECHO [3/4] Build OK.
)

:: 4. Execucao
CLS
ECHO ========================================================
ECHO          LABCONTROL - ONLINE
ECHO ========================================================
ECHO.
ECHO [SUCESSO] Servidor iniciado!
ECHO.
ECHO O navegador sera aberto automaticamente em instantes.
ECHO Mantenha esta janela aberta enquanto usar o sistema.
ECHO.
ECHO Endereco Local: http://localhost:4173
ECHO.
ECHO Pressione CTRL+C para encerrar.
ECHO.

call npm run preview
