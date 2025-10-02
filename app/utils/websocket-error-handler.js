/**
 * WebSocket Error Handler
 * 
 * This utility helps reduce WebSocket connection errors and warnings
 * by providing better error handling and fallback mechanisms.
 */

export class WebSocketErrorHandler {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 5;
    this.errorSuppression = new Map();
    this.isSuppressing = false;
  }

  /**
   * Handle WebSocket connection errors gracefully
   */
  handleWebSocketError(error, context = 'unknown') {
    const errorKey = `${context}-${error.message}`;
    const now = Date.now();
    
    // Check if we should suppress this error
    if (this.shouldSuppressError(errorKey, now)) {
      return;
    }

    // Log the error with context
    console.warn(`WebSocket error in ${context}:`, error.message);
    
    // Track error count
    this.errorCount++;
    
    // If too many errors, suppress further errors temporarily
    if (this.errorCount >= this.maxErrors) {
      this.isSuppressing = true;
      console.warn('Too many WebSocket errors, suppressing further errors for 30 seconds');
      
      // Reset suppression after 30 seconds
      setTimeout(() => {
        this.isSuppressing = false;
        this.errorCount = 0;
        this.errorSuppression.clear();
      }, 30000);
    }
  }

  /**
   * Check if we should suppress this error
   */
  shouldSuppressError(errorKey, now) {
    if (this.isSuppressing) {
      return true;
    }

    const lastSeen = this.errorSuppression.get(errorKey);
    if (!lastSeen) {
      this.errorSuppression.set(errorKey, now);
      return false;
    }

    // Suppress if seen within last 10 seconds
    if (now - lastSeen < 10000) {
      return true;
    }

    // Update timestamp
    this.errorSuppression.set(errorKey, now);
    return false;
  }

  /**
   * Handle SendBeacon errors (common in Shopify apps)
   */
  handleSendBeaconError(error) {
    // SendBeacon errors are often not critical and can be safely ignored
    console.warn('SendBeacon error (non-critical):', error.message);
  }

  /**
   * Setup global error handlers for WebSocket issues
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') {
      return;
    }

    // Store original console methods
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;

    // Override console.error to catch WebSocket errors
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Handle WebSocket connection errors (Shopify App Bridge)
      if (message.includes('WebSocket connection') && 
          (message.includes('failed') || message.includes('closed before the connection is established'))) {
        this.handleWebSocketError(new Error(message), 'shopify-app-bridge');
        return; // Don't log to console to reduce noise
      }
      
      // Handle SendBeacon errors
      if (message.includes('SendBeacon failed')) {
        this.handleSendBeaconError(new Error(message));
        return; // Don't log to console to reduce noise
      }
      
      // Handle App Bridge preload warnings
      if (message.includes('was preloaded using link preload but not used')) {
        // These are non-critical warnings, suppress them
        return;
      }
      
      // For other errors, use original console.error
      this.originalConsoleError.apply(console, args);
    };

    // Override console.warn to catch WebSocket warnings
    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Handle WebSocket warnings
      if (message.includes('WebSocket') || message.includes('SendBeacon')) {
        this.handleWebSocketError(new Error(message), 'console-warn');
        return; // Don't log to console to reduce noise
      }
      
      // For other warnings, use original console.warn
      this.originalConsoleWarn.apply(console, args);
    };

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message) {
        const message = event.reason.message;
        if (message.includes('WebSocket') || message.includes('SendBeacon')) {
          this.handleWebSocketError(event.reason, 'unhandled-rejection');
          event.preventDefault(); // Prevent default error handling
        }
      }
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message) {
        const message = event.error.message;
        if (message.includes('WebSocket') || message.includes('SendBeacon')) {
          this.handleWebSocketError(event.error, 'uncaught-error');
          event.preventDefault(); // Prevent default error handling
        }
      }
    });
  }

  /**
   * Cleanup error handlers
   */
  cleanup() {
    // Restore original console methods if we overrode them
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
    }
  }
}

// Export singleton instance
export const websocketErrorHandler = new WebSocketErrorHandler();
