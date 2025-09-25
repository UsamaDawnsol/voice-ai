import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import debugLogger from "../utils/debug.server";
import fs from 'fs';
import path from 'path';

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    debugLogger.info('Debug logs requested', {
      shop: session.shop,
      user: session.id
    });

    const url = new URL(request.url);
    const lines = parseInt(url.searchParams.get('lines') || '100');
    const level = url.searchParams.get('level') || 'all';
    
    const logFile = process.env.DEBUG_LOG_FILE || './logs/debug.log';
    
    let logs = [];
    
    // Check if log file exists
    if (fs.existsSync(logFile)) {
      try {
        const logContent = fs.readFileSync(logFile, 'utf8');
        const allLines = logContent.split('\n').filter(line => line.trim());
        
        // Filter by level if specified
        let filteredLines = allLines;
        if (level !== 'all') {
          filteredLines = allLines.filter(line => 
            line.includes(`[${level.toUpperCase()}]`)
          );
        }
        
        // Get last N lines
        logs = filteredLines.slice(-lines);
      } catch (error) {
        debugLogger.error('Failed to read log file', {
          error: error.message,
          logFile
        });
      }
    }

    const response = {
      shop: session.shop,
      timestamp: new Date().toISOString(),
      logFile: logFile,
      fileExists: fs.existsSync(logFile),
      requestedLines: lines,
      requestedLevel: level,
      actualLines: logs.length,
      logs: logs,
      debugInfo: debugLogger.getDebugInfo()
    };

    debugLogger.debug('Debug logs retrieved', {
      shop: session.shop,
      logCount: logs.length,
      fileExists: response.fileExists
    });

    return json(response, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    debugLogger.error('Failed to get debug logs', {
      error: error.message,
      stack: error.stack
    });

    return json({
      error: "Failed to retrieve debug logs",
      message: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get('action');
    
    debugLogger.info('Debug logs action requested', {
      shop: session.shop,
      user: session.id,
      action
    });

    const logFile = process.env.DEBUG_LOG_FILE || './logs/debug.log';
    
    if (action === 'clear') {
      // Clear log file
      if (fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, '');
        debugLogger.info('Debug logs cleared', {
          shop: session.shop,
          logFile
        });
      }
      
      return json({
        success: true,
        message: 'Logs cleared successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'download') {
      // Return log file content for download
      if (fs.existsSync(logFile)) {
        const logContent = fs.readFileSync(logFile, 'utf8');
        
        return new Response(logContent, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="debug-logs-${session.shop}-${Date.now()}.log"`,
            'Cache-Control': 'no-cache'
          }
        });
      } else {
        return json({
          error: 'Log file not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
    }
    
    return json({
      error: 'Invalid action',
      timestamp: new Date().toISOString()
    }, { status: 400 });
    
  } catch (error) {
    debugLogger.error('Debug logs action failed', {
      error: error.message,
      stack: error.stack
    });

    return json({
      error: "Failed to perform debug logs action",
      message: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

