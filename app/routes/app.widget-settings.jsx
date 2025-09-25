import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  ColorPicker,
  Select,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Box,
  Checkbox,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get current widget settings from database
  let widgetSettings = await db.widgetSettings.findUnique({
    where: { shop: session.shop }
  });

  // If no settings found, create default ones
  if (!widgetSettings) {
    widgetSettings = await db.widgetSettings.create({
      data: {
        shop: session.shop,
        backgroundColor: "#007bff",
        iconColor: "#ffffff",
        position: "right",
        isActive: true
      }
    });
  }

  const currentSettings = {
    backgroundColor: widgetSettings.backgroundColor,
    iconColor: widgetSettings.iconColor,
    position: widgetSettings.position,
    isActive: widgetSettings.isActive,
    publishedAt: widgetSettings.publishedAt,
    shop: session.shop,
    appUrl: process.env.SHOPIFY_APP_URL,
    embedCode: `<script src="${process.env.SHOPIFY_APP_URL}/embed?shop=${session.shop}"></script>`
  };

  return { settings: currentSettings };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");
  
  console.log("Action received:", actionType);
  
  if (actionType === "saveSettings") {
    // Get form data with proper validation and defaults
    let backgroundColor = formData.get("backgroundColor") || "#007bff";
    let iconColor = formData.get("iconColor") || "#ffffff";
    const position = formData.get("position") || "right";
    const isActive = formData.get("isActive") === "true";
    
    // Fix color picker object issue - extract hex value if it's an object
    if (typeof backgroundColor === 'object' && backgroundColor.hex) {
      backgroundColor = backgroundColor.hex;
    }
    if (typeof iconColor === 'object' && iconColor.hex) {
      iconColor = iconColor.hex;
    }
    
    // Ensure colors are valid hex strings
    if (!backgroundColor.startsWith('#')) {
      backgroundColor = "#007bff";
    }
    if (!iconColor.startsWith('#')) {
      iconColor = "#ffffff";
    }
    
    const settings = {
      backgroundColor: backgroundColor,
      iconColor: iconColor,
      position: position,
      isActive: isActive,
    };

    // Validate settings before saving
    if (!backgroundColor || !iconColor || !position) {
      return { 
        success: false, 
        error: "Invalid settings: backgroundColor, iconColor, and position are required" 
      };
    }

    // Save settings to database
    await db.widgetSettings.upsert({
      where: { shop: session.shop },
      update: {
        backgroundColor: settings.backgroundColor,
        iconColor: settings.iconColor,
        position: settings.position,
        isActive: settings.isActive,
        updatedAt: new Date()
      },
      create: {
        shop: session.shop,
        backgroundColor: settings.backgroundColor,
        iconColor: settings.iconColor,
        position: settings.position,
        isActive: settings.isActive
      }
    });

    // If widget is being disabled, remove script tag from theme
    if (!isActive) {
      await removeScriptTagFromTheme(admin, session.shop);
    }

    return { success: true, settings, message: "Settings saved successfully!" };
  }
  
  if (actionType === "publishToTheme") {
    try {
      // Get current settings
      const widgetSettings = await db.widgetSettings.findUnique({
        where: { shop: session.shop }
      });

      if (!widgetSettings) {
        return { 
          success: false, 
          error: "No settings found to publish" 
        };
      }

      // Mark settings as published
      await db.widgetSettings.update({
        where: { shop: session.shop },
        data: { 
          updatedAt: new Date(),
          publishedAt: new Date()
        }
      });

      // Use theme extension method instead of script tags
      return { 
        success: true, 
        message: "Settings published successfully! Now add the Voice AI Widget to your theme using the Theme Extension method.",
        useThemeExtension: true,
        instructions: "Go to Online Store → Themes → Customize → Add 'Voice AI Widget' block",
        themeEditorUrl: `https://${session.shop}/admin/themes/current/editor`
      };
      
    } catch (error) {
      console.error("Publish to theme error:", error);
      return { 
        success: false, 
        error: "Failed to publish settings. Please try again." 
      };
    }
  }

  return { success: false, error: "Invalid action" };
};

