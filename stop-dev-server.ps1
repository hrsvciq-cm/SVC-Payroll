# Script to stop all Node.js processes (development server)
# Usage: .\stop-dev-server.ps1

Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow

# Stop all node.exe processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "All Node.js processes stopped" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run: npm run prisma:generate" -ForegroundColor Cyan

