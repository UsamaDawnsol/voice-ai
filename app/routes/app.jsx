import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { Frame, Navigation } from "@shopify/polaris";
import { HomeIcon, ChatIcon, ChartLineIcon, CreditCardIcon, SettingsIcon, StarIcon } from "@shopify/polaris-icons";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { websocketHandler } from "../utils/websocket-handler";
import { authHandler } from "../utils/auth-handler";
import { websocketErrorHandler } from "../utils/websocket-error-handler";
import { shopifyErrorSuppressor } from "../utils/shopify-error-suppressor";
import ConnectionStatus from "../components/ConnectionStatus";
import { redirect } from "@remix-run/node";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Check if session is valid
    if (!session || !session.shop) {
      console.log('Invalid session, redirecting to auth');
      return redirect('/auth');
    }
    
    return { apiKey: process.env.SHOPIFY_API_KEY || "" };
  } catch (error) {
    // Only log if it's not a common session token issue
    if (!(error.status === 302 && error.headers?.get('Location')?.includes('session-token'))) {
      console.error('Authentication error in app loader:', error);
    }
    
    // Check if it's a session token redirect
    if (error.status === 302 && error.headers?.get('Location')?.includes('session-token')) {
      // Let the auth handler deal with it silently
      return authHandler.handleAuthError(error, request);
    }
    
    // For other authentication errors, redirect to auth
    return redirect('/auth');
  }
};

export default function App() {
  const { apiKey } = useLoaderData();

  // Initialize WebSocket connection with error handling
  useEffect(() => {
    // Setup aggressive error suppression for Shopify App Bridge
    shopifyErrorSuppressor.activate();
    
    // Setup global error handlers
    websocketErrorHandler.setupGlobalErrorHandlers();

    const initializeConnection = async () => {
      try {
        await websocketHandler.initializeConnection();
      } catch (error) {
        console.warn('WebSocket initialization failed, using fallback mode:', error);
        websocketErrorHandler.handleWebSocketError(error, 'initialization');
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      websocketHandler.cleanup();
      websocketErrorHandler.cleanup();
      shopifyErrorSuppressor.deactivate();
    };
  }, []);

  // Navigation items following Shopify design guidelines
  const navigationItems = [
    {
      label: "Home",
      icon: HomeIcon,
      url: "/app",
      exactMatch: true,
    },
    {
      label: "Welcome",
      icon: StarIcon,
      url: "/app/welcome",
    },
    {
      label: "Chatbot Settings",
      icon: ChatIcon,
      url: "/app/floating-widget-pro",
    },
    {
      label: "Analytics",
      icon: ChartLineIcon,
      url: "/app/conversation-history",
    },
    {
      label: "Plans & Pricing",
      icon: CreditCardIcon,
      url: "/app/plans",
    },
    {
      label: "Billing",
      icon: SettingsIcon,
      url: "/app/billing",
    },
  ];

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <Frame>
        <Navigation location="/app">
          {navigationItems.map((item) => (
            <Navigation.Section
              key={item.label}
              items={[
                {
                  label: item.label,
                  icon: item.icon,
                  url: item.url,
                  exactMatch: item.exactMatch,
                },
              ]}
            />
          ))}
        </Navigation>
        <ConnectionStatus />
        <Outlet />
      </Frame>
    </AppProvider>
  );
}

    // Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
    export function ErrorBoundary() {
      const error = useRouteError();
      
      // Suppress WebSocket and SendBeacon errors in error boundary
      const isWebSocketError = error?.message?.includes('WebSocket') || 
                              error?.message?.includes('SendBeacon') ||
                              error?.message?.includes('closed before the connection is established');
      
      if (isWebSocketError) {
        // These are non-critical errors, show a minimal error state
        return (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div>
              <h2>🔄 Connecting...</h2>
              <p>Establishing connection to Shopify. Please wait...</p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Retry Connection
              </button>
            </div>
          </div>
        );
      }
      
      // Log the error for debugging (only if not a WebSocket error)
      console.error("App Error Boundary:", error);
      
      // Check if it's an authentication error
      const isAuthError = error?.status === 401 || 
                         error?.status === 302 ||
                         error?.message?.includes('Authentication') ||
                         error?.message?.includes('session-token') ||
                         error?.message?.includes('frame-ancestors') ||
                         error?.message?.includes('Max authentication retries exceeded');
      
      if (isAuthError) {
        return (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div>
              <h2>🔐 Authentication Required</h2>
              <p>Your session has expired or there was an authentication issue.</p>
              <p>Please try refreshing the page or re-authenticating.</p>
              <button 
                onClick={() => {
                  // Try to redirect to auth
                  window.location.href = '/auth';
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Re-authenticate
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  marginLeft: '10px'
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div>
            <h2>🚨 Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <p>Please try refreshing the page or contact support if the problem persists.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary>Error Details (Development)</summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {error?.message || 'Unknown error'}
                  {error?.stack && `\n\nStack trace:\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

export const headers = (headersArgs) => {
  const headers = boundary.headers(headersArgs);
  
  // Add CSP and X-Frame-Options headers for Shopify authentication
  headers.set('Content-Security-Policy', "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com https://accounts.shopify.com;");
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return headers;
};
