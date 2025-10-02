import { useState, useCallback } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
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
  Modal,
  Box,
  Banner,
  CalloutCard,
  ProgressBar,
} from "@shopify/polaris";
import { StarIcon, CreditCardIcon, CheckIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  // Get current billing status
  const billing = await admin.billing.require({
    plans: ["free", "starter", "professional", "enterprise"],
    returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
  });

  return json({
    shop: session.shop,
    billing,
  });
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");
  const planName = formData.get("planName");

  try {
    if (actionType === "subscribe") {
      // Create subscription for the selected plan
      const subscription = await admin.billing.subscribe({
        plan: planName,
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
      });

      return redirect(subscription.confirmationUrl);
    }

    if (actionType === "purchase_credits") {
      // Create one-time purchase for credits
      const purchase = await admin.billing.purchase({
        plan: "credits",
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
      });

      return redirect(purchase.confirmationUrl);
    }

    if (actionType === "cancel_subscription") {
      // Cancel current subscription
      await admin.billing.cancel({
        subscriptionId: formData.get("subscriptionId"),
      });

      return json({ success: true, message: "Subscription cancelled successfully" });
    }

    return json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Billing action error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function BillingPage() {
  const { shop, billing } = useLoaderData();
  const fetcher = useFetcher();
  const actionData = useActionData();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const plans = [
    {
      name: "free",
      displayName: "Free",
      price: 0,
      features: [
        "100 conversations/month",
        "1,000 messages/month", 
        "Basic AI responses",
        "Standard support"
      ],
      popular: false,
    },
    {
      name: "starter",
      displayName: "Starter",
      price: 29,
      features: [
        "500 conversations/month",
        "5,000 messages/month",
        "Custom AI personality",
        "Email support",
        "Basic analytics"
      ],
      popular: true,
    },
    {
      name: "professional", 
      displayName: "Professional",
      price: 79,
      features: [
        "2,000 conversations/month",
        "20,000 messages/month",
        "Advanced AI training",
        "Priority support",
        "Advanced analytics",
        "Custom integrations"
      ],
      popular: false,
    },
    {
      name: "enterprise",
      displayName: "Enterprise", 
      price: 199,
      features: [
        "Unlimited conversations",
        "Unlimited messages",
        "Custom AI models",
        "Dedicated support",
        "White-label options",
        "API access"
      ],
      popular: false,
    },
  ];

  const handleUpgradeClick = useCallback((plan) => {
    setSelectedPlan(plan);
    setIsUpgradeModalOpen(true);
  }, []);

  const handleConfirmUpgrade = useCallback(() => {
    if (selectedPlan) {
      fetcher.submit({
        _action: "subscribe",
        planName: selectedPlan.name,
      }, { method: "post" });
      setIsUpgradeModalOpen(false);
    }
  }, [selectedPlan, fetcher]);

  const handlePurchaseCredits = useCallback(() => {
    fetcher.submit({
      _action: "purchase_credits",
    }, { method: "post" });
    setIsCreditsModalOpen(false);
  }, [fetcher]);

  const getCurrentPlan = () => {
    if (billing?.subscription) {
      return plans.find(p => p.name === billing.subscription.name);
    }
    return plans.find(p => p.name === "free");
  };

  const currentPlan = getCurrentPlan();

  return (
    <Page title="Billing & Plans" subtitle={`Store: ${shop}`}>
      <Layout>
        {/* Success/Error Messages */}
        {actionData?.success && (
          <Layout.Section>
            <Banner status="success" title={actionData.message} />
          </Layout.Section>
        )}
        
        {actionData?.error && (
          <Layout.Section>
            <Banner status="critical" title={actionData.error} />
          </Layout.Section>
        )}

        {/* Current Plan Status */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd">Current Plan</Text>
                <Badge status={currentPlan?.name === "free" ? "info" : "success"}>
                  {currentPlan?.displayName}
                </Badge>
              </InlineStack>
              
              {billing?.subscription && (
                <BlockStack gap="200">
                  <Text variant="bodyMd">
                    <strong>Status:</strong> {billing.subscription.status}
                  </Text>
                  <Text variant="bodyMd">
                    <strong>Next billing:</strong> {new Date(billing.subscription.nextBillingDate).toLocaleDateString()}
                  </Text>
                  <Text variant="bodyMd">
                    <strong>Amount:</strong> ${billing.subscription.price.amount} {billing.subscription.price.currencyCode}
                  </Text>
                </BlockStack>
              )}
              
              {billing?.subscription && billing.subscription.status === "ACTIVE" && (
                <Button
                  variant="tertiary"
                  tone="critical"
                  onClick={() => {
                    if (confirm("Are you sure you want to cancel your subscription?")) {
                      fetcher.submit({
                        _action: "cancel_subscription",
                        subscriptionId: billing.subscription.id,
                      }, { method: "post" });
                    }
                  }}
                >
                  Cancel Subscription
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Available Plans */}
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingLg">Choose Your Plan</Text>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px' 
            }}>
              {plans.map((plan) => (
                <Card 
                  key={plan.name}
                  background={plan.popular ? "bg-fill-brand-secondary" : "bg-surface-secondary"}
                  padding="500"
                >
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingLg">{plan.displayName}</Text>
                      {plan.popular && (
                        <Badge status="success">Most Popular</Badge>
                      )}
                    </InlineStack>
                    
                    <Text variant="heading2xl">
                      {plan.price === 0 ? "Free" : `$${plan.price}/month`}
                    </Text>
                    
                    <BlockStack gap="200">
                      {plan.features.map((feature, index) => (
                        <InlineStack key={index} gap="200" blockAlign="center">
                          <Icon source={CheckIcon} color="success" />
                          <Text variant="bodyMd">{feature}</Text>
                        </InlineStack>
                      ))}
                    </BlockStack>
                    
                    {plan.name === currentPlan?.name ? (
                      <Button disabled fullWidth>Current Plan</Button>
                    ) : (
                      <Button 
                        variant={plan.popular ? "primary" : "secondary"}
                        fullWidth
                        onClick={() => handleUpgradeClick(plan)}
                      >
                        {plan.price === 0 ? "Downgrade" : "Upgrade"}
                      </Button>
                    )}
                  </BlockStack>
                </Card>
              ))}
            </div>
          </BlockStack>
        </Layout.Section>

        {/* Additional Services */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Additional Services</Text>
              
              <CalloutCard
                title="Purchase Credits"
                illustration="https://cdn.shopify.com/s/files/1/0780/7745/0100/files/credits-icon.png"
                primaryAction={{
                  content: "Buy Credits",
                  onAction: () => setIsCreditsModalOpen(true),
                }}
              >
                <p>Purchase additional credits for one-time usage beyond your plan limits.</p>
              </CalloutCard>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Billing History */}
        {billing?.charges && billing.charges.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Billing History</Text>
                
                <List>
                  {billing.charges.map((charge, index) => (
                    <List.Item key={index}>
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text variant="bodyMd" fontWeight="bold">
                            {charge.name}
                          </Text>
                          <Text variant="bodyMd" color="subdued">
                            {new Date(charge.createdAt).toLocaleDateString()}
                          </Text>
                        </BlockStack>
                        <Text variant="bodyMd" fontWeight="bold">
                          ${charge.price.amount} {charge.price.currencyCode}
                        </Text>
                      </InlineStack>
                    </List.Item>
                  ))}
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Upgrade Confirmation Modal */}
      <Modal
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title={`Confirm ${selectedPlan?.displayName} Plan`}
        primaryAction={{
          content: 'Confirm & Pay',
          onAction: handleConfirmUpgrade,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setIsUpgradeModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Box padding="400">
            <BlockStack gap="300">
              <Text variant="bodyMd" as="p">
                You're about to upgrade to the <strong>{selectedPlan?.displayName}</strong> plan for{' '}
                <strong>${selectedPlan?.price}/month</strong>.
              </Text>
              
              <Text variant="bodyMd" as="p">
                This will give you access to:
              </Text>
              
              <List>
                {selectedPlan?.features.map((feature, index) => (
                  <List.Item key={index}>
                    <Text variant="bodyMd">{feature}</Text>
                  </List.Item>
                ))}
              </List>
              
              <Text variant="bodyMd" as="p" color="subdued">
                You'll be redirected to Shopify's secure payment page to complete your subscription.
              </Text>
            </BlockStack>
          </Box>
        </Modal.Section>
      </Modal>

      {/* Credits Purchase Modal */}
      <Modal
        open={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        title="Purchase Credits"
        primaryAction={{
          content: 'Purchase Credits',
          onAction: handlePurchaseCredits,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setIsCreditsModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Box padding="400">
            <BlockStack gap="300">
              <Text variant="bodyMd" as="p">
                Purchase additional credits for <strong>$9.99</strong> to use beyond your plan limits.
              </Text>
              
              <Text variant="bodyMd" as="p" color="subdued">
                Credits can be used for extra conversations or messages when you exceed your monthly plan limits.
              </Text>
            </BlockStack>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
