# Manual Backend Testing Script
# Run this script to test all backend endpoints manually
# Make sure the backend server is running on http://localhost:3001

$baseUrl = "http://localhost:3001/v1"
$testResults = @()

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "KoreaBiz Backend Manual Testing" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test Health Endpoints
Write-Host "1. Testing Health Endpoints..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   [PASS] GET /health - Status: $($health.status)" -ForegroundColor Green
    $testResults += "PASS: Health Check"
}
catch {
    Write-Host "   [FAIL] GET /health - Failed" -ForegroundColor Red
    $testResults += "FAIL: Health Check"
}

try {
    $ready = Invoke-RestMethod -Uri "$baseUrl/health/ready" -Method Get
    Write-Host "   [PASS] GET /health/ready - Status: $($ready.status)" -ForegroundColor Green
    $testResults += "PASS: Readiness Check"
}
catch {
    Write-Host "   [FAIL] GET /health/ready - Failed" -ForegroundColor Red
    $testResults += "FAIL: Readiness Check"
}

try {
    $live = Invoke-RestMethod -Uri "$baseUrl/health/live" -Method Get
    Write-Host "   [PASS] GET /health/live - Status: $($live.status)" -ForegroundColor Green
    $testResults += "PASS: Liveness Check"
}
catch {
    Write-Host "   [FAIL] GET /health/live - Failed" -ForegroundColor Red
    $testResults += "FAIL: Liveness Check"
}

Write-Host ""

# Test Authentication
Write-Host "2. Testing Authentication..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "test-$timestamp@example.com"
$testPassword = "Password123!"

try {
    $registerBody = @{
        email       = $testEmail
        password    = $testPassword
        displayName = "Test User"
    } | ConvertTo-Json

    $register = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    $accessToken = $register.access_token
    $refreshToken = $register.refresh_token
    Write-Host "   [PASS] POST /auth/register - User created" -ForegroundColor Green
    $testResults += "PASS: User Registration"
}
catch {
    Write-Host "   [FAIL] POST /auth/register - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "FAIL: User Registration"
}

try {
    $loginBody = @{
        email    = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $accessToken = $login.access_token
    Write-Host "   [PASS] POST /auth/login - Login successful" -ForegroundColor Green
    $testResults += "PASS: User Login"
}
catch {
    Write-Host "   [FAIL] POST /auth/login - Failed" -ForegroundColor Red
    $testResults += "FAIL: User Login"
}

Write-Host ""

# Test Users
Write-Host "3. Testing Users..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    $user = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Get -Headers $headers
    Write-Host "   [PASS] GET /users/me - User: $($user.email)" -ForegroundColor Green
    $testResults += "PASS: Get Current User"
}
catch {
    Write-Host "   [FAIL] GET /users/me - Failed" -ForegroundColor Red
    $testResults += "FAIL: Get Current User"
}

Write-Host ""

# Test Categories
Write-Host "4. Testing Categories..." -ForegroundColor Yellow
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get
    Write-Host "   [PASS] GET /categories - Found $($categories.data.Count) categories" -ForegroundColor Green
    $testResults += "PASS: List Categories"
}
catch {
    Write-Host "   [FAIL] GET /categories - Failed" -ForegroundColor Red
    $testResults += "FAIL: List Categories"
}

try {
    $allCategories = Invoke-RestMethod -Uri "$baseUrl/categories/all" -Method Get
    Write-Host "   [PASS] GET /categories/all - Found $($allCategories.Count) categories" -ForegroundColor Green
    $testResults += "PASS: Get All Categories"
}
catch {
    Write-Host "   [FAIL] GET /categories/all - Failed" -ForegroundColor Red
    $testResults += "FAIL: Get All Categories"
}

Write-Host ""

# Test Cities
Write-Host "5. Testing Cities..." -ForegroundColor Yellow
try {
    $cities = Invoke-RestMethod -Uri "$baseUrl/cities" -Method Get
    Write-Host "   [PASS] GET /cities - Found $($cities.data.Count) cities" -ForegroundColor Green
    $testResults += "PASS: List Cities"
}
catch {
    Write-Host "   [FAIL] GET /cities - Failed" -ForegroundColor Red
    $testResults += "FAIL: List Cities"
}

try {
    $allCities = Invoke-RestMethod -Uri "$baseUrl/cities/all" -Method Get
    Write-Host "   [PASS] GET /cities/all - Found $($allCities.Count) cities" -ForegroundColor Green
    $testResults += "PASS: Get All Cities"
}
catch {
    Write-Host "   [FAIL] GET /cities/all - Failed" -ForegroundColor Red
    $testResults += "FAIL: Get All Cities"
}

Write-Host ""

