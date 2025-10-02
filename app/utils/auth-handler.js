/**
 * Authentication Handler
 * 
 * This utility handles authentication issues and provides better error handling
 * for Shopify app authentication flows.
 */

export class AuthHandler {
  constructor() {
    this.isAuthenticating = false;
    this.authRetries = 0;
    this.maxRetries = 2; // Reduced to prevent excessive retries
    this.lastAuthAttempt = 0;
    this.authCooldown = 30000; // 30 seconds cooldown
    this.errorSuppression = new Map(); // Track suppressed errors
    this.sessionCache = new Map(); // Cache session info
  }

  /**
   * Handle authentication errors gracefully
   */
  handleAuthError(error, request) {
    const errorKey = this.getErrorKey(error);
    const now = Date.now();
    
    // Check if we should suppress this error
    if (this.shouldSuppressError(errorKey, now)) {
      return this.handleSuppressedError(error);
    }
    
    // Log error only if not suppressed
    console.warn('Authentication error:', error);
    
    // Check if it's a session token issue
    if (error.status === 302 && error.headers?.get('Location')?.includes('session-token')) {
      console.log('Session token redirect detected, handling gracefully');
      return this.handleSessionTokenRedirect(error);
    }
    
    // Check if it's a CSP or frame issue
    if (error.message?.includes('frame-ancestors') || error.message?.includes('X-Frame-Options')) {
      console.log('Frame/CSP issue detected, attempting to resolve');
      return this.handleFrameIssue(error);
    }
    
    // Generic error handling
    return this.handleGenericError(error);
  }

  /**
   * Handle session token redirects
   */
  handleSessionTokenRedirect(error) {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastAuthAttempt < this.authCooldown) {
      console.log('Authentication in cooldown period, redirecting to auth');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/auth',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Don't retry if we've already tried too many times
    if (this.authRetries >= this.maxRetries) {
      console.log('Max authentication retries exceeded, redirecting to auth');
      // Reset retry counter after a delay
      setTimeout(() => {
        this.authRetries = 0;
        this.lastAuthAttempt = 0;
      }, 30000); // Reset after 30 seconds
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/auth',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    this.authRetries++;
    this.lastAuthAttempt = now;
    console.log(`Session token redirect, retry ${this.authRetries}/${this.maxRetries}`);
    
    // Return a response that will trigger a page reload
    return new Response(null, {
      status: 302,
      headers: {
        'Location': error.headers?.get('Location') || '/auth',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  /**
   * Handle frame/CSP issues
   */
  handleFrameIssue(error) {
    console.log('Frame/CSP issue detected, attempting to resolve');
    
    // Try to open in a new window instead of iframe
    if (typeof window !== 'undefined') {
      const authUrl = this.getAuthUrl();
      if (authUrl) {
        window.open(authUrl, '_blank');
        return this.createAuthErrorResponse('Authentication required. Please complete authentication in the new window.');
      }
    }
    
    return this.createAuthErrorResponse('Authentication frame blocked. Please try again.');
  }

  /**
   * Handle generic authentication errors
   */
  handleGenericError(error) {
    console.error('Generic authentication error:', error);
    return this.createAuthErrorResponse('Authentication failed. Please try again.');
  }

  /**
   * Get authentication URL
   */
  getAuthUrl() {
    if (typeof window === 'undefined') return null;
    
    const currentUrl = new URL(window.location.href);
    const shop = currentUrl.searchParams.get('shop');
    const host = currentUrl.searchParams.get('host');
    
    if (shop && host) {
      return `/auth?shop=${shop}&host=${host}`;
    }
    
    return '/auth';
  }

  /**
   * Create authentication error response
   */
  createAuthErrorResponse(message) {
    return new Response(JSON.stringify({
      error: 'AuthenticationError',
      message: message,
      retry: this.authRetries < this.maxRetries
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }

  /**
   * Reset authentication state
   */
  reset() {
    this.isAuthenticating = false;
    this.authRetries = 0;
  }

  /**
   * Check if authentication is in progress
   */
  isAuthInProgress() {
    return this.isAuthenticating;
  }

  /**
   * Set authentication state
   */
  setAuthInProgress(inProgress) {
    this.isAuthenticating = inProgress;
  }

  /**
   * Get error key for suppression tracking
   */
  getErrorKey(error) {
    const status = error.status || 'unknown';
    const message = error.message || 'unknown';
    const location = error.headers?.get('Location') || 'unknown';
    return `${status}-${message.substring(0, 50)}-${location.substring(0, 50)}`;
  }

  /**
   * Check if error should be suppressed
   */
  shouldSuppressError(errorKey, now) {
    const lastSeen = this.errorSuppression.get(errorKey);
    if (!lastSeen) {
      this.errorSuppression.set(errorKey, now);
      return false;
    }
    
    // Suppress if seen within last 30 seconds
    if (now - lastSeen < 30000) {
      return true;
    }
    
    // Update timestamp
    this.errorSuppression.set(errorKey, now);
    return false;
  }

  /**
   * Handle suppressed errors (silent handling)
   */
  handleSuppressedError(error) {
    // Silent handling - just redirect without logging
    if (error.status === 302 && error.headers?.get('Location')?.includes('session-token')) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': error.headers?.get('Location') || '/auth',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // For other errors, just redirect to auth
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/auth',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }

  /**
   * Clean up old suppression entries
   */
  cleanupSuppression() {
    const now = Date.now();
    for (const [key, timestamp] of this.errorSuppression.entries()) {
      if (now - timestamp > 60000) { // Remove entries older than 1 minute
        this.errorSuppression.delete(key);
      }
    }
  }
}

// Export singleton instance
export const authHandler = new AuthHandler();

// Clean up suppression entries every 5 minutes
setInterval(() => {
  authHandler.cleanupSuppression();
}, 300000);
