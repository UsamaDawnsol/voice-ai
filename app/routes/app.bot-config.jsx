import { useState } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Box,
  Checkbox,
  RangeSlider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get merchant configuration
  let merchant = await db.merchant.findUnique({
    where: { shop: session.shop }
  });

  // If no merchant found, create default one
  if (!merchant) {
    merchant = await db.merchant.create({
      data: {
        shop: session.shop,
        accessToken: session.accessToken,
        settings: {
          tone: "friendly",
          storeName: session.shop.split('.')[0],
          maxTokens: 500,
          temperature: 0.7,
          enableRAG: true,
          enableVoice: true
        },
        isActive: true
      }
    });
  }

  // Get ingestion job status
  const latestJob = await db.ingestionJob.findFirst({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' }
  });

  // Get document count
  const documentCount = await db.document.count({
    where: { merchantId: merchant.id }
  });

  // Get chat statistics
  const chatStats = await db.chat.groupBy({
    by: ['status'],
    where: { merchantId: merchant.id },
    _count: { status: true }
  });

  return { 
    merchant,
    latestJob,
    documentCount,
    chatStats
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const settings = {
    tone: formData.get("tone") || "friendly",
    storeName: formData.get("storeName") || session.shop.split('.')[0],
    maxTokens: parseInt(formData.get("maxTokens")) || 500,
    temperature: parseFloat(formData.get("temperature")) || 0.7,
    enableRAG: formData.get("enableRAG") === "true",
    enableVoice: formData.get("enableVoice") === "true",
    systemPrompt: formData.get("systemPrompt") || ""
  };

  // Update merchant settings
  await db.merchant.upsert({
    where: { shop: session.shop },
    update: {
      settings: settings,
      updatedAt: new Date()
    },
    create: {
      shop: session.shop,
      accessToken: session.accessToken,
      settings: settings,
      isActive: true
    }
  });

  return { success: true, settings };
};

export default function BotConfig() {
  const { merchant, latestJob, documentCount, chatStats } = useLoaderData();
  const fetcher = useFetcher();
  const [formData, setFormData] = useState({
    tone: merchant.settings?.tone || "friendly",
    storeName: merchant.settings?.storeName || merchant.shop.split('.')[0],
    maxTokens: merchant.settings?.maxTokens || 500,
    temperature: merchant.settings?.temperature || 0.7,
    enableRAG: merchant.settings?.enableRAG || true,
    enableVoice: merchant.settings?.enableVoice || true,
    systemPrompt: merchant.settings?.systemPrompt || ""
  });

  const toneOptions = [
    { label: "Friendly", value: "friendly" },
    { label: "Professional", value: "professional" },
    { label: "Casual", value: "casual" },
    { label: "Formal", value: "formal" }
  ];

  const handleSubmit = () => {
    const form = new FormData();
    form.append("tone", formData.tone);
    form.append("storeName", formData.storeName);
    form.append("maxTokens", formData.maxTokens.toString());
    form.append("temperature", formData.temperature.toString());
    form.append("enableRAG", formData.enableRAG.toString());
    form.append("enableVoice", formData.enableVoice.toString());
    form.append("systemPrompt", formData.systemPrompt);
    
    fetcher.submit(form, { method: "post" });
  };

  const startIngestion = () => {
    fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop: merchant.shop,
        type: 'full'
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Data ingestion started successfully!');
        window.location.reload();
      } else {
        alert('Failed to start data ingestion: ' + data.error);
      }
    })
    .catch(error => {
      console.error('Ingestion error:', error);
      alert('Failed to start data ingestion');
    });
  };

  return (
    <Page>
      <TitleBar title="Bot Configuration" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                AI Bot Configuration
              </Text>
              <Text as="p" variant="bodyMd" color="subdued">
                Configure your AI chatbot's behavior, tone, and capabilities.
              </Text>
              
              {fetcher.data?.success && (
                <Banner status="success">
                  Bot configuration saved successfully!
                </Banner>
              )}

              <fetcher.Form method="post" onSubmit={handleSubmit}>
                <FormLayout>
                  <FormLayout.Group>
                    <TextField
                      label="Store Name"
                      value={formData.storeName}
                      onChange={(value) => 
                        setFormData(prev => ({ ...prev, storeName: value }))
                      }
                      helpText="The name of your store for the bot to reference"
                    />
                    <Select
                      label="Bot Tone"
                      options={toneOptions}
                      value={formData.tone}
                      onChange={(value) => 
                        setFormData(prev => ({ ...prev, tone: value }))
                      }
                    />
                  </FormLayout.Group>

                  <FormLayout.Group>
                    <RangeSlider
                      label={`Max Response Length: ${formData.maxTokens} tokens`}
                      value={formData.maxTokens}
                      min={100}
                      max={1000}
                      step={50}
                      onChange={(value) => 
                        setFormData(prev => ({ ...prev, maxTokens: value }))
                      }
                    />
                    <RangeSlider
                      label={`Creativity Level: ${formData.temperature}`}
                      value={formData.temperature}
                      min={0}
                      max={1}
                      step={0.1}
                      onChange={(value) => 
                        setFormData(prev => ({ ...prev, temperature: value }))
                      }
                    />
                  </FormLayout.Group>

                  <FormLayout.Group>
                    <Checkbox
                      label="Enable RAG (Retrieval-Augmented Generation)"
                      checked={formData.enableRAG}
                      onChange={(checked) => 
                        setFormData(prev => ({ ...prev, enableRAG: checked }))
                      }
                      helpText="Use your store data to provide accurate answers"
                    />
                    <Checkbox
                      label="Enable Voice Input"
                      checked={formData.enableVoice}
                      onChange={(checked) => 
                        setFormData(prev => ({ ...prev, enableVoice: checked }))
                      }
                      helpText="Allow customers to use voice input"
                    />
                  </FormLayout.Group>

                  <TextField
                    label="Custom System Prompt"
                    value={formData.systemPrompt}
                    onChange={(value) => 
                      setFormData(prev => ({ ...prev, systemPrompt: value }))
                    }
                    multiline={4}
                    helpText="Additional instructions for the AI bot (optional)"
                  />

                  <InlineStack gap="300">
                    <Button 
                      submit 
                      variant="primary"
                      loading={fetcher.state === "submitting"}
                    >
                      Save Configuration
                    </Button>
                  </InlineStack>
                </FormLayout>
              </fetcher.Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Data Status
              </Text>
              
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <Text as="p" variant="bodyMd">
                  <strong>Documents:</strong> {documentCount}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Latest Job:</strong> {latestJob ? latestJob.status : 'None'}
                </Text>
                {latestJob && (
                  <Text as="p" variant="bodyMd">
                    <strong>Progress:</strong> {latestJob.progress}/{latestJob.total}
                  </Text>
                )}
              </Box>

              <Button 
                variant="primary" 
                onClick={startIngestion}
                loading={latestJob?.status === 'running'}
              >
                {latestJob?.status === 'running' ? 'Ingesting...' : 'Start Data Ingestion'}
              </Button>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Chat Statistics
              </Text>
              
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                {chatStats.map(stat => (
                  <Text key={stat.status} as="p" variant="bodyMd">
                    <strong>{stat.status}:</strong> {stat._count.status}
                  </Text>
                ))}
                {chatStats.length === 0 && (
                  <Text as="p" variant="bodyMd" color="subdued">
                    No chats yet
                  </Text>
                )}
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
