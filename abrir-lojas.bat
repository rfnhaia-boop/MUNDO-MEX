@echo off
rem Abre as lojas 3D num servidor local (http://localhost) pra voz/microfone funcionar.
cd /d "%~dp0"
start "Lojas 3D (servidor)" /min python -m http.server 8000
ping 127.0.0.1 -n 3 >nul
start "" "http://localhost:8000/mundo/index.html"
echo Lojas abertas em http://localhost:8000 - feche a janela do servidor pra parar.
