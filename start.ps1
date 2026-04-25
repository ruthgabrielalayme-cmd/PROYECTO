Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Levantando SAFDA — Modo Desarrollo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ─── Microservicios Backend ───────────────────────────────────────────────
Write-Host "`n[1/2] Iniciando microservicios backend..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$PWD\services\usuarios'; npm run start:dev" `
-WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$PWD\services\documentos'; npm run start:dev" `
-WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$PWD\services\plataforma'; npm run start:dev" `
-WindowStyle Normal

# ─── Frontends ────────────────────────────────────────────────────────────
Write-Host "[2/2] Iniciando frontends..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$PWD\frontends\safda-frontend-cd'; npm run dev" `
-WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$PWD\frontends\safda-frontend-admin'; npm run dev" `
-WindowStyle Normal

# ─── Resumen ──────────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  SAFDA levantando en segundo plano" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:" -ForegroundColor White
Write-Host "  svc_usuarios    → http://localhost:3001" -ForegroundColor Gray
Write-Host "  svc_documentos  → http://localhost:3002" -ForegroundColor Gray
Write-Host "  svc_plataforma  → http://localhost:3003" -ForegroundColor Gray
Write-Host ""
Write-Host "  Frontend:" -ForegroundColor White
Write-Host "  Ciudadania Digital (Funcionarios) → http://localhost:4200" -ForegroundColor Gray
Write-Host "  Panel Admin (Google)              → http://localhost:4201" -ForegroundColor Gray
Write-Host ""
Write-Host "  Esperá ~15 segundos a que todo compile." -ForegroundColor DarkYellow
Write-Host ""
