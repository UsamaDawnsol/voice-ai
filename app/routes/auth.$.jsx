import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // Inject floating chat widget script tag
  try {
    // Use the current request URL to ensure we're using the correct tunnel
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const scriptUrl = `${baseUrl}/floating-widget.js?shop=${session.shop}`;
    
    // Check if script tag already exists
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
    const existingScript = existingScripts.data?.scriptTags?.edges?.find(
      edge => edge.node.src.includes('/floating-widget.js')
    );
    
    if (!existingScript) {
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
            src: scriptUrl,
            displayScope: "ONLINE_STORE"
          }
        }
      });
      
      const createResult = await createResponse.json();
      
      if (createResult.data?.scriptTagCreate?.userErrors?.length > 0) {
        console.error("Error creating script tag:", createResult.data.scriptTagCreate.userErrors[0].message);
      } else {
        console.log("Floating chat widget script tag created successfully");
      }
    }
  } catch (error) {
    console.error("Error injecting floating chat widget:", error);
  }

  // Auto-setup store with free plan and default configuration
  try {
    console.log(`Setting up store: ${session.shop}`);
    
    // Get the free plan
    const freePlan = await prisma.plan.findUnique({
      where: { name: 'free' }
    });
    
    if (!freePlan) {
      console.error("Free plan not found in database");
    } else {
      // Check if shop already has a plan
      const existingShopPlan = await prisma.shopPlan.findUnique({
        where: { shop: session.shop }
      });
      
      if (!existingShopPlan) {
        // Assign free plan to new store
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        
        await prisma.shopPlan.create({
          data: {
            shop: session.shop,
            planId: freePlan.id,
            currentPeriodStart,
            currentPeriodEnd,
            conversationsUsed: 0,
            messagesUsed: 0
          }
        });
        
        console.log(`✅ Free plan assigned to ${session.shop}`);
      }
      
      // Check if shop has widget configuration
      const existingConfig = await prisma.widgetConfig.findUnique({
        where: { shop: session.shop }
      });
      
      if (!existingConfig) {
        // Create default widget configuration
        await prisma.widgetConfig.create({
          data: {
            shop: session.shop,
            title: "Support Chat",
            color: "#e63946",
            greeting: "👋 Welcome! How can we help you?",
            position: "right",
            isActive: true,
            agentName: "Assistant",
            agentRole: "Customer Support",
            responseLength: "medium",
            language: "en",
            tone: "friendly",
            avatar: "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png",
            // Default agent style settings
            colorScheme: "0",
            startColor: "#000000CF",
            endColor: "#000000",
            chatBgColor: "#FFFFFF",
            fontFamily: "inter, sans-serif",
            fontColor: "#000000CF",
            openByDefault: "1",
            isPulsing: false
          }
        });
        
        console.log(`✅ Default widget configuration created for ${session.shop}`);
      }
    }
  } catch (error) {
    console.error("Error setting up store:", error);
  }

  // Redirect to the main app after authentication
  return redirect("/app");
};

// Default component for the auth route
export default function AuthCallback() {
  useEffect(() => {
    // This component will redirect via the loader, but provides a fallback
    window.location.href = "/app";
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>🔐 Authenticating...</h2>
        <p>Please wait while we authenticate your app.</p>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  );
}
