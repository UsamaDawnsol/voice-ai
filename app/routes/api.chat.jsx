import { json } from "@remix-run/node";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { message, shop, sessionId, customerId } = await request.json();
    
    if (!message || !shop) {
      return json({ error: "Message and shop are required" }, { status: 400 });
    }

    // Get merchant from database
    const merchant = await db.merchant.findUnique({
      where: { shop: shop }
    });

    if (!merchant) {
      return json({ error: "Merchant not found" }, { status: 404 });
    }

    // Get or create chat session
    let chat = await db.chat.findFirst({
      where: { 
        merchantId: merchant.id,
        sessionId: sessionId || "default"
      }
    });

    if (!chat) {
      chat = await db.chat.create({
        data: {
          merchantId: merchant.id,
          sessionId: sessionId || "default",
          customerId: customerId,
          status: "active"
        }
      });
    }

    // Save customer message
    await db.message.create({
      data: {
        chatId: chat.id,
        sender: "customer",
        text: message
      }
    });

    // Get relevant documents using RAG
    const relevantDocs = await getRelevantDocuments(message, merchant.id);
    
    // Build context from relevant documents
    const context = relevantDocs.map(doc => 
      `${doc.title}: ${doc.content}`
    ).join('\n\n');

    // Generate AI response using RAG
    const aiResponse = await generateAIResponse(message, context, merchant.settings);

    // Save AI response
    await db.message.create({
      data: {
        chatId: chat.id,
        sender: "bot",
        text: aiResponse,
        metadata: {
          model: "dummy-ai",
          contextDocs: relevantDocs.length,
          timestamp: new Date().toISOString()
        }
      }
    });

    return json({ 
      reply: aiResponse,
      chatId: chat.id,
      sessionId: chat.sessionId
    });

  } catch (error) {
    console.error("Chat error:", error);
    return json({ 
      error: "Failed to process message",
      reply: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    }, { status: 500 });
  }
};

// RAG: Get relevant documents based on user query
async function getRelevantDocuments(query, merchantId) {
  try {
    // For now, return all documents (in production, use vector similarity search)
    const documents = await db.document.findMany({
      where: { merchantId: merchantId },
      take: 5, // Limit to 5 most relevant documents
      orderBy: { updatedAt: 'desc' }
    });

    // Simple keyword matching (in production, use vector embeddings)
    const relevantDocs = documents.filter(doc => 
      doc.content.toLowerCase().includes(query.toLowerCase()) ||
      doc.title.toLowerCase().includes(query.toLowerCase())
    );

    return relevantDocs.slice(0, 3); // Return top 3 matches
  } catch (error) {
    console.error("Error getting relevant documents:", error);
    return [];
  }
}

// Generate AI response using dummy responses
async function generateAIResponse(userMessage, context, merchantSettings) {
  try {
    // Dummy responses based on keywords
    const responses = {
      "hello": "Hello! Welcome to our store! How can I help you today?",
      "hi": "Hi there! I'm here to assist you with any questions about our products or services.",
      "product": "I'd be happy to help you find the perfect product! Could you tell me what you're looking for?",
      "price": "I can help you with pricing information. Which product are you interested in?",
      "order": "I can help you with your order. Do you have an order number or need help placing a new order?",
      "shipping": "Our shipping information: We offer free shipping on orders over $50. Standard delivery takes 3-5 business days.",
      "return": "Our return policy: You can return items within 30 days of purchase. Please contact us for a return authorization.",
      "size": "I can help you with sizing information. What type of product are you looking at?",
      "color": "We have various colors available. Which product are you interested in?",
      "help": "I'm here to help! What would you like to know about our products or services?",
      "thank": "You're welcome! Is there anything else I can help you with?",
      "bye": "Thank you for visiting! Have a great day!",
      "default": "That's a great question! I'm here to help you with information about our products and services. Could you be more specific about what you're looking for?"
    };

    // Find matching response
    const lowerMessage = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Default response
    return responses.default;
  } catch (error) {
    console.error("Error generating response:", error);
    return "I'm here to help! What would you like to know about our products?";
  }
}

// Build system prompt based on merchant settings
function buildSystemPrompt(merchantSettings) {
  const settings = merchantSettings || {};
  const tone = settings.tone || "friendly";
  const storeName = settings.storeName || "this store";
  
  return `You are a helpful AI assistant for ${storeName}. You help customers with questions about products, orders, and general inquiries.

Tone: ${tone}
Store: ${storeName}

Guidelines:
- Be helpful and accurate
- Use the provided context to answer questions
- If you don't know something, say so politely
- Keep responses concise but informative
- Always be friendly and professional

Context will be provided with relevant store information. Use this context to provide accurate answers.`;
}
