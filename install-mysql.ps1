# MySQL Installation Script for Windows
# This script will help you install MySQL for the TerraFlow project

Write-Host "🚀 TerraFlow MySQL Setup Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

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
        Write-Host "✅ MySQL found at: $path" -ForegroundColor Green
        $mysqlFound = $true
        $env:PATH += ";$(Split-Path $path)"
        break
    }
}

if (-not $mysqlFound) {
    Write-Host "❌ MySQL not found. Please install MySQL first:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: XAMPP (Recommended for development)" -ForegroundColor Yellow
    Write-Host "Download: https://www.apachefriends.org/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Option 2: MySQL Community Server" -ForegroundColor Yellow
    Write-Host "Download: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor White
    
    # Try to download and install MySQL Community Server automatically
    $choice = Read-Host "Would you like to download MySQL Community Server now? (y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host "Opening MySQL download page..." -ForegroundColor Blue
        Start-Process "https://dev.mysql.com/downloads/mysql/"
    }
    exit
}

# Test MySQL connection
Write-Host "Testing MySQL connection..." -ForegroundColor Blue
try {
    $testResult = & mysql -u root -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL connection successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MySQL connection failed. You may need to:" -ForegroundColor Yellow
        Write-Host "   1. Start MySQL service" -ForegroundColor White
        Write-Host "   2. Set root password if needed" -ForegroundColor White
        Write-Host "   3. Check firewall settings" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Unable to test MySQL connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Green
Write-Host "1. Ensure MySQL service is running" -ForegroundColor White
Write-Host "2. Run: cd TerraflowBackend; node setup-db.js" -ForegroundColor White
Write-Host "3. Run: node server.js" -ForegroundColor White
Write-Host ""
Write-Host "If you need help, check SETUP_GUIDE.md" -ForegroundColor Blue
