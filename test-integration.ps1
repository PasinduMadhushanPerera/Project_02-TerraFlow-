# TerraFlow Integration Test Script
# This script tests the integration between frontend and backend

Write-Host "🧪 TerraFlow Integration Test Suite" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Test 1: Backend Health Check
Write-Host "1. Testing Backend Health Check..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    if ($response.success) {
        Write-Host "   ✅ Backend health check passed" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Cannot connect to backend (http://localhost:5000)" -ForegroundColor Red
    Write-Host "   Please ensure backend server is running" -ForegroundColor Yellow
}

# Test 2: Frontend Accessibility
Write-Host "2. Testing Frontend Accessibility..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Cannot connect to frontend (http://localhost:5174)" -ForegroundColor Red
    Write-Host "   Please ensure frontend server is running" -ForegroundColor Yellow
}

# Test 3: API Endpoints
Write-Host "3. Testing API Endpoints..." -ForegroundColor Blue

# Test login endpoint
try {
    $loginData = @{
        email = "admin@terraflow.com"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $loginData -ContentType "application/json"
    if ($response.success) {
        Write-Host "   ✅ Admin login successful" -ForegroundColor Green
        $token = $response.token
        
        # Test authenticated endpoint
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $profileResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/profile" -Method GET -Headers $headers
        if ($profileResponse.success) {
            Write-Host "   ✅ Profile API working" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Profile API failed" -ForegroundColor Red
        }
        
        # Test admin endpoints
        $adminResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/dashboard/stats" -Method GET -Headers $headers
        if ($adminResponse.success) {
            Write-Host "   ✅ Admin dashboard API working" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Admin dashboard API failed" -ForegroundColor Red
        }
        
    } else {
        Write-Host "   ❌ Admin login failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Login API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Database Connection
Write-Host "4. Testing Database Connection..." -ForegroundColor Blue
try {
    $dbResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users" -Method GET -Headers $headers
    if ($dbResponse.success) {
        Write-Host "   ✅ Database connection working" -ForegroundColor Green
        Write-Host "   📊 Found $($dbResponse.data.Count) users in database" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Database test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "🎯 Integration Test Complete!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:5174" -ForegroundColor Blue
Write-Host "Backend URL:  http://localhost:5000" -ForegroundColor Blue
Write-Host "API Docs:     http://localhost:5000/api" -ForegroundColor Blue
Write-Host ""
Write-Host "👤 Test Login Credentials:" -ForegroundColor Yellow
Write-Host "   Email: admin@terraflow.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Green
Write-Host "1. Open http://localhost:5174 in your browser" -ForegroundColor White
Write-Host "2. Login with admin credentials" -ForegroundColor White
Write-Host "3. Test different user roles and features" -ForegroundColor White
Write-Host "4. Create test customer and supplier accounts" -ForegroundColor White
