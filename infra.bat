@echo off
REM Start the Redis infrastructure service using Docker Compose
cd /d "%~dp0"

echo Starting Redis service...
docker compose up -d redis

if %ERRORLEVEL% neq 0 (
  echo.
  echo Failed to start Redis. Please ensure Docker is running and docker compose is installed.
  exit /b %ERRORLEVEL%
)

echo Redis started successfully.
docker compose ps redis
