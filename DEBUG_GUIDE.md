# Debug Mode Guide for Voice AI Shopify App

This guide explains how to use the comprehensive debug mode implemented in your Shopify app according to Shopify's best practices.

## Overview

The debug mode provides comprehensive logging, monitoring, and debugging capabilities for your Voice AI Shopify app. It includes:

- **Environment-based configuration**
- **Comprehensive logging system**
- **Debug dashboard with real-time monitoring**
- **API testing and connectivity checks**
- **System health monitoring**
- **Log management and analysis**

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Debug Configuration
DEBUG_MODE=true
DEBUG_LOG_LEVEL=debug
DEBUG_ENABLE_CONSOLE=true
DEBUG_ENABLE_FILE_LOGS=true
DEBUG_LOG_FILE=./logs/debug.log
```

### Shopify App Configuration

The `shopify.app.toml` file includes debug configuration:

```toml
[dev]
# Debug mode configuration
debug_mode = true
log_level = "debug"
enable_console_logs = true
```

## Debug Features

### 1. Debug Dashboard

Access the debug dashboard at `/debug` in your app. It provides:

- **Debug configuration status**
- **Quick access to all debug tools**
- **System information**
- **Real-time status indicators**

### 2. App State Inspector

**URL:** `/debug/app-state`

Provides comprehensive app state information:

- **Session information** (sanitized)
- **Environment configuration**
- **Database connectivity status**
- **Shopify API connectivity**
- **Widget settings status**
- **Recent activity logs**
- **System health metrics**

### 3. API Testing

**URL:** `/debug/api-test`

Tests Shopify API connectivity and permissions:

- **Shop information access**
- **Products API access**
- **Orders API access** (if scoped)
- **Themes API access**
- **App installation status**
- **Success rate calculation**

### 4. Debug Logs

**URL:** `/debug/logs`

Manages debug logs:

- **View recent logs** (configurable lines)
- **Filter by log level**
- **Clear logs**
- **Download log files**
- **Real-time log monitoring**

### 5. Widget Settings Debug

**URL:** `/debug/widget`

Debug widget-specific settings:

- **Widget configuration status**
- **Settings validation**
- **Embed URL generation**
- **Active status checking**

## Log Levels

The debug system supports multiple log levels:

- **ERROR** (0): Critical errors that need immediate attention
- **WARN** (1): Warning messages for potential issues
- **INFO** (2): General information about app operations
- **DEBUG** (3): Detailed debugging information
- **TRACE** (4): Very detailed tracing information

## Usage Examples

### Basic Debug Logging

```javascript
import debugLogger from "../utils/debug.server";

// Log different levels
debugLogger.error("Database connection failed", { error: error.message });
debugLogger.warn("API rate limit approaching", { remaining: 10 });
debugLogger.info("User authenticated", { shop: session.shop });
debugLogger.debug("Processing webhook", { topic, shop });
debugLogger.trace("Detailed operation step", { step: "validation" });
```

### API Request/Response Logging

```javascript
import { logApiCall } from "../utils/debug.server";

// Log API calls
logApiCall('POST', '/admin/api/2025-01/products.json', requestData, responseData);
```

### Authentication Logging

```javascript
import { logAuth } from "../utils/debug.server";

// Log authentication events
logAuth('app_installed', session.shop, { sessionId: session.id });
logAuth('token_refreshed', session.shop, { expires: session.expires });
```

### Webhook Logging

```javascript
import { logWebhook } from "../utils/debug.server";

// Log webhook events
logWebhook('app/uninstalled', session.shop, payload);
logWebhook('orders/create', session.shop, orderData);
```

### Database Operation Logging

```javascript
import { logDatabase } from "../utils/debug.server";

// Log database operations
logDatabase('create', 'widgetSettings', { shop: session.shop });
logDatabase('update', 'sessions', { sessionId: session.id });
```

## Debug Routes

All debug routes are protected by Shopify authentication and only accessible to authenticated users.

### Available Routes

- `/debug` - Main debug dashboard
- `/debug/app-state` - Comprehensive app state
- `/debug/api-test` - API connectivity tests
- `/debug/logs` - Log management
- `/debug/widget` - Widget settings debug
- `/debug-settings` - Settings debug (existing)

## Security Considerations

### Data Sanitization

The debug system automatically sanitizes sensitive data:

- **API keys and secrets** are redacted
- **Authentication tokens** are marked as present/missing
- **Passwords and sensitive fields** are hidden
- **HMAC signatures** are redacted

### Access Control

- All debug routes require Shopify authentication
- Only authenticated app users can access debug features
- Debug mode can be disabled in production

## Production Considerations

### Disabling Debug Mode

For production deployment:

1. Set `DEBUG_MODE=false` in environment variables
2. Set `NODE_ENV=production`
3. Consider removing debug routes in production builds

### Log Management

- Log files can grow large over time
- Implement log rotation in production
- Consider using external logging services
- Monitor disk space usage

## Troubleshooting

### Common Issues

1. **Debug logs not appearing**
   - Check `DEBUG_MODE=true` in environment
   - Verify log file permissions
   - Ensure logs directory exists

2. **API tests failing**
   - Check app scopes in `shopify.app.toml`
   - Verify API credentials
   - Check network connectivity

3. **Database connection issues**
   - Verify `DATABASE_URL` is correct
   - Check database server status
   - Review connection permissions

### Debug Mode Not Working

1. Check environment variables:
   ```bash
   echo $DEBUG_MODE
   echo $DEBUG_LOG_LEVEL
   ```

2. Verify log file permissions:
   ```bash
   ls -la logs/debug.log
   ```

3. Check console output for debug messages

## Best Practices

### Development

- Use debug mode during development
- Set appropriate log levels
- Monitor debug logs regularly
- Use API tests to verify connectivity

### Testing

- Run API tests before deployment
- Check app state after configuration changes
- Monitor logs during testing
- Verify widget settings

### Production

- Disable debug mode in production
- Monitor system health
- Set up log rotation
- Use external monitoring tools

## Integration with Shopify CLI

The debug mode works seamlessly with Shopify CLI:

```bash
# Start development with debug mode
npm run dev

# View debug logs in terminal
# Debug logs will appear in console and file

# Test webhooks with debug logging
shopify app generate webhook
```

## Monitoring and Alerts

Consider setting up monitoring for:

- **Error log frequency**
- **API test failures**
- **Database connection issues**
- **System resource usage**
- **Log file size growth**

## Support

For issues with the debug system:

1. Check the debug dashboard for system status
2. Review debug logs for error messages
3. Run API tests to verify connectivity
4. Check environment configuration
5. Review this documentation

The debug mode provides comprehensive visibility into your Shopify app's operation, making development, testing, and troubleshooting much more efficient.

