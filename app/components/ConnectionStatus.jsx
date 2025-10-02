import { useState, useEffect } from 'react';

/**
 * Connection Status Component
 * 
 * Shows the current connection status and provides debugging information
 */
export default function ConnectionStatus() {
  const [status, setStatus] = useState('connecting');
  const [lastError, setLastError] = useState(null);
  const [wsStatus, setWsStatus] = useState('unknown');

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      if (navigator.onLine) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    };

    // Initial check
    checkConnection();

    // Listen for online/offline events
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    // Monitor WebSocket connection with better error handling
    const monitorWebSocket = () => {
      try {
        if (window.Shopify && window.Shopify.AppBridge) {
          setStatus('shopify-connected');
          setWsStatus('app-bridge-ready');
        } else {
          setStatus('shopify-disconnected');
          setWsStatus('app-bridge-not-ready');
        }
      } catch (error) {
        setLastError('WebSocket monitoring error: ' + error.message);
        setWsStatus('error');
      }
    };

    // Monitor for WebSocket errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('WebSocket') || message.includes('SendBeacon')) {
        setLastError('WebSocket/Beacon error detected');
        setWsStatus('error');
      }
      originalConsoleError.apply(console, args);
    };

    const interval = setInterval(monitorWebSocket, 2000); // Reduced frequency

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearInterval(interval);
      console.error = originalConsoleError; // Restore original console.error
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online':
      case 'shopify-connected':
        return '#10b981';
      case 'offline':
      case 'shopify-disconnected':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'shopify-connected':
        return 'Shopify Connected';
      case 'shopify-disconnected':
        return 'Shopify Disconnected';
      default:
        return 'Connecting...';
    }
  };

  const getWsStatusText = () => {
    switch (wsStatus) {
      case 'app-bridge-ready':
        return 'App Bridge Ready';
      case 'app-bridge-not-ready':
        return 'App Bridge Not Ready';
      case 'error':
        return 'WebSocket Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getStatusColor()
        }} />
        <span>{getStatusText()}</span>
      </div>
      <div style={{ 
        marginTop: '2px', 
        fontSize: '10px',
        color: '#6b7280'
      }}>
        WS: {getWsStatusText()}
      </div>
      {lastError && (
        <div style={{ 
          marginTop: '4px', 
          color: '#ef4444',
          fontSize: '10px'
        }}>
          Error: {lastError}
        </div>
      )}
    </div>
  );
}


