import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import debugLogger, { getDebugInfo } from "../utils/debug.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    debugLogger.info('Debug app state requested', {
      shop: session.shop,
      user: session.id
    });

    // Get comprehensive app state
    const appState = {
      // Debug configuration
      debug: getDebugInfo(),
      
      // Session information
      session: {
        shop: session.shop,
        id: session.id,
        isOnline: session.isOnline,
        expires: session.expires,
        accessToken: session.accessToken ? '[PRESENT]' : '[MISSING]',
        scope: session.scope
      },
      
      // Environment information
      environment: {
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.SHOPIFY_APP_URL,
        apiKey: process.env.SHOPIFY_API_KEY ? '[PRESENT]' : '[MISSING]',
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        scopes: process.env.SCOPES?.split(',') || [],
        databaseUrl: process.env.DATABASE_URL ? '[PRESENT]' : '[MISSING]',
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasPinecone: !!process.env.PINECONE_API_KEY,
        hasRedis: !!process.env.REDIS_URL
      },
      
      // Database state
      database: await getDatabaseState(session.shop),
      
      // Shopify API connectivity
      shopifyApi: await testShopifyApi(admin),
      
      // Widget settings
      widgetSettings: await getWidgetSettings(session.shop),
      
      // Recent activity
      recentActivity: await getRecentActivity(session.shop),
      
      // System health
      systemHealth: await getSystemHealth(),
      
      timestamp: new Date().toISOString()
    };

    debugLogger.debug('App state retrieved successfully', {
      shop: session.shop,
      hasWidgetSettings: !!appState.widgetSettings,
      databaseConnected: appState.database.connected
    });

    return json(appState, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    debugLogger.error('Failed to get app state', {
      error: error.message,
      stack: error.stack
    });

    return json({
      error: "Failed to retrieve app state",
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

/**
 * Get database connection state and basic info
 */
async function getDatabaseState(shop) {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    // Get widget settings count
    const widgetCount = await db.widgetSettings.count({
      where: { shop }
    });
    
    // Get session count
    const sessionCount = await db.session.count({
      where: { shop }
    });
    
    return {
      connected: true,
      widgetSettingsCount: widgetCount,
      sessionCount: sessionCount,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    debugLogger.error('Database connection failed', {
      error: error.message,
      shop
    });
    
    return {
      connected: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Test Shopify API connectivity
 */
async function testShopifyApi(admin) {
  try {
    const response = await admin.graphql(`
      query {
        shop {
          name
          id
          myshopifyDomain
        }
      }
    `);
    
    const data = await response.json();
    
    return {
      connected: true,
      shop: data.data?.shop || null,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    debugLogger.error('Shopify API test failed', {
      error: error.message
    });
    
    return {
      connected: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Get widget settings for the shop
 */
async function getWidgetSettings(shop) {
  try {
    const settings = await db.widgetSettings.findUnique({
      where: { shop }
    });
    
    return {
      exists: !!settings,
      settings: settings ? {
        ...settings,
        // Don't expose sensitive data
        apiKey: settings.apiKey ? '[PRESENT]' : '[MISSING]'
      } : null,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    debugLogger.error('Failed to get widget settings', {
      error: error.message,
      shop
    });
    
    return {
      exists: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Get recent activity (sessions, etc.)
 */
async function getRecentActivity(shop) {
  try {
    const recentSessions = await db.session.findMany({
      where: { shop },
      orderBy: { expires: 'desc' },
      take: 5,
      select: {
        id: true,
        isOnline: true,
        expires: true,
        scope: true
      }
    });
    
    return {
      recentSessions: recentSessions.length,
      sessions: recentSessions,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    debugLogger.error('Failed to get recent activity', {
      error: error.message,
      shop
    });
    
    return {
      recentSessions: 0,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Get system health information
 */
async function getSystemHealth() {
  const health = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    lastChecked: new Date().toISOString()
  };
  
  // Add external service health checks
  try {
    // Test OpenAI API if configured
    if (process.env.OPENAI_API_KEY) {
      health.openai = { configured: true, status: 'unknown' };
    }
    
    // Test Pinecone if configured
    if (process.env.PINECONE_API_KEY) {
      health.pinecone = { configured: true, status: 'unknown' };
    }
    
    // Test Redis if configured
    if (process.env.REDIS_URL) {
      health.redis = { configured: true, status: 'unknown' };
    }
  } catch (error) {
    health.externalServicesError = error.message;
  }
  
  return health;
}

