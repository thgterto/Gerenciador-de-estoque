@echo off
TITLE LabControl - Build Portable
COLOR 0A
CLS

ECHO ========================================================
ECHO          LABCONTROL - PORTABLE BUILDER
ECHO ========================================================
ECHO.
ECHO Este script ira construir a versao Portavel (Standalone) do LabControl.
ECHO.

:: 1. Verificacao do Node.js
ECHO [1/3] Verificando ambiente...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO [ERRO FATAL] Node.js nao encontrado!
    ECHO Instale o Node.js para continuar.
    PAUSE
    EXIT
)

:: 2. Instalar Dependencias (Se necessario)
IF NOT EXIST "node_modules" (
    ECHO [2/3] Instalando dependencias...
    call npm install
) ELSE (
    ECHO [2/3] Dependencias OK.
)

:: 3. Construir
ECHO.
ECHO [3/3] Iniciando Build (Pode levar alguns minutos)...
ECHO       Destino: release/
ECHO.
call npm run electron:build

IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO.
    ECHO [ERRO] Falha no build. Verifique os logs acima.
    PAUSE
    EXIT
)

ECHO.
ECHO [SUCESSO] Build concluido com sucesso!
ECHO O executavel esta na pasta 'release/'.
ECHO.
PAUSE
