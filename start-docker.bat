@echo off
title BookVerse - Docker Container Launcher
color 0A

:: Ensure working directory is the script directory
cd /d "%~dp0"

echo =====================================================================
echo                BOOKVERSE DOCKER CONTAINER LAUNCHER
echo =====================================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker is not installed or not running!
    echo Please install or start Docker Desktop from https://www.docker.com
    echo.
    pause
    exit /b 1
)

echo [*] Starting BookVerse containers (MongoDB, Backend, Frontend)...
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [OK] All containers started successfully!
    echo [*] Frontend: http://localhost:80 (or http://localhost)
    echo [*] Backend:  http://localhost:5000/api
    echo =====================================================================
    echo.
    start http://localhost
) else (
    color 0C
    echo [ERROR] Failed to start Docker containers. Check Docker Desktop status.
)

pause
