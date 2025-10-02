import { useEffect } from "react";
import { useFetcher, useLoaderData, redirect } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Badge,
  Divider,
  Icon,
  CalloutCard,
  ProgressBar,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { ChatIcon, ChartLineIcon, CreditCardIcon, StarIcon, CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  // Check if this is a new installation
  const shopPlan = await prisma.shopPlan.findUnique({
    where: { shop: session.shop }
  });
  
  const widgetConfig = await prisma.widgetConfig.findUnique({
    where: { shop: session.shop }
  });
  
  // If no plan or config exists, redirect to welcome page
  if (!shopPlan || !widgetConfig) {
    return redirect("/app/welcome");
  }

  return { shop: session.shop };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const { shop } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="Voice AI Chatbot" />
      <Layout>
        {/* Hero Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text as="h1" variant="headingLg">
                      Welcome to Voice AI Chatbot
                    </Text>
                    <Text variant="bodyLg" color="subdued">
                      AI-powered customer support that engages your customers 24/7
                    </Text>
                  </BlockStack>
                  <Badge status="success">Active</Badge>
                </InlineStack>
                
                <Divider />
                
                <InlineStack gap="400">
                  <Button 
                    url="/app/floating-widget-pro" 
                    variant="primary"
                    size="large"
                    icon={ChatIcon}
                  >
                    Configure Chatbot
                  </Button>
                  <Button 
                    url="/app/conversation-history" 
                    variant="secondary"
                    size="large"
                    icon={ChartLineIcon}
                  >
                    View Analytics
                  </Button>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Stats */}
        <Layout.Section>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <Card sectioned>
              <BlockStack gap="200">
                <Text variant="headingMd">Active Conversations</Text>
                <Text variant="heading2xl" fontWeight="bold">0</Text>
                <Text variant="bodyMd" color="subdued">This month</Text>
              </BlockStack>
            </Card>
            
            <Card sectioned>
              <BlockStack gap="200">
                <Text variant="headingMd">Messages Sent</Text>
                <Text variant="heading2xl" fontWeight="bold">0</Text>
                <Text variant="bodyMd" color="subdued">This month</Text>
              </BlockStack>
            </Card>
            
            <Card sectioned>
              <BlockStack gap="200">
                <Text variant="headingMd">Response Time</Text>
                  <Text variant="heading2xl" fontWeight="bold">&lt; 1s</Text>
                <Text variant="bodyMd" color="subdued">Average</Text>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingMd">Quick Actions</Text>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '16px' 
            }}>
              <CalloutCard
                title="Configure Your Chatbot"
                illustration="https://cdn.shopify.com/s/files/1/0780/7745/0100/files/chat-icon.png"
                primaryAction={{
                  content: "Open Settings",
                  url: "/app/floating-widget-pro"
                }}
              >
                <p>Customize your AI chatbot's personality, appearance, and behavior to match your brand.</p>
              </CalloutCard>
              
              <CalloutCard
                title="View Analytics"
                illustration="https://cdn.shopify.com/s/files/1/0780/7745/0100/files/analytics-icon.png"
                primaryAction={{
                  content: "View Reports",
                  url: "/app/conversation-history"
                }}
              >
                <p>Track customer conversations and measure your chatbot's performance.</p>
              </CalloutCard>
              
              <CalloutCard
                title="Upgrade Plan"
                illustration="https://cdn.shopify.com/s/files/1/0780/7745/0100/files/upgrade-icon.png"
                primaryAction={{
                  content: "View Plans",
                  url: "/app/plans"
                }}
              >
                <p>Unlock more features and higher limits with a premium plan.</p>
              </CalloutCard>
            </div>
          </BlockStack>
        </Layout.Section>

        {/* Features Overview */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">What's Included</Text>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '16px' 
              }}>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={CheckIcon} color="success" />
                    <Text variant="bodyMd" fontWeight="bold">AI-Powered Responses</Text>
                  </InlineStack>
                  <Text variant="bodyMd" color="subdued">
                    Intelligent chatbot that understands customer questions and provides helpful answers.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={CheckIcon} color="success" />
                    <Text variant="bodyMd" fontWeight="bold">Customizable Design</Text>
                  </InlineStack>
                  <Text variant="bodyMd" color="subdued">
                    Match your brand with custom colors, fonts, and positioning options.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={CheckIcon} color="success" />
                    <Text variant="bodyMd" fontWeight="bold">24/7 Availability</Text>
                  </InlineStack>
                  <Text variant="bodyMd" color="subdued">
                    Your chatbot never sleeps, providing instant support to customers anytime.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={CheckIcon} color="success" />
                    <Text variant="bodyMd" fontWeight="bold">Mobile Responsive</Text>
                  </InlineStack>
                  <Text variant="bodyMd" color="subdued">
                    Optimized for all devices, ensuring great experience on mobile and desktop.
                  </Text>
                </BlockStack>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
