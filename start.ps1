# BookVerse One-Click PowerShell Launcher
Set-Location -Path $PSScriptRoot
$Host.UI.RawUI.WindowTitle = "BookVerse - Application Launcher"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "                    BOOKVERSE PLATFORM LAUNCHER                      " -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Node.js
Write-Host "[*] Checking Node.js environment..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor White
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Verify MongoDB
Write-Host "[*] Checking MongoDB status..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "*mongo*" -ErrorAction SilentlyContinue
if ($mongoService) {
    if ($mongoService.Status -ne "Running") {
        Write-Host "[!] Starting MongoDB service..." -ForegroundColor Yellow
        try {
            Start-Service -Name $mongoService.Name -ErrorAction SilentlyContinue
            Write-Host "[OK] MongoDB service started." -ForegroundColor Green
        } catch {
            Write-Host "[!] Could not start service directly. Make sure MongoDB is active on port 27017." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[OK] MongoDB is running." -ForegroundColor Green
    }
} else {
    Write-Host "[*] Checking MongoDB port 27017..." -ForegroundColor Yellow
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue
    if ($tcp.TcpTestSucceeded) {
        Write-Host "[OK] MongoDB connection verified on 127.0.0.1:27017." -ForegroundColor Green
    } else {
        Write-Host "[!] Port 27017 not responding. Ensure MongoDB is active before running queries." -ForegroundColor Yellow
    }
}

# 3. Check Dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Installing root workspace packages..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "[*] Installing backend packages..." -ForegroundColor Yellow
    npm install --prefix backend
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[*] Installing frontend packages..." -ForegroundColor Yellow
    npm install --prefix frontend
}

# 4. Verify .env files
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "[OK] Created backend/.env" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "[OK] Created frontend/.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[*] Launching Backend (http://localhost:5000) & Frontend (http://localhost:5173)..." -ForegroundColor Green
Write-Host "[*] Opening browser in 3 seconds..." -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Open browser asynchronously
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:5173"
} | Out-Null

# Run Application
npm run dev
