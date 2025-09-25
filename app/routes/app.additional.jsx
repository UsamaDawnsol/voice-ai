import {
  Box,
  Button,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {
  return (
    <Page>
      <TitleBar title="Theme Extension" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Voice AI Theme Extension
              </Text>
              <Text as="p" variant="bodyMd">
                The Voice AI theme extension makes it easy to add the floating widget to your store. 
                Simply install the extension and configure the settings through your theme customizer.
              </Text>
              
              <Text as="h3" variant="headingMd">
                Installation Steps:
              </Text>
              <List>
                <List.Item>
                  Go to your Shopify admin → Online Store → Themes
                </List.Item>
                <List.Item>
                  Click "Customize" on your active theme
                </List.Item>
                <List.Item>
                  In the theme editor, look for "Voice AI Widget" in the available blocks
                </List.Item>
                <List.Item>
                  Add the block to your theme and configure the settings
                </List.Item>
                <List.Item>
                  Save your changes and publish the theme
                </List.Item>
              </List>

              <Text as="h3" variant="headingMd">
                Alternative Installation:
              </Text>
              <Text as="p" variant="bodyMd">
                If you prefer to add the widget manually, you can use the embed code from the{" "}
                <Link url="/app/widget-settings" removeUnderline>
                  Widget Settings
                </Link>{" "}
                page. Simply copy the code and add it to your theme's layout files.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Extension Features
              </Text>
              <List>
                <List.Item>
                  Easy theme integration
                </List.Item>
                <List.Item>
                  Customizable colors and position
                </List.Item>
                <List.Item>
                  Enable/disable toggle
                </List.Item>
                <List.Item>
                  Mobile responsive
                </List.Item>
                <List.Item>
                  Voice input support
                </List.Item>
              </List>
            </BlockStack>
          </Card>
          
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Need Help?
              </Text>
              <Text as="p" variant="bodyMd">
                If you need assistance with installation or configuration, 
                check the Widget Settings page for detailed customization options.
              </Text>
              <Button url="/app/widget-settings" variant="primary">
                Go to Widget Settings
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function Code({ children }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
