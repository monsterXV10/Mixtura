@echo off
REM ════════════════════════════════════════════════
REM  MIXTURA — Push vers GitHub
REM  Double-cliquer ce fichier pour pousser le code
REM ════════════════════════════════════════════════

cd /d "%~dp0"

REM 1) Nettoyage du .git cassé si besoin
if exist .git\config.lock (
  echo [+] Nettoyage du lock git...
  rd /s /q .git
)

REM 2) Init si pas encore fait
if not exist .git (
  echo [+] Initialisation du repo git...
  git init -b main
  git config user.email "kuhlichalexis@gmail.com"
  git config user.name "alexis"
)

REM 3) Remote GitHub
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo.
  echo ═══════════════════════════════════════════════════════
  echo  Premiere fois : entre l'URL de ton repo GitHub
  echo  Exemple: https://github.com/TON_USER/mixtura-pwa.git
  echo ═══════════════════════════════════════════════════════
  set /p REPO_URL="URL: "
  git remote add origin "%REPO_URL%"
)

REM 4) Commit + push
git add -A
git commit -m "MIXTURA v3 — refonte interface 4 onglets (cocktails, ingredients, batch, settings)"
git branch -M main
git push -u origin main

echo.
echo ════════════════════════
echo  Termine !
echo ════════════════════════
pause
