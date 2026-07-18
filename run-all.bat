@echo off
REM Run backend and frontend in separate terminals from the repo root
cd /d "%~dp0"

start "Task Forge Backend" cmd /k "cd /d "%~dp0task-api" && npm run dev"
start "Task Forge Frontend" cmd /k "cd /d "%~dp0task-frontend" && npm run dev"
