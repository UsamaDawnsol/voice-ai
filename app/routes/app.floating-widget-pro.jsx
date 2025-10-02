import { useState, useEffect } from "react";
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
  Divider,
  Badge,
  Icon,
  Tabs,
  Collapsible,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { ChatIcon, ColorIcon, SettingsIcon, StarIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  // Ensure Shopify auth errors propagate (to handle redirects)
  const { admin, session } = await authenticate.admin(request);
  try {
    let widgetConfig = await prisma.widgetConfig.findUnique({
      where: { shop: session.shop }
    });

    if (!widgetConfig) {
      widgetConfig = await prisma.widgetConfig.create({
        data: {
          shop: session.shop,
          title: "Support Chat",
          color: "#e63946",
          greeting: "👋 Welcome! How can we help you?",
          position: "right",
          isActive: true
        }
      });
    }

    return { 
      config: widgetConfig,
      shop: session.shop,
      appUrl: process.env.SHOPIFY_APP_URL || "",
    };
  } catch (error) {
    console.error("Error loading widget config:", error);
    throw new Error("Failed to load widget configuration");
  }
};

export const action = async ({ request }) => {
  // Ensure Shopify auth errors propagate (to handle redirects)
  const { admin, session } = await authenticate.admin(request);
  try {
    const formData = await request.formData();
    const actionType = formData.get("_action");
    
    if (actionType === "saveConfig") {
      console.log("Processing saveConfig action");
      
      const title = formData.get("title")?.trim() || "Support Chat";
      let color = formData.get("color")?.trim() || "#e63946";
      const greeting = formData.get("greeting")?.trim() || "👋 Welcome! How can we help you?";
      const position = formData.get("position") || "right";
      const isActive = formData.get("isActive") === "true";
      
      // Agent Persona Fields
      const agentName = formData.get("agentName")?.trim() || "Assistant";
      const agentRole = formData.get("agentRole")?.trim() || "Customer Support";
      const responseLength = formData.get("responseLength") || "medium";
      const language = formData.get("language") || "en";
      const tone = formData.get("tone") || "friendly";
      const avatar = formData.get("avatar")?.trim() || "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png";
      
      // Agent Style Fields
      const colorScheme = formData.get("colorScheme") || "0";
      const startColor = formData.get("startColor")?.trim() || "#000000CF";
      const endColor = formData.get("endColor")?.trim() || "#000000";
      const chatBgColor = formData.get("chatBgColor")?.trim() || "#FFFFFF";
      const fontFamily = formData.get("fontFamily")?.trim() || "inter, sans-serif";
      const fontColor = formData.get("fontColor")?.trim() || "#000000CF";
      const openByDefault = formData.get("openByDefault") || "1";
      const isPulsing = formData.get("isPulsing") === "true";
      
      console.log("Form data received:", {
        title, color, greeting, position, isActive,
        agentName, agentRole, responseLength, language, tone, avatar
      });
      
      if (!color.startsWith('#')) {
        color = "#e63946";
      }
      
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        color = "#e63946";
      }
      
      if (!["left", "right"].includes(position)) {
        return { success: false, error: "Invalid position value" };
      }

      console.log("Attempting database upsert for shop:", session.shop);
      
      const result = await prisma.widgetConfig.upsert({
        where: { shop: session.shop },
        update: {
          title,
          color,
          greeting,
          position,
          isActive,
          agentName,
          agentRole,
          responseLength,
          language,
          tone,
          avatar,
          colorScheme,
          startColor,
          endColor,
          chatBgColor,
          fontFamily,
          fontColor,
          openByDefault,
          isPulsing
        },
        create: {
          shop: session.shop,
          title,
          color,
          greeting,
          position,
          isActive,
          agentName,
          agentRole,
          responseLength,
          language,
          tone,
          avatar,
          colorScheme,
          startColor,
          endColor,
          chatBgColor,
          fontFamily,
          fontColor,
          openByDefault,
          isPulsing
        }
      });
      
      console.log("Database operation successful:", result);

      return { success: true, message: "Widget settings saved successfully!" };
    }

    return { success: false, error: "Invalid action" };
  } catch (error) {
    console.error("Action error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
};

export default function FloatingWidgetPro() {
  const { config, shop, appUrl } = useLoaderData();
  const fetcher = useFetcher();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState("https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png");
  const [selectedColorScheme, setSelectedColorScheme] = useState(parseInt(config.colorScheme || "0"));
  const [isPulsing, setIsPulsing] = useState(config.isPulsing || false);
  const [formData, setFormData] = useState({
    title: config.title || "Support Chat",
    color: config.color || "#e63946",
    greeting: config.greeting || "👋 Welcome! How can we help you?",
    position: config.position || "right",
    isActive: config.isActive !== undefined ? config.isActive : true,
    agentName: config.agentName || "Assistant",
    agentRole: config.agentRole || "Customer Support",
    responseLength: config.responseLength || "medium",
    language: config.language || "en",
    tone: config.tone || "friendly",
    avatar: selectedAvatar,
    // Agent Style Fields
    colorScheme: config.colorScheme || "0",
    startColor: config.startColor || "#000000CF",
    endColor: config.endColor || "#000000",
    chatBgColor: config.chatBgColor || "#FFFFFF",
    fontFamily: config.fontFamily || "inter, sans-serif",
    fontColor: config.fontColor || "#000000CF",
    openByDefault: config.openByDefault || "1",
    isPulsing: config.isPulsing !== undefined ? config.isPulsing : false,
  });

  const responseLengthOptions = [
    { label: "Short", value: "short" },
    { label: "Medium", value: "medium" },
    { label: "Long", value: "long" },
  ];

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "British English", value: "en-GB" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Italiano", value: "it" },
    { label: "Português", value: "pt" },
    { label: "Português (Brasil)", value: "pt-BR" },
    { label: "Deutsch", value: "de" },
    { label: "Türkçe", value: "tr" },
    { label: "Nederlands", value: "nl" },
    { label: "Suomi", value: "fi" },
    { label: "Polski", value: "pl" },
    { label: "Русский", value: "ru" },
    { label: "日本語", value: "ja" },
    { label: "Български", value: "bg" },
    { label: "Српски", value: "sr" },
    { label: "Georgian", value: "ka" },
    { label: "Indonesia", value: "id" },
    { label: "العربية", value: "ar" },
    { label: "한국어", value: "ko" },
    { label: "中文（香港）", value: "zh-HK" },
    { label: "中文", value: "zh" },
    { label: "Afrikaans", value: "af" },
    { label: "עברית", value: "he" },
    { label: "Magyar", value: "hu" },
    { label: "Українська", value: "uk" },
    { label: "Català", value: "ca" },
    { label: "Svenska", value: "sv" },
    { label: "Norsk", value: "no" },
    { label: "Dansk", value: "da" },
    { label: "Română", value: "ro" },
    { label: "हिन्दी", value: "hi" },
    { label: "বাংলা", value: "bn" },
    { label: "اردو", value: "ur" },
    { label: "Kiswahili", value: "sw" },
    { label: "Javanese", value: "jv" },
    { label: "मराठी", value: "mr" },
    { label: "తెలుగు", value: "te" },
    { label: "தமிழ்", value: "ta" },
    { label: "Tiếng Việt", value: "vi" },
    { label: "فارسی", value: "fa" },
    { label: "ไทย", value: "th" },
    { label: "Melayu", value: "ms" },
    { label: "ਪੰਜਾਬੀ", value: "pa" },
    { label: "ગુજરાતી", value: "gu" },
    { label: "Ελληνικά", value: "el" },
    { label: "Čeština", value: "cs" },
    { label: "Slovenčina", value: "sk" },
    { label: "Hrvatski", value: "hr" },
    { label: "Azərbaycan", value: "az" },
    { label: "O'zbek", value: "uz" },
    { label: "አማርኛ", value: "am" },
    { label: "Nepali", value: "ne" },
    { label: "മലയാളം", value: "ml" },
    { label: "ಕನ್ನಡ", value: "kn" },
    { label: "Basque", value: "eu" },
    { label: "Armenian", value: "hy" },
    { label: "Khmer", value: "km" },
    { label: "Lao", value: "lo" },
    { label: "Latviešu", value: "lv" },
    { label: "Lietuvių", value: "lt" },
    { label: "Eesti", value: "et" },
    { label: "Icelandic", value: "is" },
    { label: "Burmese", value: "my" },
    { label: "Albanian", value: "sq" },
    { label: "Sinhala", value: "si" },
    { label: "Zulu", value: "zu" },
  ];

  const toneOptions = [
    { label: "Casual", value: "casual" },
    { label: "Professional", value: "professional" },
    { label: "Friendly", value: "friendly" },
  ];

  const fontFamilyOptions = [
    { label: 'Inter', value: 'inter, sans-serif' },
    { label: 'Circular', value: 'circular' },
    { label: 'Times New Roman', value: 'timesNewRoman' }
  ];

  const openByDefaultOptions = [
    { label: 'Always open', value: '1' },
    { label: 'Open after 5 seconds', value: '5000' },
    { label: 'Open after 10 seconds', value: '10000' },
    { label: 'Do not open automatically', value: '0' }
  ];

  const embedSnippet = `\n<script>\n  window.floatingChatWidget = {\n    appUrl: '${appUrl || ''}',\n    shop: '${shop}'\n  };\n</script>\n<script src="${appUrl || ''}/floating-widget.js" defer></script>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      alert("Embed code copied to clipboard");
    } catch (e) {
      console.error("Failed to copy", e);
      alert("Could not copy. Please copy manually.");
    }
  };

  const colorSchemes = [
    { background: '#667eea', box: '#667eea', text: '#ffffff', right: '#764ba2' },
    { background: '#f093fb', box: '#f093fb', text: '#ffffff', right: '#f5576c' },
    { background: '#4facfe', box: '#4facfe', text: '#ffffff', right: '#00f2fe' },
    { background: '#43e97b', box: '#43e97b', text: '#ffffff', right: '#38f9d7' },
    { background: '#fa709a', box: '#fa709a', text: '#ffffff', right: '#fee140' },
    { background: '#a8edea', box: '#a8edea', text: '#333333', right: '#fed6e3' },
    { background: '#ffecd2', box: '#ffecd2', text: '#333333', right: '#fcb69f' },
    { background: '#ff9a9e', box: '#ff9a9e', text: '#ffffff', right: '#fecfef' },
    { background: '#a18cd1', box: '#a18cd1', text: '#ffffff', right: '#fbc2eb' },
    { background: '#fad0c4', box: '#fad0c4', text: '#333333', right: '#ffd1ff' }
  ];

  // Avatar gallery data - exact same as HTML
  const avatarOptions = [
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-1.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-2.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-3.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-4.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-5.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-6.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-7.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-8.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-9.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-10.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-11.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-12.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-13.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-14.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-15.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-16.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-17.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-18.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-19.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-20.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-21.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-22.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-23.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-24.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-25.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-26.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-27.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-28.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-29.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-30.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-31.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-32.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-33.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-34.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-35.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-36.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-37.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-38.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-39.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-40.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-41.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-42.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-43.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-44.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-45.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-46.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-47.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-48.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-49.png",
    "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/avatar-50.png"
  ];

  const tabs = [
    {
      id: 'agent-persona',
      content: 'Agent persona',
      panelID: 'agent-persona-panel',
    },
    {
      id: 'agent-style',
      content: 'Agent style',
      panelID: 'agent-style-panel',
    },
    {
      id: 'train-agent',
      content: 'Train your chatbot',
      panelID: 'train-agent-panel',
      badge: '6',
    },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    
    console.log("Form data being submitted:", formData);
    console.log("Selected avatar:", selectedAvatar);
    
    if (!formData.title || !formData.greeting) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Validate required fields
    if (!formData.agentName) {
      alert("Please enter an agent name");
      return;
    }
    
    if (!formData.agentRole) {
      alert("Please enter an agent role");
      return;
    }
    
    const submitForm = new FormData();
    submitForm.append("_action", "saveConfig");
    submitForm.append("title", formData.title);
    submitForm.append("color", formData.color);
    submitForm.append("greeting", formData.greeting);
    submitForm.append("position", formData.position);
    submitForm.append("isActive", formData.isActive.toString());
    
    // Agent Persona Fields
    submitForm.append("agentName", formData.agentName);
    submitForm.append("agentRole", formData.agentRole);
    submitForm.append("responseLength", formData.responseLength);
    submitForm.append("language", formData.language);
    submitForm.append("tone", formData.tone);
    submitForm.append("avatar", selectedAvatar);
    
    // Agent Style Fields
    submitForm.append("colorScheme", formData.colorScheme);
    submitForm.append("startColor", formData.startColor);
    submitForm.append("endColor", formData.endColor);
    submitForm.append("chatBgColor", formData.chatBgColor);
    submitForm.append("fontFamily", formData.fontFamily);
    submitForm.append("fontColor", formData.fontColor);
    submitForm.append("openByDefault", formData.openByDefault);
    submitForm.append("isPulsing", formData.isPulsing.toString());
    
    fetcher.submit(submitForm, { method: "post" });
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      console.log("Settings saved successfully:", fetcher.data.message);
    } else if (fetcher.data?.error) {
      console.error("Error saving settings:", fetcher.data.error);
      alert("Error saving settings: " + fetcher.data.error);
    } else if (fetcher.state === "idle" && fetcher.data && !fetcher.data.success && !fetcher.data.error) {
      console.error("Unexpected error occurred");
      alert("An unexpected error occurred while saving settings");
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <Page>
      <TitleBar title="AI chatbot settings" />

      {fetcher.data?.success && (
        <Banner status="success">
          <Text as="p" variant="bodyMd">
            <strong>✅ {fetcher.data.message}</strong>
          </Text>
        </Banner>
      )}

      {fetcher.data?.error && (
        <Banner status="critical">
          <Text as="p" variant="bodyMd">
            <strong>Error:</strong> {fetcher.data.error}
          </Text>
        </Banner>
      )}

      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" wrap={false}>
                <Button
                  variant={selectedTab === 0 ? "primary" : "tertiary"}
                  onClick={() => setSelectedTab(0)}
                >
                  Agent persona
                </Button>
                <Button
                  variant={selectedTab === 1 ? "primary" : "tertiary"}
                  onClick={() => setSelectedTab(1)}
                >
                  Agent style
                </Button>
                <Button
                  variant={selectedTab === 2 ? "primary" : "tertiary"}
                  onClick={() => setSelectedTab(2)}
                >
                  Train your chatbot
                </Button>
              </InlineStack>
              
              {selectedTab === 0 && (
                <BlockStack gap="400">
                  {/* Agent Avatar Section */}
                  <Box 
                    padding="400" 
                    background="bg-surface" 
                    borderRadius="300"
                    borderWidth="025"
                    borderColor="border"
                    shadow="100"
                  >
                    <BlockStack gap="400">
                      <Text as="h6" variant="headingSm">
                        Agent avatar
                      </Text>
                      
                      <div id="jf-avatar-gallery">
                        <Box style={{ 
                          minHeight: '224px', 
                          height: '100%', 
                          padding: '2px',
                          overflow: 'auto',
                          maxHeight: '300px'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '4px',
                            alignItems: 'flex-start'
                          }}>
                            {avatarOptions.map((avatar, index) => (
                              <div 
                                key={index}
                                className={`jf-avatar-gallery-item ${selectedAvatar === avatar ? 'selected' : ''}`}
                                style={{
                                  cursor: 'pointer',
                                  border: selectedAvatar === avatar ? '2px solid #0070f3' : '2px solid transparent',
                                  borderRadius: '8px',
                                  padding: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => setSelectedAvatar(avatar)}
                              >
                                <img 
                                  src={avatar} 
                                  alt={`avatar_${index}`} 
                                  loading="eager" 
                                  width="108" 
                                  height="108" 
                                  style={{ borderRadius: '4px' }}
                                />
                              </div>
                            ))}
                          </div>
                        </Box>
                      </div>
                    </BlockStack>
                  </Box>

                  {/* Agent Persona Section */}
                  <Box 
                    padding="400" 
                    background="bg-surface" 
                    borderRadius="300"
                    borderWidth="025"
                    borderColor="border"
                    shadow="100"
                  >
    <BlockStack gap="400">
      <Text as="h6" variant="headingSm">
        Agent persona
      </Text>
      
      <TextField
        label="Agent name"
        value={formData.agentName}
        onChange={(value) => setFormData(prev => ({ ...prev, agentName: value }))}
        placeholder="Assistant"
        helpText="Give your agent a name that will be displayed in the conversation"
      />

      <TextField
        label="Agent role"
        value={formData.agentRole}
        onChange={(value) => setFormData(prev => ({ ...prev, agentRole: value }))}
                        placeholder="Product Order AI Agent"
      />

      <Select
        label="Chat response length"
        options={responseLengthOptions}
        value={formData.responseLength}
        onChange={(value) => setFormData(prev => ({ ...prev, responseLength: value }))}
      />

      <Select
        label="Default language"
        options={languageOptions}
        value={formData.language}
        onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
      />

      <Select
        label="Tone of voice"
        options={toneOptions}
        value={formData.tone}
        onChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
      />

      <TextField
        label="Greeting message"
        value={formData.greeting}
        onChange={(value) => setFormData(prev => ({ ...prev, greeting: value }))}
        placeholder="Hi! How can I help you?"
        multiline={3}
        helpText="This message will appear when customers first open the chat"
      />
    </BlockStack>
                  </Box>
                </BlockStack>
              )}

              {selectedTab === 1 && (
                <BlockStack gap="400">
                  <Box 
                    padding="400" 
                    background="bg-surface" 
                    borderRadius="300"
                    borderWidth="025"
                    borderColor="border"
                    shadow="100"
                  >
    <BlockStack gap="400">
      <Text as="h6" variant="headingSm">
                        Color
      </Text>
      
                      <BlockStack gap="200">
                        <Text variant="bodyMd">Color scheme</Text>
                        <InlineStack gap="200" wrap>
                          {colorSchemes.map((scheme, index) => (
                            <div
                              key={index}
                              className={`colorScheme-item ${selectedColorScheme === index ? 'selected' : ''}`}
                              style={{ backgroundColor: scheme.background }}
                              onClick={() => {
                                setSelectedColorScheme(index);
                                setFormData(prev => ({ ...prev, colorScheme: index.toString() }));
                              }}
                            >
                              <div className="colorScheme-itemBox" style={{ backgroundColor: scheme.box }}>
                                <span className="colorScheme-itemText" style={{ color: scheme.text }}>A</span>
                                <div className="colorScheme-itemBoxRight" style={{ backgroundColor: scheme.right }}></div>
                              </div>
                            </div>
                          ))}
                        </InlineStack>
                      </BlockStack>
                      
                      <BlockStack gap="200">
                        <Text as="h6" variant="headingSm">Agent background style</Text>
                        <InlineStack gap="200">
                          <BlockStack gap="100">
                            <Text variant="bodyMd">Start color</Text>
                            <div className="colorPicker-btn">
                              <svg width="20" height="20" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="10" stroke="#8A8A8A" strokeWidth="1" fill="#000000CF"></circle>
                              </svg>
                              #000000CF
                            </div>
                          </BlockStack>
                          <BlockStack gap="100">
                            <Text variant="bodyMd">End color</Text>
                            <div className="colorPicker-btn">
                              <svg width="20" height="20" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="10" stroke="#8A8A8A" strokeWidth="1" fill="#000000"></circle>
                              </svg>
                              #000000
                            </div>
                          </BlockStack>
                        </InlineStack>
                      </BlockStack>
                      
                      <BlockStack gap="200">
                        <Text as="h6" variant="headingSm">Chat style</Text>
                        <BlockStack gap="100">
                          <Text variant="bodyMd">Chat background color</Text>
                          <div className="colorPicker-btn">
                            <svg width="20" height="20" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="11" cy="11" r="10" stroke="#8A8A8A" strokeWidth="1" fill="#FFFFFF"></circle>
                            </svg>
                            #FFFFFF
                          </div>
                        </BlockStack>
                        <InlineStack gap="200">
                          <BlockStack gap="100">
                            <Text variant="bodyMd">Font family</Text>
                            <Select
                              label="Font family"
                              options={fontFamilyOptions}
                              value={formData.fontFamily}
                              onChange={(value) => setFormData(prev => ({ ...prev, fontFamily: value }))}
                            />
                          </BlockStack>
                          <BlockStack gap="100">
                            <Text variant="bodyMd">Font color</Text>
                            <div className="colorPicker-btn">
                              <svg width="20" height="20" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="10" stroke="#8A8A8A" strokeWidth="1" fill="#000000CF"></circle>
                              </svg>
                              #000000CF
                            </div>
                          </BlockStack>
                        </InlineStack>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                  
                  <Box 
                    padding="400" 
                    background="bg-surface" 
                    borderRadius="300"
                    borderWidth="025"
                    borderColor="border"
                    shadow="100"
                  >
                    <BlockStack gap="400">
                      <Text as="h6" variant="headingSm">
                        Chat
                      </Text>
                      
                      <BlockStack gap="200">
                        <Text variant="bodyMd">Position</Text>
                        <InlineStack gap="200">
                          <div 
                            className={`chatbotPosition-btn ${formData.position === 'left' ? 'selected' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, position: 'left' }))}
                          >
                            <Box 
                              role="button" 
                              borderWidth="025"
                              borderColor="icon-secondary"
                              borderRadius="200"
                              padding="300"
                            >
                              <BlockStack align="center" inlineAlign="center" gap="200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="42" fill="none">
                                  <path fill="#4A4A4A" d="M24.206 0H2.794C1.527 0 .5 1.06.5 2.368v25.264C.5 28.94 1.527 30 2.794 30h21.412c1.267 0 2.294-1.06 2.294-2.368V2.368C26.5 1.06 25.473 0 24.206 0"></path>
                                  <path fill="#4A4A4A" fillOpacity="0.2" d="M5.5 42a5 5 0 1 0 0-10 5 5 0 0 0 0 10"></path>
                                </svg>
                                <Text variant="bodyMd">Left</Text>
                              </BlockStack>
                            </Box>
                          </div>
                          <div 
                            className={`chatbotPosition-btn ${formData.position === 'right' ? 'selected' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, position: 'right' }))}
                          >
                            <Box 
                              role="button" 
                              borderWidth="025"
                              borderColor="icon-secondary"
                              borderRadius="200"
                              padding="300"
                            >
                              <BlockStack align="center" inlineAlign="center" gap="200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="42" fill="none">
                                  <path fill="#4A4A4A" d="M24.206 0H2.794C1.527 0 .5 1.06.5 2.368v25.264C.5 28.94 1.527 30 2.794 30h21.412c1.267 0 2.294-1.06 2.294-2.368V2.368C26.5 1.06 25.473 0 24.206 0"></path>
                                  <path fill="#4A4A4A" fillOpacity="0.2" d="M21.5 42a5 5 0 1 0 0-10 5 5 0 0 0 0 10"></path>
                                </svg>
                                <Text variant="bodyMd">Right</Text>
                              </BlockStack>
                            </Box>
                          </div>
                        </InlineStack>
                      </BlockStack>
                      
                      <BlockStack gap="200">
                        <Text variant="bodyMd">Open by default</Text>
        <Select
                          label="Open by default"
                          options={openByDefaultOptions}
                          value={formData.openByDefault}
                          onChange={(value) => setFormData(prev => ({ ...prev, openByDefault: value }))}
                        />
                      </BlockStack>
                      
                      <InlineStack align="space-between" blockAlign="center" gap="800">
                        <BlockStack gap="50">
                          <Text as="h6" variant="headingSm">Pulsing</Text>
                          <Box id="jf-pulsing-desc">
                            <Text variant="bodySm" tone="subdued">Add a pulsing effect to the avatar</Text>
                          </Box>
                        </BlockStack>
                        <button 
                          type="button" 
                          id="jf-custom-toggle-track" 
                          className={`jf-custom-toggle-track ${isPulsing ? 'jf-custom-toggle-track_on' : ''}`}
                          role="switch" 
                          aria-checked={isPulsing}
                          onClick={() => {
                            setIsPulsing(!isPulsing);
                            setFormData(prev => ({ ...prev, isPulsing: !isPulsing }));
                          }}
                        >
                          <div className={`jf-custom-toggle-knob ${isPulsing ? 'jf-custom-toggle-knob_on' : ''}`}></div>
                        </button>
                      </InlineStack>
                    </BlockStack>
                  </Box>
    </BlockStack>
              )}

              {selectedTab === 2 && (
                <BlockStack gap="400">
                  {/* Training Options Section */}
                  <Box 
                    padding="400" 
                    background="bg-surface" 
                    borderRadius="300"
                    borderWidth="025"
                    borderColor="border"
                    shadow="100"
                  >
    <BlockStack gap="400">
      <Text as="h6" variant="headingSm">
                        Training Options
      </Text>
      
      <Banner status="info">
        <Text as="p" variant="bodyMd">
                          <strong>Training Options:</strong>
        </Text>
        <Text as="p" variant="bodyMd">
                          • Upload knowledge base documents<br/>
                          • Add FAQ responses<br/>
                          • Configure conversation flows<br/>
                          • Set up product recommendations
        </Text>
      </Banner>

                      <TextField
                        label="Knowledge Base URL"
                        placeholder="https://your-help-center.com"
                        helpText="Link to your help center or knowledge base"
                      />

                      <TextField
                        label="Product Catalog URL"
                        placeholder="https://your-store.com/products.json"
                        helpText="Link to your product catalog for recommendations"
                      />

                      <InlineStack gap="200">
                        <Button variant="primary">
                          🚀 Start Training
      </Button>

                        <Button variant="secondary">
                          📚 Upload Documents
      </Button>
                      </InlineStack>
                    </BlockStack>
                  </Box>
    </BlockStack>
              )}

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          loading={fetcher.state === "submitting"}
        >
          {fetcher.state === "submitting" ? "Saving..." : "Publish"}
        </Button>
              </div>
              </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h4" variant="headingSm">
                Preview
              </Text>
              
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="200"
                borderWidth="025"
                borderColor="border"
              >
                <div id="jotform-agent-preview-root">
                  <div className="embedded-agent-container align-right" style={{
                    position: 'relative',
                    width: '100%',
                    height: '400px',
                    background: `linear-gradient(135deg, ${colorSchemes[selectedColorScheme]?.background || '#667eea'} 0%, ${colorSchemes[selectedColorScheme]?.right || '#764ba2'} 100%)`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                  {/* Floating Widget Preview */}
                    <div className="ai-agent-chat-avatar-container" style={{
                      position: 'absolute',
                      bottom: '20px',
                      right: '20px',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(rgba(0, 0, 0, 0.81) 0%, rgb(0, 0, 0) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px 0 rgba(37,45,91,.0392156863), 0 16px 24px 0 rgba(84,95,111,.1607843137)',
                      border: '3px solid #fff'
                    }}>
                      <img 
                        src={formData.avatar || selectedAvatar} 
                        alt="agent" 
                        width="80" 
                        height="80"
                        style={{ borderRadius: '50%' }}
                      />
                  </div>
                  
                  {/* Chat Preview */}
                    <div className="ai-agent-chat-animation-container" style={{
                      position: 'absolute',
                      bottom: '110px',
                      right: '20px',
                      width: '300px',
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    opacity: 0.9
                  }}>
                    <Text variant="bodyMd" color="subdued">
                      {formData.greeting}
                    </Text>
                  </div>
                </div>
                </div>
              </Box>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="300">
              <Text as="h4" variant="headingSm">Embed this widget</Text>
              <Text as="p" variant="bodySm">Paste this into your theme or custom app block.</Text>
              <Box borderWidth="025" borderColor="border" borderRadius="200" padding="300" background="bg-surface-secondary">
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{embedSnippet}</pre>
              </Box>
              <InlineStack gap="200">
                <Button variant="secondary" onClick={handleCopyEmbed}>Copy embed code</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      
      <style>
        {`
          .jf-avatar-gallery-item {
            border-radius: 4px;
            transition: all 0.2s ease;
          }
          
          .jf-avatar-gallery-item:hover {
            transform: scale(1.05);
          }
          
          .jf-avatar-gallery-item.selected {
            border: 2px solid #0070f3 !important;
            box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
          }
          
          .colorScheme-item {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .colorScheme-item:hover {
            transform: scale(1.1);
          }
          
          .colorScheme-item.selected {
            border: 2px solid #0070f3;
            box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
          }
          
          .colorScheme-itemBox {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
          }
          
          .colorScheme-itemBoxRight {
            position: absolute;
            right: 0;
            top: 0;
            width: 8px;
            height: 24px;
            border-radius: 0 4px 4px 0;
          }
          
          .colorPicker-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
            background: white;
            transition: all 0.2s ease;
          }
          
          .colorPicker-btn:hover {
            border-color: #9ca3af;
            background: #f9fafb;
          }
          
          .chatbotPosition-btn {
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .chatbotPosition-btn:hover {
            transform: scale(1.02);
          }
          
          .chatbotPosition-btn.selected {
            border: 2px solid #0070f3 !important;
            box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
          }
          
          .jf-custom-toggle-track {
            position: relative;
            width: 44px;
            height: 24px;
            background: #d1d5db;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .jf-custom-toggle-track_on {
            background: #0070f3;
          }
          
          .jf-custom-toggle-knob {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .jf-custom-toggle-knob_on {
            transform: translateX(20px);
          }
        `}
      </style>
    </Page>
  );
}

export function ErrorBoundary({ error }) {
  console.error("FloatingWidgetPro ErrorBoundary:", error);
  return (
    <Page>
      <TitleBar title="AI chatbot settings" />
      <Layout>
        <Layout.Section>
          <Banner status="critical">
            <Text as="p" variant="bodyMd">
              <strong>There was an error loading this page.</strong>
            </Text>
            <Text as="p" variant="bodySm">
              {error?.message || "Unexpected error"}
            </Text>
          </Banner>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export function CatchBoundary() {
  return (
    <Page>
      <TitleBar title="AI chatbot settings" />
      <Layout>
        <Layout.Section>
          <Banner status="critical">
            <Text as="p" variant="bodyMd">
              <strong>Access error.</strong>
            </Text>
            <Text as="p" variant="bodySm">
              Please reopen the app from Shopify Admin to reauthenticate.
            </Text>
          </Banner>
        </Layout.Section>
      </Layout>
    </Page>
  );
}