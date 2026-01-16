@echo off
title LabControl UMV - Launcher
echo ==========================================
echo      Iniciando LabControl UMV...
echo ==========================================

IF NOT EXIST "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
)

IF NOT EXIST "dist" (
    echo [INFO] Compilando aplicacao...
    call npm run build
)

echo [INFO] Iniciando Electron...
call npm run electron

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Ocorreu um erro ao iniciar a aplicacao.
    pause
)
