# TerraFlow Integration Test Script
Write-Host "TerraFlow Integration Test Suite" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Test 1: Backend Health Check
Write-Host "1. Testing Backend Health Check..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    if ($response.success) {
        Write-Host "   Backend health check PASSED" -ForegroundColor Green
    } else {
        Write-Host "   Backend health check FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   Cannot connect to backend at http://localhost:5000" -ForegroundColor Red
    Write-Host "   Please ensure backend server is running" -ForegroundColor Yellow
}

# Test 2: Frontend Accessibility  
Write-Host "2. Testing Frontend Accessibility..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   Frontend is accessible - PASSED" -ForegroundColor Green
    } else {
        Write-Host "   Frontend returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   Cannot connect to frontend at http://localhost:5174" -ForegroundColor Red
    Write-Host "   Please ensure frontend server is running" -ForegroundColor Yellow
}

# Test 3: API Login Test
Write-Host "3. Testing API Login..." -ForegroundColor Blue
try {
    $loginData = @{
        email = "admin@terraflow.com" 
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $loginData -ContentType "application/json"
    if ($response.success) {
        Write-Host "   Admin login PASSED" -ForegroundColor Green
        $token = $response.token
        
        # Test authenticated endpoint
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $profileResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/profile" -Method GET -Headers $headers
        if ($profileResponse.success) {
            Write-Host "   Profile API PASSED" -ForegroundColor Green
        }
        
    } else {
        Write-Host "   Admin login FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   Login API test FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Integration Test Complete!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Blue
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Blue
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@terraflow.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
