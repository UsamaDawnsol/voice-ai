import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const { shop, sessionId, customerEmail, customerName, status } = await request.json();
    
    console.log('Creating conversation for shop:', shop || session.shop);
    console.log('Session ID:', sessionId);
    console.log('Customer Email:', customerEmail);
    console.log('Customer Name:', customerName);
    
    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        shop: shop || session.shop,
        sessionId,
        customerEmail,
        customerName,
        status: status || "active",
      },
    });
    
    console.log('Conversation created with ID:', conversation.id);
    return json({ success: true, id: conversation.id });
    
  } catch (error) {
    console.error("Error creating conversation:", error);
    return json({ success: false, error: error.message });
  }
};
