Write-Host "Levantando SAFDA..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\usuarios'; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\documentos'; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\plataforma'; npm run start:dev"

Write-Host "Servicios iniciando en puertos 3001, 3002 y 3003" -ForegroundColor Green