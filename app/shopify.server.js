import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import debugLogger from "./utils/debug.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  billing: {
    // Free plan - no billing required
    free: {
      enabled: true,
    },
    // Starter plan - $29/month
    starter: {
      amount: 29.00,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
    },
    // Professional plan - $79/month  
    professional: {
      amount: 79.00,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
    },
    // Enterprise plan - $199/month
    enterprise: {
      amount: 199.00,
      currencyCode: "USD", 
      interval: "EVERY_30_DAYS",
    },
    // One-time purchase for credits
    credits: {
      amount: 9.99,
      currencyCode: "USD",
      oneTime: true,
    },
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      debugLogger.logAuth('app_installed', session.shop, {
        sessionId: session.id,
        isOnline: session.isOnline,
        scope: session.scope
      });
    },
  },
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
