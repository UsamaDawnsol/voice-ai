import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Divider,
  List,
  Icon,
  Banner,
  ProgressBar,
  CalloutCard,
  EmptyState,
  Box,
} from "@shopify/polaris";
import { CheckIcon, StarIcon, ChatIcon, ChartLineIcon, CreditCardIcon, SettingsIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // Get shop plan and configuration
  const shopPlan = await prisma.shopPlan.findUnique({
    where: { shop: session.shop },
    include: { plan: true }
  });
  
  const widgetConfig = await prisma.widgetConfig.findUnique({
    where: { shop: session.shop }
  });
  
  // Get usage statistics
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const [conversationsCount, messagesCount] = await Promise.all([
    prisma.conversation.count({
      where: {
        shop: session.shop,
        createdAt: { gte: currentMonth }
      }
    }),
    prisma.message.count({
      where: {
        conversation: {
          shop: session.shop,
          createdAt: { gte: currentMonth }
        }
      }
    })
  ]);
  
  return json({
    shop: session.shop,
    plan: shopPlan?.plan,
    config: widgetConfig,
    usage: {
      conversations: conversationsCount,
      messages: messagesCount
    }
  });
};

export default function Welcome() {
  const { shop, plan, config, usage } = useLoaderData();
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome to Voice AI Chatbot!",
      description: "Your AI-powered customer support is now ready to go.",
      icon: ChatIcon,
      completed: true
    },
    {
      title: "Plan Activated",
      description: `You're on the ${plan?.displayName} plan with ${plan?.maxConversations === -1 ? 'unlimited' : plan?.maxConversations} conversations per month.`,
      icon: StarIcon,
      completed: true
    },
    {
      title: "Widget Configured",
      description: "Your chat widget is ready and will appear on your store.",
      icon: CheckIcon,
      completed: !!config
    },
    {
      title: "Ready to Go!",
      description: "Your AI chatbot is live and ready to help your customers.",
      icon: CheckIcon,
      completed: true
    }
  ];
  
  const getUsagePercentage = (used, max) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((used / max) * 100, 100);
  };
  
  return (
    <Page title="Welcome to Voice AI Chatbot!" subtitle={`Store: ${shop}`}>
      <Layout>
        <Layout.Section>
          {/* Welcome Banner */}
          <Banner status="success" title="🎉 Installation Complete!">
            <p>Your AI chatbot is now live and ready to help your customers. The chat widget has been automatically added to your store.</p>
          </Banner>
        </Layout.Section>
        
        <Layout.Section>
          {/* Setup Progress */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Setup Progress</Text>
              
              <BlockStack gap="300">
                {steps.map((step, index) => (
                  <InlineStack key={index} gap="300" blockAlign="center">
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: step.completed ? '#008060' : '#e1e3e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      border: step.completed ? '2px solid #008060' : '2px solid #e1e3e5'
                    }}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="bold">
                        {step.title}
                      </Text>
                      <Text variant="bodyMd" color="subdued">
                        {step.description}
                      </Text>
                    </BlockStack>
                    
                    {step.completed && (
                      <Icon source={CheckIcon} color="success" />
                    )}
                  </InlineStack>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          {/* Current Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Plan Status */}
            <Card sectioned>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd">Current Plan</Text>
                  <Badge status="info">{plan?.displayName}</Badge>
                </InlineStack>
                
                <Text variant="bodyLg" fontWeight="bold">
                  ${plan?.price}/month
                </Text>
                
                <Text variant="bodyMd" color="subdued">
                  {plan?.maxConversations === -1 ? 'Unlimited conversations' : `Up to ${plan?.maxConversations} conversations/month`}
                </Text>
                
                <Button variant="primary" size="large" fullWidth>
                  View Plans & Pricing
                </Button>
              </BlockStack>
            </Card>
            
            {/* Usage Status */}
            <Card sectioned>
              <BlockStack gap="300">
                <Text variant="headingMd">This Month's Usage</Text>
                
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd">Conversations</Text>
                    <Text variant="bodyMd" fontWeight="bold">
                      {usage.conversations} / {plan?.maxConversations === -1 ? '∞' : plan?.maxConversations}
                    </Text>
                  </InlineStack>
                  
                  {plan?.maxConversations !== -1 && (
                    <ProgressBar
                      progress={getUsagePercentage(usage.conversations, plan.maxConversations)}
                      color={getUsagePercentage(usage.conversations, plan.maxConversations) >= 90 ? 'critical' : 'success'}
                    />
                  )}
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd">Messages</Text>
                    <Text variant="bodyMd" fontWeight="bold">
                      {usage.messages} / {plan?.maxMessages === -1 ? '∞' : plan?.maxMessages}
                    </Text>
                  </InlineStack>
                  
                  {plan?.maxMessages !== -1 && (
                    <ProgressBar
                      progress={getUsagePercentage(usage.messages, plan.maxMessages)}
                      color={getUsagePercentage(usage.messages, plan.maxMessages) >= 90 ? 'critical' : 'success'}
                    />
                  )}
                </BlockStack>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
        
        <Layout.Section>
          {/* Quick Actions */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Quick Actions</Text>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <CalloutCard
                  title="Customize Chat Widget"
                  illustration="https://cdn.shopify.com/s/files/1/0780/7745/0100/files/chat-widget-icon.png"
                  primaryAction={{
                    content: "Configure Widget",
                    url: "/app/floating-widget-pro"
                  }}
                >
                  <p>Customize your chat widget's appearance, behavior, and AI personality.</p>
                </CalloutCard>
                
                <CalloutCard
                  title="View Conversations"
                  illustration="https://cdn.shopify.com/s/files/1/0780/7745/0100/files/conversations-icon.png"
                  primaryAction={{
                    content: "View History",
                    url: "/app/conversation-history"
                  }}
                >
                  <p>See all customer conversations and chat history in your dashboard.</p>
                </CalloutCard>
                
                <CalloutCard
                  title="Upgrade Plan"
                  illustration="https://cdn.shopify.com/s/files/1/0780/7745/0100/files/upgrade-icon.png"
                  primaryAction={{
                    content: "View Plans",
                    url: "/app/plans"
                  }}
                >
                  <p>Upgrade your plan to get more conversations and advanced features.</p>
                </CalloutCard>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          {/* Getting Started */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Getting Started</Text>
              
              <List>
                <List.Item>
                  <Text variant="bodyMd">
                    <strong>1. Test your chat widget:</strong> Visit your store and look for the chat widget in the bottom corner.
                  </Text>
                </List.Item>
                <List.Item>
                  <Text variant="bodyMd">
                    <strong>2. Customize the appearance:</strong> Go to AI Chatbot Settings to change colors, greeting, and more.
                  </Text>
                </List.Item>
                <List.Item>
                  <Text variant="bodyMd">
                    <strong>3. Monitor conversations:</strong> Check the Conversation History to see how customers are interacting.
                  </Text>
                </List.Item>
                <List.Item>
                  <Text variant="bodyMd">
                    <strong>4. Upgrade when needed:</strong> As your business grows, upgrade your plan for more conversations.
                  </Text>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

