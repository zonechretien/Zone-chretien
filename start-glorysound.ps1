# ============================================================
# start-glorysound.ps1
# Démarre l'environnement de développement GlorySound :
#   1. PostgreSQL portable
#   2. Backend  (port 4000) dans une nouvelle fenêtre PowerShell
#   3. Frontend (port 3000) dans une nouvelle fenêtre PowerShell
# ============================================================

$root = $PSScriptRoot

# --- PATH node + claude disponibles dans cette fenêtre ------
$claudeBin = "C:\Users\elianea\.local\bin"
$nodeDir   = Join-Path $root "node-v24.18.0-win-x64\node-v24.18.0-win-x64"
foreach ($p in @($claudeBin, $nodeDir)) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = "$p;$env:PATH"
    }
}

# --- Chemins portables --------------------------------------
$pgBin   = Join-Path $root "postgresql\pgsql\bin"
$pgCtl   = Join-Path $pgBin "pg_ctl.exe"
$pgData  = Join-Path $root "postgresql\data"
$pgLog   = Join-Path $root "postgresql\postgresql.log"

$nodeExe = Join-Path $nodeDir "node.exe"
$npmCmd  = Join-Path $nodeDir "npm.cmd"

$backendDir  = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

# --- Vérification des chemins --------------------------------
$requiredPaths = @($pgCtl, $pgData, $nodeExe, $npmCmd, $backendDir, $frontendDir)
foreach ($p in $requiredPaths) {
    if (-not (Test-Path $p)) {
        Write-Host "Chemin introuvable : $p" -ForegroundColor Red
        exit 1
    }
}

# --- 1. PostgreSQL portable -----------------------------------
Write-Host "Vérification de PostgreSQL..." -ForegroundColor Cyan
& $pgCtl status -D $pgData | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL est déjà démarré." -ForegroundColor Yellow
}
else {
    Write-Host "Démarrage de PostgreSQL..." -ForegroundColor Cyan
    & $pgCtl start -D $pgData -l $pgLog -w
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Échec du démarrage de PostgreSQL. Consultez le log : $pgLog" -ForegroundColor Red
        exit 1
    }
    Write-Host "PostgreSQL démarré." -ForegroundColor Green
}

# --- 2. Backend (port 4000) -----------------------------------
Write-Host "Démarrage du backend (port 4000)..." -ForegroundColor Cyan
$backendCommand = "`$Host.UI.RawUI.WindowTitle = 'GlorySound - Backend (4000)'; `$env:Path = '$nodeDir;' + `$env:Path; Set-Location '$backendDir'; & '$npmCmd' run dev"
Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $backendCommand

# --- 3. Frontend (port 3000) ----------------------------------
Write-Host "Démarrage du frontend (port 3000)..." -ForegroundColor Cyan
$frontendCommand = "`$Host.UI.RawUI.WindowTitle = 'GlorySound - Frontend (3000)'; `$env:Path = '$nodeDir;' + `$env:Path; Set-Location '$frontendDir'; & '$npmCmd' run dev"
Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $frontendCommand

Write-Host ""
Write-Host "Tout est lancé :" -ForegroundColor Green
Write-Host "  PostgreSQL : localhost:5432"
Write-Host "  Backend    : http://localhost:4000"
Write-Host "  Frontend   : http://localhost:3000"