# Test Enterprises
Write-Host "6. Testing Enterprises..." -ForegroundColor Yellow
try {
    $enterprises = Invoke-RestMethod -Uri "$baseUrl/enterprises" -Method Get
    Write-Host "   [PASS] GET /enterprises - Found $($enterprises.data.Count) enterprises" -ForegroundColor Green
    $testResults += "PASS: List Enterprises"
}
catch {
    Write-Host "   [FAIL] GET /enterprises - Failed" -ForegroundColor Red
    $testResults += "FAIL: List Enterprises"
}

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type"  = "application/json"
    }
    $enterpriseBody = @{
        name             = "Test Enterprise $timestamp"
        shortDescription = "A test enterprise"
        description      = "This is a test enterprise created during manual testing"
    } | ConvertTo-Json

    $newEnterprise = Invoke-RestMethod -Uri "$baseUrl/enterprises" -Method Post -Headers $headers -Body $enterpriseBody
    $enterpriseId = $newEnterprise.id
    Write-Host "   [PASS] POST /enterprises - Created: $($newEnterprise.name)" -ForegroundColor Green
    $testResults += "PASS: Create Enterprise"
}
catch {
    Write-Host "   [FAIL] POST /enterprises - Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "FAIL: Create Enterprise"
}

if ($enterpriseId) {
    try {
        $enterprise = Invoke-RestMethod -Uri "$baseUrl/enterprises/$enterpriseId" -Method Get
        Write-Host "   [PASS] GET /enterprises/:id - Retrieved: $($enterprise.name)" -ForegroundColor Green
        $testResults += "PASS: Get Enterprise by ID"
    }
    catch {
        Write-Host "   [FAIL] GET /enterprises/:id - Failed" -ForegroundColor Red
        $testResults += "FAIL: Get Enterprise by ID"
    }
}

Write-Host ""

# Test Search
Write-Host "7. Testing Search..." -ForegroundColor Yellow
try {
    $searchResults = Invoke-RestMethod -Uri "$baseUrl/search/enterprises" -Method Get
    Write-Host "   [PASS] GET /search/enterprises - Found $($searchResults.data.Count) results" -ForegroundColor Green
    $testResults += "PASS: Search Enterprises"
}
catch {
    Write-Host "   [FAIL] GET /search/enterprises - Failed" -ForegroundColor Red
    $testResults += "FAIL: Search Enterprises"
}

try {
    $popular = Invoke-RestMethod -Uri "$baseUrl/search/popular" -Method Get
    Write-Host "   [PASS] GET /search/popular - Found $($popular.Count) popular enterprises" -ForegroundColor Green
    $testResults += "PASS: Get Popular"
}
catch {
    Write-Host "   [FAIL] GET /search/popular - Failed" -ForegroundColor Red
    $testResults += "FAIL: Get Popular"
}

try {
    $featured = Invoke-RestMethod -Uri "$baseUrl/search/featured" -Method Get
    Write-Host "   [PASS] GET /search/featured - Found $($featured.Count) featured enterprises" -ForegroundColor Green
    $testResults += "PASS: Get Featured"
}
catch {
    Write-Host "   [FAIL] GET /search/featured - Failed" -ForegroundColor Red
    $testResults += "FAIL: Get Featured"
}

Write-Host ""

# Test Subscriptions
Write-Host "8. Testing Subscriptions..." -ForegroundColor Yellow
try {
    $plans = Invoke-RestMethod -Uri "$baseUrl/subscriptions/plans" -Method Get
    Write-Host "   [PASS] GET /subscriptions/plans - Found $($plans.Count) plans" -ForegroundColor Green
    $testResults += "PASS: Get Subscription Plans"
}
catch {
    Write-Host "   [FAIL] GET /subscriptions/plans - Failed" -ForegroundColor Red
    $testResults += "FAIL: Get Subscription Plans"
}

Write-Host ""

# Test Analytics
Write-Host "9. Testing Analytics..." -ForegroundColor Yellow
if ($enterpriseId) {
    try {
        $eventBody = @{
            enterpriseId = $enterpriseId
            eventType    = "page_view"
            metadata     = @{
                source = "manual_test"
            }
        } | ConvertTo-Json

        $event = Invoke-RestMethod -Uri "$baseUrl/analytics/events" -Method Post -Body $eventBody -ContentType "application/json"
        Write-Host "   [PASS] POST /analytics/events - Event recorded" -ForegroundColor Green
        $testResults += "PASS: Record Analytics Event"
    }
    catch {
        Write-Host "   [FAIL] POST /analytics/events - Failed" -ForegroundColor Red
        $testResults += "FAIL: Record Analytics Event"
    }
}

Write-Host ""

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
$passed = ($testResults | Where-Object { $_ -like "PASS:*" }).Count
$failed = ($testResults | Where-Object { $_ -like "FAIL:*" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "SUCCESS: All tests passed!" -ForegroundColor Green
}
else {
    Write-Host "WARNING: Some tests failed. Please review the output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test Results:" -ForegroundColor Cyan
$testResults | ForEach-Object {
    if ($_ -like "PASS:*") {
        Write-Host $_ -ForegroundColor Green
    }
    else {
        Write-Host $_ -ForegroundColor Red
    }
}
