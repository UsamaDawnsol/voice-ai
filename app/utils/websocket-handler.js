/**
 * WebSocket Connection Handler
 * 
 * This utility handles WebSocket connection issues with Shopify's real-time features
 * and provides fallback mechanisms for when connections fail.
 */

export class WebSocketHandler {
  constructor() {
    this.connectionAttempts = 0;
    this.maxRetries = 2; // Reduced retries to prevent excessive attempts
    this.retryDelay = 2000; // Increased delay between retries
    this.isConnected = false;
    this.isInitialized = false;
    this.fallbackMode = false;
  }

  /**
   * Initialize WebSocket connection with retry logic
   */
  async initializeConnection() {
    // Prevent multiple initialization attempts
    if (this.isInitialized) {
      return;
    }
    
    this.isInitialized = true;
    
    try {
      // Check if we're in a Shopify environment
      if (typeof window === 'undefined') {
        console.log('Not in browser environment, skipping WebSocket connection');
        return;
      }
      
      // Check for Shopify context (it might not be available immediately)
      if (!window.Shopify) {
        console.log('Shopify context not available yet, will retry later');
        // Retry after a short delay
        setTimeout(() => this.initializeConnection(), 1000);
        return;
      }

      // Wait for App Bridge to be ready
      await this.waitForAppBridge();
      
      // Attempt to establish connection
      await this.establishConnection();
      
    } catch (error) {
      console.warn('WebSocket connection failed, using fallback mode:', error);
      this.handleConnectionFailure();
    }
  }

  /**
   * Wait for App Bridge to be ready
   */
  async waitForAppBridge() {
    return new Promise((resolve) => {
      const checkAppBridge = () => {
        if (window.Shopify && window.Shopify.AppBridge) {
          resolve();
        } else {
          setTimeout(checkAppBridge, 100);
        }
      };
      checkAppBridge();
    });
  }

  /**
   * Establish WebSocket connection
   */
  async establishConnection() {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        const wsUrl = this.getWebSocketUrl();
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          this.isConnected = true;
          this.connectionAttempts = 0;
          resolve();
        };

        ws.onerror = (error) => {
          console.warn('WebSocket connection error:', error);
          reject(error);
        };

        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          this.isConnected = false;
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.connectionAttempts < this.maxRetries) {
            setTimeout(() => {
              this.connectionAttempts++;
              this.establishConnection();
            }, this.retryDelay * this.connectionAttempts);
          }
        };

        // Store reference for cleanup
        this.ws = ws;
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get WebSocket URL from Shopify context
   */
  getWebSocketUrl() {
    // This would typically come from Shopify's context
    // For now, we'll use a fallback approach
    const shop = window.Shopify?.shop || 'unknown';
    return `wss://argus.shopifycloud.com/graphql?bucket_id=gid://shopify/Shop/${shop}`;
  }

  /**
   * Handle connection failure
   */
  handleConnectionFailure() {
    if (this.fallbackMode) {
      return; // Already in fallback mode
    }
    
    this.fallbackMode = true;
    console.log('WebSocket connection failed, using fallback mode');
    
    // Implement fallback mechanisms here
    // For example, use polling instead of WebSocket
    this.startPollingFallback();
  }

  /**
   * Start polling fallback when WebSocket fails
   */
  startPollingFallback() {
    console.log('Starting polling fallback for real-time updates');
    
    // Implement polling logic here
    // This would typically poll for updates at regular intervals
    setInterval(() => {
      // Poll for updates
      this.pollForUpdates();
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Poll for updates (fallback method)
   */
  async pollForUpdates() {
    try {
      // Implement polling logic
      // This would typically make API calls to check for updates
      console.log('Polling for updates...');
    } catch (error) {
      console.warn('Polling failed:', error);
    }
  }

  /**
   * Cleanup connections
   */
  cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

// Export singleton instance
export const websocketHandler = new WebSocketHandler();
