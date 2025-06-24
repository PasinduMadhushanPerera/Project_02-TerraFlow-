// Test login flow debugging script
console.log('=== TERRAFLOW LOGIN DEBUG SCRIPT ===');

// Test 1: Direct API call
async function testDirectAPI() {
    console.log('\n1. Testing Direct API Call...');
    
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: 'admin@terraflow.com', 
                password: 'admin123' 
            }),
        });
        
        console.log('   Status:', response.status);
        console.log('   OK:', response.ok);
        
        const result = await response.json();
        console.log('   Response:', result);
        
        if (response.ok && result.success) {
            console.log('   ✅ Direct API call SUCCESS');
            return result;
        } else {
            console.log('   ❌ Direct API call FAILED');
            return null;
        }
    } catch (error) {
        console.log('   ❌ Direct API call ERROR:', error.message);
        return null;
    }
}

// Test 2: LocalStorage test
function testLocalStorage(userData) {
    console.log('\n2. Testing LocalStorage...');
    
    try {
        // Test storing and retrieving user data
        const testData = {
            ...userData.user,
            token: userData.token
        };
        
        localStorage.setItem('terraflow_user_test', JSON.stringify(testData));
        const retrieved = localStorage.getItem('terraflow_user_test');
        
        if (retrieved) {
            const parsed = JSON.parse(retrieved);
            console.log('   ✅ LocalStorage test SUCCESS');
            console.log('   Stored data:', parsed);
            
            // Clean up test data
            localStorage.removeItem('terraflow_user_test');
            return true;
        } else {
            console.log('   ❌ LocalStorage test FAILED - could not retrieve');
            return false;
        }
    } catch (error) {
        console.log('   ❌ LocalStorage test ERROR:', error.message);
        return false;
    }
}

// Test 3: Simulate AuthContext login
async function testAuthContextFlow() {
    console.log('\n3. Testing AuthContext Flow Simulation...');
    
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: 'admin@terraflow.com', 
                password: 'admin123' 
            }),
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Simulate the exact same flow as AuthContext
            const user = {
                id: result.user.id.toString(),
                username: result.user.full_name,
                email: result.user.email,
                role: result.user.role,
                fullName: result.user.full_name,
                isApproved: true
            };
            
            const userWithToken = {
                ...user,
                token: result.token
            };
            
            // Store in localStorage like AuthContext does
            localStorage.setItem('terraflow_user', JSON.stringify(userWithToken));
            
            // Verify storage
            const storedUser = localStorage.getItem('terraflow_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                console.log('   ✅ AuthContext flow simulation SUCCESS');
                console.log('   User role:', parsed.role);
                console.log('   Token present:', !!parsed.token);
                return true;
            } else {
                console.log('   ❌ AuthContext flow simulation FAILED - storage failed');
                return false;
            }
        } else {
            console.log('   ❌ AuthContext flow simulation FAILED - API failed');
            return false;
        }
    } catch (error) {
        console.log('   ❌ AuthContext flow simulation ERROR:', error.message);
        return false;
    }
}

// Test 4: Check current authentication state
function testCurrentAuthState() {
    console.log('\n4. Checking Current Auth State...');
    
    const userData = localStorage.getItem('terraflow_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            console.log('   ✅ User is currently logged in');
            console.log('   Role:', user.role);
            console.log('   Email:', user.email);
            console.log('   Token present:', !!user.token);
        } catch (error) {
            console.log('   ❌ Corrupted user data in localStorage');
        }
    } else {
        console.log('   ℹ️ No user currently logged in');
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting comprehensive login tests...');
    
    // Check current state first
    testCurrentAuthState();
    
    // Test direct API
    const apiResult = await testDirectAPI();
    
    if (apiResult) {
        // Test localStorage if API works
        testLocalStorage(apiResult);
        
        // Test full AuthContext flow
        await testAuthContextFlow();
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Check the results above to identify any issues.');
}

// Auto-run tests when script loads
runAllTests();
