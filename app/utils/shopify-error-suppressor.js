/**
 * Shopify Error Suppressor
 * 
 * This utility specifically handles and suppresses common Shopify App Bridge errors
 * that are not critical to app functionality but create console noise.
 */

export class ShopifyErrorSuppressor {
  constructor() {
    this.suppressedErrors = new Set();
    this.errorCounts = new Map();
    this.isActive = false;
  }

  /**
   * Activate error suppression for Shopify App Bridge
   */
  activate() {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.setupErrorSuppression();
    this.setupWarningSuppression();
    this.setupNetworkErrorSuppression();
  }

  /**
   * Setup error suppression for common Shopify errors
   */
  setupErrorSuppression() {
    if (typeof window === 'undefined') {
      return;
    }

    // Override console.error to suppress Shopify-specific errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Suppress WebSocket connection errors from Shopify App Bridge
      if (this.shouldSuppressWebSocketError(message)) {
        this.trackSuppressedError('websocket-connection', message);
        return;
      }
      
      // Suppress SendBeacon errors
      if (this.shouldSuppressSendBeaconError(message)) {
        this.trackSuppressedError('sendbeacon', message);
        return;
      }
      
      // Suppress App Bridge preload warnings
      if (this.shouldSuppressPreloadWarning(message)) {
        this.trackSuppressedError('preload-warning', message);
        return;
      }
      
      // Suppress App Bridge script loading errors
      if (this.shouldSuppressAppBridgeError(message)) {
        this.trackSuppressedError('app-bridge-error', message);
        return;
      }
      
      // For other errors, use original console.error
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Setup warning suppression
   */
  setupWarningSuppression() {
    if (typeof window === 'undefined') {
      return;
    }

    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Suppress WebSocket warnings
      if (this.shouldSuppressWebSocketWarning(message)) {
        this.trackSuppressedError('websocket-warning', message);
        return;
      }
      
      // Suppress App Bridge warnings
      if (this.shouldSuppressAppBridgeError(message)) {
        this.trackSuppressedError('app-bridge-warning', message);
        return;
      }
      
      // For other warnings, use original console.warn
      originalConsoleWarn.apply(console, args);
    };
  }

  /**
   * Setup network error suppression
   */
  setupNetworkErrorSuppression() {
    if (typeof window === 'undefined') {
      return;
    }

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message) {
        const message = event.reason.message;
        
        if (this.shouldSuppressWebSocketError(message) || 
            this.shouldSuppressSendBeaconError(message) ||
            this.shouldSuppressAppBridgeError(message)) {
          this.trackSuppressedError('unhandled-rejection', message);
          event.preventDefault();
        }
      }
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message) {
        const message = event.error.message;
        
        if (this.shouldSuppressWebSocketError(message) || 
            this.shouldSuppressSendBeaconError(message) ||
            this.shouldSuppressAppBridgeError(message)) {
          this.trackSuppressedError('uncaught-error', message);
          event.preventDefault();
        }
      }
    });
  }

  /**
   * Check if WebSocket error should be suppressed
   */
  shouldSuppressWebSocketError(message) {
    return message.includes('WebSocket connection') && 
           (message.includes('failed') || 
            message.includes('closed before the connection is established') ||
            message.includes('WebSocket is closed'));
  }

  /**
   * Check if SendBeacon error should be suppressed
   */
  shouldSuppressSendBeaconError(message) {
    return message.includes('SendBeacon failed');
  }

  /**
   * Check if preload warning should be suppressed
   */
  shouldSuppressPreloadWarning(message) {
    return message.includes('was preloaded using link preload but not used');
  }

  /**
   * Check if App Bridge error should be suppressed
   */
  shouldSuppressAppBridgeError(message) {
    return message.includes('App Bridge must be included as the first') ||
           message.includes('Do not use async, defer or type=module') ||
           message.includes('The script tag loading App Bridge has `defer`');
  }

  /**
   * Check if WebSocket warning should be suppressed
   */
  shouldSuppressWebSocketWarning(message) {
    return message.includes('WebSocket') && 
           (message.includes('failed') || message.includes('closed'));
  }

  /**
   * Track suppressed errors for debugging
   */
  trackSuppressedError(type, message) {
    const key = `${type}-${message}`;
    this.suppressedErrors.add(key);
    
    const count = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, count + 1);
    
    // Log suppression info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Error Suppressor] Suppressed ${type} error (${count + 1} total)`);
    }
  }

  /**
   * Get suppression statistics
   */
  getSuppressionStats() {
    return {
      totalSuppressed: this.suppressedErrors.size,
      errorCounts: Object.fromEntries(this.errorCounts),
      isActive: this.isActive
    };
  }

  /**
   * Deactivate error suppression
   */
  deactivate() {
    this.isActive = false;
    this.suppressedErrors.clear();
    this.errorCounts.clear();
  }
}

// Export singleton instance
export const shopifyErrorSuppressor = new ShopifyErrorSuppressor();
