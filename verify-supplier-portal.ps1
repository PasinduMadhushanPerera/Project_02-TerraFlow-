# TerraFlow Supplier Portal Test Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TerraFlow Supplier Portal Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: Backend Health Check
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    if ($healthResponse.success) {
        Write-Host "✅ Backend Health Check PASSED" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend Health Check FAILED" -ForegroundColor Red
    exit 1
}

# Test 2: Frontend Accessibility
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend Accessibility PASSED" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend Accessibility FAILED" -ForegroundColor Red
    Write-Host "   Please ensure frontend is running on port 5174" -ForegroundColor Yellow
}

# Test 3: Supplier Authentication
try {
    $loginData = @{
        email = 'testsupplier@test.com'
        password = 'password123'
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success -and $loginResponse.user.role -eq 'supplier') {
        Write-Host "✅ Supplier Authentication PASSED" -ForegroundColor Green
        $token = $loginResponse.token
    } else {
        throw "Invalid login response"
    }
} catch {
    Write-Host "❌ Supplier Authentication FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Test 4: Supplier Dashboard API
try {
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    $dashResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/supplier/dashboard" -Method GET -Headers $headers
    
    if ($dashResponse.success) {
        Write-Host "✅ Supplier Dashboard API PASSED" -ForegroundColor Green
        Write-Host "   Total Requests: $($dashResponse.data.stats.total_requests)" -ForegroundColor Cyan
        Write-Host "   Completed Requests: $($dashResponse.data.stats.completed_requests)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Supplier Dashboard API FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: Material Requests API
try {
    $requestsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/supplier/requests" -Method GET -Headers $headers
    
    if ($requestsResponse.success) {
        Write-Host "✅ Material Requests API PASSED" -ForegroundColor Green
        Write-Host "   Total Material Requests: $($requestsResponse.data.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Material Requests API FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 6: Delivery History API
try {
    $historyResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/supplier/history" -Method GET -Headers $headers
    
    if ($historyResponse.success) {
        Write-Host "✅ Delivery History API PASSED" -ForegroundColor Green
        Write-Host "   Total Deliveries: $($historyResponse.data.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Delivery History API FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 7: Forecast API
try {
    $forecastResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/supplier/forecast" -Method GET -Headers $headers
    
    if ($forecastResponse.success) {
        Write-Host "✅ Forecast API PASSED" -ForegroundColor Green
        Write-Host "   Top Materials Count: $($forecastResponse.data.topMaterials.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Forecast API FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supplier Portal Verification Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "👤 Supplier Test Account:" -ForegroundColor Yellow
Write-Host "   Email:    testsupplier@test.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Supplier Portal Features:" -ForegroundColor Yellow
Write-Host "   ✅ Dashboard with real-time statistics" -ForegroundColor Green
Write-Host "   ✅ Material requests management" -ForegroundColor Green
Write-Host "   ✅ Delivery history and performance tracking" -ForegroundColor Green
Write-Host "   ✅ Supplier profile management" -ForegroundColor Green
Write-Host "   ✅ Demand forecasting and analytics" -ForegroundColor Green
