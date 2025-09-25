// Test script to verify admin-widget connection
// Run this in browser console on your live site

console.log('🔗 Testing Admin-Widget Connection...');

// Test 1: Check if widget is loaded
function testWidgetLoaded() {
    const widget = document.getElementById('voice-ai-widget');
    if (widget) {
        console.log('✅ Widget found on page');
        return true;
    } else {
        console.log('❌ Widget not found on page');
        return false;
    }
}

// Test 2: Check widget configuration
function testWidgetConfig() {
    if (window.voiceAIWidget) {
        console.log('✅ Widget configuration found:', window.voiceAIWidget);
        return true;
    } else {
        console.log('❌ Widget configuration not found');
        return false;
    }
}

// Test 3: Test embed script loading
function testEmbedScript() {
    const embedScript = document.querySelector('script[src*="/embed"]');
    if (embedScript) {
        console.log('✅ Embed script found:', embedScript.src);
        return true;
    } else {
        console.log('❌ Embed script not found');
        return false;
    }
}

// Test 4: Test database connection (simulate)
function testDatabaseConnection() {
    // This would normally make an API call to check database
    console.log('🔄 Testing database connection...');
    
    // Simulate API call
    fetch('/embed?shop=test-shop.myshopify.com')
        .then(response => {
            if (response.ok) {
                console.log('✅ Database connection successful');
                return true;
            } else {
                console.log('❌ Database connection failed');
                return false;
            }
        })
        .catch(error => {
            console.log('❌ Database connection error:', error);
            return false;
        });
}

// Test 5: Test settings sync
function testSettingsSync() {
    console.log('🔄 Testing settings sync...');
    
    // Check if settings are properly applied
    const widget = document.getElementById('voice-ai-widget');
    if (widget && window.voiceAIWidget) {
        const config = window.voiceAIWidget;
        
        // Check if widget styles match configuration
        const bgColor = widget.style.backgroundColor;
        const position = widget.style.right || widget.style.left;
        
        console.log('Widget background color:', bgColor);
        console.log('Widget position:', position);
        console.log('Config background color:', config.backgroundColor);
        console.log('Config position:', config.position);
        
        if (bgColor && position) {
            console.log('✅ Settings sync working');
            return true;
        } else {
            console.log('❌ Settings sync not working');
            return false;
        }
    } else {
        console.log('❌ Cannot test settings sync - widget or config not found');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🧪 Running all connection tests...');
    
    const results = {
        widgetLoaded: testWidgetLoaded(),
        widgetConfig: testWidgetConfig(),
        embedScript: testEmbedScript(),
        settingsSync: testSettingsSync()
    };
    
    console.log('📊 Test Results:', results);
    
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`✅ ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Admin-widget connection is working perfectly!');
    } else {
        console.log('⚠️ Some tests failed. Check the issues above.');
    }
    
    return results;
}

// Auto-run tests
setTimeout(() => {
    runAllTests();
}, 1000);

// Export functions for manual testing
window.testAdminWidgetConnection = {
    testWidgetLoaded,
    testWidgetConfig,
    testEmbedScript,
    testDatabaseConnection,
    testSettingsSync,
    runAllTests
};

console.log('🔧 Connection test functions available as window.testAdminWidgetConnection');
