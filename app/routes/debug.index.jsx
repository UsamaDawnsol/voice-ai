import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Card, Page, Layout, List, Text, Button, Banner, BlockStack, InlineStack } from "@shopify/polaris";
import debugLogger, { getDebugInfo } from "../utils/debug.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    debugLogger.info('Debug dashboard accessed', {
      shop: session.shop,
      user: session.id
    });

    const debugInfo = getDebugInfo();
    
    return json({
      shop: session.shop,
      debugInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    debugLogger.error('Failed to load debug dashboard', {
      error: error.message,
      stack: error.stack
    });

    return json({
      error: "Failed to load debug dashboard",
      message: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
};

export default function DebugIndex() {
  const { shop, debugInfo, error } = useLoaderData();

  if (error) {
    return (
      <Page title="Debug Dashboard">
        <Layout>
          <Layout.Section>
            <Banner status="critical" title="Error">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const debugRoutes = [
    {
      title: "App State",
      description: "View comprehensive app state including database, API connectivity, and system health",
      url: "/debug/app-state",
      icon: "📊"
    },
    {
      title: "API Tests",
      description: "Test Shopify API connectivity and permissions",
      url: "/debug/api-test",
      icon: "🔌"
    },
    {
      title: "Debug Logs",
      description: "View and manage debug logs",
      url: "/debug/logs",
      icon: "📝"
    },
    {
      title: "Widget Settings",
      description: "Debug widget configuration and settings",
      url: "/debug/widget",
      icon: "⚙️"
    },
    {
      title: "Settings Debug",
      description: "Debug app settings and configuration",
      url: "/debug-settings",
      icon: "🔧"
    },
    {
      title: "Script Tags Debug",
      description: "Debug script tag embedding in Shopify theme",
      url: "/debug/script-tags",
      icon: "🏷️"
    }
  ];

  return (
    <Page 
      title="Debug Dashboard" 
      subtitle={`Shop: ${shop}`}
      primaryAction={{
        content: 'Refresh',
        onAction: () => window.location.reload()
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner 
            status={debugInfo.isDebugMode ? "success" : "warning"}
            title={debugInfo.isDebugMode ? "Debug Mode Active" : "Debug Mode Inactive"}
          >
            <p>
              {debugInfo.isDebugMode 
                ? "Debug mode is enabled. All debug features are available."
                : "Debug mode is disabled. Enable DEBUG_MODE=true in your environment to access debug features."
              }
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card title="Debug Configuration" sectioned>
            <BlockStack gap="400">
              <Text variant="bodyMd">
                <strong>Debug Mode:</strong> {debugInfo.isDebugMode ? "Enabled" : "Disabled"}
              </Text>
              <Text variant="bodyMd">
                <strong>Log Level:</strong> {debugInfo.logLevel}
              </Text>
              <Text variant="bodyMd">
                <strong>Console Logs:</strong> {debugInfo.enableConsole ? "Enabled" : "Disabled"}
              </Text>
              <Text variant="bodyMd">
                <strong>File Logs:</strong> {debugInfo.enableFileLogs ? "Enabled" : "Disabled"}
              </Text>
              <Text variant="bodyMd">
                <strong>Log File:</strong> {debugInfo.logFile}
              </Text>
              <Text variant="bodyMd">
                <strong>Node Environment:</strong> {debugInfo.nodeEnv}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Debug Tools" sectioned>
            <List type="bullet">
              {debugRoutes.map((route, index) => (
                <List.Item key={index}>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="200">
                      <Text variant="headingMd">
                        {route.icon} {route.title}
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        {route.description}
                      </Text>
                    </BlockStack>
                    <Button 
                      url={route.url}
                      external
                    >
                      Open
                    </Button>
                  </InlineStack>
                </List.Item>
              ))}
            </List>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Quick Actions" sectioned>
            <InlineStack gap="400">
              <Button 
                url="/debug/app-state"
                external
              >
                View App State
              </Button>
              <Button 
                url="/debug/api-test"
                external
              >
                Test APIs
              </Button>
              <Button 
                url="/debug/logs"
                external
              >
                View Logs
              </Button>
            </InlineStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="System Information" sectioned>
            <BlockStack gap="400">
              <Text variant="bodyMd">
                <strong>Timestamp:</strong> {new Date().toISOString()}
              </Text>
              <Text variant="bodyMd">
                <strong>Shop:</strong> {shop}
              </Text>
              <Text variant="bodyMd">
                <strong>Debug Info Generated:</strong> {debugInfo.timestamp}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
