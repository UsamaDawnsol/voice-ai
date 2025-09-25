// Debug script to test embed settings connection
// Run this in browser console on your live site

console.log('🔗 Debugging Embed Settings Connection...');

// Test 1: Check if widget is loaded
function checkWidgetLoaded() {
    const widget = document.getElementById('voice-ai-widget');
    if (widget) {
        console.log('✅ Widget found on page');
        console.log('Widget styles:', {
            backgroundColor: widget.style.backgroundColor,
            color: widget.style.color,
            position: widget.style.right || widget.style.left
        });
        return true;
    } else {
        console.log('❌ Widget not found on page');
        return false;
    }
}

// Test 2: Check widget configuration
function checkWidgetConfig() {
    if (window.voiceAIWidget) {
        console.log('✅ Widget configuration found:', window.voiceAIWidget);
        return true;
    } else {
        console.log('❌ Widget configuration not found');
        return false;
    }
}

// Test 3: Test embed script loading
function checkEmbedScript() {
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
    console.log('🔄 Testing database connection...');
    
    // Extract shop from current URL or embed script
    const embedScript = document.querySelector('script[src*="/embed"]');
    let shop = null;
    
    if (embedScript) {
        const url = new URL(embedScript.src);
        shop = url.searchParams.get('shop');
    }
    
    if (!shop) {
        shop = window.location.hostname;
    }
    
    console.log('Shop:', shop);
    
    // Test debug endpoint
    fetch(`/debug-settings?shop=${shop}`)
        .then(response => response.json())
        .then(data => {
            console.log('✅ Database connection successful:', data);
            return true;
        })
        .catch(error => {
            console.log('❌ Database connection failed:', error);
            return false;
        });
}

// Test 5: Test settings sync
function testSettingsSync() {
    console.log('🔄 Testing settings sync...');
    
    const widget = document.getElementById('voice-ai-widget');
    if (widget && window.voiceAIWidget) {
        const config = window.voiceAIWidget;
        
        // Check if widget styles match configuration
        const bgColor = widget.style.backgroundColor;
        const iconColor = widget.style.color;
        const position = widget.style.right || widget.style.left;
        
        console.log('Widget styles:', {
            backgroundColor: bgColor,
            color: iconColor,
            position: position
        });
        
        console.log('Config:', {
            backgroundColor: config.backgroundColor,
            iconColor: config.iconColor,
            position: config.position
        });
        
        // Check if styles match config
        const bgMatch = bgColor === config.backgroundColor || 
                       bgColor === `rgb(${hexToRgb(config.backgroundColor).join(', ')})`;
        const colorMatch = iconColor === config.iconColor || 
                          iconColor === `rgb(${hexToRgb(config.iconColor).join(', ')})`;
        
        if (bgMatch && colorMatch) {
            console.log('✅ Settings sync working - Widget styles match configuration');
            return true;
        } else {
            console.log('❌ Settings sync not working - Widget styles do not match configuration');
            return false;
        }
    } else {
        console.log('❌ Cannot test settings sync - widget or config not found');
        return false;
    }
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

// Test 6: Force widget refresh
function forceWidgetRefresh() {
    console.log('🔄 Forcing widget refresh...');
    
    // Remove existing widget
    const existingWidget = document.getElementById('voice-ai-widget');
    const existingModal = document.getElementById('voice-ai-modal');
    
    if (existingWidget) {
        existingWidget.remove();
        console.log('✅ Existing widget removed');
    }
    
    if (existingModal) {
        existingModal.remove();
        console.log('✅ Existing modal removed');
    }
    
    // Clear initialization flag
    if (window.voiceAIWidgetInitialized) {
        delete window.voiceAIWidgetInitialized;
        console.log('✅ Initialization flag cleared');
    }
    
    // Reload embed script
    const embedScript = document.querySelector('script[src*="/embed"]');
    if (embedScript) {
        const newScript = document.createElement('script');
        newScript.src = embedScript.src + '&t=' + Date.now();
        document.head.appendChild(newScript);
        document.head.removeChild(embedScript);
        console.log('✅ Embed script reloaded');
    }
    
    console.log('✅ Widget refresh completed');
}

// Run all tests
function runAllTests() {
    console.log('🧪 Running all embed connection tests...');
    
    const results = {
        widgetLoaded: checkWidgetLoaded(),
        widgetConfig: checkWidgetConfig(),
        embedScript: checkEmbedScript(),
        settingsSync: testSettingsSync()
    };
    
    console.log('📊 Test Results:', results);
    
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`✅ ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Embed settings connection is working perfectly!');
    } else {
        console.log('⚠️ Some tests failed. Check the issues above.');
        console.log('💡 Try running forceWidgetRefresh() to fix the widget');
    }
    
    return results;
}

// Auto-run tests
setTimeout(() => {
    runAllTests();
}, 1000);

// Export functions for manual testing
window.debugEmbedConnection = {
    checkWidgetLoaded,
    checkWidgetConfig,
    checkEmbedScript,
    testDatabaseConnection,
    testSettingsSync,
    forceWidgetRefresh,
    runAllTests
};

console.log('🔧 Debug functions available as window.debugEmbedConnection');
console.log('💡 Run window.debugEmbedConnection.runAllTests() to test again');
console.log('💡 Run window.debugEmbedConnection.forceWidgetRefresh() to refresh widget');
