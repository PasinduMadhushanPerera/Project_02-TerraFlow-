const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
    console.log('=== Testing Login API ===');
    
    const testCases = [
        { email: 'admin@terraflow.com', password: 'admin123', role: 'admin' },
        { email: 'supplier@test.com', password: 'supplier123', role: 'supplier' },
        { email: 'testcustomer@test.com', password: 'customer123', role: 'customer' }
    ];
    
    for (const testCase of testCases) {
        console.log(`\nTesting ${testCase.role} login...`);
        console.log(`Email: ${testCase.email}`);
        
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: testCase.email, 
                    password: testCase.password 
                }),
            });
            
            console.log(`Response status: ${response.status}`);
            console.log(`Response ok: ${response.ok}`);
            
            const result = await response.json();
            console.log(`Response:`, JSON.stringify(result, null, 2));
            
            if (response.ok && result.success) {
                console.log(`✅ ${testCase.role} login SUCCESS`);
                console.log(`   - User ID: ${result.user.id}`);
                console.log(`   - User Role: ${result.user.role}`);
                console.log(`   - User Name: ${result.user.full_name}`);
                console.log(`   - Token: ${result.token ? 'Present' : 'Missing'}`);
            } else {
                console.log(`❌ ${testCase.role} login FAILED: ${result.message}`);
            }
            
        } catch (error) {
            console.error(`❌ ${testCase.role} login ERROR:`, error.message);
        }
    }
}

// Test invalid login
async function testInvalidLogin() {
    console.log('\n=== Testing Invalid Login ===');
    
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: 'invalid@test.com', 
                password: 'wrongpassword' 
            }),
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            console.log('✅ Invalid login correctly rejected');
            console.log(`   Message: ${result.message}`);
        } else {
            console.log('❌ Invalid login was accepted (this should not happen)');
        }
        
    } catch (error) {
        console.error('❌ Invalid login test ERROR:', error.message);
    }
}

// Run tests
async function runAllTests() {
    try {
        await testLogin();
        await testInvalidLogin();
        console.log('\n=== Test Complete ===');
    } catch (error) {
        console.error('Test suite error:', error);
    }
}

runAllTests();
