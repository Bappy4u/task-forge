@echo off
REM Start the BullMQ worker from the repo root
cd /d "%~dp0task-api"
npm run worker
