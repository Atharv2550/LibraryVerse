@echo off
setlocal enabledelayedexpansion
title BookVerse - Application Launcher
color 0B

:: Ensure working directory is the script directory
cd /d "%~dp0"

echo =====================================================================
echo                     BOOKVERSE PLATFORM LAUNCHER
echo =====================================================================
echo.

:: 1. Check Node.js installation
echo [*] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your PATH!
    echo Please install Node.js (v18+) from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Check MongoDB Service
echo [*] Checking MongoDB service...
sc.exe query MongoDB | findstr /i "RUNNING" >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] MongoDB service is not currently running. Attempting to start...
    net start MongoDB >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] MongoDB service started successfully.
    ) else (
        echo [!] Could not auto-start Windows MongoDB service (requires admin permissions or container).
        echo [!] Checking if MongoDB is already active on localhost:27017...
    )
) else (
    echo [OK] MongoDB service is active and running.
)

:: 3. Verify Dependencies
if not exist "node_modules\" (
    echo [*] Installing workspace root dependencies...
    call npm install
)

if not exist "backend\node_modules\" (
    echo [*] Installing backend dependencies...
    call npm install --prefix backend
)

if not exist "frontend\node_modules\" (
    echo [*] Installing frontend dependencies...
    call npm install --prefix frontend
)

:: 4. Verify Backend & Frontend Environment Files
if not exist "backend\.env" (
    echo [*] Creating backend/.env from .env.example...
    copy "backend\.env.example" "backend\.env" >nul
)

if not exist "frontend\.env" (
    echo [*] Creating frontend/.env from .env.example...
    copy "frontend\.env.example" "frontend\.env" >nul
)

echo.
echo =====================================================================
echo [*] Starting BookVerse Backend (port 5000) & Frontend (port 5173)...
echo [*] Application will open automatically in your browser...
echo =====================================================================
echo.

:: Launch browser in background after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

:: Run Backend and Frontend concurrently
call npm run dev

pause
