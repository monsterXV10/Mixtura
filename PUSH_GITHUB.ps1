# ════════════════════════════════════════════════════════════
#  MIXTURA — Setup + push GitHub (PowerShell, Windows)
#  Crée le repo sur GitHub si besoin, puis pousse tout le code.
#
#  Usage : clic-droit sur le fichier → "Exécuter avec PowerShell"
#  ou dans PowerShell : .\PUSH_GITHUB.ps1
# ════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# ── 1) Token GitHub ──
$Token = Read-Host "Colle ton GitHub PAT (commence par github_pat_ ou ghp_)"
if (-not $Token) { Write-Host "Token vide. Annule."; exit 1 }

# ── 2) Récupère ton login GitHub ──
Write-Host "[+] Verification du token..."
$headers = @{
  "Authorization" = "Bearer $Token"
  "Accept"        = "application/vnd.github+json"
  "User-Agent"    = "MIXTURA-setup"
}
try {
  $me = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
  $login = $me.login
  Write-Host "[+] Connecte en tant que : $login"
} catch {
  Write-Host "Token invalide ou pas d'acces. Erreur : $($_.Exception.Message)"
  exit 1
}

# ── 3) Nom du repo ──
$repoName = Read-Host "Nom du repo (defaut: mixtura-pwa)"
if (-not $repoName) { $repoName = "mixtura-pwa" }

# ── 4) Crée le repo s'il n'existe pas ──
$repoUrl = "https://github.com/$login/$repoName"
try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$login/$repoName" -Headers $headers | Out-Null
  Write-Host "[+] Repo deja existant : $repoUrl"
} catch {
  Write-Host "[+] Creation du repo $repoName..."
  $body = @{
    name        = $repoName
    description = "MIXTURA — Cocktail Manager (PWA)"
    private     = $false
    auto_init   = $false
  } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method POST -Uri "https://api.github.com/user/repos" -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "[+] Repo cree : $repoUrl"
  } catch {
    Write-Host "Echec creation repo : $($_.Exception.Message)"
    exit 1
  }
}

# ── 5) Nettoyage du .git casse ──
if (Test-Path ".git\config.lock") {
  Write-Host "[+] Nettoyage du lock git..."
  Remove-Item -Recurse -Force ".git"
}

# ── 6) Init git ──
if (-not (Test-Path ".git")) {
  Write-Host "[+] git init..."
  git init -b main | Out-Null
  git config user.email "kuhlichalexis@gmail.com"
  git config user.name "alexis"
}

# ── 7) Remote ──
$pushUrl = "https://x-access-token:$Token@github.com/$login/$repoName.git"
git remote remove origin 2>$null | Out-Null
git remote add origin $pushUrl

# ── 8) Add + commit + push ──
Write-Host "[+] Stage + commit..."
git add -A
git commit -m "MIXTURA v3 — refonte interface 4 onglets + scanner + auto-ingredients" 2>&1 | Out-Null
git branch -M main
Write-Host "[+] Push vers $repoUrl..."
git push -u origin main

Write-Host ""
Write-Host "════════════════════════════════════════════"
Write-Host "  ✅ Pousse ! Repo en ligne : $repoUrl"
Write-Host "════════════════════════════════════════════"
Read-Host "Appuie sur Entree pour fermer"
