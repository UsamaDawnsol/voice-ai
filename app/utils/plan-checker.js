import prisma from "../db.server";

/**
 * Plan Checker Utility
 * 
 * This utility checks plan limits and enforces restrictions based on the shop's current plan.
 */

export class PlanChecker {
  /**
   * Check if shop can create a new conversation
   */
  static async canCreateConversation(shop) {
    try {
      const shopPlan = await this.getShopPlan(shop);
      if (!shopPlan) return { allowed: true, reason: "No plan restrictions" };
      
      // Check if plan has unlimited conversations
      if (shopPlan.plan.maxConversations === -1) {
        return { allowed: true, reason: "Unlimited plan" };
      }
      
      // Check current month usage
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const conversationsCount = await prisma.conversation.count({
        where: {
          shop,
          createdAt: { gte: currentMonth }
        }
      });
      
      if (conversationsCount >= shopPlan.plan.maxConversations) {
        return { 
          allowed: false, 
          reason: "Conversation limit reached",
          limit: shopPlan.plan.maxConversations,
          used: conversationsCount,
          plan: shopPlan.plan.displayName
        };
      }
      
      return { allowed: true, reason: "Within limits" };
    } catch (error) {
      console.error("Error checking conversation limit:", error);
      return { allowed: true, reason: "Error checking limits" };
    }
  }
  
  /**
   * Check if shop can send a new message
   */
  static async canSendMessage(shop) {
    try {
      const shopPlan = await this.getShopPlan(shop);
      if (!shopPlan) return { allowed: true, reason: "No plan restrictions" };
      
      // Check if plan has unlimited messages
      if (shopPlan.plan.maxMessages === -1) {
        return { allowed: true, reason: "Unlimited plan" };
      }
      
      // Check current month usage
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const messagesCount = await prisma.message.count({
        where: {
          conversation: {
            shop,
            createdAt: { gte: currentMonth }
          }
        }
      });
      
      if (messagesCount >= shopPlan.plan.maxMessages) {
        return { 
          allowed: false, 
          reason: "Message limit reached",
          limit: shopPlan.plan.maxMessages,
          used: messagesCount,
          plan: shopPlan.plan.displayName
        };
      }
      
      return { allowed: true, reason: "Within limits" };
    } catch (error) {
      console.error("Error checking message limit:", error);
      return { allowed: true, reason: "Error checking limits" };
    }
  }
  
  /**
   * Get shop's current plan
   */
  static async getShopPlan(shop) {
    try {
      const shopPlan = await prisma.shopPlan.findUnique({
        where: { shop },
        include: { plan: true }
      });
      
      return shopPlan;
    } catch (error) {
      console.error("Error getting shop plan:", error);
      return null;
    }
  }
  
  /**
   * Get shop's usage statistics
   */
  static async getUsageStats(shop) {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const [conversationsCount, messagesCount] = await Promise.all([
        prisma.conversation.count({
          where: {
            shop,
            createdAt: { gte: currentMonth }
          }
        }),
        prisma.message.count({
          where: {
            conversation: {
              shop,
              createdAt: { gte: currentMonth }
            }
          }
        })
      ]);
      
      return {
        conversations: conversationsCount,
        messages: messagesCount
      };
    } catch (error) {
      console.error("Error getting usage stats:", error);
      return { conversations: 0, messages: 0 };
    }
  }
  
  /**
   * Check if shop has access to a specific feature
   */
  static async hasFeature(shop, feature) {
    try {
      const shopPlan = await this.getShopPlan(shop);
      if (!shopPlan) return true; // Default to allowing features
      
      const features = shopPlan.plan.features || [];
      return features.includes(feature);
    } catch (error) {
      console.error("Error checking feature access:", error);
      return true; // Default to allowing features
    }
  }
  
  /**
   * Get plan upgrade suggestions based on usage
   */
  static async getUpgradeSuggestions(shop) {
    try {
      const shopPlan = await this.getShopPlan(shop);
      const usage = await this.getUsageStats(shop);
      
      if (!shopPlan) return [];
      
      const suggestions = [];
      
      // Check conversation usage
      if (shopPlan.plan.maxConversations !== -1) {
        const conversationUsage = (usage.conversations / shopPlan.plan.maxConversations) * 100;
        if (conversationUsage >= 80) {
          suggestions.push({
            type: "conversations",
            current: usage.conversations,
            limit: shopPlan.plan.maxConversations,
            usage: conversationUsage,
            message: `You've used ${Math.round(conversationUsage)}% of your conversation limit`
          });
        }
      }
      
      // Check message usage
      if (shopPlan.plan.maxMessages !== -1) {
        const messageUsage = (usage.messages / shopPlan.plan.maxMessages) * 100;
        if (messageUsage >= 80) {
          suggestions.push({
            type: "messages",
            current: usage.messages,
            limit: shopPlan.plan.maxMessages,
            usage: messageUsage,
            message: `You've used ${Math.round(messageUsage)}% of your message limit`
          });
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error("Error getting upgrade suggestions:", error);
      return [];
    }
  }
}

export default PlanChecker;


