# MySQL Installation Script for Windows
# This script will help you install MySQL for the TerraFlow project

Write-Host "MySQL Setup Script" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

# Check if MySQL is already installed
$mysqlPath = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\MySQL\bin\mysql.exe"
)

$mysqlFound = $false
foreach ($path in $mysqlPath) {
    if (Test-Path $path) {
        Write-Host "MySQL found at: $path" -ForegroundColor Green
        $mysqlFound = $true
        break
    }
}

if (-not $mysqlFound) {
    Write-Host "MySQL not found. Please install MySQL first:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: XAMPP (Recommended for development)" -ForegroundColor Yellow
    Write-Host "Download: https://www.apachefriends.org/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Option 2: MySQL Community Server" -ForegroundColor Yellow
    Write-Host "Download: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor White
    exit
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Ensure MySQL service is running" -ForegroundColor White
Write-Host "2. Run database setup script" -ForegroundColor White
Write-Host "3. Start the backend server" -ForegroundColor White
