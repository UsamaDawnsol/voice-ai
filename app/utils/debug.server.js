import fs from 'fs';
import path from 'path';

/**
 * Debug utility for Shopify app development
 * Provides comprehensive logging and debugging capabilities
 */
class DebugLogger {
  constructor() {
    this.isDebugMode = process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
    this.logLevel = process.env.DEBUG_LOG_LEVEL || 'info';
    this.enableConsole = process.env.DEBUG_ENABLE_CONSOLE !== 'false';
    this.enableFileLogs = process.env.DEBUG_ENABLE_FILE_LOGS === 'true';
    this.logFile = process.env.DEBUG_LOG_FILE || './logs/debug.log';
    
    // Ensure logs directory exists
    if (this.enableFileLogs) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Log levels in order of severity
   */
  static LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  };

  /**
   * Check if a log level should be output
   */
  shouldLog(level) {
    if (!this.isDebugMode) return false;
    return DebugLogger.LOG_LEVELS[level] <= DebugLogger.LOG_LEVELS[this.logLevel];
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Write to console if enabled
   */
  writeToConsole(level, formattedMessage) {
    if (!this.enableConsole) return;
    
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[35m', // Magenta
      trace: '\x1b[90m'  // Gray
    };
    
    const reset = '\x1b[0m';
    console.log(`${colors[level] || ''}${formattedMessage}${reset}`);
  }

  /**
   * Write to file if enabled
   */
  writeToFile(formattedMessage) {
    if (!this.enableFileLogs) return;
    
    try {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to debug log file:', error.message);
    }
  }

  /**
   * Main logging method
   */
  log(level, message, context = {}) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, message, context);
    this.writeToConsole(level, formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Convenience methods for different log levels
   */
  error(message, context = {}) {
    this.log('error', message, context);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  debug(message, context = {}) {
    this.log('debug', message, context);
  }

  trace(message, context = {}) {
    this.log('trace', message, context);
  }

  /**
   * Log Shopify API requests
   */
  logApiRequest(method, url, headers = {}, body = null) {
    this.debug('Shopify API Request', {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      body: body ? this.sanitizeBody(body) : null
    });
  }

  /**
   * Log Shopify API responses
   */
  logApiResponse(status, headers = {}, body = null) {
    this.debug('Shopify API Response', {
      status,
      headers: this.sanitizeHeaders(headers),
      body: body ? this.sanitizeBody(body) : null
    });
  }

  /**
   * Log authentication events
   */
  logAuth(event, shop, context = {}) {
    this.info(`Auth Event: ${event}`, {
      shop,
      ...context
    });
  }

  /**
   * Log webhook events
   */
  logWebhook(topic, shop, payload = {}) {
    this.info(`Webhook: ${topic}`, {
      shop,
      payload: this.sanitizePayload(payload)
    });
  }

  /**
   * Log database operations
   */
  logDatabase(operation, table, context = {}) {
    this.debug(`Database ${operation}`, {
      table,
      ...context
    });
  }

  /**
   * Sanitize sensitive data from logs
   */
  sanitizeHeaders(headers) {
    const sensitive = ['authorization', 'x-shopify-hmac-sha256', 'x-shopify-shop-domain'];
    const sanitized = { ...headers };
    
    sensitive.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  sanitizeBody(body) {
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return this.sanitizePayload(parsed);
      } catch {
        return body;
      }
    }
    return this.sanitizePayload(body);
  }

  sanitizePayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    
    const sensitive = ['password', 'token', 'secret', 'key', 'hmac', 'signature'];
    const sanitized = { ...payload };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizePayload(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  /**
   * Get debug information about the app
   */
  getDebugInfo() {
    return {
      isDebugMode: this.isDebugMode,
      logLevel: this.logLevel,
      enableConsole: this.enableConsole,
      enableFileLogs: this.enableFileLogs,
      logFile: this.logFile,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

export default debugLogger;

/**
 * Convenience functions for common debug operations
 */
export const logApiCall = (method, url, requestData, responseData) => {
  debugLogger.logApiRequest(method, url, requestData.headers, requestData.body);
  debugLogger.logApiResponse(responseData.status, responseData.headers, responseData.body);
};

export const logAuth = (event, shop, context) => {
  debugLogger.logAuth(event, shop, context);
};

export const logWebhook = (topic, shop, payload) => {
  debugLogger.logWebhook(topic, shop, payload);
};

export const logDatabase = (operation, table, context) => {
  debugLogger.logDatabase(operation, table, context);
};

export const getDebugInfo = () => {
  return debugLogger.getDebugInfo();
};

