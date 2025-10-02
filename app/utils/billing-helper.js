import { authenticate } from "../shopify.server";

/**
 * Billing helper utilities for Shopify app billing
 */
export class BillingHelper {
  /**
   * Check if a shop has an active subscription for a specific plan
   */
  static async hasActiveSubscription(request, planName) {
    try {
      const { admin } = await authenticate.admin(request);
      
      const billing = await admin.billing.require({
        plans: [planName],
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
      });

      return billing?.subscription?.status === "ACTIVE";
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }

  /**
   * Check if a shop has any active paid subscription
   */
  static async hasAnyPaidSubscription(request) {
    try {
      const { admin } = await authenticate.admin(request);
      
      const billing = await admin.billing.require({
        plans: ["starter", "professional", "enterprise"],
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
      });

      return billing?.subscription?.status === "ACTIVE" && 
             billing.subscription.name !== "free";
    } catch (error) {
      console.error("Error checking paid subscription:", error);
      return false;
    }
  }

  /**
   * Get current subscription details
   */
  static async getCurrentSubscription(request) {
    try {
      const { admin } = await authenticate.admin(request);
      
      const billing = await admin.billing.require({
        plans: ["free", "starter", "professional", "enterprise"],
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
      });

      return billing?.subscription || null;
    } catch (error) {
      console.error("Error getting subscription:", error);
      return null;
    }
  }

  /**
   * Create a subscription for a specific plan
   */
  static async createSubscription(request, planName) {
    try {
      const { admin } = await authenticate.admin(request);
      
      const subscription = await admin.billing.subscribe({
        plan: planName,
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
      });

      return subscription;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Create a one-time purchase
   */
  static async createOneTimePurchase(request, planName) {
    try {
      const { admin } = await authenticate.admin(request);
      
      const purchase = await admin.billing.purchase({
        plan: planName,
        returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
      });

      return purchase;
    } catch (error) {
      console.error("Error creating one-time purchase:", error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(request, subscriptionId) {
    try {
      const { admin } = await authenticate.admin(request);
      
      await admin.billing.cancel({
        subscriptionId: subscriptionId,
      });

      return true;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  }

  /**
   * Get plan limits based on subscription
   */
  static getPlanLimits(subscription) {
    const limits = {
      free: {
        maxConversations: 100,
        maxMessages: 1000,
        features: ["Basic AI responses", "Standard support"]
      },
      starter: {
        maxConversations: 500,
        maxMessages: 5000,
        features: ["Custom AI personality", "Email support", "Basic analytics"]
      },
      professional: {
        maxConversations: 2000,
        maxMessages: 20000,
        features: ["Advanced AI training", "Priority support", "Advanced analytics", "Custom integrations"]
      },
      enterprise: {
        maxConversations: -1, // Unlimited
        maxMessages: -1, // Unlimited
        features: ["Custom AI models", "Dedicated support", "White-label options", "API access"]
      }
    };

    const planName = subscription?.name || "free";
    return limits[planName] || limits.free;
  }

  /**
   * Check if a feature is available for the current plan
   */
  static isFeatureAvailable(subscription, feature) {
    const limits = this.getPlanLimits(subscription);
    return limits.features.includes(feature);
  }

  /**
   * Get upgrade recommendations based on usage
   */
  static getUpgradeRecommendation(usage, subscription) {
    const limits = this.getPlanLimits(subscription);
    const planName = subscription?.name || "free";

    // Check if approaching limits
    const conversationUsage = (usage.conversations / limits.maxConversations) * 100;
    const messageUsage = (usage.messages / limits.maxMessages) * 100;

    if (conversationUsage >= 80 || messageUsage >= 80) {
      return {
        shouldUpgrade: true,
        reason: "You're approaching your plan limits",
        recommendedPlan: this.getNextPlan(planName)
      };
    }

    return {
      shouldUpgrade: false,
      reason: "Your current plan is sufficient",
      recommendedPlan: null
    };
  }

  /**
   * Get the next plan in the upgrade path
   */
  static getNextPlan(currentPlan) {
    const upgradePath = {
      free: "starter",
      starter: "professional", 
      professional: "enterprise",
      enterprise: null
    };

    return upgradePath[currentPlan] || null;
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount, currencyCode = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  }

  /**
   * Get plan display name
   */
  static getPlanDisplayName(planName) {
    const displayNames = {
      free: "Free",
      starter: "Starter",
      professional: "Professional", 
      enterprise: "Enterprise"
    };

    return displayNames[planName] || "Unknown";
  }
}
