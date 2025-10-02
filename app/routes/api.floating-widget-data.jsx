import { json } from "@remix-run/node";
import prisma from "../db.server";
import { PlanChecker } from "../utils/plan-checker";

export const loader = async ({ request }) => {
  // Add CORS headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  try {
    const url = new URL(request.url);
    let shop = url.searchParams.get("shop");

    if (!shop) {
      const headerShop = request.headers.get("x-shopify-shop-domain");
      if (headerShop) shop = headerShop;
    }

    if (!shop) {
      const referer = request.headers.get("referer");
      try {
        if (referer) {
          const refHost = new URL(referer).hostname;
          if (refHost && refHost.includes(".myshopify.com")) {
            shop = refHost;
          }
        }
      } catch {}
    }

    if (!shop) {
      return json({ error: "Missing shop parameter" }, { status: 400, headers });
    }

    // Get widget configuration from database
    const widgetConfig = await prisma.widgetConfig.findUnique({
      where: { shop }
    });

    if (!widgetConfig) {
      return json({
        isActive: false,
        title: "Support Chat",
        color: "#e63946",
        greeting: "👋 Welcome! How can we help you?",
        position: "right",
        agentName: "Assistant",
        agentRole: "Customer Support",
        responseLength: "medium",
        language: "en",
        tone: "friendly",
        avatar: "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png"
      });
    }

    return json({
      isActive: widgetConfig.isActive,
      title: widgetConfig.title || "Support Chat",
      color: widgetConfig.color || "#e63946",
      greeting: widgetConfig.greeting || "👋 Welcome! How can we help you?",
      position: widgetConfig.position || "right",
      agentName: widgetConfig.agentName || "Assistant",
      agentRole: widgetConfig.agentRole || "Customer Support",
      responseLength: widgetConfig.responseLength || "medium",
      language: widgetConfig.language || "en",
      tone: widgetConfig.tone || "friendly",
      avatar: widgetConfig.avatar || "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png"
    }, { headers });

  } catch (error) {
    console.error("Error fetching widget data:", error);
    return json({
      isActive: false,
      title: "Support Chat",
      color: "#e63946",
      greeting: "👋 Welcome! How can we help you?",
      position: "right",
      agentName: "Assistant",
      agentRole: "Customer Support",
      responseLength: "medium",
      language: "en",
      tone: "friendly",
      avatar: "https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png"
    }, { headers });
  }
};

export const action = async ({ request }) => {
  // Add CORS headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  try {
    const url = new URL(request.url);
    let shop = url.searchParams.get("shop");

    if (!shop) {
      const headerShop = request.headers.get("x-shopify-shop-domain");
      if (headerShop) shop = headerShop;
    }

    if (!shop) {
      return json({ error: "Missing shop parameter" }, { status: 400, headers });
    }

    const body = await request.json();
    const { action: actionType, conversationId, message, role, sessionId, customerEmail, customerName } = body;

    console.log('Floating widget API action:', actionType);
    console.log('Shop:', shop);
    console.log('Body:', body);

    if (actionType === 'create_conversation') {
      // Check plan limits before creating conversation
      const canCreate = await PlanChecker.canCreateConversation(shop);
      if (!canCreate.allowed) {
        console.log('Conversation creation blocked:', canCreate.reason);
        return json({ 
          success: false, 
          error: canCreate.reason,
          limit: canCreate.limit,
          used: canCreate.used,
          plan: canCreate.plan
        }, { status: 403, headers });
      }
      
      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          shop,
          sessionId,
          customerEmail,
          customerName,
          status: "active",
        },
      });
      
      console.log('Conversation created with ID:', conversation.id);
      return json({ success: true, conversationId: conversation.id }, { headers });
    }

    if (actionType === 'save_message') {
      if (!conversationId || !message || !role) {
        return json({ error: "Missing required fields" }, { status: 400, headers });
      }

      // Check plan limits before saving message
      const canSend = await PlanChecker.canSendMessage(shop);
      if (!canSend.allowed) {
        console.log('Message saving blocked:', canSend.reason);
        return json({ 
          success: false, 
          error: canSend.reason,
          limit: canSend.limit,
          used: canSend.used,
          plan: canSend.plan
        }, { status: 403, headers });
      }

      // Save message to conversation
      const messageRecord = await prisma.message.create({
        data: {
          conversationId,
          role,
          content: message,
        },
      });
      
      console.log('Message saved with ID:', messageRecord.id);
      return json({ success: true, messageId: messageRecord.id }, { headers });
    }

    if (actionType === 'get_conversation') {
      if (!conversationId) {
        return json({ error: "Missing conversationId" }, { status: 400, headers });
      }

      // Get conversation with messages
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      if (!conversation) {
        return json({ error: "Conversation not found" }, { status: 404, headers });
      }

      return json({ success: true, conversation }, { headers });
    }

    return json({ error: "Invalid action" }, { status: 400, headers });

  } catch (error) {
    console.error("Error in floating widget API action:", error);
    return json({ success: false, error: error.message }, { status: 500, headers });
  }
};