// Function to remove script tag from theme
async function removeScriptTagFromTheme(admin, shop) {
  try {
    // Find existing script tags
    const existingScriptsResponse = await admin.graphql(`
      query {
        scriptTags(first: 50) {
          edges {
            node {
              id
              src
              displayScope
            }
          }
        }
      }
    `);
    
    const existingScripts = await existingScriptsResponse.json();
    
    // Find our script tag
    const ourScript = existingScripts.data?.scriptTags?.edges?.find(
      edge => edge.node.src.includes('/embed?shop=')
    );
    
    if (ourScript) {
      // Delete the script tag
      const deleteResponse = await admin.graphql(`
        mutation scriptTagDelete($id: ID!) {
          scriptTagDelete(id: $id) {
            deletedScriptTagId
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          id: ourScript.node.id
        }
      });
      
      const deleteResult = await deleteResponse.json();
      
      if (deleteResult.data?.scriptTagDelete?.userErrors?.length > 0) {
        console.error("Error deleting script tag:", deleteResult.data.scriptTagDelete.userErrors[0].message);
        return false;
      }
      
      return true;
    }
    
    return true; // No script tag to remove
    
  } catch (error) {
    console.error("Error removing script tag from theme:", error);
    return false;
  }
}

// Function to add script tag to theme using Shopify Admin API
async function addScriptTagToTheme(admin, shop) {
  try {
    const embedUrl = `${process.env.SHOPIFY_APP_URL}/embed?shop=${shop}`;
    
    // First, check if script tag already exists
    const existingScriptsResponse = await admin.graphql(`
      query {
        scriptTags(first: 50) {
          edges {
            node {
              id
              src
              displayScope
            }
          }
        }
      }
    `);
    
    const existingScripts = await existingScriptsResponse.json();
    
    // Check if our script tag already exists
    const existingScript = existingScripts.data?.scriptTags?.edges?.find(
      edge => edge.node.src.includes('/embed?shop=')
    );
    
    if (existingScript) {
      // Script tag already exists, update it
      const updateResponse = await admin.graphql(`
        mutation scriptTagUpdate($id: ID!, $input: ScriptTagInput!) {
          scriptTagUpdate(id: $id, input: $input) {
            scriptTag {
              id
              src
              displayScope
            }
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          id: existingScript.node.id,
          input: {
            src: embedUrl,
            displayScope: "ONLINE_STORE"
          }
        }
      });
      
      const updateResult = await updateResponse.json();
      
      if (updateResult.data?.scriptTagUpdate?.userErrors?.length > 0) {
        return {
          success: false,
          error: updateResult.data.scriptTagUpdate.userErrors[0].message
        };
      }
      
      return {
        success: true,
        message: "Script tag updated successfully",
        scriptTagId: updateResult.data?.scriptTagUpdate?.scriptTag?.id
      };
    } else {
      // Create new script tag
      const createResponse = await admin.graphql(`
        mutation scriptTagCreate($input: ScriptTagInput!) {
          scriptTagCreate(input: $input) {
            scriptTag {
              id
              src
              displayScope
            }
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          input: {
            src: embedUrl,
            displayScope: "ONLINE_STORE"
          }
        }
      });
      
      const createResult = await createResponse.json();
      
      if (createResult.data?.scriptTagCreate?.userErrors?.length > 0) {
        return {
          success: false,
          error: createResult.data.scriptTagCreate.userErrors[0].message
        };
      }
      
      return {
        success: true,
        message: "Script tag created successfully",
        scriptTagId: createResult.data?.scriptTagCreate?.scriptTag?.id
      };
    }
    
  } catch (error) {
    console.error("Error adding script tag to theme:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to update theme extension settings
async function updateThemeExtensionSettings(admin, shop, settings) {
  try {
    // For now, return success without actually updating theme
    // This is a placeholder for the theme update functionality
    console.log("Theme update requested for shop:", shop);
    console.log("Settings to publish:", settings);
    
    // Simulate successful theme update
    return { 
      success: true, 
      themeId: "placeholder-theme-id",
      message: "Settings published successfully! (Theme update simulated)"
    };
    
    /* 
    // TODO: Implement actual theme update when Shopify API is properly configured
    // This would require proper API credentials and theme access
    
    try {
      // Get current theme using REST API
      const themesResponse = await fetch(`https://${shop}/admin/api/2023-10/themes.json`, {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      const themesData = await themesResponse.json();
      const activeTheme = themesData.themes.find(theme => theme.role === 'main');
      
      if (!activeTheme) {
        return { success: false, error: "No active theme found" };
      }
      
      // Update theme asset
      const assetResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${activeTheme.id}/assets.json`, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: {
            key: "sections/voice-ai-widget.liquid",
            value: generateThemeExtensionLiquid(settings)
          }
        })
      });
      
      if (assetResponse.ok) {
        return { success: true, themeId: activeTheme.id };
      } else {
        return { success: false, error: "Failed to update theme asset" };
      }
    } catch (apiError) {
      console.error("API error:", apiError);
      return { success: false, error: "API error: " + apiError.message };
    }
    */
  } catch (error) {
    console.error("Theme update error:", error);
    return { success: false, error: error.message };
  }
}

// Generate theme extension liquid file
function generateThemeExtensionLiquid(settings) {
  return `{% comment %}
  Voice AI Widget - Auto-generated from Admin Dashboard
  Last updated: ${new Date().toISOString()}
{% endcomment %}

{% if block.settings.enable_widget %}
  <script>
    window.voiceAIWidget = {
      shop: '{{ shop.permanent_domain }}',
      shopName: '{{ shop.name }}',
      backgroundColor: '${settings.backgroundColor}',
      iconColor: '${settings.iconColor}',
      position: '${settings.position}',
      enabled: ${settings.isActive},
      theme: '{{ theme.name }}',
      currency: '{{ shop.currency }}',
      locale: '{{ shop.locale }}',
      customMessage: 'Hello! How can I help you today?',
      widgetSize: 60,
      publishedFromAdmin: true,
      lastUpdated: '${new Date().toISOString()}'
    };
  </script>
  
  <script src="{{ 'voice-ai-widget.js' | asset_url }}" defer></script>
{% endif %}

{% schema %}
{
  "name": "Voice AI Widget",
  "target": "body",
  "settings": [
    {
      "type": "header",
      "content": "Voice AI Widget Settings"
    },
    {
      "type": "checkbox",
      "id": "enable_widget",
      "label": "Enable Voice AI Widget",
      "default": true,
      "info": "Enable or disable the floating Voice AI widget on your store"
    },
    {
      "type": "header",
      "content": "Appearance (Managed by Admin Dashboard)"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Widget Background Color",
      "default": "${settings.backgroundColor}",
      "info": "This setting is managed by the Admin Dashboard"
    },
    {
      "type": "color",
      "id": "icon_color",
      "label": "Icon Color",
      "default": "${settings.iconColor}",
      "info": "This setting is managed by the Admin Dashboard"
    },
    {
      "type": "select",
      "id": "position",
      "label": "Widget Position",
      "options": [
        { "value": "right", "label": "Right Side" },
        { "value": "left", "label": "Left Side" }
      ],
      "default": "${settings.position}",
      "info": "This setting is managed by the Admin Dashboard"
    }
  ]
}
{% endschema %}`;
}

export default function WidgetSettings() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const [formData, setFormData] = useState({
    backgroundColor: settings.backgroundColor,
    iconColor: settings.iconColor,
    position: settings.position,
    isActive: settings.isActive,
  });

  const positionOptions = [
    { label: "Right side", value: "right" },
    { label: "Left side", value: "left" },
  ];

  const handleSubmit = (event) => {
    // Validate form data before submission
    if (!formData.backgroundColor || !formData.iconColor || !formData.position) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Let the form submit naturally with the hidden inputs
    console.log("Form submitted with data:", formData);
  };

  // Auto-refresh widget when settings are successfully saved
  useEffect(() => {
    if (fetcher.data?.success && fetcher.formData?.get("_action") === "saveSettings") {
      // Small delay to ensure the database is updated
      setTimeout(() => {
        refreshWidget();
      }, 500);
    }
  }, [fetcher.data?.success, fetcher.formData?.get("_action")]);

  const handlePublish = () => {
    console.log("Publish button clicked");
    const form = new FormData();
    form.append("_action", "publishToTheme");
    console.log("Submitting form with action:", "publishToTheme");
    fetcher.submit(form, { method: "post" });
  };

  // Refresh widget when settings are saved
  const refreshWidget = () => {
    if (typeof window !== 'undefined') {
      // Clear settings hash to force widget refresh
      localStorage.removeItem('voiceAIWidgetSettingsHash');
      
      // Force reload of embed script with new timestamp
      const embedScript = document.querySelector('script[src*="/embed"]');
      if (embedScript) {
        const newScript = document.createElement('script');
        newScript.src = embedScript.src.split('&t=')[0] + '&t=' + Date.now();
        document.head.appendChild(newScript);
        document.head.removeChild(embedScript);
      }
      
      // Also try to refresh any existing widget directly
      const existingWidget = document.getElementById('voice-ai-widget');
      const existingModal = document.getElementById('voice-ai-modal');
      if (existingWidget) existingWidget.remove();
      if (existingModal) existingModal.remove();
      
      // Clear initialization flag
      delete window.voiceAIWidgetInitialized;
      
      console.log('Widget refreshed with new settings');
    }
  };

  const updateEmbedCode = () => {
    // Use shop and appUrl from settings instead of process.env
    // Don't use timestamp to avoid hydration issues
    return `<script src="${settings.appUrl}/embed?shop=${settings.shop}"></script>`;
  };

  return (
    <Page>
      <TitleBar title="Widget Settings" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Customize Your Floating Widget
              </Text>
              <Text as="p" variant="bodyMd" color="subdued">
                Customize the appearance and behavior of your Voice AI floating widget.
              </Text>
              
              {fetcher.data?.success && (
                <Banner status="success">
                  {fetcher.data.message || "Widget settings saved successfully!"}
                  {fetcher.data?.useThemeExtension && (
                    <div style={{ marginTop: '10px' }}>
                      <Text as="p" variant="bodyMd">
                        <strong>🎯 Next Step: Add Widget to Your Theme</strong>
                      </Text>
                      <Text as="p" variant="bodyMd" color="subdued">
                        {fetcher.data.instructions}
                      </Text>
                      <Button 
                        size="slim"
                        variant="primary"
                        onClick={() => window.open(fetcher.data.themeEditorUrl, '_blank')}
                        style={{ marginTop: '8px' }}
                      >
                        🚀 Open Theme Editor
                      </Button>
                    </div>
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <Button size="slim" onClick={refreshWidget}>
                      Refresh Widget on Site
                    </Button>
                  </div>
                </Banner>
              )}

              {fetcher.data?.error && (
                <Banner status="critical">
                  Error: {fetcher.data.error}
                  {fetcher.data?.useThemeExtension && (
                    <div style={{ marginTop: '10px' }}>
                      <Text as="p" variant="bodyMd">
                        <strong>Theme Extension Method (Recommended):</strong>
                      </Text>
                      <Text as="p" variant="bodyMd" color="subdued">
                        {fetcher.data.instructions}
                      </Text>
                      <Button 
                        size="slim"
                        onClick={() => {
                          window.open('https://voiceaidawnsol.myshopify.com/admin/themes', '_blank');
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Open Theme Editor
                      </Button>
                    </div>
                  )}
                  {fetcher.data?.embedCode && (
                    <div style={{ marginTop: '10px' }}>
                      <Text as="p" variant="bodyMd">
                        <strong>Manual Installation Code:</strong>
                      </Text>
                      <Box
                        padding="200"
                        background="bg-surface-active"
                        borderRadius="100"
                        borderWidth="025"
                        borderColor="border"
                        style={{ marginTop: '8px' }}
                      >
                        <code style={{ fontSize: "12px" }}>{fetcher.data.embedCode}</code>
                      </Box>
                      <Button 
                        size="slim"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(fetcher.data.embedCode);
                          }
                        }}
                        style={{ marginTop: '8px' }}
                      >
                        Copy Code
                      </Button>
                    </div>
                  )}
                </Banner>
              )}

              <fetcher.Form method="post" onSubmit={handleSubmit}>
                <input type="hidden" name="_action" value="saveSettings" />
                <input 
                  type="hidden" 
                  name="backgroundColor" 
                  value={formData.backgroundColor}
                  onChange={() => {}} // Keep the value in sync
                />
                <input 
                  type="hidden" 
                  name="iconColor" 
                  value={formData.iconColor}
                  onChange={() => {}} // Keep the value in sync
                />
                <input 
                  type="hidden" 
                  name="position" 
                  value={formData.position}
                  onChange={() => {}} // Keep the value in sync
                />
                <input 
                  type="hidden" 
                  name="isActive" 
                  value={formData.isActive.toString()}
                  onChange={() => {}} // Keep the value in sync
                />
                <FormLayout>
                  <Checkbox
                    label="Enable Voice AI Widget"
                    checked={formData.isActive}
                    onChange={(checked) => 
                      setFormData(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                  
                  <FormLayout.Group>
                    <ColorPicker
                      label="Background Color"
                      color={formData.backgroundColor}
                      onChange={(color) => {
                        const hexColor = typeof color === 'object' ? color.hex : color;
                        setFormData(prev => ({ ...prev, backgroundColor: hexColor }));
                      }}
                    />
                    <ColorPicker
                      label="Icon Color"
                      color={formData.iconColor}
                      onChange={(color) => {
                        const hexColor = typeof color === 'object' ? color.hex : color;
                        setFormData(prev => ({ ...prev, iconColor: hexColor }));
                      }}
                    />
                  </FormLayout.Group>

                  <Select
                    label="Widget Position"
                    options={positionOptions}
                    value={formData.position}
                    onChange={(value) => 
                      setFormData(prev => ({ ...prev, position: value }))
                    }
                  />

                  <InlineStack gap="300">
                    <Button 
                      submit 
                      variant="primary"
                      loading={fetcher.state === "submitting" && fetcher.formData?.get("_action") === "saveSettings"}
                    >
                      Save Settings
                    </Button>
                    <Button 
                      type="button"
                      onClick={handlePublish}
                      variant="primary"
                      loading={fetcher.state === "submitting" && fetcher.formData?.get("_action") === "publishToTheme"}
                    >
                      🚀 Publish to Theme
                    </Button>
                    <Button 
                      onClick={refreshWidget}
                      variant="secondary"
                    >
                      🔄 Refresh Widget
                    </Button>
                    <Button 
                      onClick={() => setFormData({
                        backgroundColor: "#007bff",
                        iconColor: "#ffffff",
                        position: "right",
                        isActive: true,
                      })}
                    >
                      Reset to Default
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
                🚀 Publish Status
              </Text>
              <Text as="p" variant="bodyMd" color="subdued">
                Publish your settings to make them live on your store.
              </Text>
              
              <Box
                padding="300"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <Text as="p" variant="bodyMd">
                  <strong>Current Status:</strong> Settings saved in database
                </Text>
                {settings.publishedAt && (
                  <Text as="p" variant="bodyMd" color="subdued">
                    <strong>Last Published:</strong> {new Date(settings.publishedAt).toLocaleString()}
                  </Text>
                )}
                <Text as="p" variant="bodyMd" color="subdued">
                  Click "Publish to Live Store" to make changes live on your store.
                </Text>
              </Box>

              <Button 
                onClick={handlePublish}
                variant="primary"
                loading={fetcher.state === "submitting" && fetcher.formData?.get("_action") === "publishToTheme"}
                fullWidth
              >
                🚀 Publish to Live Store
              </Button>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Widget Preview
              </Text>
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="200"
                minHeight="200px"
                position="relative"
              >
                {formData.isActive ? (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        [formData.position]: "20px",
                        bottom: "20px",
                        width: "60px",
                        height: "60px",
                        backgroundColor: formData.backgroundColor,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span style={{ 
                        fontSize: "24px", 
                        color: formData.iconColor,
                        transition: "color 0.3s ease"
                      }}>
                        🎤
                      </span>
                    </div>
                    <Text as="p" variant="bodyMd" color="subdued">
                      Live preview - changes update instantly
                    </Text>
                    <Text as="p" variant="bodyMd" color="subdued" style={{ fontSize: "12px" }}>
                      Position: {formData.position} | BG: {formData.backgroundColor} | Icon: {formData.iconColor}
                    </Text>
                  </>
                ) : (
                  <Text as="p" variant="bodyMd" color="subdued">
                    Widget is disabled. Enable it to see preview.
                  </Text>
                )}
              </Box>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Installation Code
              </Text>
              <Text as="p" variant="bodyMd" color="subdued">
                Add this code to your website to display the widget:
              </Text>
              <Box
                padding="300"
                background="bg-surface-active"
                borderRadius="200"
                borderWidth="025"
                borderColor="border"
              >
                <pre style={{ 
                  margin: 0, 
                  fontSize: "12px", 
                  overflow: "auto",
                  whiteSpace: "pre-wrap"
                }}>
                  <code>{updateEmbedCode()}</code>
                </pre>
              </Box>
              <Button 
                size="slim"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(updateEmbedCode());
                  } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = updateEmbedCode();
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                  }
                }}
              >
                Copy Code
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
