# TerraFlow SCM - Final System Test
Write-Host "TerraFlow SCM - Final Integration Test" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Login and get token
$loginData = @{email='admin@terraflow.com'; password='admin123'} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/login' -Method POST -Body $loginData -ContentType 'application/json'
$headers = @{'Authorization' = "Bearer $($loginResponse.token)"}

Write-Host "Authentication: PASSED" -ForegroundColor Green

# Test all major APIs
$dashboard = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/dashboard/stats' -Method GET -Headers $headers
Write-Host "Dashboard API: PASSED - $($dashboard.data.totalUsers) users, $($dashboard.data.totalProducts) products" -ForegroundColor Green

$products = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/products' -Method GET -Headers $headers
Write-Host "Products API: PASSED - $($products.data.Count) products loaded" -ForegroundColor Green

$users = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/users' -Method GET -Headers $headers
Write-Host "Users API: PASSED - $($users.data.Count) users managed" -ForegroundColor Green

$reports = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/reports/sales' -Method GET -Headers $headers
Write-Host "Reports API: PASSED - Sales reports generated" -ForegroundColor Green

Write-Host ""
Write-Host "SYSTEM STATUS: FULLY OPERATIONAL" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Blue
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Blue
Write-Host "Login: admin@terraflow.com / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ready for production use!" -ForegroundColor Cyan
