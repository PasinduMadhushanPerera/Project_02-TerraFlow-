# TerraFlow Login Functionality Test
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TerraFlow Login Functionality Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: Backend Health Check
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    if ($healthResponse.success) {
        Write-Host "   ✅ Backend is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
    Write-Host "   Please start the backend server first" -ForegroundColor Yellow
    exit 1
}

# Test 2: Frontend Accessibility
Write-Host "2. Testing Frontend Accessibility..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Frontend not accessible" -ForegroundColor Red
    Write-Host "   Please start the frontend server on port 5173" -ForegroundColor Yellow
}

# Test 3: Admin Login API
Write-Host "3. Testing Admin Login API..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = 'admin@terraflow.com'
        password = 'admin123'
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success -and $loginResponse.token) {
        Write-Host "   ✅ Admin login successful" -ForegroundColor Green
        Write-Host "   User: $($loginResponse.user.full_name)" -ForegroundColor Cyan
        Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor Cyan
        Write-Host "   Token: $($loginResponse.token.Substring(0,30))..." -ForegroundColor Gray
        $adminToken = $loginResponse.token
    } else {
        throw "Login failed or no token received"
    }
} catch {
    Write-Host "   ❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Supplier Login API
Write-Host "4. Testing Supplier Login API..." -ForegroundColor Yellow
try {
    $supplierLoginData = @{
        email = 'testsupplier@test.com'
        password = 'password123'
    } | ConvertTo-Json
    
    $supplierResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $supplierLoginData -ContentType "application/json"
    
    if ($supplierResponse.success -and $supplierResponse.token) {
        Write-Host "   ✅ Supplier login successful" -ForegroundColor Green
        Write-Host "   User: $($supplierResponse.user.full_name)" -ForegroundColor Cyan
        Write-Host "   Role: $($supplierResponse.user.role)" -ForegroundColor Cyan
        $supplierToken = $supplierResponse.token
    } else {
        throw "Supplier login failed or no token received"
    }
} catch {
    Write-Host "   ❌ Supplier login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Customer Login API
Write-Host "5. Testing Customer Login API..." -ForegroundColor Yellow
try {
    $customerLoginData = @{
        email = 'testcustomer@test.com'
        password = 'password123'
    } | ConvertTo-Json
    
    $customerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $customerLoginData -ContentType "application/json"
    
    if ($customerResponse.success -and $customerResponse.token) {
        Write-Host "   ✅ Customer login successful" -ForegroundColor Green
        Write-Host "   User: $($customerResponse.user.full_name)" -ForegroundColor Cyan
        Write-Host "   Role: $($customerResponse.user.role)" -ForegroundColor Cyan
    } else {
        throw "Customer login failed or no token received"
    }
} catch {
    Write-Host "   ❌ Customer login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Invalid Login Attempt
Write-Host "6. Testing Invalid Login (Security Check)..." -ForegroundColor Yellow
try {
    $invalidLoginData = @{
        email = 'invalid@test.com'
        password = 'wrongpassword'
    } | ConvertTo-Json
    
    $invalidResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $invalidLoginData -ContentType "application/json"
    
    if (!$invalidResponse.success) {
        Write-Host "   ✅ Invalid login properly rejected" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Security issue: Invalid login was accepted" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✅ Invalid login properly rejected (Expected error)" -ForegroundColor Green
}

# Test 7: Test Protected Routes
if ($adminToken) {
    Write-Host "7. Testing Protected Admin Route..." -ForegroundColor Yellow
    try {
        $headers = @{
            'Authorization' = "Bearer $adminToken"
            'Content-Type' = 'application/json'
        }
        $protectedResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/dashboard/stats" -Method GET -Headers $headers
        
        if ($protectedResponse.success) {
            Write-Host "   ✅ Protected admin route accessible with token" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ Protected route test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($supplierToken) {
    Write-Host "8. Testing Protected Supplier Route..." -ForegroundColor Yellow
    try {
        $headers = @{
            'Authorization' = "Bearer $supplierToken"
            'Content-Type' = 'application/json'
        }
        $supplierDashResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/supplier/dashboard" -Method GET -Headers $headers
        
        if ($supplierDashResponse.success) {
            Write-Host "   ✅ Protected supplier route accessible with token" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ Supplier route test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Login Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend URL: http://localhost:5173" -ForegroundColor Yellow
Write-Host "🔧 Backend URL:  http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Test Accounts:" -ForegroundColor Yellow
Write-Host "   Admin:    admin@terraflow.com / admin123" -ForegroundColor White
Write-Host "   Supplier: testsupplier@test.com / password123" -ForegroundColor White
Write-Host "   Customer: testcustomer@test.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "🎯 If backend login APIs are working but frontend login isn't:" -ForegroundColor Yellow
Write-Host "   1. Check browser console for JavaScript errors" -ForegroundColor White
Write-Host "   2. Verify CORS settings in backend" -ForegroundColor White
Write-Host "   3. Check network tab for failed requests" -ForegroundColor White
Write-Host "   4. Clear browser cache and localStorage" -ForegroundColor White
