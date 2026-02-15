@echo off
TITLE EstoqueNode Corp Portable Launcher

echo Starting EstoqueNode Corp...
echo ensure "EstoqueNode_Corp.exe" exists or build it first.

if not exist "EstoqueNode_Corp.exe" (
    echo Executable not found. Attempting to build...
    cd server
    call npm install
    call npm run package
    cd ..
    if not exist "EstoqueNode_Corp.exe" (
        echo Build failed or executable not created.
        pause
        exit /b 1
    )
)

start "" "EstoqueNode_Corp.exe"
timeout /t 5 >nul
start http://localhost:3000
exit
