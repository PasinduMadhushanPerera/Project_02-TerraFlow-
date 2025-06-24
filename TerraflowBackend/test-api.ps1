# TerraFlow Backend API Test Script
# This script tests all major API endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TerraFlow Backend API Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$totalTests = 0
$passedTests = 0

function Test-Endpoint {
    param($name, $scriptBlock)
    
    $global:totalTests++
    Write-Host "[$global:totalTests] Testing: $name" -ForegroundColor Yellow
    
    try {
        $result = & $scriptBlock
        Write-Host "    ✅ PASSED" -ForegroundColor Green
        $global:passedTests++
        return $result
    }
    catch {
        Write-Host "    ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Health Check
Test-Endpoint "Health Check" {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    if ($response.success -ne $true) { throw "Health check failed" }
    return $response
}

# Test 2: Admin Login
$adminToken = Test-Endpoint "Admin Login" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@terraflow.com","password":"admin123"}'
    if ($response.success -ne $true) { throw "Admin login failed" }
    return $response.token
}

# Test 3: Admin Dashboard Stats
Test-Endpoint "Admin Dashboard Stats" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/dashboard/stats" -Method GET -Headers @{Authorization="Bearer $adminToken"}
    if ($response.success -ne $true) { throw "Failed to get dashboard stats" }
    return $response
}

# Test 4: Get Products (Admin)
Test-Endpoint "Get Products (Admin)" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/products" -Method GET -Headers @{Authorization="Bearer $adminToken"}
    if ($response.success -ne $true) { throw "Failed to get products" }
    return $response
}

# Test 5: Customer Registration
Test-Endpoint "Customer Registration" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/register" -Method POST -ContentType "application/json" -Body '{"role":"customer","fullName":"Test Customer","email":"testcustomer@test.com","password":"password123","mobile":"1234567890","address":"123 Test Street"}'
    if ($response.success -ne $true) { throw "Customer registration failed" }
    return $response
}

# Test 6: Customer Login
$customerToken = Test-Endpoint "Customer Login" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -ContentType "application/json" -Body '{"email":"testcustomer@test.com","password":"password123"}'
    if ($response.success -ne $true) { throw "Customer login failed" }
    return $response.token
}

# Test 7: Customer Dashboard
Test-Endpoint "Customer Dashboard" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/customer/dashboard" -Method GET -Headers @{Authorization="Bearer $customerToken"}
    if ($response.success -ne $true) { throw "Failed to get customer dashboard" }
    return $response
}

# Test 8: Customer Products
$products = Test-Endpoint "Customer Products" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/customer/products" -Method GET -Headers @{Authorization="Bearer $customerToken"}
    if ($response.success -ne $true) { throw "Failed to get customer products" }
    return $response.data
}

# Test 9: Create Order
Test-Endpoint "Create Order" {
    if ($products -and $products.Count -gt 0) {
        $orderData = @{
            items = @(@{
                product_id = $products[0].id
                quantity = 2
            })
            shipping_address = "123 Test Street, Test City, Test State"
            notes = "Test order"
        } | ConvertTo-Json -Depth 3
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/customer/orders" -Method POST -ContentType "application/json" -Body $orderData -Headers @{Authorization="Bearer $customerToken"}
        if ($response.success -ne $true) { throw "Failed to create order" }
        return $response
    } else {
        throw "No products available for order"
    }
}

# Test 10: Supplier Registration
Test-Endpoint "Supplier Registration" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/register" -Method POST -ContentType "application/json" -Body '{"role":"supplier","fullName":"Test Supplier","email":"testsupplier@test.com","password":"password123","mobile":"9876543210","businessName":"Test Supply Co","businessAddress":"456 Business Ave","address":"456 Business Ave"}'
    if ($response.success -ne $true) { throw "Supplier registration failed" }
    return $response
}

# Test 11: Supplier Login
$supplierToken = Test-Endpoint "Supplier Login" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -ContentType "application/json" -Body '{"email":"testsupplier@test.com","password":"password123"}'
    if ($response.success -ne $true) { throw "Supplier login failed" }
    return $response.token
}

# Test 12: Supplier Dashboard
Test-Endpoint "Supplier Dashboard" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/supplier/dashboard" -Method GET -Headers @{Authorization="Bearer $supplierToken"}
    if ($response.success -ne $true) { throw "Failed to get supplier dashboard" }
    return $response
}

# Test 13: Get All Users (Admin)
Test-Endpoint "Get All Users (Admin)" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Method GET -Headers @{Authorization="Bearer $adminToken"}
    if ($response.success -ne $true) { throw "Failed to get users" }
    return $response
}

# Test 14: Create Material Request (Admin)
Test-Endpoint "Create Material Request (Admin)" {
    $requestData = @{
        supplier_id = 3
        material_type = "Red Clay"
        quantity = 100
        unit = "kg"
        required_date = "2025-07-01"
        description = "High quality red clay for production"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/material-requests" -Method POST -ContentType "application/json" -Body $requestData -Headers @{Authorization="Bearer $adminToken"}
    if ($response.success -ne $true) { throw "Failed to create material request" }
    return $response
}

# Test 15: Get Material Requests (Supplier)
Test-Endpoint "Get Material Requests (Supplier)" {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/supplier/requests" -Method GET -Headers @{Authorization="Bearer $supplierToken"}
    if ($response.success -ne $true) { throw "Failed to get material requests" }
    return $response
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red

if ($passedTests -eq $totalTests) {
    Write-Host ""
    Write-Host "🎉 All tests passed! Backend is fully functional." -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend is ready for frontend integration:" -ForegroundColor Yellow
    Write-Host "- API Base URL: $baseUrl" -ForegroundColor White
    Write-Host "- Admin Account: admin@terraflow.com / admin123" -ForegroundColor White
    Write-Host "- Test Customer: testcustomer@test.com / password123" -ForegroundColor White
    Write-Host "- Test Supplier: testsupplier@test.com / password123" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️ Some tests failed. Please check the backend configuration." -ForegroundColor Yellow
}

Write-Host ""
