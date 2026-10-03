@echo off
cd /d "%~dp0"
start "Harriet Website Server" /min cmd /c "node server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://localhost:4173/editor/"
